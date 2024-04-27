#!/bin/bash

# Set variables
BBOX=${1:-""} # No default bounding box
THEME=${2:-""} # No default theme
OUTPUT_PATH=${3:-"."}

# Array of valid themes
VALID_THEMES=(
    "locality"
    "locality_area"
    "administrative_boundary"
    "building"
    "building_part"
    "place"
    "segment"
    "connector"
    "infrastructure"
    "land"
    "land_use"
    "water"
)

# Function to download, validate, and convert data
download_and_convert() {
    local theme=$1
    local output_file="$OUTPUT_PATH/$theme.geojsonseq"

    # Download data
    if [ -n "$BBOX" ]; then
        echo "Downloading $theme data within the specified bounding box..."
        overturemaps download -f geojsonseq --type="$theme" --bbox "$BBOX" -o "$output_file"
    else
        echo "Downloading $theme data for the entire dataset..."
        overturemaps download -f geojsonseq --type="$theme" -o "$output_file"
    fi

    # Convert to geojsonseq to PMTiles
    echo "Converting $theme data to PMtiles format ..."
    tippecanoe -o "$OUTPUT_PATH/$theme.pmtiles" "$OUTPUT_PATH/$theme.geojsonseq" --force --read-parallel -l "$theme" -rg --drop-densest-as-needed

    echo "Done processing $theme data."
}

# Check if a valid theme is provided
if [ -n "$THEME" ] && printf '%s\n' "${VALID_THEMES[@]}" | grep -qw "$THEME"; then
    echo "Starting data download and conversion for $THEME..."
    download_and_convert "$THEME"
    echo "Data download and conversion completed."
elif [ -z "$THEME" ]; then
    echo "No theme provided. Downloading and processing all themes..."
    for theme in "${VALID_THEMES[@]}"; do
        download_and_convert "$theme"
    done
    echo "Data download and conversion for all themes completed."
else
    echo "Invalid theme provided. Please provide a valid theme from the following options:"
    printf "%s\n" "${VALID_THEMES[@]}"
fi