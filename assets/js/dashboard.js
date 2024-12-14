import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const userNameElement = document.getElementById("user-name");
  const totalBookingsElement = document.getElementById("total-bookings");
  const availableSpotsElement = document.getElementById("available-spots");
  const accountCreatedElement = document.getElementById("account-created");
  const logoutButton = document.getElementById("logout");

  // Check if user is logged in
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        // Fetch user details from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userNameElement.textContent = userData.email;
          accountCreatedElement.textContent =
            userData.createdAt?.toDate().toLocaleDateString() || "--";
        }

        // Fetch other data (mocked for example purposes)
        totalBookingsElement.textContent = 5; // Replace with real data
        availableSpotsElement.textContent = 12; // Replace with real data
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    } else {
      // Redirect to login page if not logged in
      window.location.href = "login_register.html";
    }
  });

  // Logout functionality
  logoutButton.addEventListener("click", async () => {
    try {
      await signOut(auth);
      alert("Logged out successfully!");
      window.location.href = "login_register.html";
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  });
});
