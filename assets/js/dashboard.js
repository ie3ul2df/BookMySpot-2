// Import Firebase modules and services
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { doc, getDoc, updateDoc, collection, query, where, addDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// DOM Elements
const userDetailsForm = document.getElementById("user-details-form");
const profileImage = document.getElementById("profile-image");
const spotsTable = document.getElementById("parking-spots-table");
const availabilityData = [];
const availabilityList = document.getElementById("availability-list");
const openCalendarBtn = document.getElementById("open-calendar-btn");
const parkingSpotForm = document.getElementById("parking-spot-form");

//--------------------- Gravatar for User Profile ---------------------
function getGravatarUrl(email) {
  const md5 = CryptoJS.MD5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${md5}?s=150&d=identicon`;
}

//--------------------- Fetch User Data ---------------------
async function fetchUserData(userId) {
  const userDocRef = doc(db, "users", userId);
  const userDoc = await getDoc(userDocRef);
  return userDoc.exists() ? userDoc.data() : null;
}

//--------------------- Populate User Profile ---------------------
function populateUserProfile(data) {
  if (data.email) {
    profileImage.src = getGravatarUrl(data.email);
    document.getElementById("email").value = data.email || "";
    document.getElementById("address").value = data.address || "";
    document.getElementById("address2").value = data.address2 || "";
    document.getElementById("zip").value = data.zip || "";
    document.getElementById("phone").value = data.phone || "";
  }
}

//--------------------- Handle User Authentication ---------------------
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
        loadParkingSpots(user.uid);
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

//--------------------- Handle Profile Form Submission ---------------------
if (userDetailsForm) {
  userDetailsForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const address = document.getElementById("address").value;
    const address2 = document.getElementById("address2").value;
    const zip = document.getElementById("zip").value;
    const phone = document.getElementById("phone").value;

    try {
      const user = auth.currentUser;
      await updateDoc(doc(db, "users", user.uid), { address, address2, zip, phone });

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    }
  });
}

//--------------------- Load Parking Spots ---------------------
async function loadParkingSpots(ownerId) {
  try {
    const parkingRef = collection(db, "parking-spots");
    const querySnapshot = await getDocs(parkingRef);

    const spotsTable = document.getElementById("parking-spots-table"); // Ensure this matches your table's `tbody` ID
    spotsTable.innerHTML = ""; // Clear any existing rows

    querySnapshot.forEach((doc) => {
      const spot = doc.data();
      if (spot.ownerId === ownerId) {
        const availability = spot.availability
          .map((av) => {
            const startDate = new Date(av.start);
            const endDate = new Date(av.end);
            return `<span class="fw-bold"> From &nbsp </span> ${formatDate(startDate)} <span class="fw-bold"> &nbsp to &nbsp </span> ${formatDate(endDate)}`;
          })
          .join("<br>");

        const row = `
          <tr>
            <td>${spot.address}</td>
            <td>${spot.postcode}</td>
            <td>${spot.pricePerHour}</td>
            <td>${availability}</td>
          </tr>`;
        spotsTable.insertAdjacentHTML("beforeend", row);
      }
    });
  } catch (error) {
    console.error("Error loading parking spots:", error);
  }
}

/**
 * Format a date into dd/mm/yyyy hh:mm AM/PM format.
 * @param {Date} date - The date to format.
 * @returns {string} - The formatted date string.
 */
function formatDate(date) {
  const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    // hour12: true, // Enables AM/PM format
  };
  return new Intl.DateTimeFormat("en-GB", options).format(date);
}

//--------------------- Initialize Flatpickr ---------------------
if (openCalendarBtn) {
  openCalendarBtn.addEventListener("click", (e) => {
    e.preventDefault(); // Prevent the button from triggering form submission
  });

  // Initialize Flatpickr for selecting date-time ranges
  flatpickr(openCalendarBtn, {
    enableTime: true, // Allows time selection
    mode: "range", // Enables range selection
    dateFormat: "Y-m-d H:i", // Formats date and time
    minDate: "today", // Prevents selecting past dates
    inline: false, // Keeps the calendar floating
    onClose: function (selectedDates) {
      if (selectedDates.length === 2) {
        const start = selectedDates[0];
        const end = selectedDates[1];

        // Add the selected range to availability data
        availabilityData.push({ start, end });

        // Display selected availability in a list
        const listItem = document.createElement("li");
        listItem.className = "list-group-item d-flex justify-content-between align-items-center";
        listItem.innerHTML = `
          ${start.toLocaleDateString()} ${start.toLocaleTimeString()} to 
          ${end.toLocaleDateString()} ${end.toLocaleTimeString()}
          <button class="btn btn-sm btn-danger remove-btn">Remove</button>
        `;
        availabilityList.appendChild(listItem);

        // Remove availability on "Remove" button click
        listItem.querySelector(".remove-btn").addEventListener("click", () => {
          const index = availabilityData.findIndex((range) => range.start.getTime() === start.getTime() && range.end.getTime() === end.getTime());
          if (index > -1) {
            availabilityData.splice(index, 1); // Remove from data array
            listItem.remove(); // Remove from UI
          }
        });
      }
    },
  });
}
//--------------------- Handle Parking Spot Form Submission ---------------------
if (parkingSpotForm) {
  parkingSpotForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const address = document.getElementById("spot-address").value.trim();
    const postcode = document.getElementById("spot-postcode").value.trim();
    const pricePerHour = parseFloat(document.getElementById("spot-price").value.trim());

    if (!address || !postcode || !pricePerHour || availabilityData.length === 0) {
      alert("Please fill out all fields and set availability.");
      return;
    }

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        alert("You need to log in to save a parking spot.");
        window.location.href = "login_register.html";
        return;
      }

      const spotDetails = {
        address,
        postcode,
        pricePerHour,
        availability: availabilityData.map((range) => ({
          start: range.start.toISOString(),
          end: range.end.toISOString(),
        })),
        ownerId: userId,
      };

      await addDoc(collection(db, "parking-spots"), spotDetails);

      alert("Parking spot saved successfully!");
      parkingSpotForm.reset();
      availabilityData.length = 0;
      availabilityList.innerHTML = "";
    } catch (error) {
      console.error("Error saving parking spot:", error);
      alert("Failed to save parking spot. Please try again.");
    }
  });
}

//------------------------ get the current user's bookings from the database  and display them in the dashboard
//------------------------ get the current user's bookings from the database  and display them in the dashboard
//------------------------ get the current user's bookings from the database  and display them in the dashboard
//------------------------ get the current user's bookings from the database  and display them in the dashboard
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
 * Fetch and display user bookings from the database.
 */
const fetchUserBookings = async () => {
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
      const spotDetails = await getSpotDetails(data.spotId); // Fetch spot details using spotId
      bookings.push({
        id: doc.id,
        ...data,
        address: spotDetails.address,
        postcode: spotDetails.postcode,
      });
    }

    displayBookings(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    displayMessage(bookingsContainer, "Error loading bookings. Please try again later.", "text-danger");
  }
};

/**
 * Fetch spot details using spotId.
 * @param {string} spotId - The ID of the parking spot.
 * @returns {Object} - The spot details including address and postcode.
 */
const getSpotDetails = async (spotId) => {
  try {
    const spotDoc = await getDoc(doc(db, "parking-spots", spotId));
    if (spotDoc.exists()) {
      return spotDoc.data();
    }
    return { address: "Unknown", postcode: "Unknown" }; // Default values if spot is not found
  } catch (error) {
    console.error("Error fetching spot details:", error);
    return { address: "Error", postcode: "Error" }; // Default values on error
  }
};

const displayBookings = (bookings) => {
  bookingsContainer.innerHTML = ""; // Clear any existing content

  bookings.forEach((booking) => {
    const bookingCard = document.createElement("div");
    bookingCard.className = "card mb-3";

    bookingCard.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">Booking ID: ${booking.id}</h5>
        <p class="card-text"><strong>Spot ID:</strong> ${booking.spotId}</p>
        <p class="card-text"><strong>Address:</strong> ${booking.address}</p>
        <p class="card-text"><strong>Postcode:</strong> ${booking.postcode}</p>
        <p class="card-text"><strong>Selected Date & Time:</strong> ${booking.selectedDateTimeRange}</p>
        <button class="btn btn-danger delete-booking-btn" data-id="${booking.id}">Cancel Booking</button>
      </div>
    `;

    bookingsContainer.appendChild(bookingCard);
  });

  // Add event listeners to all delete buttons
  const deleteButtons = document.querySelectorAll(".delete-booking-btn");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      const bookingId = event.target.dataset.id;
      const confirmDelete = confirm("Are you sure you want to cancel this booking?");
      if (confirmDelete) {
        await deleteBooking(bookingId);
        fetchUserBookings(); // Refresh the bookings list
      }
    });
  });
};

/**
 * Delete a booking from the database.
 * @param {string} bookingId - The ID of the booking to delete.
 */
const deleteBooking = async (bookingId) => {
  try {
    await deleteDoc(doc(db, "bookings", bookingId));
    alert("Booking successfully cancelled.");
  } catch (error) {
    console.error("Error cancelling booking:", error);
    alert("Error cancelling booking. Please try again later.");
  }
};

/**
 * Initialize dashboard and authenticate user.
 */
const initializeDashboard = () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchUserBookings();
    } else {
      displayMessage(bookingsContainer, "Please log in to view your bookings.", "text-danger");
    }
  });
};

// Initialize
initializeDashboard();

//------------------------ Ranking system ------------------------
//------------------------ Ranking system ------------------------
//------------------------ Ranking system ------------------------
//------------------------ Ranking system ------------------------
// ________________________________________________________________
// ________________________________________________________________

const bookedSpotsContainer = document.getElementById("booked-spots-cards");

// Fetch booked spots for the current owner
async function fetchBookedSpots(ownerId) {
  try {
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
  }
}

// Add event listeners to dynamically created buttons
function addEventListeners() {
  document.querySelectorAll(".save-rank-btn").forEach((button) =>
    button.addEventListener("click", async (event) => {
      const bookingId = event.target.dataset.id;
      const rankInput = document.getElementById(`rank-${bookingId}`);
      const rankValue = parseInt(rankInput.value, 10);

      if (!isNaN(rankValue) && rankValue >= 1 && rankValue <= 5) {
        await saveUserRank(bookingId, rankValue);
      } else {
        alert("Please enter a valid rank between 1 and 5.");
      }
    })
  );

  document.querySelectorAll(".cancel-booking-btn").forEach((button) =>
    button.addEventListener("click", async (event) => {
      const bookingId = event.target.dataset.id;
      if (confirm("Are you sure you want to cancel this booking?")) {
        await cancelBooking(bookingId);
      }
    })
  );
}

// Save rank to Firestore
async function saveUserRank(bookingId, rank) {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, { rank });
    alert("Rank saved successfully!");
  } catch (error) {
    console.error("Error saving rank:", error);
    alert("Error saving rank. Please try again.");
  }
}

// Cancel booking in Firestore
async function cancelBooking(bookingId) {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await deleteDoc(bookingRef);
    alert("Booking cancelled successfully!");
    // Refresh the list
    const ownerId = auth.currentUser?.uid;
    if (ownerId) fetchBookedSpots(ownerId);
  } catch (error) {
    console.error("Error cancelling booking:", error);
    alert("Error cancelling booking. Please try again.");
  }
}

// Initialize fetch when the user is authenticated
onAuthStateChanged(auth, (user) => {
  if (user) {
    fetchBookedSpots(user.uid);
  } else {
    alert("Please log in to access booked spots.");
  }
});

// -----------------------------------------------------------------------
// Create stars for rating
function createStarRating(bookingId, maxRating = 5) {
  const container = document.createElement("div");
  container.classList.add("star-rating");
  for (let i = 1; i <= maxRating; i++) {
    const star = document.createElement("i");
    star.classList.add("fa", "fa-star", "star");
    star.dataset.rating = i;

    // Add hover effect
    star.addEventListener("mouseover", () => highlightStars(container, i));
    star.addEventListener("mouseout", () => resetStars(container));

    // Add click event to save rating
    star.addEventListener("click", async () => {
      selectStars(container, i);
      await saveUserRank(bookingId, i);
    });

    container.appendChild(star);
  }
  return container;
}

// Highlight stars on hover
function highlightStars(container, rating) {
  const stars = container.querySelectorAll(".star");
  stars.forEach((star, index) => {
    star.style.color = index < rating ? "gold" : "lightgray";
  });
}

// Reset stars to default state
function resetStars(container) {
  const stars = container.querySelectorAll(".star");
  stars.forEach((star) => {
    star.style.color = star.classList.contains("selected") ? "gold" : "lightgray";
  });
}

// Select stars on click
function selectStars(container, rating) {
  const stars = container.querySelectorAll(".star");
  stars.forEach((star, index) => {
    star.classList.toggle("selected", index < rating);
    star.style.color = index < rating ? "gold" : "lightgray";
  });
}
// --------------------------------------------------------------
// Updated displayBookedSpots function
function displayBookedSpots(bookedSpots) {
  bookedSpotsContainer.innerHTML = ""; // Clear existing cards

  bookedSpots.forEach((booking) => {
    const card = document.createElement("div");
    card.className = "col-md-4";

    // Create star rating container
    const starRating = createStarRating(booking.id);

    card.innerHTML = `
      <div class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">Spot: ${booking.spotDetails.address}</h5>
          <p><strong>User:</strong> ${booking.userDetails.email}</p>
          <p><strong>Date:</strong> ${booking.selectedDateTimeRange}</p>
          <div class="mb-2">Rate this user:</div>
        </div>
      </div>
    `;

    // Append the star rating to the card
    card.querySelector(".card-body").appendChild(starRating);

    // Add cancel booking button
    const cancelButton = document.createElement("button");
    cancelButton.classList.add("btn", "btn-danger", "cancel-booking-btn");
    cancelButton.textContent = "Cancel Booking";
    cancelButton.dataset.id = booking.id;
    cancelButton.addEventListener("click", async () => {
      if (confirm("Are you sure you want to cancel this booking?")) {
        await cancelBooking(booking.id);
      }
    });
    card.querySelector(".card-body").appendChild(cancelButton);

    bookedSpotsContainer.appendChild(card);
  });
}
