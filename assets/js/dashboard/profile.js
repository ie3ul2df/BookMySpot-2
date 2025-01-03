import { auth, db } from "../firebase-config.js";
import { doc, getDoc, updateDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { createStarRating } from "./rating-system.js";

/**
 * Fetch user data from the Firestore database.
 * @param {string} userId - The user's unique ID.
 * @returns {Promise<Object|null>} - The user data or null if not found.
 */
export const fetchUserData = async (userId) => {
  const userDocRef = doc(db, "users", userId);
  const userDoc = await getDoc(userDocRef);
  return userDoc.exists() ? userDoc.data() : null;
};

/**
 * Populate the user profile form with fetched data.
 * @param {Object} data - The user data.
 */
export const populateUserProfile = (data) => {
  if (data.email) {
    document.getElementById("profile-image").src = getGravatarUrl(data.email);
    document.getElementById("email").value = data.email || "";
    document.getElementById("address").value = data.address || "";
    document.getElementById("address2").value = data.address2 || "";
    document.getElementById("zip").value = data.zip || "";
    document.getElementById("phone").value = data.phone || "";
  }
};

/**
 * Handle user profile form submission for updating profile details.
 * @param {HTMLFormElement} form - The form element.
 */
export const handleProfileFormSubmission = (form) => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const address = document.getElementById("address").value;
    const address2 = document.getElementById("address2").value;
    const zip = document.getElementById("zip").value;
    const phone = document.getElementById("phone").value;

    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to update your profile.");
        return;
      }

      await updateDoc(doc(db, "users", user.uid), { address, address2, zip, phone });
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    }
  });
};

/**
 * Generate a Gravatar URL based on the user's email.
 * @param {string} email - The user's email address.
 * @returns {string} - The Gravatar URL.
 */
export const getGravatarUrl = (email) => {
  const md5 = CryptoJS.MD5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${md5}?s=150&d=identicon`;
};

// --------------------------------------------------
// --------------------------------------------------
// --------------------------------------------------

/**
 * Fetch the average rank for the current user from the `ratings` collection.
 * @param {string} userId - The unique ID of the current user.
 */
const calculateAverageRankForCurrentUser = async (userId) => {
  try {
    const ratingsRef = collection(db, "ratings");
    const querySnapshot = await getDocs(query(ratingsRef, where("toUserId", "==", userId)));

    let totalRank = 0;
    let rankCount = 0;

    querySnapshot.forEach((doc) => {
      const rating = doc.data();
      totalRank += rating.rating; // Sum up the ratings
      rankCount++;
    });

    const averageRank = rankCount > 0 ? (totalRank / rankCount).toFixed(2) : "No ratings yet";
    displayAverageRank(averageRank); // Update the UI with the average rank
  } catch (error) {
    console.error("Error calculating average rank:", error);
  }
};

// ---------------------------------------------

export const initializeAverageRank = async () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userId = user.uid;

      // Calculate and display the average rank
      await calculateAverageRankForCurrentUser(userId);
    } else {
      console.error("User is not logged in.");
    }
  });
};

// ---------------------------------------------

export const displayAverageRank = (averageRank) => {
  const rankContainer = document.getElementById("average-rank-display");

  if (rankContainer) {
    rankContainer.innerHTML = `<h5>Average Rank</h5>`;

    if (averageRank === "No ratings yet") {
      rankContainer.innerHTML += `<p>${averageRank}</p>`;
    } else {
      const starRating = createStarRating(parseFloat(averageRank), 5, false); // Ensure averageRank is a number
      rankContainer.appendChild(starRating);
    }
  }
};
