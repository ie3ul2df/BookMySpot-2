import { db } from "../firebase-config.js";
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { createInteractiveStarRating } from "./rankings.js";

/**
 * Fetch and display user bookings from the Firestore database.
 * @param {HTMLElement} container - The container to display bookings in.
 */
export const fetchUserBookings = async (container) => {
  displayMessage(container, "Loading your bookings...", "text-info");

  try {
    const user = auth.currentUser;
    if (!user) {
      displayMessage(container, "Please log in to view your bookings.", "text-danger");
      return;
    }

    const userId = user.uid;
    const bookingsRef = collection(db, "bookings");
    const userBookingsQuery = query(bookingsRef, where("userId", "==", userId));

    const querySnapshot = await getDocs(userBookingsQuery);

    if (querySnapshot.empty) {
      displayMessage(container, "No bookings found.", "text-warning");
      return;
    }

    const bookings = [];
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      const spotDetails = await fetchSpotDetails(data.spotId);

      bookings.push({
        id: doc.id,
        ...data,
        address: spotDetails.address || "N/A",
        postcode: spotDetails.postcode || "N/A",
        ownerRank: data.ownerRank || 0,
      });
    }

    container.innerHTML = "";
    bookings.forEach((booking) => {
      const bookingCard = createBookingCard(booking);
      container.appendChild(bookingCard);
    });
  } catch (error) {
    console.error("[fetchUserBookings] Error fetching bookings:", error);
    displayMessage(container, "Error loading bookings. Please try again later.", "text-danger");
  }
};

/**
 * Fetch spot details using `spotId`.
 * @param {string} spotId - The ID of the parking spot.
 * @returns {Promise<Object>} - The spot details or default values if not found.
 */
export const fetchSpotDetails = async (spotId) => {
  try {
    if (!spotId) {
      throw new Error("Invalid spotId provided.");
    }

    const spotDoc = await getDoc(doc(db, "parking-spots", spotId));
    if (spotDoc.exists()) {
      return spotDoc.data();
    }
    return { address: "Unknown", postcode: "Unknown" };
  } catch (error) {
    console.error("[fetchSpotDetails] Error fetching spot details:", error);
    return { address: "Error", postcode: "Error" };
  }
};

/**
 * Delete a booking from Firestore.
 * @param {string} bookingId - The ID of the booking to delete.
 */
export const deleteBooking = async (bookingId) => {
  try {
    if (!bookingId) {
      throw new Error("Invalid bookingId provided.");
    }

    await deleteDoc(doc(db, "bookings", bookingId));
    alert("Booking successfully cancelled.");
  } catch (error) {
    console.error("[deleteBooking] Error cancelling booking:", error);
    alert("Error cancelling booking. Please try again later.");
  }
};

/**
 * Create a booking card element.
 * @param {Object} booking - Booking data.
 * @returns {HTMLElement} - The booking card element.
 */
export const createBookingCard = (booking) => {
  const bookingCard = document.createElement("div");
  bookingCard.className = "card mb-3";

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

  const starRating = createInteractiveStarRating(booking, "owner");
  bookingCard.querySelector(".card-body").appendChild(starRating);

  const cancelButton = createCancelButton(booking.id);
  bookingCard.querySelector(".card-body").appendChild(cancelButton);

  return bookingCard;
};

/**
 * Create a Cancel Booking button.
 * @param {string} bookingId - The booking ID.
 * @returns {HTMLElement} - The Cancel Booking button element.
 */
export const createCancelButton = (bookingId) => {
  const cancelButton = document.createElement("button");
  cancelButton.className = "btn btn-danger mt-3";
  cancelButton.textContent = "Cancel Booking";

  cancelButton.addEventListener("click", async () => {
    if (confirm("Are you sure you want to cancel this booking?")) {
      try {
        await deleteBooking(bookingId);
        alert("Booking cancelled successfully.");
      } catch (error) {
        console.error("[createCancelButton] Error cancelling booking:", error);
      }
    }
  });

  return cancelButton;
};

/**
 * Display a message in a container.
 * @param {HTMLElement} container - The container to display the message in.
 * @param {string} message - The message to display.
 * @param {string} [className=""] - Optional class for styling.
 */
export const displayMessage = (container, message, className = "") => {
  if (container) {
    container.innerHTML = `<p class="${className}">${message}</p>`;
  }
};
