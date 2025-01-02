// Import necessary Firebase modules
import { auth } from "../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

/**
 * Initialize authentication and handle user state changes.
 * @param {Function} onAuthenticated - Callback when the user is authenticated.
 * @param {Function} onUnauthenticated - Callback when the user is not authenticated.
 */
export const initializeAuth = (onAuthenticated, onUnauthenticated) => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User authenticated:", user.uid);
      onAuthenticated(user);
    } else {
      console.error("User is not logged in.");
      if (onUnauthenticated) {
        onUnauthenticated();
      }
    }
  });
};

/**
 * Redirect to login if user is not authenticated.
 */
export const redirectToLogin = () => {
  window.location.href = "login_register.html";
};
