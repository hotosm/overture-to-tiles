let allLayers;
let layerOrder;

import {
  allLayers as localAllLayers,
  layerOrder as localLayerOrder,
} from "./styles/default.js";

let protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

const urlParams = new URLSearchParams(window.location.search);
const BASE_URL = urlParams.get("url");

const STYLE_FILE = urlParams.get("style");

if (STYLE_FILE) {
  import(STYLE_FILE)
    .then((module) => {
      allLayers = module.allLayers;
      layerOrder = module.layerOrder;
    })
    .catch((error) => {
      console.error("Error importing module from URL:", error);
    });
} else {
  allLayers = localAllLayers;
  layerOrder = localLayerOrder;
}

if (BASE_URL) {
  let base_pmtile = BASE_URL + "/base.pmtiles";
  const p = new pmtiles.PMTiles(base_pmtile);

  protocol.add(p);

  p.getHeader().then((h) => {
    const osmMap = new maplibregl.Map({
      container: "osm",
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap Contributors",
            maxzoom: 19,
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
        ],
      },
      center: [h.centerLon, h.centerLat],
      zoom: h.maxZoom - 2,
    });

    const satellite = new maplibregl.Map({
      container: "satellite",
      style: {
        version: 8,
        sources: {
          satellite: {
            type: "raster",
            tiles: [
              "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "&copy; ArcGIS World Imagery",
            maxzoom: 18,
          },
        },
        layers: [
          {
            id: "satellite",
            type: "raster",
            source: "satellite",
          },
        ],
      },
      center: [h.centerLon, h.centerLat],
      zoom: h.maxZoom - 2,
    });

    const map = new maplibregl.Map({
      container: "overture",
      zoom: h.maxZoom - 2,
      center: [h.centerLon, h.centerLat],
      style: {
        version: 8,
        light: { anchor: "viewport", color: "white", intensity: 0.8 },
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        sources: {
          roads: {
            type: "vector",
            url: `pmtiles://${BASE_URL}/roads.pmtiles`,
          },
          places: {
            type: "vector",
            url: `pmtiles://${BASE_URL}/places.pmtiles`,
          },
          placenames: {
            type: "vector",
            url: `pmtiles://${BASE_URL}/placenames.pmtiles`,
          },
          buildings: {
            type: "vector",
            url: `pmtiles://${BASE_URL}/buildings.pmtiles`,
          },
          boundary: {
            type: "vector",
            url: `pmtiles://${BASE_URL}/boundary.pmtiles`,
          },
          base: {
            type: "vector",
            url: `pmtiles://${BASE_URL}/base.pmtiles`,
          },
          osm: {
            type: "raster",
            tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap Contributors",
            maxzoom: 19,
          },
          satellite: {
            type: "raster",
            tiles: [
              "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "&copy; ArcGIS World Imagery",
            maxzoom: 18,
          },
        },
        layers: [
          {
            id: "satellite",
            type: "raster",
            source: "satellite",
          },
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
          ...addLayers(allLayers, layerOrder),
        ],
      },
    });

    map.showTileBoundaries = false;
    document
      .getElementById("show-tile-boundaries")
      .addEventListener("change", (e) => {
        map.showTileBoundaries = e.target.checked;
      });
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
    });
    let fixedPopup = false;

    map.on("mousemove", (e) => {
      if (!fixedPopup) {
        const features = map.queryRenderedFeatures(e.point);

        if (
          features.length > 0 &&
          document.getElementById("show-attributes").checked
        ) {
          let content = '<div class="popup-container">';

          for (const feature of features) {
            const props = feature.properties;
            content += '<div class="popup-section">';

            for (const [key, value] of Object.entries(props)) {
              if (!["id", "version"].includes(key)) {
                content += `<div><strong>${key}:</strong> ${value}</div>`;
              }
            }

            content += "</div>";
          }

          content += "</div>";

          popup.setLngLat(e.lngLat).setHTML(content).addTo(map);
        }
      }
    });
    document
      .getElementById("show-attributes")
      .addEventListener("click", function () {
        if (!this.checked) {
          popup.remove();
        }
      });
    map.on("mouseleave", function (e) {
      if (fixedPopup) return;
      popup.remove();
    });
    map.on("click", function (e) {
      if (fixedPopup) {
        fixedPopup = false;
      } else {
        fixedPopup = true;
      }
    });

    const layerGroups = constructLayerGroups(allLayers, layerOrder);
    console.log(layerGroups);

    const layerControl = document.getElementById("layer-control");
    const createNestedLayerGroup = (groupName, isNested = false) => {
      const group = layerGroups[groupName];
      const groupDiv = document.createElement("div");
      groupDiv.classList.add("layer-group");

      const headerDiv = document.createElement("div");
      headerDiv.classList.add("layer-group-header");

      const masterCheckbox = document.createElement("input");
      masterCheckbox.type = "checkbox";
      masterCheckbox.checked = true;
      masterCheckbox.addEventListener("change", (e) => {
        const visibility = e.target.checked ? "visible" : "none";
        toggleLayerVisibility(group.layers, visibility);
        if (!isNested) {
          group.children.forEach((childGroupName) => {
            const childGroup = layerGroups[childGroupName];
            const nestedCheckboxes = groupDiv.querySelectorAll(
              `.layer-group-content input[type='checkbox']`
            );
            nestedCheckboxes.forEach((checkbox) => {
              checkbox.checked = e.target.checked;
              toggleLayerVisibility(childGroup.layers, visibility);
            });
          });
        }
      });

      const headerLabel = document.createElement("label");
      headerLabel.appendChild(masterCheckbox);
      headerLabel.appendChild(document.createTextNode(groupName));

      headerDiv.appendChild(headerLabel);

      const contentDiv = document.createElement("div");
      contentDiv.classList.add("layer-group-content");
      contentDiv.style.display = isNested ? "none" : "block";

      headerDiv.addEventListener("click", () => {
        contentDiv.style.display =
          contentDiv.style.display === "none" ? "block" : "none";
      });

      if (!isNested) {
        group.children.forEach((childGroupName) => {
          const childGroup = createNestedLayerGroup(childGroupName, true);
          contentDiv.appendChild(childGroup);
        });
      } else {
        group.layers.forEach((layer) => {
          const label = document.createElement("label");
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = true;
          checkbox.addEventListener("change", (e) => {
            const visibility = e.target.checked ? "visible" : "none";
            map.setLayoutProperty(layer.id, "visibility", visibility);
          });
          label.appendChild(checkbox);
          label.appendChild(document.createTextNode(layer.id));
          contentDiv.appendChild(label);
        });
      }

      groupDiv.appendChild(headerDiv);
      groupDiv.appendChild(contentDiv);
      layerControl.appendChild(groupDiv);

      return groupDiv;
    };

    const toggleLayerVisibility = (layers, visibility) => {
      layers.forEach((layer) => {
        map.setLayoutProperty(layer.id, "visibility", visibility);
      });
    };

    createNestedLayerGroup("Overture");
    createNestedLayerGroup("OSM");
    createNestedLayerGroup("Satellite");

    const stopSync = syncMaps(osmMap, map, satellite);
  });
}

function addLayers(layersObject, order = [], nested = false) {
  const layersArray = [];

  if (nested) {
    for (const key in layersObject) {
      const value = layersObject[key];
      if (typeof value === "object") {
        if (Array.isArray(value)) {
          layersArray.push(...value);
        } else if (value.hasOwnProperty("id")) {
          layersArray.push(value);
        } else {
          layersArray.push(...addLayers(value, [], true));
        }
      }
    }
  } else {
    for (const key of order) {
      if (key in layersObject) {
        const value = layersObject[key];
        if (typeof value === "object") {
          if (Array.isArray(value)) {
            layersArray.push(...value);
          } else if (value.hasOwnProperty("id")) {
            // If the value has an 'id' property, it's a single layer object
            layersArray.push(value);
          } else {
            layersArray.push(...addLayers(value, [], true));
          }
        }
      }
    }
  }
  return layersArray;
}

function constructLayerGroups(layersObject, order) {
  const layerGroups = {
    Overture: {
      layers: [],
      children: order,
    },
    OSM: {
      layers: [
        {
          id: "osm",
          type: "raster",
          source: "osm",
        },
      ],
      children: [],
    },
    Satellite: {
      layers: [
        {
          id: "satellite",
          type: "raster",
          source: "satellite",
        },
      ],
      children: [],
    },
  };

  for (const key of order) {
    if (key in layersObject) {
      const value = layersObject[key];
      const layersArray = addLayers({ [key]: value }, [], true);

      layerGroups[key] = {
        layers: layersArray,
        children: [],
      };
    }
  }

  return layerGroups;
}
