import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

//-------------- change login / Register link on the navbar to Dashboard --------------

const logoutButton = document.getElementById("logout");

document.addEventListener("DOMContentLoaded", () => {
  const authLink = document.querySelector("#auth-link > a"); // Target the <a> inside the <li>

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in: Update to Dashboard
      authLink.href = "dashboard.html";
      authLink.textContent = "Dashboard";
      authLink.setAttribute("aria-label", "Go to Dashboard");
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
        await signOut(auth); // Sign the user out
        alert("You have been logged out.");
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
