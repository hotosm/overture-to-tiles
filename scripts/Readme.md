## Examples 

1. Download everything in pokhara and convert it to individual tiles per theme
```bash
bash ./extract.sh "83.931770,28.172507,84.042320,28.263566" "" "pokhara"
```

2. Download everything in pokhara using base_theme.json , convert it to individual tiles per theme and upload to s3
```bash
bash ./extract.sh "83.931770,28.172507,84.042320,28.263566" "" "pokhara" "" false "base_theme.json" "s3://staging-raw-data-api/default/overture"
```

3. Download everything in pokhara and create a single pmtiles with multiple layers in it

```bash
bash ./extract.sh "83.931770,28.172507,84.042320,28.263566" "" "pokhara" "" true
```


## Params : 
```
BBOX=${1:-""} # No default bounding box
THEME=${2:-"all"} # Default theme is "all"
OUTPUT_DIR=${3:-"$(pwd)/output"}
RELEASE=${4:-"2024-04-16-beta.0"}
COMBINE=${5:-false} # Default is to create separate tiles per theme
BASE_THEMES_PATH=${6:-"base_theme.json"} # Default path to base_themes.json
S3_URL=${7:-""} # Default path to base_themes.json
DELETE=${8:-true} 
```