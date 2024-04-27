#!/bin/bash

# Set variables
BBOX=${1:-""} # No default bounding box
THEME=${2:-"all"} # Default to extract all themes if no theme is provided
OUTPUT_PATH=${3:-"."}

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
    tippecanoe -o "$OUTPUT_PATH/$theme.pmtiles" "$OUTPUT_PATH/$theme.geojsonseq --force --read-parallel -l $theme -rg --drop-densest-as-needed"
    echo "Done processing $theme data."
}

# Call the download_and_convert function for specified theme or all themes
echo "Starting data download and conversion..."

if [ "$THEME" == "all" ]; then
    for theme in $(overturemaps download --help | grep -o 'type=[a-z]*' | cut -d'=' -f2); do
        download_and_convert "$theme"
    done
else
    download_and_convert "$THEME"
fi

echo "Data download and conversion completed."