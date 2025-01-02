// Import Firebase modules
import { auth, db } from "../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { createStarRating, saveUserRank } from "./rating-system.js";
import { createCancelButton } from "./helpers.js";

// DOM Element
const bookedSpotsContainer = document.getElementById("booked-spots-cards");

/**
 * Display a message in a container.
 * @param {HTMLElement} container - The container to display the message in.
 * @param {string} message - The message to display.
 * @param {string} [className=""] - Optional class for styling.
 */
const displayMessage = (container, message, className = "") => {
  if (container) {
    container.innerHTML = `<p class="${className}">${message}</p>`;
  }
};

/**
 * Fetch booked spots for the current owner.
 */
export const fetchBookedSpots = async () => {
  displayMessage(bookedSpotsContainer, "Loading booked spots...", "text-info");

  try {
    const user = auth.currentUser;
    if (!user) {
      displayMessage(bookedSpotsContainer, "Please log in to view booked spots.", "text-danger");
      return;
    }

    const ownerId = user.uid;
    const bookingsRef = collection(db, "bookings");
    const querySnapshot = await getDocs(bookingsRef);

    const bookedSpots = [];
    for (const bookingDoc of querySnapshot.docs) {
      const booking = bookingDoc.data();
      const spotDoc = await getDoc(doc(db, "parking-spots", booking.spotId));
      const userDoc = await getDoc(doc(db, "users", booking.userId));

      if (spotDoc.exists() && userDoc.exists() && spotDoc.data().ownerId === ownerId) {
        bookedSpots.push({
          id: bookingDoc.id,
          ...booking,
          spotDetails: spotDoc.data(),
          userDetails: userDoc.data(),
        });
      }
    }

    displayBookedSpots(bookedSpots);
  } catch (error) {
    console.error("Error fetching booked spots:", error);
    displayMessage(bookedSpotsContainer, "Error loading booked spots. Please try again later.", "text-danger");
  }
};

/**
 * Display booked spots as cards.
 * @param {Array} bookedSpots - List of booked spots.
 */
function displayBookedSpots(bookedSpots) {
  bookedSpotsContainer.innerHTML = ""; // Clear existing cards

  bookedSpots.forEach((booking) => {
    const card = document.createElement("div");
    card.className = "col-md-4";

    // Enable interactivity for ranking the owner
    const starRating = createStarRating(
      booking.rank || 0, // Existing rank or default to 0
      5,
      true, // Enable interactivity
      async (newRank) => {
        try {
          await saveUserRank(booking.id, newRank); // Save the rank
          alert("Rank saved successfully!");
          booking.rank = newRank; // Update the local rank value
        } catch (error) {
          console.error("Error saving rank:", error);
          alert("Failed to save the rank. Please try again.");
        }
      }
    );

    card.innerHTML = `
      <div class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">Spot: ${booking.spotDetails.address}</h5>
          <p><strong>User:</strong> ${booking.userDetails.email}</p>
          <p><strong>Date:</strong> ${booking.selectedDateTimeRange}</p>
          <div class="mb-2">Rate this owner:</div>
        </div>
      </div>
    `;

    // Append the star rating to the card
    card.querySelector(".card-body").appendChild(starRating);

    // Add cancel booking button
    const cancelButton = createCancelButton(booking.id);
    card.querySelector(".card-body").appendChild(cancelButton);

    bookedSpotsContainer.appendChild(card);
  });
}

/**
 * Create a booked spot card.
 * @param {Object} booking - Booking data.
 * @returns {HTMLElement} - The booked spot card element.
 */
const createBookedSpotCard = (booking) => {
  const card = document.createElement("div");
  card.className = "col-md-4";

  card.innerHTML = `
    <div class="card mb-3">
      <div class="card-body">
        <h5 class="card-title">Spot: ${booking.spotDetails.address}</h5>
        <p class="card-text"><strong>User:</strong> ${booking.userDetails.email}</p>
        <p class="card-text"><strong>Date:</strong> ${booking.selectedDateTimeRange}</p>
      </div>
    </div>
  `;

  return card;
};
