import {
  Admins,
  Buildings,
  Places,
  Transportation,
  Land,
  Landuse,
  Water,
} from "./layers.js";

let protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

const urlParams = new URLSearchParams(window.location.search);
const BASE_URL =
  urlParams.get("url") ||
  "https://staging-raw-data-api.s3.amazonaws.com/default/overture/nepal/pmtiles";

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
          id: "osm",
          type: "raster",
          source: "osm",
        },
        {
          id: "satellite",
          type: "raster",
          source: "satellite",
        },
        Land.land,
        Land.sand,
        Land.wetland,
        Land.forest,
        Landuse.recSand,
        Landuse.parks,
        Landuse.golfGreens,
        Water.waterPolygons,
        Water.waterLinestrings,
        Transportation.footwayCasing,
        Transportation.footway,
        Transportation.parkingAisleUnknownCasing,
        Transportation.residentialCasing,
        Transportation.secondaryTertiaryCasing,
        Transportation.primaryCasing,
        Transportation.parkingAisleUnknown,
        Transportation.residential,
        Transportation.secondaryTertiary,
        Transportation.primary,
        Transportation.motorwayCasing,
        Transportation.motorway,
        Transportation.residentialLabel,
        Transportation.highwayLabel,
        Buildings.osmBuildings,
        Buildings.nonOsmBuildings,
        Places,
        Admins.placeHighZoom,
        Admins.placeMidZoom,
      ],
    },
  });

  map.showTileBoundaries = false;

  const popup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
  });

  map.on("mousemove", (e) => {
    const features = map.queryRenderedFeatures(e.point);
    if (
      features.length > 0 &&
      document.getElementById("show-attributes").checked
    ) {
      const feature = features[0];
      const props = feature.properties;
      let content = "";

      for (const [key, value] of Object.entries(props)) {
        content += `<div><strong>${key}:</strong> ${value}</div>`;
      }

      popup.setLngLat(e.lngLat).setHTML(content).addTo(map);
    } else {
      popup.remove();
    }
  });

  const layerGroups = {
    Overture: {
      layers: [],
      children: [
        "Land",
        "Landuse",
        "Water",
        "Transportation",
        "Buildings",
        "Places",
        "Admins",
      ],
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
    Land: {
      layers: [Land.land, Land.sand, Land.wetland, Land.forest],
      children: [],
    },
    Landuse: {
      layers: [Landuse.recSand, Landuse.parks, Landuse.golfGreens],
      children: [],
    },
    Water: {
      layers: [Water.waterPolygons, Water.waterLinestrings],
      children: [],
    },
    Transportation: {
      layers: [
        Transportation.footwayCasing,
        Transportation.footway,
        Transportation.parkingAisleUnknownCasing,
        Transportation.residentialCasing,
        Transportation.secondaryTertiaryCasing,
        Transportation.primaryCasing,
        Transportation.parkingAisleUnknown,
        Transportation.residential,
        Transportation.secondaryTertiary,
        Transportation.primary,
        Transportation.motorwayCasing,
        Transportation.motorway,
        Transportation.residentialLabel,
        Transportation.highwayLabel,
      ],
      children: [],
    },
    Buildings: {
      layers: [Buildings.osmBuildings, Buildings.nonOsmBuildings],
      children: [],
    },
    Places: {
      layers: [Places],
      children: [],
    },
    Admins: {
      layers: [Admins.placeHighZoom, Admins.placeMidZoom],
      children: [],
    },
  };

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
