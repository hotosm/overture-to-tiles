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

export { addLayers, constructLayerGroups };
