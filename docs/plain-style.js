// color palette
var land = "#ccdae8";
var building = "#dce6ef";
var water = "#3063d2";
var park = "#09bac6";
var forest = "#09bac6";
var sand = "#EBD5BD";

var roadMinor = "#a7bfd7";

var placeLabel = "#071F3F";
var placeCasing = "#dce6ef";
var boundary = "#ff6961";

const layers = {
  land: {
    id: "land",
    type: "fill",
    source: "base",
    "source-layer": "land",
    paint: {
      "fill-color": land,
    },
  },
  buildings: {
    id: "buildings",
    type: "fill",
    source: "buildings",
    "source-layer": "buildings",
    paint: {
      "fill-color": building,
    },
  },
  landuse: {
    id: "landuse",
    type: "fill",
    source: "base",
    "source-layer": "landuse",
    paint: {
      "fill-color": [
        "match",
        ["get", "subtype"],
        "park",
        park,
        ["fairway"],
        park,
        ["recreation_sand"],
        sand,
        forest,
      ],
    },
  },
  water: {
    id: "water",
    type: "fill",
    source: "base",
    "source-layer": "water",
    paint: {
      "fill-color": water,
    },
  },
  roads: {
    id: "roads",
    type: "line",
    source: "roads",
    "source-layer": "roads",
    paint: {
      "line-color": roadMinor,
      "line-width": 2,
    },
  },
  placenames: {
    id: "placenames",
    type: "symbol",
    source: "placenames",
    "source-layer": "placenames",
    layout: {
      "text-field": ["get", "names.primary"],
      "text-font": ["Noto Sans Bold"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 8, 10, 22, 22],
      "text-transform": "uppercase",
      "text-padding": 10,
      "text-max-width": 6,
      "symbol-avoid-edges": true,
      "text-justify": "auto",
    },
    paint: {
      "text-color": placeLabel,
      "text-halo-color": placeCasing,
      "text-halo-width": 1,
    },
  },
  places: {
    id: "places",
    type: "symbol",
    source: "places",
    "source-layer": "places",
    layout: {
      "text-field": ["concat", "■\n", ["get", "names.primary"]],
      "text-font": ["Noto Sans Bold"],
      "text-max-width": 5,
      "text-size": 10,
      "text-line-height": 1,
      "text-justify": "center",
      "text-anchor": "center",
      "text-radial-offset": 0.8,
      "text-padding": 4,
    },
    paint: {
      "text-color": placeLabel,
      "text-halo-color": placeCasing,
      "text-halo-width": 1,
    },
  },
  boundary: {
    id: "boundary",
    type: "line",
    source: "boundary",
    "source-layer": "boundary",
    paint: {
      "line-color": boundary,
    },
  },
};

export const layerOrder = [
  "land",
  "buildings",
  "landuse",
  "water",
  "roads",
  "placenames",
  "places",
  "boundary",
];
export const allLayers = layers;
