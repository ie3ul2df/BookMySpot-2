// Import Firebase modules
import { auth, db } from "../firebase-config.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { createStarRating, saveRating } from "./rating-system.js";

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

export const fetchBookedSpots = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("User not logged in.");
      return;
    }

    const ownerId = user.uid;
    const bookingsRef = collection(db, "bookings");
    const querySnapshot = await getDocs(bookingsRef);

    const bookedSpots = await Promise.all(
      querySnapshot.docs.map(async (bookingDoc) => {
        const booking = bookingDoc.data();
        const bookingId = bookingDoc.id;
        const fromUserId = booking.userId;

        if (!fromUserId || !bookingId) {
          console.error("Skipping invalid booking data:", { fromUserId, bookingId });
          return null; // Skip invalid bookings
        }

        const spotDoc = await getDoc(doc(db, "parking-spots", booking.spotId));
        const userDoc = await getDoc(doc(db, "users", booking.userId));
        const rating = await fetchBookingRating(fromUserId, bookingId); // Fetch existing rating

        if (spotDoc.exists() && userDoc.exists() && spotDoc.data().ownerId === ownerId) {
          return {
            id: bookingId,
            ...booking,
            spotDetails: spotDoc.data(),
            userDetails: userDoc.data(),
            ownerRating: rating || 0, // Default to 0 if no rating exists
          };
        }

        return null;
      })
    );

    displayBookedSpots(bookedSpots.filter((spot) => spot)); // Filter out null values
  } catch (error) {
    console.error("Error fetching booked spots:", error);
  }
};

/**
 * Fetch the existing rating for a booking.
 * @param {string} userId - The user giving the rating.
 * @param {string} bookingId - The booking ID.
 * @returns {Promise<number|null>} - The existing rating, or null if none exists.
 */
const fetchBookingRating = async (fromUserId, bookingId) => {
  if (!fromUserId || !bookingId) {
    console.error("Invalid parameters for fetching booking rating:", { fromUserId, bookingId });
    return 0; // Default rating if parameters are invalid
  }

  try {
    const ratingsRef = collection(db, "ratings");
    const q = query(ratingsRef, where("fromUserId", "==", fromUserId), where("bookingId", "==", bookingId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const ratingData = querySnapshot.docs[0].data();
      //onsole.log("Fetched rating data:", ratingData); // Debug log
      return ratingData.rating || 0; // Return rating or 0
    }

    return 0; // No rating found
  } catch (error) {
    console.error("Error fetching booking rating:", error);
    return 0;
  }
};

/**
 * Display booked spots as cards.
 * @param {Array} bookedSpots - List of booked spots.
 */
const displayBookedSpots = (bookedSpots) => {
  bookedSpotsContainer.innerHTML = ""; // Clear existing cards

  bookedSpots.forEach((booking) => {
    const card = createBookedSpotCard(booking);
    bookedSpotsContainer.appendChild(card);
  });
};

/**
 * Create a booked spot card.
 * @param {Object} booking - Booking data.
 * @returns {HTMLElement} - The booked spot card element.
 */
const createBookedSpotCard = (booking) => {
  const card = document.createElement("div");
  card.className = "col-md-4";

  card.innerHTML = `
    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title">Spot: ${booking.spotDetails.address}</h5>
        <p><strong>User:</strong> ${booking.userDetails.email}</p>
        <p><strong>Date:</strong> ${booking.selectedDateTimeRange || "N/A"}</p>
        <div id="star-rating-container-${booking.id}" class="mb-2">Rate this owner:</div>
      </div>
    </div>
  `;

  const starRatingContainer = card.querySelector(`#star-rating-container-${booking.id}`);
  renderStarRating(starRatingContainer, booking);

  return card;
};

/**
 * Render star rating component inside a given container.
 * @param {HTMLElement} container - The container to render the star rating in.
 * @param {Object} booking - Booking data.
 */
const renderStarRating = async (container, booking) => {
  const fromUserId = auth.currentUser?.uid;
  const bookingId = booking.id;
  const toUserId = booking.userId;

  if (!fromUserId || !toUserId || !bookingId) {
    console.error("Invalid parameters for rendering star rating:", { fromUserId, toUserId, bookingId });
    return;
  }

  // Fetch the updated rating from the database
  const updatedRating = await fetchBookingRating(fromUserId, bookingId);

  container.innerHTML = ""; // Clear existing stars

  const starRating = createStarRating(
    updatedRating, // Use the updated rating
    5, // Maximum stars
    true, // Enable interactivity
    async (newRank) => {
      try {
        await saveRating(fromUserId, toUserId, "owner", bookingId, newRank);
        alert("Rating saved successfully!");

        // Re-render the updated stars
        await renderStarRating(container, booking);
      } catch (error) {
        console.error("Error saving rank:", error);
        alert("Failed to save the rank. Please try again.");
      }
    }
  );

  container.appendChild(starRating);
};
