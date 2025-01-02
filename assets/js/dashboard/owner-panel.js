import { auth, db } from "../firebase-config.js";
import { addDoc, collection } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// Initialize Flatpickr and handle availability selection
export const initializeFlatpickr = (openCalendarBtn, availabilityList, availabilityData) => {
  if (openCalendarBtn) {
    openCalendarBtn.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent the button from triggering form submission
    });

    // Initialize Flatpickr for selecting date-time ranges
    flatpickr(openCalendarBtn, {
      enableTime: true, // Allows time selection
      mode: "range", // Enables range selection
      dateFormat: "Y-m-d H:i", // Formats date and time
      minDate: "today", // Prevents selecting past dates
      inline: false, // Keeps the calendar floating
      onClose: function (selectedDates) {
        if (selectedDates.length === 2) {
          const start = selectedDates[0];
          const end = selectedDates[1];

          // Add the selected range to availability data
          availabilityData.push({ start, end });

          // Display selected availability in a list
          const listItem = document.createElement("li");
          listItem.className = "list-group-item d-flex justify-content-between align-items-center";
          listItem.innerHTML = `
            ${start.toLocaleDateString()} ${start.toLocaleTimeString()} to 
            ${end.toLocaleDateString()} ${end.toLocaleTimeString()}
            <button class="btn btn-sm btn-danger remove-btn">Remove</button>
          `;
          availabilityList.appendChild(listItem);

          // Remove availability on "Remove" button click
          listItem.querySelector(".remove-btn").addEventListener("click", () => {
            const index = availabilityData.findIndex((range) => range.start.getTime() === start.getTime() && range.end.getTime() === end.getTime());
            if (index > -1) {
              availabilityData.splice(index, 1); // Remove from data array
              listItem.remove(); // Remove from UI
            }
          });
        }
      },
    });
  } else {
    console.error("Open calendar button not found.");
  }
};

/**
 * Initialize the parking spot form submission logic.
 * @param {HTMLFormElement} form - The parking spot form element.
 * @param {Array} availabilityData - The shared availability data array.
 * @param {HTMLElement} availabilityList - The availability list container.
 */
export const initializeParkingSpotForm = (form, availabilityData, availabilityList) => {
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const address = document.getElementById("spot-address").value.trim();
      const postcode = document.getElementById("spot-postcode").value.trim();
      const pricePerHour = parseFloat(document.getElementById("spot-price").value.trim());

      if (!address || !postcode || !pricePerHour || availabilityData.length === 0) {
        alert("Please fill out all fields and set availability.");
        return;
      }

      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          alert("You need to log in to save a parking spot.");
          window.location.href = "login_register.html";
          return;
        }

        const spotDetails = {
          address,
          postcode,
          pricePerHour,
          availability: availabilityData.map((range) => ({
            start: range.start.toISOString(),
            end: range.end.toISOString(),
          })),
          ownerId: userId,
        };

        await addDoc(collection(db, "parking-spots"), spotDetails);

        alert("Parking spot saved successfully!");
        form.reset();
        availabilityData.length = 0;
        availabilityList.innerHTML = "";
      } catch (error) {
        console.error("Error saving parking spot:", error);
        alert("Failed to save parking spot. Please try again.");
      }
    });
  } else {
    console.error("Parking spot form not found.");
  }
};
