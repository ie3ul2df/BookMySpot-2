// Import Firebase modules and services
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { doc, collection, addDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

//---------------------------- Spot Details and Booking on Spot Page ----------------------------

// Parse query parameters
const urlParams = new URLSearchParams(window.location.search);
const spotId = urlParams.get("id");
const spotDetailsContainer = document.getElementById("spot-details");
const bookNowButton = document.getElementById("book-now-btn");
const paymentForm = document.getElementById("payment-form");

/**
 * Display a message in the spot details container.
 * @param {string} message - The message to display.
 */
const displayMessage = (message) => {
  if (spotDetailsContainer) {
    spotDetailsContainer.innerHTML = `<p>${message}</p>`;
  } else {
    console.warn("Spot details container not found.");
  }
};

// Fetch and display spot details
if (spotDetailsContainer) {
  (async () => {
    if (!spotId) {
      displayMessage("Invalid Spot ID. Please try again.");
      return;
    }

    displayMessage("Loading spot details...");

    try {
      const spotDoc = await getDoc(doc(db, "parking-spots", spotId));
      if (spotDoc.exists()) {
        const spot = spotDoc.data();
        spotDetailsContainer.innerHTML = `
          <h2>${spot.address}</h2>
          <p>Postcode: ${spot.postcode}</p>
          <p>Price: £${spot.price}</p>
          <p>Availability: ${spot.availability}</p>
        `;
      } else {
        displayMessage("Spot not found.");
      }
    } catch (error) {
      console.error("Error fetching spot details:", error);
      displayMessage("Error fetching spot details. Please try again later.");
    }
  })();
}

// Handle Booking Button Click
if (bookNowButton) {
  let isListenerAttached = false; // Ensure only one event listener is attached

  onAuthStateChanged(auth, (user) => {
    // Update button state based on user authentication
    if (!user) {
      // For unauthenticated users
      bookNowButton.textContent = "Login First";
      bookNowButton.classList.add("btn-warning");
      bookNowButton.disabled = false;

      if (!isListenerAttached) {
        bookNowButton.addEventListener("click", () => {
          bookNowButton.textContent = "Redirecting...";
          bookNowButton.disabled = true; // Prevent multiple clicks
          setTimeout(() => {
            window.location.href = "login_register.html"; // Redirect to login page
          }, 500);
        });
        isListenerAttached = true;
      }
    } else {
      // For authenticated users
      bookNowButton.textContent = "Book Now";
      bookNowButton.classList.remove("btn-warning");
      bookNowButton.disabled = false;

      if (!isListenerAttached) {
        bookNowButton.addEventListener("click", () => {
          const paymentModal = new bootstrap.Modal(document.getElementById("paymentModal"), { keyboard: true });
          paymentModal.show();
        });
        isListenerAttached = true;
      }
    }
  });
}

// Handle Payment Form Submission
if (paymentForm) {
  paymentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cardNumber = document.getElementById("card-number")?.value;
    if (cardNumber !== "1111222233334444") {
      alert("Invalid card details. insert 1111222233334444 to proceed.");
      return;
    }
    const cardName = document.getElementById("card-name")?.value;
    if (cardNumber === "") {
      alert("Invalid card details. Any name is acceptable.");
      return;
    }

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        alert("User not authenticated. Please log in again.");
        window.location.href = "login_register.html";
        return;
      }

      const booking = {
        spotId, // Make sure `spotId` is defined globally or in scope
        userId,
        dateTime: new Date().toISOString(),
      };

      await addDoc(collection(db, "bookings"), booking);

      alert("Booking successful!");
      const paymentModal = bootstrap.Modal.getInstance(document.getElementById("paymentModal"));
      if (paymentModal) paymentModal.hide();

      window.location.href = "dashboard.html"; // Redirect to dashboard after booking
    } catch (error) {
      console.error("Error booking spot:", error);
      alert("Error processing booking. Please try again later.");
    }
  });
}
