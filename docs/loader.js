const urlParams = new URLSearchParams(window.location.search);
const urlParam = urlParams.get("url");

function handleFormSubmit(event) {
  event.preventDefault();
  const urlInput = document.getElementById("urlInput");
  const url = urlInput.value.trim();

  if (url) {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("url", url);
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

  const urlInput = document.createElement("input");
  urlInput.id = "urlInput";
  urlInput.type = "text";
  urlInput.placeholder = "Enter URL";

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Submit";

  form.appendChild(urlInput);
  form.appendChild(submitButton);
  form.addEventListener("submit", handleFormSubmit);

  formContainer.appendChild(form);
  document.body.appendChild(formContainer);
}
