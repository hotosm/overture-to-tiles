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
BBOX=${1:-""}  # No default bounding box
THEME=${2:-"all"}  # Default theme is "all"
OUTPUT_DIR=${3:-"$(pwd)/output"}
RELEASE=${4:-"2024-04-16-beta.0"}
COMBINE=${5:-false}  # Default is to create separate tiles per theme

# Array of valid themes and their corresponding input files
BASE_THEMES=(
    "place:place.geojson"
    "locality:locality.geojson"
    "segment:segment.geojson"
    "building:building.geojson"
    "infrastructure:infrastructure.geojson"
    "administrative_boundary:administrative_boundary.geojson"
    "land:land.geojson"
    "land_use:land_use.geojson"
    "water:water.geojson"
    # "building_part:building_part.geojson"
    # "connector:connector.geojson"
    # "locality_area:locality_area.geojson"
)

# Function to download, validate, and convert data
download_and_convert() {
    local theme_file=$1
    theme="${theme_file%:*}"
    input_file="${theme_file#*:}"
    output_file_parquet="$OUTPUT_DIR/parquet/$theme.geo.parquet"
    output_file_geojson="$OUTPUT_DIR/geojson/$theme.geojsonseq"

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
    processed_themes+=("$theme")
}

# Check if a valid theme is provided
if [ "$THEME" = "all" ]; then
    echo "Start..."
    processed_themes=()
    for theme_file in "${BASE_THEMES[@]}"; do
        download_and_convert "$theme_file"
    done

    if $COMBINE; then
        echo "Create: overture-$RELEASE.pmtiles , layers:multi ...."
        LAYER_FLAGS=""
        for theme in "${processed_themes[@]}"; do
            LAYER_FLAGS="$LAYER_FLAGS -L $theme:$OUTPUT_DIR/geojson/$theme.geojsonseq"
        done
        tippecanoe -o "$OUTPUT_DIR/pmtiles/overture-$RELEASE.pmtiles" $LAYER_FLAGS --force --read-parallel -rg --drop-densest-as-needed
        echo "Complete: Mode - Multilayer"
    else
        for theme in "${processed_themes[@]}"; do
            echo "Convert: $theme geojsonseq to PMtiles ...."
            tippecanoe -o "$OUTPUT_DIR/pmtiles/$theme.pmtiles" "$OUTPUT_DIR/geojson/$theme.geojsonseq" --force --read-parallel -l "$theme" -rg --drop-densest-as-needed
        done
        echo "Complete: Mode - Separate tiles per theme"
    fi
else
    echo "Starting data download and conversion for $THEME..."
    download_and_convert "$THEME"
    theme="${THEME%:*}"
    input_file="${THEME#*:}"
    echo "Convert: $theme geojsonseq to PMtiles ...."
    tippecanoe -o "$OUTPUT_DIR/pmtiles/$theme.pmtiles" "$OUTPUT_DIR/geojson/$theme.geojsonseq" --force --read-parallel -l "$theme" -rg --drop-densest-as-needed
    echo "Complete : Mode - Single"
fi
