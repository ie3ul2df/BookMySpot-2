import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { doc, collection, addDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// DOM Elements
const spotDetailsContainer = document.getElementById("spot-details");
const bookingCalendarBtn = document.getElementById("booking-calendar-btn");
const selectedDatesDisplay = document.getElementById("selected-dates");
const bookNowButton = document.getElementById("book-now-btn");
const paymentForm = document.getElementById("payment-form");
const paymentModal = document.getElementById("paymentModal");

// Variables
let selectedDateTimeRange = "";
let isListenerAttached = false;

/**
 * Display a message in a given container.
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
 * Initialize Flatpickr for booking date and time selection.
 * @param {HTMLElement} button - The calendar button element.
 * @param {Array} availability - The spot availability ranges.
 * @param {Function} onDateSelect - Callback when a date range is selected.
 */
const initializeFlatpickr = (button, availability, onDateSelect) => {
  return flatpickr(button, {
    enableTime: true,
    mode: "range",
    dateFormat: "Y-m-d H:i",
    minDate: "today",
    enable: availability.map((range) => ({
      from: new Date(range.start),
      to: new Date(range.end),
    })),
    onClose: (selectedDates) => {
      if (selectedDates.length === 2) {
        onDateSelect(selectedDates);
      }
    },
  });
};

/**
 * Fetch spot details from the database.
 */
const fetchSpotDetails = async () => {
  if (!spotDetailsContainer) return;

  const urlParams = new URLSearchParams(window.location.search);
  const spotId = urlParams.get("id");

  if (!spotId) {
    displayMessage(spotDetailsContainer, "Invalid Spot ID. Please try again.", "text-danger");
    return;
  }

  displayMessage(spotDetailsContainer, "Loading spot details...", "text-info");

  try {
    const spotDoc = await getDoc(doc(db, "parking-spots", spotId));
    if (!spotDoc.exists()) {
      displayMessage(spotDetailsContainer, "Spot not found.", "text-danger");
      return;
    }

    const spot = spotDoc.data();
    displaySpotDetails(spot);

    const calendar = initializeFlatpickr(bookingCalendarBtn, spot.availability, (selectedDates) => {
      selectedDateTimeRange = `${selectedDates[0].toLocaleString()} to ${selectedDates[1].toLocaleString()}`;
      selectedDatesDisplay.textContent = `Selected Dates: ${selectedDateTimeRange}`;
    });

    bookingCalendarBtn.addEventListener("click", () => calendar.open());
  } catch (error) {
    console.error("Error fetching spot details:", error);
    displayMessage(spotDetailsContainer, "Error fetching spot details. Please try again later.", "text-danger");
  }
};

/**
 * Display spot details in the UI.
 * @param {Object} spot - The parking spot details.
 */
const displaySpotDetails = (spot) => {
  const availabilityRanges = spot.availability
    .map((range) => `${new Date(range.start).toLocaleString()} to ${new Date(range.end).toLocaleString()}`)
    .join("<br>");

  spotDetailsContainer.innerHTML = `
    <h2>${spot.address}</h2>
    <p class="fw-bold">Postcode: <span class="fw-light"> ${spot.postcode} </span></p>
    <p class="fw-bold">Price Per Hour:<span class="fw-light"> £${spot.pricePerHour} </span></p>
    <p class="fw-bold">Availability:</p>
    <p>${availabilityRanges}</p>
  `;
};

/**
 * Handle the book now button click.
 */
const handleBookNow = () => {
  if (!bookNowButton) return;

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      updateBookNowButtonForGuest();
    } else {
      updateBookNowButtonForUser(user);
    }
  });
};

/**
 * Update Book Now button for guest users.
 */
const updateBookNowButtonForGuest = () => {
  bookNowButton.textContent = "Login First";
  bookNowButton.classList.add("btn-warning");
  bookNowButton.disabled = false;

  if (!isListenerAttached) {
    bookNowButton.addEventListener("click", () => {
      window.location.href = "login_register.html";
    });
    isListenerAttached = true;
  }
};

/**
 * Update Book Now button for authenticated users.
 * @param {Object} user - The authenticated user.
 */
const updateBookNowButtonForUser = (user) => {
  bookNowButton.textContent = "Book Now";
  bookNowButton.classList.remove("btn-warning");
  bookNowButton.disabled = false;

  if (!isListenerAttached) {
    bookNowButton.addEventListener("click", () => {
      if (!selectedDateTimeRange) {
        alert("Please select a booking date and time.");
        return;
      }

      const modal = new bootstrap.Modal(paymentModal, { keyboard: true });
      modal.show();
    });
    isListenerAttached = true;
  }
};

/**
 * Handle payment form submission.
 */
const handlePaymentForm = () => {
  if (!paymentForm) return;

  paymentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cardNumber = document.getElementById("card-number").value.trim();
    const cardName = document.getElementById("card-name").value.trim();

    if (!cardNumber || !cardName || cardNumber !== "1111222233334444") {
      alert("Invalid payment details. Please provide valid information.");
      return;
    }

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        alert("User not authenticated. Please log in again.");
        window.location.href = "login_register.html";
        return;
      }

      await processBooking(userId);
    } catch (error) {
      console.error("Error booking spot:", error);
      alert("Error processing booking. Please try again later.");
    }
  });
};

/**
 * Process the booking and save it to the database.
 * @param {string} userId - The ID of the authenticated user.
 */
const processBooking = async (userId) => {
  const booking = {
    spotId: new URLSearchParams(window.location.search).get("id"),
    userId,
    selectedDateTimeRange,
  };

  await addDoc(collection(db, "bookings"), booking);

  alert("Booking successful!");
  bootstrap.Modal.getInstance(paymentModal)?.hide();
  window.location.href = "dashboard.html";
};

// Initialize Functions
fetchSpotDetails();
handleBookNow();
handlePaymentForm();
