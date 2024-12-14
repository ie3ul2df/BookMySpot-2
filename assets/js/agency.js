import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

//_____________________________________ Navbar Active Section _____________________________________//

document.addEventListener("DOMContentLoaded", function () {
  const sections = document.querySelectorAll("section"); // Select all sections
  const navLinks = document.querySelectorAll(".navbar-nav .nav-link"); // All navbar links
  const dropdownItems = document.querySelectorAll(".dropdown-item"); // All dropdown items
  const currentURL = window.location.href; // Current page URL

  // Function to highlight the active page link
  const setActivePage = () => {
    navLinks.forEach((link) => {
      const linkHref = link.href;

      // Special handling for Home (index.html)
      if (
        (currentURL.includes("index.html") &&
          linkHref.includes("index.html")) || // Matches index.html
        (currentURL === linkHref && linkHref.includes("#")) || // Matches sections on the same page
        (currentURL.endsWith("/") && linkHref.includes("index.html")) // Root URL (e.g., https://example.com/)
      ) {
        link.classList.add("active");
      } else if (currentURL === linkHref) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Also check the dropdown items for active class
    dropdownItems.forEach((item) => {
      const itemHref = item.href;

      if (currentURL === itemHref) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  };

  // Function to update active class for section-based scrolling
  const updateActiveNav = () => {
    let currentSection = "";

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 100; // Offset for fixed navbar height
      const sectionHeight = section.offsetHeight;
      const scrollPosition = window.pageYOffset;

      if (
        scrollPosition >= sectionTop &&
        scrollPosition < sectionTop + sectionHeight
      ) {
        currentSection = section.getAttribute("id");
      }
    });

    // Update the active class for section-based links (navbar links)
    navLinks.forEach((link) => {
      if (
        link.getAttribute("href") &&
        link.getAttribute("href").includes(`#${currentSection}`)
      ) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Update the active class for section-based links (dropdown items)
    dropdownItems.forEach((item) => {
      if (
        item.getAttribute("href") &&
        item.getAttribute("href").includes(`#${currentSection}`)
      ) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  };

  // Call page-based active function on load
  setActivePage();

  // Call the function on scroll for section-based navigation (only on index.html)
  if (currentURL.includes("index.html") || currentURL.endsWith("/")) {
    document.addEventListener("scroll", updateActiveNav);

    // Call section-based function once on page load for same-page sections
    updateActiveNav();
  }

  // Add click event listeners to navbar links for immediate active feedback
  navLinks.forEach((link) => {
    link.addEventListener("click", function () {
      // Clear active classes from all links
      navLinks.forEach((nav) => nav.classList.remove("active"));

      // Add active class to clicked link
      this.classList.add("active");
    });
  });

  // Add click event listeners to dropdown items for immediate active feedback
  dropdownItems.forEach((item) => {
    item.addEventListener("click", function () {
      // Clear active classes from all dropdown items
      dropdownItems.forEach((dropdown) => dropdown.classList.remove("active"));

      // Add active class to clicked dropdown item
      this.classList.add("active");
    });
  });
});

//-------------- change login / Register link on the navbar to Dashboard --------------
document.addEventListener("DOMContentLoaded", () => {
  const authLink = document.getElementById("auth-link");

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is logged in: Change link to Dashboard
      authLink.href = "dashboard.html";
      authLink.textContent = "Dashboard";
      authLink.setAttribute("aria-label", "Go to Dashboard");
    } else {
      // User is not logged in: Keep Login/Register
      authLink.href = "login_register.html";
      authLink.textContent = "Login / Register";
      authLink.setAttribute("aria-label", "Login or Register");
    }
  });
});
