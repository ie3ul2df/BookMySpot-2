// Function to get query parameters
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    name: params.get("name"),
    email: params.get("email"),
    phone: params.get("phone"),
    message: params.get("message"),
  };
}

// Populate form details
function displayFormData() {
  const { name, email, phone, message } = getQueryParams();

  // Elements
  const titleElement = document.getElementById("formTitle");
  const messageElement = document.getElementById("formMessage");
  const detailsList = document.getElementById("formDetails");

  // Clear existing list items
  detailsList.innerHTML = "";

  // Update content with form submission details
  titleElement.textContent = `Thank You, ${name || "Guest"}!`;
  messageElement.textContent =
    "Your submission has been received with the following details:";
  detailsList.innerHTML += `
        <li class="list-group-item"><strong>Email:</strong> ${
          email || "No email provided"
        }</li>
        <li class="list-group-item"><strong>Phone:</strong> ${
          phone || "No phone provided"
        }</li>
        <li class="list-group-item"><strong>Message:</strong> ${
          message || "No message provided"
        }</li>`;
}

// Run the function after the page loads
document.addEventListener("DOMContentLoaded", displayFormData);
