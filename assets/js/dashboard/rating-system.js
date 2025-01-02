// Import Firebase modules
import { db } from "../firebase-config.js";
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

/**
 * Fetch and display the average rank for a user.
 * @param {string} userId - The unique ID of the user.
 * @param {string} role - The role of the user ("user" or "owner").
 * @param {HTMLElement} container - The container to display the average rank.
 */
export const fetchAverageRank = async (userId, role, container) => {
  try {
    const bookingsRef = collection(db, "bookings");
    const querySnapshot = await getDocs(bookingsRef);

    let totalRank = 0;
    let rankCount = 0;

    for (const docSnapshot of querySnapshot.docs) {
      const booking = docSnapshot.data();

      if (role === "user" && booking.ownerRank && booking.userId === userId) {
        totalRank += booking.ownerRank;
        rankCount++;
      }

      if (role === "owner" && booking.rank && booking.spotId) {
        const spotDoc = await getDoc(doc(db, "parking-spots", booking.spotId));
        if (spotDoc.exists() && spotDoc.data().ownerId === userId) {
          totalRank += booking.rank;
          rankCount++;
        }
      }
    }

    const averageRank = rankCount > 0 ? (totalRank / rankCount).toFixed(2) : "No ratings yet";
    displayAverageRank(averageRank, container);
  } catch (error) {
    console.error("Error fetching average rank:", error);
    displayAverageRank("Error", container);
  }
};

/**
 * Display the average rank in a container.
 * @param {string|number} averageRank - The calculated average rank or a placeholder message.
 * @param {HTMLElement} container - The container to display the rank.
 */
const displayAverageRank = (averageRank, container) => {
  if (container) {
    container.innerHTML = `<h5>Average Rank</h5>`;

    if (averageRank === "No ratings yet" || averageRank === "Error") {
      container.innerHTML += `<p>${averageRank}</p>`;
    } else {
      const starRating = createStarRating(parseFloat(averageRank), 5, false);
      container.appendChild(starRating);
    }
  }
};

/**
 * Save a user's rank for a booking.
 * @param {string} bookingId - The unique ID of the booking.
 * @param {number} rank - The rank to save (1-5).
 */
export const saveUserRank = async (bookingId, rank) => {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, { rank });
    alert("Rank saved successfully!");
  } catch (error) {
    console.error("Error saving rank:", error);
    alert("Failed to save rank. Please try again.");
  }
};

/**
 * Create a star rating element.
 * @param {number} averageRank - The average rank to display.
 * @param {number} maxRating - The maximum number of stars.
 * @param {boolean} interactive - Whether the stars are clickable.
 * @param {function} [saveCallback] - Callback for saving the rank (if interactive).
 * @returns {HTMLElement} - The star rating element.
 */
export const createStarRating = (averageRank, maxRating = 5, interactive = false, saveCallback = null) => {
  const container = document.createElement("div");
  container.classList.add("star-rating", "d-block");

  for (let i = 1; i <= maxRating; i++) {
    const star = document.createElement("i");
    star.classList.add("fa", "fa-star", "star");

    // Full stars
    if (i <= Math.floor(averageRank)) {
      star.classList.add("gold");
    }
    // Half stars
    else if (i === Math.ceil(averageRank) && averageRank % 1 >= 0.5) {
      star.classList.add("gold", "fa-star-half-alt");
    }
    // Empty stars
    else {
      star.classList.add("gray");
    }

    // Add interactivity if enabled
    if (interactive) {
      star.addEventListener("mouseover", () => highlightStars(container, i));
      star.addEventListener("mouseout", () => resetStars(container, averageRank));
      star.addEventListener("click", () => {
        selectStars(container, i);
        if (saveCallback) saveCallback(i); // Save the selected rank
      });
    } else {
      star.style.pointerEvents = "none"; // Disable interaction for static display
    }

    container.appendChild(star);
  }

  return container;
};

// Highlight stars on hover
const highlightStars = (container, rating) => {
  const stars = container.querySelectorAll(".star");
  stars.forEach((star, index) => {
    star.style.color = index < rating ? "gold" : "lightgray";
  });
};

// Reset stars to default state
const resetStars = (container, existingRank = 0) => {
  const stars = container.querySelectorAll(".star");
  stars.forEach((star, index) => {
    star.style.color = index < existingRank ? "gold" : "lightgray";
  });
};

// Select stars on click
const selectStars = (container, rating) => {
  const stars = container.querySelectorAll(".star");
  stars.forEach((star, index) => {
    star.style.color = index < rating ? "gold" : "lightgray";
  });
};

// Save rank to Firestore
export async function saveOwnerRank(bookingId, rank) {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, { ownerRank: rank });
    alert("Rating saved successfully!");
  } catch (error) {
    console.error("Error saving rating:", error);
    alert("Error saving rating. Please try again later.");
  }
}
