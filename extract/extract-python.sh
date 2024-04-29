#!/bin/bash

set -e

# Set variables
BBOX=${1:-""} # No default bounding box
THEME=${2:-"all"} # Default theme is "all"
OUTPUT_PATH=${3:-"$(pwd)"}
RELEASE=${4:-"2024-04-16-beta.0"}

# Array of valid themes and their corresponding input files
VALID_THEMES=(
    "locality:locality.geojson"
    "locality_area:locality_area.geojson"
    "administrative_boundary:administrative_boundary.geojson"
    "building:building.geojson"
    "building_part:building_part.geojson"
    "place:place.geojson"
    "segment:segment.geojson"
    "connector:connector.geojson"
    "infrastructure:infrastructure.geojson"
    "land:land.geojson"
    "land_use:land_use.geojson"
    "water:water.geojson"
)

# Function to download, validate, and convert data
download_and_convert() {
    local theme_file=$1
    theme="${theme_file%:*}"
    input_file="${theme_file#*:}"
    output_file="$OUTPUT_PATH/$theme.geojsonseq"

    # Check if OUTPUT_PATH is an absolute path
    if [[ "$OUTPUT_PATH" != /* ]]; then
        # If not, create it relative to the current working directory
        OUTPUT_PATH="$(pwd)/$OUTPUT_PATH"
    fi

    # Create the output directory if it doesn't exist
    mkdir -p "$OUTPUT_PATH"

    # Download data
    if [ -n "$BBOX" ]; then
        echo "Downloading $theme data within the specified bounding box..."
        overturemaps download -f geojsonseq --type="$theme" --bbox "$BBOX" -o "$output_file"
    else
        echo "Downloading $theme data for the entire dataset..."
        overturemaps download -f geojsonseq --type="$theme" -o "$output_file"
    fi
}

# Check if a valid theme is provided
if [ "$THEME" = "all" ]; then
    echo "Downloading and processing all themes..."
    LAYER_FLAGS=""
    for theme_file in "${VALID_THEMES[@]}"; do
        download_and_convert "$theme_file"
        theme="${theme_file%:*}"
        input_file="${theme_file#*:}"
        LAYER_FLAGS="$LAYER_FLAGS -L $theme:$OUTPUT_PATH/$theme.geojsonseq"
    done

    echo "Creating overture-$RELEASE.pmtiles with multiple layers..."
    tippecanoe -o "$OUTPUT_PATH/overture-$RELEASE.pmtiles" $LAYER_FLAGS --force --read-parallel -rg --drop-densest-as-needed

    echo "Data download and conversion for all themes completed."
else
    echo "Starting data download and conversion for $THEME..."
    download_and_convert "$THEME"
    theme="${THEME%:*}"
    input_file="${THEME#*:}"
    echo "Converting $theme data to PMtiles format ..."
    tippecanoe -o "$OUTPUT_PATH/$theme.pmtiles" -L "$theme:$OUTPUT_PATH/$theme.geojsonseq" --force --read-parallel -rg --drop-densest-as-needed
    echo "Data download and conversion completed."
fi