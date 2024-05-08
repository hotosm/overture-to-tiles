## Overture data to Tiles

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

**Using overturemap python cli and tippecanoe [Recommended]**

- Install [overturemap cli](https://github.com/OvertureMaps/overturemaps-py/tree/main) -> Downloads dataset from s3 to geojsonseq
  ```bash
  pip install git+https://github.com/kshitijrajsharma/overturemaps-py.git/@main
- Install [tippecanoe](https://github.com/felt/tippecanoe) -> Converts geojsonseq to pmtiles , Install using [bash](./install/install-tippecanoe.sh)
  ```bash
  bash ./install/install-tippecanoe.sh


## Examples: 

1. Download everything in pokhara and convert it to individual tiles per theme
```bash
bash scripts/extract.sh "83.931770,28.172507,84.042320,28.263566" "" "pokhara"
```

2. Download everything in pokhara and create a single pmtiles with multiple layers in it

```bash
bash scripts/extract.sh "83.931770,28.172507,84.042320,28.263566" "" "pokhara" "" true
```


## Usage 

#### Options : 
  - **BBOX (optional)**: The bounding box coordinates for the desired area. If not provided, no bounding box filter will be applied.
  - **THEME (optional):** The theme or type of data to be downloaded. If not provided, it defaults to "all", which means all available themes will be processed.
  - **OUTPUT_PATH (optional):** The output directory where the downloaded and converted data files will be saved. If not provided, it defaults to the current directory.

#### Overture-py cli themes 
```json 
{
  "locality": "admins",
  "locality_area": "admins",
  "administrative_boundary": "admins",
  "building": "buildings",
  "building_part": "buildings",
  "place": "places",
  "segment": "transportation",
  "connector": "transportation",
  "infrastructure": "base",
  "land": "base",
  "land_use": "base",
  "water": "base"
}
```


## Output

The script will generate the following files in the specified `output_path`:

- `<theme>.pmtiles`: PMTiles file converted from the GeoParquet file, suitable for rendering and visualization.

Note that if you extract data for all themes, separate GeoParquet and PMTiles files will be generated for each theme.

You can visualize your extracted pmtiles using [Pmtiles viewer](https://protomaps.github.io/PMTiles/)

