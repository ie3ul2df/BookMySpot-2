import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { db } from "../firebase-config.js"; // Adjust the path if needed

/**
 * Formats a date into a readable format.
 * @param {Date} date - The date to format.
 * @returns {string} - Formatted date as a string.
 */
export const formatDate = (date) => {
  const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Intl.DateTimeFormat("en-GB", options).format(date);
};

/**
 * Loads parking spots for the specified owner and updates the DOM.
 * @param {string} ownerId - The ID of the owner.
 */
export async function loadParkingSpots(ownerId) {
  try {
    const parkingRef = collection(db, "parking-spots");
    const querySnapshot = await getDocs(parkingRef);

    const spotsTable = document.getElementById("parking-spots-table");
    spotsTable.innerHTML = ""; // Clear any existing rows

    querySnapshot.forEach((doc) => {
      const spot = doc.data();
      if (spot.ownerId === ownerId) {
        const availability = spot.availability
          .map((av) => {
            const startDate = new Date(av.start);
            const endDate = new Date(av.end);
            return `<span class="fw-bold"> From &nbsp </span> ${formatDate(startDate)} <span class="fw-bold"> &nbsp to &nbsp </span> ${formatDate(endDate)}`;
          })
          .join("<br>");

        const row = `
          <tr>
            <td>${spot.address}</td>
            <td>${spot.postcode}</td>
            <td>${spot.pricePerHour}</td>
            <td>${availability}</td>
          </tr>`;
        spotsTable.insertAdjacentHTML("beforeend", row);
      }
    });
  } catch (error) {
    console.error("Error loading parking spots:", error);
  }
}
