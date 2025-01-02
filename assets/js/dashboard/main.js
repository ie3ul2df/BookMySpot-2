import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { auth } from "../firebase-config.js";
import { fetchUserData, populateUserProfile, handleProfileFormSubmission, initializeAverageRank } from "./profile.js";
import { fetchUserBookings } from "./my-bookings.js";
import { fetchBookedSpots } from "./booked-spots.js";
import { initializeFlatpickr, initializeParkingSpotForm } from "./owner-panel.js";
import { loadParkingSpots } from "./parking-spots.js";

//------------------------------------- Showing Tabs according to user role
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userData = await fetchUserData(user.uid);
      if (!userData) {
        console.error("User data not found");
        return;
      }

      populateUserProfile(userData);

      const ownerPanel = document.getElementById("owner-panel-li");
      const bookedSpots = document.getElementById("booked-spots-li");
      const adminPanel = document.getElementById("admin-panel-li");

      if (userData.role === "owner") {
        ownerPanel?.classList.remove("d-none");
        bookedSpots?.classList.remove("d-none");
        await loadParkingSpots(user.uid); // Call the function from the module
      } else {
        ownerPanel?.classList.add("d-none");
        bookedSpots?.classList.add("d-none");
      }

      if (userData.role === "admin") {
        adminPanel?.classList.remove("d-none");
      } else {
        adminPanel?.classList.add("d-none");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  } else {
    window.location.href = "login_register.html";
  }
});

//---------------------------- Initialize the average rank display

// Initialize
initializeAverageRank();

//--------------------- M Y - B O O K I N G S ---------------------
const loadBookingCards = () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchUserBookings();
    } else {
      console.error("User not logged in.");
    }
  });
};

// Initialize
loadBookingCards();

//--------------------- B O O K E D - S P O T S ---------------------
const initializeBookedSpots = () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchBookedSpots();
    } else {
      console.error("User not logged in.");
    }
  });
};

// Initialize
initializeBookedSpots();

//--------------------- O W N E R - P A N E L ---------------------
const openCalendarBtn = document.getElementById("open-calendar-btn");
const availabilityList = document.getElementById("availability-list");
const availabilityData = [];
const parkingSpotForm = document.getElementById("parking-spot-form");

// Initialize the parking spot form
initializeParkingSpotForm(parkingSpotForm, availabilityData, availabilityList);

// Initialize Flatpickr
initializeFlatpickr(openCalendarBtn, availabilityList, availabilityData);

//--------------------- P R O F I L E ---------------------
// Get the form element from the DOM
const userDetailsForm = document.getElementById("user-details-form");

// Ensure the form element exists before calling the function
if (userDetailsForm) {
  handleProfileFormSubmission(userDetailsForm);
} else {
  console.error("User details form not found.");
}
