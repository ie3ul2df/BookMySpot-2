// Import Firebase modules
import { auth, db } from "../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { createStarRating, saveOwnerRank } from "./rating-system.js";
import { createCancelButton } from "./helpers.js";

// DOM Element
const bookingsContainer = document.getElementById("bookings-container");

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
 * Fetch and display user bookings.
 */
export const fetchUserBookings = async () => {
  displayMessage(bookingsContainer, "Loading your bookings...", "text-info");

  try {
    const user = auth.currentUser;
    if (!user) {
      displayMessage(bookingsContainer, "Please log in to view your bookings.", "text-danger");
      return;
    }

    const userId = user.uid;
    const bookingsRef = collection(db, "bookings");
    const userBookingsQuery = query(bookingsRef, where("userId", "==", userId));

    const querySnapshot = await getDocs(userBookingsQuery);

    if (querySnapshot.empty) {
      displayMessage(bookingsContainer, "No bookings found.", "text-warning");
      return;
    }

    const bookings = [];
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      const spotDetails = await getSpotDetails(data.spotId);

      bookings.push({
        id: doc.id,
        ...data,
        address: spotDetails.address,
        postcode: spotDetails.postcode,
        rank: data.rank || 0,
      });
    }

    displayBookings(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    displayMessage(bookingsContainer, "Error loading bookings. Please try again later.", "text-danger");
  }
};

/**
 * Fetch parking spot details.
 */
const getSpotDetails = async (spotId) => {
  try {
    const spotDoc = await getDoc(doc(db, "parking-spots", spotId));
    if (spotDoc.exists()) {
      return spotDoc.data();
    }
    return { address: "Unknown", postcode: "Unknown" };
  } catch (error) {
    console.error("Error fetching spot details:", error);
    return { address: "Error", postcode: "Error" };
  }
};

/**
 * Display bookings as cards.
 */
const displayBookings = (bookings) => {
  bookingsContainer.innerHTML = "";

  bookings.forEach((booking) => {
    const bookingCard = createBookingCard(booking);
    bookingsContainer.appendChild(bookingCard);
  });
};

/**
 * Create a booking card.
 */
const createBookingCard = (booking) => {
  const bookingCard = document.createElement("div");
  bookingCard.className = "card mb-3";

  // Card content
  bookingCard.innerHTML = `
    <div class="card-body">
      <h5 class="card-title">Booking ID: ${booking.id}</h5>
      <p class="card-text"><strong>Spot ID:</strong> ${booking.spotId}</p>
      <p class="card-text"><strong>Address:</strong> ${booking.address}</p>
      <p class="card-text"><strong>Postcode:</strong> ${booking.postcode}</p>
      <p class="card-text"><strong>Selected Date & Time:</strong> ${booking.selectedDateTimeRange}</p>
      <div class="mb-2">Rate the owner:</div>
    </div>
  `;

  // Enable interactivity for the star rating
  const starRating = createStarRating(
    booking.ownerRank || 0, // Pass existing rank or default to 0
    5, // Maximum stars
    true, // Enable interactivity
    async (newRank) => {
      try {
        await saveOwnerRank(booking.id, newRank); // Save rank to Firestore
        alert("Rank saved successfully!");
        booking.rank = newRank; // Update local rank
      } catch (error) {
        console.error("Error saving rank:", error);
        alert("Failed to save the rank. Please try again.");
      }
    }
  );

  // Append the star rating to the card
  bookingCard.querySelector(".card-body").appendChild(starRating);

  // Create and append Cancel Booking button
  const cancelButton = createCancelButton(booking.id);
  bookingCard.querySelector(".card-body").appendChild(cancelButton);

  return bookingCard;
};
