// Import Firebase modules
import { auth, db } from "../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { createStarRating, saveRating } from "./rating-system.js";
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

    const bookings = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const spotDetails = await getSpotDetails(data.spotId);
        const rank = await fetchBookingRating(userId, doc.id); // Fetch rank from `ratings`

        return {
          id: doc.id,
          ...data,
          address: spotDetails.address,
          postcode: spotDetails.postcode,
          ownerId: spotDetails.ownerId, // Ensure ownerId is included
          rank: rank || 0, // Use rank from `ratings` or default to 0
        };
      })
    );

    displayBookings(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    displayMessage(bookingsContainer, "Error loading bookings. Please try again later.", "text-danger");
  }
};

/**
 * Fetch parking spot details.
 * @param {string} spotId - The ID of the parking spot.
 * @returns {Object} - Spot details including address, postcode, and ownerId.
 */
const getSpotDetails = async (spotId) => {
  try {
    const spotDoc = await getDoc(doc(db, "parking-spots", spotId));
    return spotDoc.exists() ? spotDoc.data() : { address: "Unknown", postcode: "Unknown", ownerId: null };
  } catch (error) {
    console.error("Error fetching spot details:", error);
    return { address: "Error", postcode: "Error", ownerId: null };
  }
};

/**
 * Fetch the existing rating for a booking.
 * @param {string} userId - The user giving the rating.
 * @param {string} bookingId - The booking ID.
 * @returns {Promise<number>} - The existing rating, or 0 if none exists.
 */
const fetchBookingRating = async (fromUserId, bookingId) => {
  if (!fromUserId || !bookingId) {
    console.error("Invalid parameters for fetching booking rating:", {
      fromUserId,
      bookingId,
    });
    return 0; // Default rating if parameters are invalid
  }

  try {
    const ratingsRef = collection(db, "ratings");
    const q = query(ratingsRef, where("fromUserId", "==", fromUserId), where("bookingId", "==", bookingId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const ratingData = querySnapshot.docs[0].data();
      return ratingData.rating || 0; // Return the rating or default to 0
    }

    return 0; // Default to 0 if no rating found
  } catch (error) {
    console.error("Error fetching booking rating:", error);
    return 0;
  }
};

/**
 * Display bookings as cards.
 * @param {Array} bookings - List of bookings.
 */
const displayBookings = (bookings) => {
  bookingsContainer.innerHTML = ""; // Clear existing content

  bookings.forEach((booking) => {
    const bookingCard = createBookingCard(booking);
    bookingsContainer.appendChild(bookingCard);
  });
};

/**
 * Create a booking card.
 * @param {Object} booking - Booking data.
 * @returns {HTMLElement} - The booking card element.
 */
const createBookingCard = (booking) => {
  const bookingCard = document.createElement("div");
  bookingCard.className = "card mb-3";

  bookingCard.innerHTML = `
    <div class="card-body">
      <h5 class="card-title">Booking ID: ${booking.id}</h5>
      <p class="card-text"><strong>Spot ID:</strong> ${booking.spotId}</p>
      <p class="card-text"><strong>Address:</strong> ${booking.address}</p>
      <p class="card-text"><strong>Postcode:</strong> ${booking.postcode}</p>
      <p class="card-text"><strong>Selected Date & Time:</strong> ${booking.selectedDateTimeRange || "N/A"}</p>
      <div class="mb-2">Rate the owner:</div>
      <div id="star-rating-container-${booking.id}"></div> <!-- Star rating container -->
    </div>
  `;

  const starRatingContainer = bookingCard.querySelector(`#star-rating-container-${booking.id}`);

  renderStarRating(starRatingContainer, booking);

  // Add cancel booking button
  const cancelButton = createCancelButton(booking.id);
  bookingCard.querySelector(".card-body").appendChild(cancelButton);

  return bookingCard;
};

/**
 * Render star rating component inside a given container.
 * @param {HTMLElement} container - The container to render the star rating in.
 * @param {Object} booking - Booking data.
 */
const renderStarRating = (container, booking) => {
  container.innerHTML = ""; // Clear existing stars

  const starRating = createStarRating(
    booking.rank || 0, // Use current rank
    5, // Maximum stars
    true, // Enable interactivity
    async (newRank) => {
      try {
        const fromUserId = auth.currentUser?.uid; // Logged-in user's ID
        const toUserId = booking.ownerId; // Owner being rated
        const role = "owner"; // Specify the role as "owner"
        const bookingId = booking.id; // The booking ID

        if (!fromUserId || !toUserId || !role || !bookingId) {
          console.error("Missing required data for saving rating:", {
            fromUserId,
            toUserId,
            role,
            bookingId,
          });
          return;
        }

        await saveRating(fromUserId, toUserId, role, bookingId, newRank); // Save the new rating
        alert("Rank saved successfully!");

        // Update the booking's rank locally
        booking.rank = newRank;

        // Re-render the updated star rating
        renderStarRating(container, booking);
      } catch (error) {
        console.error("Error saving rank:", error);
        alert("Failed to save the rank. Please try again.");
      }
    }
  );

  container.appendChild(starRating);
};
