#!/bin/bash

set -e

# Set variables
BBOX=${1:-""} # No default bounding box
THEME=${2:-"all"} # Default theme is "all"
OUTPUT_DIR=${3:-"$(pwd)/output"}
RELEASE=${4:-"2024-04-16-beta.0"}
COMBINE=${5:-false} # Default is to create separate tiles per theme
BASE_THEMES_PATH=${6:-"default_theme.json"} # Default path to base_themes.json


# Display the parameters supplied
echo "Parameters supplied:"
echo "Bounding box: $BBOX"
echo "Theme: $THEME"
echo "Output directory: $OUTPUT_DIR"
echo "Release: $RELEASE"
echo "Combine: $COMBINE"
echo "Base themes path: $BASE_THEMES_PATH"
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
    processed_themes+=("$theme_info")
}

# Check if a valid theme is provided
if [ "$THEME" = "all" ]; then
    echo "Start..."
    processed_themes=()
    while read -r theme_info; do
        download_and_convert "$theme_info"
    done <<< "$BASE_THEMES"
    if $COMBINE; then
        echo "Create: overture-$RELEASE.pmtiles , layers:multi ...."
        LAYER_FLAGS=""
        for theme_info in "${processed_themes[@]}"; do
            name=$(echo "$theme_info" | jq -r '.name')
            min_zoom=$(echo "$theme_info" | jq -r '.minZoom')
            max_zoom=$(echo "$theme_info" | jq -r '.maxZoom')
            LAYER_FLAGS="$LAYER_FLAGS -L $type:$OUTPUT_DIR/geojson/$name.geojsonseq"
        done
        tippecanoe -o "$OUTPUT_DIR/pmtiles/combined-$RELEASE.pmtiles" $LAYER_FLAGS --force --read-parallel -rg --drop-densest-as-needed
        echo "Complete: Mode - Multilayer"
    else
        for theme_info in "${processed_themes[@]}"; do
            name=$(echo "$theme_info" | jq -r '.name')
            min_zoom=$(echo "$theme_info" | jq -r '.minZoom')
            max_zoom=$(echo "$theme_info" | jq -r '.maxZoom')
            echo "Convert: $type geojsonseq to PMtiles ...."
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