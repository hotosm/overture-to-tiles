#!/bin/bash

# Set variables
COUNTRY_GEOJSON=${1:-""} # No default country boundary GeoJSON
RELEASE_VERSION=${2:-"2024-04-16-beta.0"} # Current release version
THEME=${3:-"all"} # Default to extract all themes if no theme is provided
OUTPUT_PATH=${4:-"."}

# Function to extract and convert data
extract_and_convert() {
    local theme=$1
    local filter_condition=$2
    local output_file="$theme"

    echo "Extracting $theme data..."

    duckdb -c """
        INSTALL httpfs;
        LOAD httpfs;
        INSTALL spatial;
        LOAD spatial;

        COPY (
            SELECT *
            FROM read_parquet('s3://overturemaps-us-west-2/release/$RELEASE_VERSION/theme=$theme/type=*//*', hive_partitioning=1)
            WHERE $filter_condition
        )
        TO '$output_file.parquet' (FORMAT 'parquet');
    """

    echo "Converting $theme data to GeoParquet format..."
    gpq convert $output_file.parquet "$OUTPUT_PATH/$output_file-geo.parquet" --from=parquet --to=geoparquet

    echo "Converting $theme data to PMTiles format..."
    ogr2ogr -f 'pmtiles' "$OUTPUT_PATH/$output_file.pmtiles" "$OUTPUT_PATH/$output_file-geo.parquet" -progress

    echo "Done processing $theme data."
}

# Call the function for specified theme or all themes
echo "Starting data extraction and conversion..."

if [ "$THEME" == "all" ]; then
    if [ -z "$COUNTRY_GEOJSON" ]; then
        # Extract all data without filtering
        extract_and_convert "admins" "1" "admins"
        extract_and_convert "transportation" "1" "transportation"
        extract_and_convert "buildings" "1" "buildings"
        extract_and_convert "places" "1" "places"
    else
        # Filter data based on GeoJSON
        extract_and_convert "admins" "ST_Intersects(ST_GeomFromWKB(a.geometry), ST_GeomFromWKB(b.wkb_geometry))" "admins"
        extract_and_convert "transportation" "ST_Intersects(ST_GeomFromWKB(a.geometry), ST_GeomFromWKB(b.wkb_geometry))" "transportation"
        extract_and_convert "buildings" "ST_Intersects(ST_GeomFromWKB(a.geometry), ST_GeomFromWKB(b.wkb_geometry))" "buildings"
        extract_and_convert "places" "ST_Intersects(ST_GeomFromWKB(a.geometry), ST_GeomFromWKB(b.wkb_geometry))" "places"
    fi
else
    filter_condition=""
    if [ -n "$COUNTRY_GEOJSON" ]; then
        filter_condition="ST_Intersects(ST_GeomFromWKB(a.geometry), ST_GeomFromWKB(b.wkb_geometry))"
    else
        filter_condition="1"
    fi
    extract_and_convert "$THEME" "$filter_condition" "$THEME"
fi

echo "Data extraction and conversion completed."