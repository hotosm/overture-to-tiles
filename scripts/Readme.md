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


## Example testing areas : 

1. Nepal 
```bash
time bash ./extract.sh "79.991455,26.372185,88.220215,30.477083" "" "/mnt/disk/nepal" "" false "base_theme.json" "s3://staging-raw-data-api/default/overture/nepal"
```

2. Indonesia  
```bash
time bash ./extract.sh "95.29, -10.36, 141.03, 5.48" "" "/mnt/disk/indonesia" "" false "base_theme.json" "s3://staging-raw-data-api/default/overture/2024-05-16-beta.0/indonesia"
```

3. Argentina 
```bash
time bash ./extract.sh "-73.42, -55.25, -53.63, -21.83" "" "/mnt/disk/argentina" "" false "base_theme.json" "s3://staging-raw-data-api/default/overture/2024-05-16-beta.0/argentina"
```

4. Brazil 
```bash
time bash ./extract.sh "-73.99, -33.77, -34.73, 5.24" "" "/mnt/disk/brazil" "" false "base_theme.json" "s3://staging-raw-data-api/default/overture/2024-05-16-beta.0/brazil"
```

5. Liberia
```bash
time bash ./extract.sh "-11.44, 4.36, -7.54, 8.54" "" "/mnt/disk/liberia" "" false "base_theme.json" "s3://staging-raw-data-api/default/overture/2024-05-16-beta.0/liberia"
```

6. Nigeria 

```bash
time bash ./extract.sh "2.69, 4.24, 14.58, 13.87" "" "/mnt/disk/nigeria" "" false "base_theme.json" "s3://staging-raw-data-api/default/overture/2024-05-16-beta.0/nigeria"
```

7. Kenya

```bash
time bash ./extract.sh "33.89, -4.68, 41.86, 5.51" "" "/mnt/disk/kenya" "" false "base_theme.json" "s3://staging-raw-data-api/default/overture/2024-05-16-beta.0/kenya"
```

8. Malawi

```bash
time bash ./extract.sh "32.69, -16.8, 35.77, -9.23" "" "/mnt/disk/malawi" "" false "base_theme.json" "s3://staging-raw-data-api/default/overture/2024-05-16-beta.0/malawi"
```