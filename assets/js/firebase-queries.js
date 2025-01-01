// Import Firebase modules and services
import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { setDoc, doc, serverTimestamp, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

//---------------------------- Signin / Signout  ----------------------------

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

//---------------------------- Utility Functions ----------------------------

/**
 * Display error messages for Firebase error codes.
 * @param {string} errorCode - Firebase error code
 * @returns {string} - User-friendly error message
 */
function getErrorMessage(errorCode) {
  const errorMessages = {
    "auth/email-already-in-use": "The email address is already in use.",
    "auth/invalid-email": "The email address is invalid.",
    "auth/user-not-found": "No user found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/weak-password": "Password must be at least 6 characters.",
  };
  return errorMessages[errorCode] || "An unexpected error occurred. Please try again.";
}

//---------------------------- Function to handle login ----------------------------

async function handleLoginForm(e) {
  e.preventDefault();

  const email = e.target.querySelector('input[name="email"]').value.trim();
  const password = e.target.querySelector('input[name="password"]').value;
  const submitButton = e.target.querySelector('button[type="submit"]');

  if (!email) {
    alert("Please enter your email.");
    e.target.querySelector('input[name="email"]').focus();
    return;
  }
  if (!password) {
    alert("Please enter your password.");
    e.target.querySelector('input[name="password"]').focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Logging in...";

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in:", userCredential.user);
    alert("Login successful!");
    window.location.href = "dashboard.html"; // Redirect to dashboard
  } catch (error) {
    console.error("Login error:", error.message);
    const errorContainer = e.target.querySelector(".error-container") || document.createElement("div");
    errorContainer.className = "error-container text-danger mt-2";
    errorContainer.textContent = getErrorMessage(error.code);
    if (!e.target.contains(errorContainer)) {
      e.target.appendChild(errorContainer);
    }
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Login";
  }
}

//---------------------------- Function to handle registration ----------------------------

async function handleRegisterForm(e) {
  e.preventDefault();

  // Get form values
  const email = e.target.querySelector('input[name="email"]').value.trim();
  const password = e.target.querySelector('input[name="password"]').value;
  const address = e.target.querySelector('input[name="address"]').value.trim();
  const address2 = e.target.querySelector('input[name="address2"]').value.trim() || "";
  const city = e.target.querySelector('input[name="city"]').value.trim();
  const zip = e.target.querySelector('input[name="zip"]').value.trim();
  const role = e.target.querySelector('input[name="role"]:checked').value;

  if (!email || !password || !address || !city || !zip || !role) {
    alert("Please fill in all required fields.");
    return;
  }

  const termsAccepted = e.target.querySelector("#gridCheck").checked;
  if (!termsAccepted) {
    alert("You must agree to the terms and conditions to register.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // console.log("Saving user:", { email, address, city, zip, role });
    // Save user details in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email,
      address,
      address2,
      city,
      zip,
      createdAt: serverTimestamp(),
      role,
    });

    console.log("User registered successfully:", user);
    alert("Registration successful! Please log in.");
    document.querySelector("#show-login-form").click(); // Switch to the login form
  } catch (error) {
    console.error("Registration error:", error.message);
    alert(getErrorMessage(error.code));
  }
}

//---------------------------- Function to handle forgot password ----------------------------

async function handleForgotPasswordForm(e) {
  e.preventDefault();

  const email = e.target.querySelector('input[name="email"]').value.trim();

  if (!email) {
    alert("Please enter your email address.");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    console.log("Password reset email sent to:", email);
    alert("Password reset email sent. Check your inbox.");
    document.querySelector("#show-login-form").click(); // Switch to login form
  } catch (error) {
    console.error("Forgot password error:", error.message);
    alert(getErrorMessage(error.code));
  }
}

//---------------------------- Attach Event Listeners ----------------------------

document.addEventListener("DOMContentLoaded", () => {
  /**
   * Attach an event listener to a specified element if it exists.
   * @param {string} selector - The CSS selector of the target element.
   * @param {string} event - The event type (e.g., 'submit', 'click').
   * @param {Function} handler - The function to handle the event.
   * @param {string} elementName - A descriptive name for the element (optional).
   */
  const attachEventListener = (selector, event, handler, elementName = "Element") => {
    const element = document.querySelector(selector);
    if (element) {
      element.addEventListener(event, handler);
    }
  };

  // Attach event listeners for various forms
  attachEventListener("#loginForm", "submit", handleLoginForm, "Login form");
  attachEventListener("#registerForm", "submit", handleRegisterForm, "Register form");
  attachEventListener("#forgotPasswordForm", "submit", handleForgotPasswordForm, "Forgot password form");
});

//---------------------------- Hero Search Input Suggestions for all inserted characters ----------------------------

const searchInput = document.getElementById("hero-search");
const suggestionsList = document.getElementById("search-suggestions");

if (searchInput && suggestionsList) {
  // Debounce implementation
  let debounceTimeout;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => fetchSuggestions(e.target.value.trim().toLowerCase()), 300);
  });

  // Fetch suggestions
  const fetchSuggestions = async (query) => {
    suggestionsList.innerHTML = ""; // Clear existing suggestions
    if (!query) {
      suggestionsList.classList.add("hidden");
      return;
    }

    try {
      const parkingRef = collection(db, "parking-spots");
      const querySnapshot = await getDocs(parkingRef); // Replace with optimized Firestore query if possible

      querySnapshot.forEach((doc) => {
        const spot = doc.data();
        if (spot.postcode.toLowerCase().includes(query) || spot.address.toLowerCase().includes(query)) {
          const suggestion = document.createElement("li");
          suggestion.className = "list-group-item list-group-item-action";
          suggestion.textContent = `${spot.address} - ${spot.postcode}`;
          suggestion.dataset.spotId = doc.id;

          // Add click listener for navigation
          suggestion.addEventListener("click", () => {
            window.location.href = `spot-details.html?id=${doc.id}`;
          });

          // Add keyboard navigation
          suggestion.setAttribute("tabindex", "0");
          suggestion.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
              window.location.href = `spot-details.html?id=${doc.id}`;
            }
          });

          suggestionsList.appendChild(suggestion);
        }
      });

      // Display "No results" if no suggestions
      if (suggestionsList.childElementCount === 0) {
        const noResultItem = document.createElement("li");
        noResultItem.className = "list-group-item text-muted";
        noResultItem.textContent = "No matching spots found.";
        suggestionsList.appendChild(noResultItem);
      }

      suggestionsList.classList.remove("hidden");
    } catch (error) {
      console.error("Error fetching parking spots:", error);
      const errorItem = document.createElement("li");
      errorItem.className = "list-group-item text-danger";
      errorItem.textContent = "Error fetching suggestions.";
      suggestionsList.appendChild(errorItem);
    }
  };
}
