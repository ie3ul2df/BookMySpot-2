import { initializeAuth, redirectToLogin } from "./auth.js";
import { fetchUserData, populateUserProfile, handleProfileFormSubmission } from "./profile.js";
import { fetchUserBookings } from "./bookings.js";
import { fetchBookedSpots } from "./parkingSpots.js";
import { calculateAverageRankForCurrentUser } from "./rankings.js";

// DOM Elements
const userDetailsForm = document.getElementById("user-details-form");
const bookingsContainer = document.getElementById("bookings-container");
const bookedSpotsContainer = document.getElementById("booked-spots-cards");
const averageRankContainer = document.getElementById("average-rank-display");

/**
 * Initialize the application
 */
const initializeDashboard = () => {
  initializeAuth(
    async (user) => {
      console.log("User authenticated:", user.uid);

      // Fetch user data
      const userData = await fetchUserData(user.uid);
      if (!userData) {
        console.error("User data not found.");
        return;
      }

      // Populate user profile
      populateUserProfile(userData);

      // Handle profile form submission
      if (userDetailsForm) {
        handleProfileFormSubmission(userDetailsForm);
      }

      // Display average rank for the logged-in user
      if (averageRankContainer) {
        await calculateAverageRankForCurrentUser(user.uid, userData.role, averageRankContainer);
      }

      // Load bookings if the user is a regular user
      if (bookingsContainer && userData.role === "user") {
        await fetchUserBookings(bookingsContainer);
      }

      // Load booked spots if the user is an owner
      if (bookedSpotsContainer && userData.role === "owner") {
        await fetchBookedSpots(user.uid, bookedSpotsContainer);
      }

      // Additional role-specific features can be added here
    },
    redirectToLogin // Redirect to login if unauthenticated
  );
};

// Initialize the dashboard
initializeDashboard();
