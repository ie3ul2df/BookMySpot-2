import { auth } from "./firebase-config.js";
import { onAuthStateChanged, setPersistence, browserSessionPersistence, signOut } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

const logoutButton = document.getElementById("logout");

document.addEventListener("DOMContentLoaded", () => {
  const authLink = document.querySelector("#auth-link > a"); // Target the <a> inside the <li>

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        // Force refresh user state
        await user.reload();
        const refreshedUser = auth.currentUser;

        if (refreshedUser) {
          // User still exists: Update to Dashboard
          authLink.href = "dashboard.html";
          authLink.textContent = "Dashboard";
          authLink.setAttribute("aria-label", "Go to Dashboard");
        } else {
          // User no longer exists
          console.log("User does not exist. Logging out...");
          await signOut(auth);
          alert("Your account has been deleted. Redirecting to login...");
          window.location.href = "login_register.html";
        }
      } catch (error) {
        console.error("Error refreshing user state:", error);
      }
    } else {
      // User is not signed in: Keep Login/Register
      authLink.href = "login_register.html";
      authLink.textContent = "Login / Register";
      authLink.setAttribute("aria-label", "Login or Register");
      logoutButton.style.display = "none";
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  if (logoutButton) {
    logoutButton.addEventListener("click", async (e) => {
      e.preventDefault(); // Prevent default link behavior
      try {
        // Set session persistence to NONE
        await setPersistence(auth, browserSessionPersistence);

        // Sign the user out
        await signOut(auth);

        // Clear local storage (ensure no cached session)
        localStorage.clear();
        sessionStorage.clear();

        alert("You have been logged out, and your session has been cleared.");
        window.location.href = "login_register.html"; // Redirect to login page
      } catch (error) {
        console.error("Error signing out:", error);
        alert("Error signing out. Please try again.");
      }
    });
  } else {
    console.error("Logout button not found!");
  }
});
