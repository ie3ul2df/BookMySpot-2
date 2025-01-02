import { db } from "../firebase-config.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { createStarRating } from "./helpers.js";

/**
 * Save the rank to Firestore.
 * @param {string} bookingId - The ID of the booking being ranked.
 * @param {string} rankType - The type of rank ("rank" for users or "ownerRank" for owners).
 * @param {number} rankValue - The rank value (1-5).
 */
export const saveRank = async (bookingId, rankType, rankValue) => {
  try {
    const field = rankType === "owner" ? "ownerRank" : "rank";
    const bookingRef = doc(db, "bookings", bookingId);

    await updateDoc(bookingRef, { [field]: rankValue });
    console.log(`${field} saved successfully with value ${rankValue}`);
    alert("Rank saved successfully!");
  } catch (error) {
    console.error("Error saving rank:", error);
    alert("Error saving rank. Please try again later.");
  }
};

/**
 * Create and display a star rating UI.
 * @param {Object} booking - The booking data.
 * @param {string} rankType - The type of rank ("rank" for users or "ownerRank" for owners).
 * @returns {HTMLElement} - The star rating UI element.
 */
export const createInteractiveStarRating = (booking, rankType) => {
  const currentRank = rankType === "owner" ? booking.ownerRank || 0 : booking.rank || 0;

  return createStarRating(
    currentRank, // Current rank value
    5, // Maximum stars
    true, // Enable interactivity
    async (newRank) => {
      try {
        await saveRank(booking.id, rankType, newRank); // Save the rank
        if (rankType === "owner") {
          booking.ownerRank = newRank; // Update local ownerRank
        } else {
          booking.rank = newRank; // Update local rank
        }
      } catch (error) {
        console.error("Error saving rank:", error);
        alert("Failed to save the rank. Please try again.");
      }
    }
  );
};
