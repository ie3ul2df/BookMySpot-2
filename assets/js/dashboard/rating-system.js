// Import Firebase modules
import { db } from "../firebase-config.js";
import { doc, addDoc, collection, getDocs, query, where, updateDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

/**
 * Fetch and display the average rank for a user.
 * @param {string} userId - The unique ID of the user.
 * @param {string} role - The role of the user ("user" or "owner").
 * @param {HTMLElement} container - The container to display the average rank.
 */
export const fetchAverageRank = async (userId, role, container) => {
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

    const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(2) : "No ratings yet";
    displayAverageRating(container, averageRating);
  } catch (error) {
    console.error("Error fetching average rank:", error);
    displayAverageRating(container, "Error");
  }
};

/**
 * Display the average rank in a container.
 * @param {HTMLElement} container - The container to display the rank.
 * @param {string|number} averageRating - The calculated average rating or a placeholder message.
 */
export const displayAverageRating = (container, averageRating) => {
  if (!container) return;

  container.innerHTML = `<h5>Average Rating</h5>`;
  if (averageRating === "No ratings yet" || averageRating === "Error") {
    container.innerHTML += `<p>${averageRating}</p>`;
  } else {
    const starRating = createStarRating(parseFloat(averageRating), 5, false);
    container.appendChild(starRating);
  }
};

/**
 * Save or update a rating in the `ratings` collection.
 * @param {string} fromUserId - ID of the user giving the rating.
 * @param {string} toUserId - ID of the user being rated.
 * @param {string} role - Role of the user being rated ("owner" or "user").
 * @param {string} bookingId - ID of the associated booking.
 * @param {number} rating - The rating given (1-5).
 */
export const saveRating = async (fromUserId, toUserId, role, bookingId, rating) => {
  if (!fromUserId || !toUserId || !role || !bookingId || !rating) {
    console.error("Missing required data for saving rating:", { fromUserId, toUserId, role, bookingId, rating });
    return;
  }

  try {
    const ratingsRef = collection(db, "ratings");

    // Query to find an existing rating for this booking and user pair
    const existingRatingQuery = query(
      ratingsRef,
      where("fromUserId", "==", fromUserId),
      where("toUserId", "==", toUserId),
      where("bookingId", "==", bookingId)
    );

    const querySnapshot = await getDocs(existingRatingQuery);

    if (!querySnapshot.empty) {
      // If a record exists, update it
      const ratingDocId = querySnapshot.docs[0].id; // Get the ID of the existing rating document
      const ratingDocRef = doc(db, "ratings", ratingDocId);

      await updateDoc(ratingDocRef, {
        rating,
        timestamp: new Date().toISOString(),
      });

      console.log("Rating updated successfully!");
    } else {
      // If no record exists, create a new one
      await addDoc(ratingsRef, {
        fromUserId,
        toUserId,
        role,
        bookingId,
        rating,
        timestamp: new Date().toISOString(),
      });

      console.log("Rating saved successfully!");
    }
  } catch (error) {
    console.error("Error saving or updating rating:", error);
    alert("Failed to save or update rating. Please try again.");
  }
};

/**
 * Create a star rating element.
 * @param {number} averageRating - The average rating to display.
 * @param {number} maxRating - The maximum number of stars.
 * @param {boolean} interactive - Whether the stars are clickable.
 * @param {function} [saveCallback] - Callback for saving the rating (if interactive).
 * @returns {HTMLElement} - The star rating element.
 */
export const createStarRating = (averageRating, maxRating = 5, interactive = false, saveCallback = null) => {
  const container = document.createElement("div");
  container.classList.add("star-rating", "d-block");

  for (let i = 1; i <= maxRating; i++) {
    const star = document.createElement("i");
    star.classList.add("fa", "fa-star", "star");

    // Full stars
    if (i <= Math.floor(averageRating)) {
      star.classList.add("gold");
    }
    // Half stars
    else if (i === Math.ceil(averageRating) && averageRating % 1 >= 0.5) {
      star.classList.add("gold", "fa-star-half-alt");
    }
    // Empty stars
    else {
      star.classList.add("gray");
    }

    if (interactive) {
      star.addEventListener("mouseover", () => highlightStars(container, i));
      star.addEventListener("mouseout", () => resetStars(container, averageRating));
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

export const fetchReceivedAverageRating = async (userId) => {
  try {
    const ratingsRef = collection(db, "ratings");
    const q = query(ratingsRef, where("toUserId", "==", userId)); // Ratings received by the user
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
    console.error("Error fetching received average rating:", error);
    return "Error";
  }
};
