let allLayers;
let layerOrder;

import {
  allLayers as localAllLayers,
  layerOrder as localLayerOrder,
} from "../styles/default.js";
import {
  addLayers,
  createNestedLayerGroup,
  constructLayerGroups,
} from "./utils.js";
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
  let satellite_source = {
    type: "raster",
    tiles: [
      "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    tileSize: 256,
    attribution: "&copy; ArcGIS World Imagery",
    maxzoom: 18,
  };
  let osm_source = {
    type: "raster",
    tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
    tileSize: 256,
    attribution: "&copy; OpenStreetMap Contributors",
    maxzoom: 19,
  };

  p.getHeader().then((h) => {
    const default_lat = h.centerLat;
    const default_lon = h.centerLon;
    const default_zoom = h.maxZoom;
    const osmMap = new maplibregl.Map({
      container: "osm",
      style: {
        version: 8,
        sources: {
          osm: osm_source,
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
        ],
      },
      center: [default_lon, default_lat],
      zoom: default_zoom,
    });

    const satellite = new maplibregl.Map({
      container: "satellite",
      style: {
        version: 8,
        sources: {
          satellite: satellite_source,
        },
        layers: [
          {
            id: "satellite",
            type: "raster",
            source: "satellite",
          },
        ],
      },
      center: [default_lon, default_lat],
      zoom: default_zoom,
    });
    let pmtile_sources = {
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
    };

    const map = new maplibregl.Map({
      container: "overture",
      zoom: default_zoom,
      center: [default_lon, default_lat],
      style: {
        version: 8,
        light: { anchor: "viewport", color: "white", intensity: 0.8 },
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        sources: {
          ...pmtile_sources,
          osm: osm_source,
          satellite: satellite_source,
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
    createLegend(
      map,
      allLayers,
      layerOrder,
      pmtile_sources,
      default_lon,
      default_lat,
      default_zoom
    );
    const stopSync = syncMaps(osmMap, map, satellite);
  });
}

function createLegend(
  map,
  allLayers,
  layerOrder,
  pmtileSources,
  lon,
  lat,
  zoom
) {
  const layerControl = document.getElementById("layer-control");
  const layerGroups = constructLayerGroups(allLayers, layerOrder);
  // Create tab container
  const tabContainer = document.createElement("div");
  tabContainer.classList.add("tab-container");

  // Create tabs
  const legendTab = document.createElement("button");
  legendTab.classList.add("tab-button", "active");
  legendTab.textContent = "Legend";

  const sourceTab = document.createElement("button");
  sourceTab.classList.add("tab-button");
  sourceTab.textContent = "Sources";

  tabContainer.appendChild(legendTab);
  tabContainer.appendChild(sourceTab);

  // Create tab content containers
  const legendContent = document.createElement("div");
  legendContent.classList.add("tab-content");

  const sourceContent = document.createElement("div");
  sourceContent.classList.add("tab-content", "hidden");

  layerControl.appendChild(tabContainer);
  layerControl.appendChild(legendContent);
  layerControl.appendChild(sourceContent);

  const toggleLayerVisibility = (layers, visibility) => {
    layers.forEach((layer) => {
      map.setLayoutProperty(layer.id, "visibility", visibility);
    });
  };
  // Legend tab content
  const createGroupDiv = createNestedLayerGroup(
    "Overture",
    false,
    map,
    layerGroups,
    toggleLayerVisibility
  );
  legendContent.appendChild(createGroupDiv);

  const createOSMGroupDiv = createNestedLayerGroup(
    "OSM",
    false,
    map,
    layerGroups,
    toggleLayerVisibility
  );
  legendContent.appendChild(createOSMGroupDiv);

  const createSatelliteGroupDiv = createNestedLayerGroup(
    "Satellite",
    false,
    map,
    layerGroups,
    toggleLayerVisibility
  );
  legendContent.appendChild(createSatelliteGroupDiv);

  const sourceList = document.createElement("ul");
  sourceList.style.listStyleType = "none";
  sourceList.style.padding = "0";

  for (const [sourceName, sourceData] of Object.entries(pmtileSources)) {
    const sourceItem = document.createElement("li");
    sourceItem.textContent = sourceName;
    sourceItem.style.display = "flex";
    sourceItem.style.alignItems = "center";
    sourceItem.style.marginBottom = "10px";

    const openOSMButton = document.createElement("button");
    openOSMButton.textContent = "RapID";
    openOSMButton.title = "Open in RapID";
    openOSMButton.style.marginRight = "10px";
    let modifiedUrl = sourceData.url.includes("pmtiles://")
      ? sourceData.url.replace("pmtiles://", "")
      : sourceData.url;
    openOSMButton.addEventListener("click", () => {
      window.open(
        "https://rapideditor.org/edit#map=" +
          zoom +
          "/" +
          lat +
          "/" +
          lon +
          "&background=Bing&data=" +
          modifiedUrl,
        "_blank"
      );
    });

    const openPMTilesButton = document.createElement("button");
    openPMTilesButton.textContent = "PMTiles";
    openPMTilesButton.title = "Open in PMTiles Viewer";
    openPMTilesButton.style.marginRight = "10px";
    openPMTilesButton.addEventListener("click", () => {
      window.open(
        "https://protomaps.github.io/PMTiles/?url=" + modifiedUrl,
        "_blank"
      );
    });

    const downloadGeoParquetButton = document.createElement("button");
    downloadGeoParquetButton.textContent = "Download";
    downloadGeoParquetButton.title = "Download GeoParquet";
    const parquetUrl = modifiedUrl
      .replace("/pmtiles/", "/parquet/")
      .replace(".pmtiles", ".geo.parquet");
    downloadGeoParquetButton.addEventListener("click", () => {
      window.open(parquetUrl, "_blank");
    });

    sourceItem.appendChild(openOSMButton);
    sourceItem.appendChild(openPMTilesButton);
    sourceItem.appendChild(downloadGeoParquetButton);
    sourceList.appendChild(sourceItem);
  }

  sourceContent.appendChild(sourceList);

  // Tab switching
  const tabButtons = tabContainer.querySelectorAll(".tab-button");
  const tabContents = layerControl.querySelectorAll(".tab-content");

  function showTab(tabIndex) {
    tabContents.forEach((content) => {
      content.classList.add("hidden");
    });
    tabButtons.forEach((button) => {
      button.classList.remove("active");
    });
    tabContents[tabIndex].classList.remove("hidden");
    tabButtons[tabIndex].classList.add("active");
  }

  tabButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      showTab(index);
    });
  });

  showTab(0);
}
