// admin-panel.js
import { db } from "../firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  limit,
  startAfter,
  orderBy,
  where, // Add this
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

const adminBookingsContainer = document.getElementById("admin-bookings-container");
const paginationNav = document.getElementById("pagination-nav");
let lastVisible = null; // Track the last visible document for pagination

/**
 * Fetch bookings with pagination
 */
export const fetchBookings = async (pageSize = 3) => {
  try {
    const bookingsRef = collection(db, "bookings");
    const q = lastVisible ? query(bookingsRef, startAfter(lastVisible), limit(pageSize)) : query(bookingsRef, limit(pageSize));

    const querySnapshot = await getDocs(q);

    console.log(`Fetched ${querySnapshot.size} bookings.`);
    if (querySnapshot.empty && !lastVisible) {
      adminBookingsContainer.innerHTML = `<p>No bookings found.</p>`;
      return;
    }

    if (querySnapshot.empty) {
      paginationNav.innerHTML = `<p>No more bookings to load.</p>`;
      return;
    }

    lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1]; // Update lastVisible for pagination

    const bookings = [];
    for (const bookingDoc of querySnapshot.docs) {
      const booking = bookingDoc.data();
      const bookingId = bookingDoc.id;
      const spotId = booking.spotId;
      const userId = booking.userId;

      console.log(`Processing booking: ${bookingId}, spotId: ${spotId}, userId: ${userId}`);

      // Fetch parking spot details
      const spotDetails = await fetchSpotDetails(spotId);
      console.log(`Spot details for ${spotId}:`, spotDetails);

      const ownerId = spotDetails?.ownerId || null;

      // Fetch owner and user emails
      const ownerEmail = ownerId ? await fetchUserEmail(ownerId) : "Unknown";
      const userEmail = userId ? await fetchUserEmail(userId) : "Unknown";

      console.log(`Owner Email: ${ownerEmail}, User Email: ${userEmail}`);

      // Fetch ratings
      const ownerRating = ownerId ? await fetchAverageRating(ownerId, "owner") : "Error";
      const userRating = userId ? await fetchAverageRating(userId, "user") : "Error";

      console.log(`Owner Rating: ${ownerRating}, User Rating: ${userRating}`);

      bookings.push({
        ...booking,
        bookingId,
        spotDetails,
        ownerEmail,
        userEmail,
        ownerRating,
        userRating,
      });
    }

    renderBookings(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    adminBookingsContainer.innerHTML = `<p>Error fetching bookings. Check the console for details.</p>`;
  }
};

/**
 * Fetch parking spot details by spotId
 */
const fetchSpotDetails = async (spotId) => {
  try {
    if (!spotId) {
      throw new Error("Invalid spotId");
    }
    const spotDoc = await getDoc(doc(db, "parking-spots", spotId));
    if (!spotDoc.exists()) {
      throw new Error(`Spot not found for spotId: ${spotId}`);
    }
    return spotDoc.data();
  } catch (error) {
    console.error("Error fetching spot details:", error.message);
    return { address: "Unknown", ownerId: null };
  }
};

/**
 * Fetch user email by userId
 */
const fetchUserEmail = async (userId) => {
  try {
    if (!userId) {
      throw new Error("Invalid userId");
    }
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      throw new Error(`User not found for userId: ${userId}`);
    }
    return userDoc.data().email || "Unknown";
  } catch (error) {
    console.error("Error fetching user email:", error.message);
    return "Unknown";
  }
};

/**
 * Fetch average rating
 */
const fetchAverageRating = async (userId, role) => {
  try {
    const ratingsRef = collection(db, "ratings");
    const q = query(ratingsRef, where("toUserId", "==", userId), where("role", "==", role));
    const querySnapshot = await getDocs(q);

    let totalRating = 0;
    let ratingCount = 0;

    querySnapshot.forEach((doc) => {
      const rating = doc.data();
      totalRating += rating.rating;
      ratingCount++;
    });

    return ratingCount > 0 ? (totalRating / ratingCount).toFixed(2) : "No ratings yet";
  } catch (error) {
    console.error("Error fetching average rating:", error);
    return "Error";
  }
};

/**
 * Render all bookings
 */
const renderBookings = (bookings) => {
  if (bookings.length === 0) {
    adminBookingsContainer.innerHTML += `<p>No more bookings to display.</p>`;
    return;
  }

  bookings.forEach((booking) => {
    renderBookingCard(booking);
  });
};

/**
 * Render a single booking card
 */
const renderBookingCard = (booking) => {
  const card = document.createElement("div");
  card.className = "col-md-4";

  card.innerHTML = `
      <div class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">Spot: ${booking.spotDetails?.address || "N/A"}</h5>
          <p><strong>Owner:</strong> ${booking.ownerEmail} (${booking.ownerRating})</p>
          <p><strong>User:</strong> ${booking.userEmail} (${booking.userRating})</p>
          <p><strong>Date:</strong> ${booking.selectedDateTimeRange || "N/A"}</p>
          <button class="btn btn-danger" id="cancel-btn-${booking.bookingId}">Cancel Booking</button>
        </div>
      </div>
    `;

  adminBookingsContainer.appendChild(card);

  const cancelBtn = document.getElementById(`cancel-btn-${booking.bookingId}`);
  cancelBtn.addEventListener("click", () => cancelBooking(booking.bookingId, card));
};

/**
 * Cancel booking
 */
const cancelBooking = async (bookingId, cardElement) => {
  if (confirm("Are you sure you want to cancel this booking?")) {
    try {
      await deleteDoc(doc(db, "bookings", bookingId));
      cardElement.remove();
      alert("Booking cancelled successfully!");
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Failed to cancel the booking. Please try again.");
    }
  }
};

/**
 * Create pagination controls
 */
const createPaginationControls = () => {
  paginationNav.innerHTML = ""; // Clear existing pagination controls

  const loadMoreBtn = document.createElement("button");
  loadMoreBtn.className = "btn btn-primary";
  loadMoreBtn.innerText = "Load More";

  loadMoreBtn.addEventListener("click", async () => {
    console.log("Loading more bookings...");
    await fetchBookings();
  });

  paginationNav.appendChild(loadMoreBtn);
};

/**
 * Initialize admin panel
 */
export const initializeAdminPanel = async () => {
  adminBookingsContainer.innerHTML = `<p>Loading bookings...</p>`;
  await fetchBookings();
  createPaginationControls();
};
