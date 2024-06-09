const urlParams = new URLSearchParams(window.location.search);
const urlParam = urlParams.get("url");
const styleParam = urlParams.get("style");

function handleFormSubmit(event) {
  event.preventDefault();
  const urlInput = document.getElementById("urlInput");
  const styleInput = document.getElementById("styleInput");
  const url = urlInput.value.trim();
  const style = styleInput.value.trim();

  if (url) {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("url", url);
    if (style) {
      currentUrl.searchParams.set("style", style);
    } else {
      currentUrl.searchParams.delete("style");
    }
    window.location.href = currentUrl.toString();
  } else {
    console.log("Please enter a valid URL");
  }
}

if (!urlParam) {
  const formContainer = document.createElement("div");
  formContainer.style.textAlign = "center";
  formContainer.style.marginTop = "50px";

  const form = document.createElement("form");
  form.style.marginTop = "20px";
  
  const urlLabel = document.createElement("label");
  urlLabel.textContent = "Tile URL:";


  const urlInput = document.createElement("input");
  urlInput.id = "urlInput";
  urlInput.type = "text";
  urlInput.placeholder = "Enter Tile Base URL";

  if (urlParam) {
    urlInput.value = urlParam;
  }
  else {
  urlInput.value = "https://staging-raw-data-api.s3.amazonaws.com/default/overture/2024-05-16-beta.0/argentina/pmtiles";
  }

  const styleLabel = document.createElement("label");
  styleLabel.textContent = "Style URL:";
  
  const styleInput = document.createElement("input");
  styleInput.id = "styleInput";
  styleInput.type = "text";
  styleInput.placeholder = "Enter Style URL";
  if (styleParam) {
    styleInput.value = styleParam;
  }
  else {
  styleInput.value = "https://github.com/kshitijrajsharma/overture-to-tiles/blob/master/docs/styles/default.js"; 

  }

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Submit";
  
  form.appendChild(urlLabel);
  form.appendChild(document.createElement("br"));
  form.appendChild(urlInput);
  form.appendChild(document.createElement("br"));
  form.appendChild(styleLabel);
  form.appendChild(styleInput);
  form.appendChild(document.createElement("br"));
  form.appendChild(submitButton);
  form.addEventListener("submit", handleFormSubmit);

  formContainer.appendChild(form);
  document.body.appendChild(formContainer);
}
