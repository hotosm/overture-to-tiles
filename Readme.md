## Process overture data

This repo has scripts that downloads overture map data , clips it for your area of interest , converts vector tiles so that it can be visualized in maps.


## Release and Source 

https://github.com/OvertureMaps/data


```
s3://overturemaps-us-west-2/release/2024-04-16-beta.0/
  |-- theme=admins/
  |-- theme=base/
  |-- theme=buildings/
  |-- theme=divisions/
  |-- theme=places/
  |-- theme=transportation/
```

## Installation 

There are two ways to extract : 

1. **Using overturemap python cli and tippecanoe [Recommended]**

- Install [overturemap cli](https://github.com/OvertureMaps/overturemaps-py/tree/main) -> Downloads dataset from s3 to geojsonseq
- Install [tippecanoe](https://github.com/felt/tippecanoe) -> Converts geojsonseq to pmtiles , Install using [bash](./install/install-tippecanoe.sh)


2. **Using duckdb and gpq**

- Install [duckdb](https://duckdb.org/docs/installation/index) -> Downloads from s3 and converts file to parquet, Install using [bash](./install/install-duckdb.sh)
- Install [gpq](https://github.com/planetlabs/gpq#installation) -> Converts parquet to geoparquet 
- Install [gdal](https://gdal.org/programs/ogr2ogr.html) -> Cnverts geoparquet to tiles (Requires gdal>3.7)



## Usage 


### 1. Using overturepy cli [Recommended]

  #### Options : 
    - **BBOX (optional)**: The bounding box coordinates for the desired area. If not provided, no bounding box filter will be applied.
    - **THEME (optional):** The theme or type of data to be downloaded. If not provided, it defaults to "all", which means all available themes will be processed.
    - **OUTPUT_PATH (optional):** The output directory where the downloaded and converted data files will be saved. If not provided, it defaults to the current directory.
  


  - Extract all data

  ```bash 
  bash ./extract-python.sh 
  ```


  - Example to download places data only 

  ```bash
  bash ./extract-python.sh "" "locality"
  ```
  

### 2. Using duckdb and gpq 

  ```bash
  bash ./extract-duckdb.sh [country_geojson] [release_version] [theme] [output_path]
  ```
  - `country_geojson`: (Optional) Path to the country boundary GeoJSON file. If not provided, all data will be extracted without filtering.
  - `release_version`: (Optional) The current release version. Default is `"2024-04-16-beta.0"`.
  - `theme`: (Optional) The specific theme to extract and convert. If not provided or set to `"all"`, data for all themes will be extracted and converted. Supported themes are: `admins`, `transportation`, `buildings`, and `places`.
  - `output_path`: (Optional) The output path for the GeoParquet and PMTiles files. Default is the current directory (`.`).

    #### Bash Example

    - Extract and convert data for the `admins` theme without filtering:
    
    ```bash
    bash ./extract-duckdb.sh "" "2024-04-16-beta.0" "admins"
    ```

## Output

The script will generate the following files in the specified `output_path`:

- `<theme>.pmtiles`: PMTiles file converted from the GeoParquet file, suitable for rendering and visualization.

Note that if you extract data for all themes, separate GeoParquet and PMTiles files will be generated for each theme.

You can visualize your extracted pmtiles using [Pmtiles viewer](https://protomaps.github.io/PMTiles/)


### Notebook example

I have provided how we can use duckdb to run spatial queries over the downloaded parquet files in this [notebook](./overture_duckdb.ipynb) 
