#!/bin/bash

set -e

# Display the parameters supplied
echo "Parameters supplied:"
echo "Bounding box: $1"
echo "Theme: $2"
echo "Output directory: $3"
echo "Release: $4"
echo "Combine: $5"
echo ""

# Set variables
BBOX=${1:-""} # No default bounding box
THEME=${2:-"all"} # Default theme is "all"
OUTPUT_DIR=${3:-"$(pwd)/output"}
RELEASE=${4:-"2024-04-16-beta.0"}
COMBINE=${5:-false} # Default is to create separate tiles per theme

# Array of valid themes with their corresponding min and max zoom levels
DEFAULT_THEMES=(
    "place,5,10"
    "locality,6,12"
    "segment,10,14"
    "building,12,16"
    "infrastructure,10,15"
    "administrative_boundary,5,12"
    "land_use,8,14"
    "water,5,14"
    "land,5,14"
    # "building_part,12,16"
    # "connector,10,14"
    # "locality_area,6,12"
)

# Function to download, validate, and convert data
download_and_convert() {
    local theme_info=$1
    local theme="${theme_info%,*}"
    local min_zoom="${theme_info#*,}"
    local max_zoom="${min_zoom#*,}"
    min_zoom="${min_zoom%,*}"

    local output_file_parquet="$OUTPUT_DIR/parquet/$theme.geo.parquet"
    local output_file_geojson="$OUTPUT_DIR/geojson/$theme.geojsonseq"

    # Create the output directories if they don't exist
    mkdir -p "$OUTPUT_DIR/pmtiles" "$OUTPUT_DIR/geojson" "$OUTPUT_DIR/parquet"

    # Download data
    if [ -n "$BBOX" ]; then
        echo "Download: $theme , bbox:true ...."
        overturemaps download -f geoparquet --type="$theme" --bbox "$BBOX" -o "$output_file_parquet"
    else
        echo "Download: $theme, bbox:false ...."
        overturemaps download -f geoparquet --type="$theme" -o "$output_file_parquet"
    fi

    echo "Convert: $theme parquet to geojsonseq ...."
    python pyscripts/parquet2geojson.py -f geojsonseq -i "$output_file_parquet" -o "$output_file_geojson"

    # Add the theme to the processed_themes array
    processed_themes+=("$theme_info")
}

# Check if a valid theme is provided
if [ "$THEME" = "all" ]; then
    echo "Start..."
    processed_themes=()
    for theme_info in "${DEFAULT_THEMES[@]}"; do
        download_and_convert "$theme_info"
    done
    if $COMBINE; then
        echo "Create: overture-$RELEASE.pmtiles , layers:multi ...."
        LAYER_FLAGS=""
        for theme_info in "${processed_themes[@]}"; do
            theme="${theme_info%,*}"
            min_zoom="${theme_info#*,}"
            max_zoom="${min_zoom#*,}"
            min_zoom="${min_zoom%,*}"
            LAYER_FLAGS="$LAYER_FLAGS -L $theme:$OUTPUT_DIR/geojson/$theme.geojsonseq -Z$min_zoom -z$max_zoom"
        done
        tippecanoe -fo "$OUTPUT_DIR/pmtiles/overture-$RELEASE.pmtiles" $LAYER_FLAGS --force --read-parallel -rg --drop-densest-as-needed
        echo "Complete: Mode - Multilayer"
    else
        for theme_info in "${processed_themes[@]}"; do
            theme="${theme_info%,*}"
            min_zoom="${theme_info#*,}"
            max_zoom="${min_zoom#*,}"
            min_zoom="${min_zoom%,*}"
            echo "Convert: $theme geojsonseq to PMtiles ...."
            tippecanoe -fo "$OUTPUT_DIR/pmtiles/$theme.pmtiles" "$OUTPUT_DIR/geojson/$theme.geojsonseq" --force --read-parallel -l "$theme" -Z$min_zoom -z$max_zoom -rg --drop-densest-as-needed
        done
        echo "Complete: Mode - Separate tiles per theme"
    fi
else
    echo "Starting data download and conversion for $THEME..."
    download_and_convert "$THEME"
    theme="${THEME%,*}"
    min_zoom="${THEME#*,}"
    max_zoom="${min_zoom#*,}"
    min_zoom="${min_zoom%,*}"
    echo "Convert: $THEME geojsonseq to PMtiles ...."
    tippecanoe -fo "$OUTPUT_DIR/pmtiles/$theme.pmtiles" "$OUTPUT_DIR/geojson/$theme.geojsonseq" --force --read-parallel -l "$theme" -Z$min_zoom -z$max_zoom -rg --drop-densest-as-needed
    echo "Complete : Mode - Single"
fi