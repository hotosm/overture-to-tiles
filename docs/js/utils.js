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

function createNestedLayerGroup(
  groupName,
  isNested = false,
  map,
  layerGroups,
  toggleLayerVisibility
) {
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
      const childGroup = createNestedLayerGroup(
        childGroupName,
        true,
        map,
        layerGroups,
        toggleLayerVisibility
      );
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
      const colorBox = document.createElement("span");
      colorBox.style.display = "inline-block";
      colorBox.style.width = "15px";
      colorBox.style.height = "15px";
      const colorKey = Object.keys(layer.paint).find((key) =>
        key.toLowerCase().includes("color")
      );

      if (colorKey) {
        colorBox.style.backgroundColor = layer.paint[colorKey];
      } else {
        colorBox.style.backgroundColor = "#ccc";
      }
      colorBox.style.marginRight = "5px";

      const layerName = document.createTextNode(layer.id);

      label.appendChild(checkbox);
      label.appendChild(colorBox);
      label.appendChild(layerName);
      contentDiv.appendChild(label);
    });
  }

  groupDiv.appendChild(headerDiv);
  groupDiv.appendChild(contentDiv);

  return groupDiv;
}

export { addLayers, createNestedLayerGroup, constructLayerGroups };
