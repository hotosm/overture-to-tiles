#!/bin/bash

set -e

# Set variables
BBOX=${1:-""} # No default bounding box
THEME=${2:-"all"} # Default theme is "all"
OUTPUT_DIR=${3:-"$(pwd)/output"}
RELEASE=${4:-"2024-04-16-beta.0"}
COMBINE=${5:-false} # Default is to create separate tiles per theme
BASE_THEMES_PATH=${6:-"base_theme.json"} # Default path to base_themes.json
S3_URL=${7:-""} # Default path to base_themes.json
DELETE=${8:-true} 

# Display the parameters supplied
echo "Parameters supplied:"
echo "Bounding box: $BBOX"
echo "Theme: $THEME"
echo "Output directory: $OUTPUT_DIR"
echo "Release: $RELEASE"
echo "Combine: $COMBINE"
echo "Base themes path: $BASE_THEMES_PATH"
echo "S3 URL : $S3_URL"
echo ""

# Function to read themes from base_themes.json
base_themes_file="$BASE_THEMES_PATH"
if [ ! -f "$base_themes_file" ]; then
    echo "Error: $base_themes_file not found"
    exit 1
fi
BASE_THEMES=$(jq -c '.[]' "$base_themes_file")



# Function to download, validate, and convert data
download_and_convert() {
    local theme_info=$1
    local is_nested=${2:-false}
    local theme=$(echo "$theme_info" | jq -r '.theme // ""')
    local type=$(echo "$theme_info" | jq -r '.type // ""')
    local name=$(echo "$theme_info" | jq -r '.name')
    local min_zoom=$(echo "$theme_info" | jq -r '.minZoom')
    local max_zoom=$(echo "$theme_info" | jq -r '.maxZoom')

    local output_file_parquet="$OUTPUT_DIR/parquet/$name.geo.parquet"
    local output_file_geojson="$OUTPUT_DIR/geojson/$name.geojsonseq"

    # Create the output directories if they don't exist
    mkdir -p "$OUTPUT_DIR/pmtiles" "$OUTPUT_DIR/geojson" "$OUTPUT_DIR/parquet"

    # Download data
    if [ -n "$BBOX" ]; then
        if [ -n "$theme" ]; then
            if [ -n "$type" ]; then
                echo "Download: $type , bbox:true , theme:$theme ...."
                overturemaps download -f geoparquet --bbox "$BBOX" -cth "$theme" -cty "$type" -o "$output_file_parquet"
            else
                echo "Download: bbox:true , theme:$theme ...."
                
                overturemaps download -f geoparquet --bbox "$BBOX" -cth "$theme" -o "$output_file_parquet"
            fi
        else
            echo "Download: $type , bbox:true ...."
            overturemaps download -f geoparquet --type="$type" --bbox "$BBOX" -o "$output_file_parquet"
        fi
    else
        if [ -n "$theme" ]; then
            if [ -n "$type" ]; then
                echo "Download: $type, bbox:false , theme:$theme ...."
                overturemaps download -f geoparquet -cth "$theme" -cty "$type" -o "$output_file_parquet"
            else
                echo "Download: bbox:false , theme:$theme ...."
                overturemaps download -f geoparquet -cth "$theme" -o "$output_file_parquet"
            fi
        else
            echo "Download: $type, bbox:false ...."
            overturemaps download -f geoparquet --type="$type" -o "$output_file_parquet"
        fi
    fi

    echo "Convert: $type parquet to geojsonseq ...."
    python pyscripts/parquet2geojson.py -f geojsonseq -i "$output_file_parquet" -o "$output_file_geojson"

    # Add the theme to the processed_themes array
    if [ "$is_nested" = "false" ]; then
        processed_themes+=("$theme_info")
    fi
}

upload_to_s3() {
    local output_dir=$1
    local s3_url=$2

    if [ -z "$s3_url" ]; then
        echo "No S3 URL provided, skipping upload."
        return
    fi

    echo "Uploading $output_dir to $s3_url..."

    # Install AWS CLI if not already installed
    if ! command -v aws &> /dev/null; then
        echo "AWS CLI not found, installing..."
            sudo apt-get update
            sudo apt-get install -y awscli
    fi

    aws s3 cp --recursive "$output_dir" "$s3_url"
}

# Function to process nested entries
process_nested_entries() {
    local nested_entry=$1
    local parent_name=$(echo "$nested_entry" | jq -r '.name')
    local parent_minzoom=$(echo "$nested_entry" | jq -r '.minZoom')
    local parent_maxzoom=$(echo "$nested_entry" | jq -r '.maxZoom')


    local nested_layer_flags=""

    for layer in $(echo "$nested_entry" | jq -c '.layers[]'); do
        name=$(echo "$layer" | jq -r '.name')
        theme=$(echo "$layer" | jq -r '.theme')
        type=$(echo "$layer" | jq -r '.type')
        min_zoom=$(echo "$layer" | jq -r '.minZoom')
        max_zoom=$(echo "$layer" | jq -r '.maxZoom')

        download_and_convert "$layer" true
        nested_layer_flags="$nested_layer_flags --named-layer=$type:$OUTPUT_DIR/geojson/$name.geojsonseq"
    done

    echo "Create: $parent_name.pmtiles , layers:multi ...."
    tippecanoe -o "$OUTPUT_DIR/pmtiles/$parent_name.pmtiles" -Z$parent_minzoom -z$parent_maxzoom $nested_layer_flags --force --read-parallel -rg --drop-densest-as-needed
}

# Check if a valid theme is provided
if [ "$THEME" = "all" ]; then
    echo "Start..."
    processed_themes=()
    while read -r theme_info; do
        if $(echo "$theme_info" | jq -e '.layers? | type == "array"'); then
            process_nested_entries "$theme_info"
        else
            download_and_convert "$theme_info"
        fi
    done <<< "$BASE_THEMES"

    if $COMBINE; then
        echo "Create: combined-$RELEASE.pmtiles , layers:multi ...."
        LAYER_FLAGS=""
        for theme_info in "${processed_themes[@]}"; do
            name=$(echo "$theme_info" | jq -r '.name')
            type=$(echo "$theme_info" | jq -r '.type')
            min_zoom=$(echo "$theme_info" | jq -r '.minZoom')
            max_zoom=$(echo "$theme_info" | jq -r '.maxZoom')
            LAYER_FLAGS="$LAYER_FLAGS -L $type:$OUTPUT_DIR/geojson/$name.geojsonseq"
        done
        tippecanoe -o "$OUTPUT_DIR/pmtiles/combined-$RELEASE.pmtiles" $LAYER_FLAGS --force --read-parallel -rg --drop-densest-as-needed
        echo "Complete: Mode - Multilayer"
   else
       for theme_info in "${processed_themes[@]}"; do
           name=$(echo "$theme_info" | jq -r '.name')
           type=$(echo "$theme_info" | jq -r '.type')
           min_zoom=$(echo "$theme_info" | jq -r '.minZoom')
           max_zoom=$(echo "$theme_info" | jq -r '.maxZoom')
           echo "Convert: $name geojsonseq to PMtiles ...."
           tippecanoe -o "$OUTPUT_DIR/pmtiles/$name.pmtiles" "$OUTPUT_DIR/geojson/$name.geojsonseq" --force --read-parallel -l "$name" -Z$min_zoom -z$max_zoom -rg --drop-densest-as-needed
       done
       echo "Complete: Mode - Separate tiles per theme"
   fi
else
   echo "Starting data download and conversion for $THEME..."
   theme_info=$(echo "$BASE_THEMES" | jq --arg type "$THEME" '.[] | select(.type == $type)')
   if [ -z "$theme_info" ]; then
       echo "Error: Invalid theme $THEME"
       exit 1
   fi
   download_and_convert "$theme_info"
   name=$(echo "$theme_info" | jq -r '.name')
   min_zoom=$(echo "$theme_info" | jq -r '.minZoom')
   max_zoom=$(echo "$theme_info" | jq -r '.maxZoom')
   echo "Convert: $name geojsonseq to PMtiles ...."
   tippecanoe -o "$OUTPUT_DIR/pmtiles/$name.pmtiles" "$OUTPUT_DIR/geojson/$name.geojsonseq" --force --read-parallel -l "$name" -Z$min_zoom -z$max_zoom -rg --drop-densest-as-needed
   echo "Complete : Mode - Single"
fi
if $DELETE; then 
    # Remove geojson seq
    sudo rm -rf "$OUTPUT_DIR/geojson"
fi

if [ -n "$S3_URL" ]; then
    upload_to_s3 "$OUTPUT_DIR" "$S3_URL/$OUTPUT_DIR"
    # Uploaded to s3, remove original dir
    sudo rm -rf "$OUTPUT_DIR"
fi