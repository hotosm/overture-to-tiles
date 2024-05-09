## Examples 

1. Download everything in pokhara and convert it to individual tiles per theme
```bash
bash ./extract.sh "83.931770,28.172507,84.042320,28.263566" "" "pokhara"
```

2. Download everything in pokhara and create a single pmtiles with multiple layers in it

```bash
bash ./extract.sh "83.931770,28.172507,84.042320,28.263566" "" "pokhara" "" true
```


## Params : 
```
"Bounding box: $1"
"Theme: $2"
"Output directory: $3"
"Release: $4"
"Combine: $5"
```