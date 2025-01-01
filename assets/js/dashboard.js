// Import Firebase modules and services
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { doc, getDoc, updateDoc, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// DOM Elements
const userDetailsForm = document.getElementById("user-details-form");
const profileImage = document.getElementById("profile-image");
const spotsTable = document.getElementById("parking-spots-table");
const availabilityData = [];
const availabilityList = document.getElementById("availability-list");
const openCalendarBtn = document.getElementById("open-calendar-btn");
const parkingSpotForm = document.getElementById("parking-spot-form");

//--------------------- Gravatar for User Profile ---------------------
function getGravatarUrl(email) {
  const md5 = CryptoJS.MD5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${md5}?s=150&d=identicon`;
}

//--------------------- Fetch User Data ---------------------
async function fetchUserData(userId) {
  const userDocRef = doc(db, "users", userId);
  const userDoc = await getDoc(userDocRef);
  return userDoc.exists() ? userDoc.data() : null;
}

//--------------------- Populate User Profile ---------------------
function populateUserProfile(data) {
  if (data.email) {
    profileImage.src = getGravatarUrl(data.email);
    document.getElementById("email").value = data.email || "";
    document.getElementById("address").value = data.address || "";
    document.getElementById("address2").value = data.address2 || "";
    document.getElementById("zip").value = data.zip || "";
    document.getElementById("phone").value = data.phone || "";
  }
}

//--------------------- Handle User Authentication ---------------------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userData = await fetchUserData(user.uid);
      if (!userData) {
        console.error("User data not found");
        return;
      }

      populateUserProfile(userData);

      const ownerPanel = document.getElementById("owner-panel-li");
      const adminPanel = document.getElementById("admin-panel-li");

      if (userData.role === "owner") {
        ownerPanel?.classList.remove("d-none");
        loadParkingSpots(user.uid);
      } else {
        ownerPanel?.classList.add("d-none");
      }

      if (userData.role === "admin") {
        adminPanel?.classList.remove("d-none");
      } else {
        adminPanel?.classList.add("d-none");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  } else {
    window.location.href = "login_register.html";
  }
});

//--------------------- Handle Profile Form Submission ---------------------
if (userDetailsForm) {
  userDetailsForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const address = document.getElementById("address").value;
    const address2 = document.getElementById("address2").value;
    const zip = document.getElementById("zip").value;
    const phone = document.getElementById("phone").value;

    try {
      const user = auth.currentUser;
      await updateDoc(doc(db, "users", user.uid), { address, address2, zip, phone });

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    }
  });
}

//--------------------- Load Parking Spots ---------------------
async function loadParkingSpots(ownerId) {
  try {
    const parkingRef = collection(db, "parking-spots");
    const querySnapshot = await getDocs(parkingRef);

    spotsTable.innerHTML = "";
    querySnapshot.forEach((doc) => {
      const spot = doc.data();
      if (spot.ownerId === ownerId) {
        const row = `
          <tr>
            <td>${spot.address}</td>
            <td>${spot.postcode}</td>
            <td>${spot.pricePerHour}</td>
            <td>${spot.availability.map((av) => av.start).join(", ")}</td>
          </tr>`;
        spotsTable.insertAdjacentHTML("beforeend", row);
      }
    });
  } catch (error) {
    console.error("Error loading parking spots:", error);
  }
}

//--------------------- Initialize Flatpickr ---------------------
if (openCalendarBtn) {
  openCalendarBtn.addEventListener("click", (e) => {
    e.preventDefault(); // Prevent the button from triggering form submission
  });

  // Initialize Flatpickr for selecting date-time ranges
  flatpickr(openCalendarBtn, {
    enableTime: true, // Allows time selection
    mode: "range", // Enables range selection
    dateFormat: "Y-m-d H:i", // Formats date and time
    minDate: "today", // Prevents selecting past dates
    inline: false, // Keeps the calendar floating
    onClose: function (selectedDates) {
      if (selectedDates.length === 2) {
        const start = selectedDates[0];
        const end = selectedDates[1];

        // Add the selected range to availability data
        availabilityData.push({ start, end });

        // Display selected availability in a list
        const listItem = document.createElement("li");
        listItem.className = "list-group-item d-flex justify-content-between align-items-center";
        listItem.innerHTML = `
          ${start.toLocaleDateString()} ${start.toLocaleTimeString()} to 
          ${end.toLocaleDateString()} ${end.toLocaleTimeString()}
          <button class="btn btn-sm btn-danger remove-btn">Remove</button>
        `;
        availabilityList.appendChild(listItem);

        // Remove availability on "Remove" button click
        listItem.querySelector(".remove-btn").addEventListener("click", () => {
          const index = availabilityData.findIndex((range) => range.start.getTime() === start.getTime() && range.end.getTime() === end.getTime());
          if (index > -1) {
            availabilityData.splice(index, 1); // Remove from data array
            listItem.remove(); // Remove from UI
          }
        });
      }
    },
  });
}
//--------------------- Handle Parking Spot Form Submission ---------------------
if (parkingSpotForm) {
  parkingSpotForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const address = document.getElementById("spot-address").value.trim();
    const postcode = document.getElementById("spot-postcode").value.trim();
    const pricePerHour = parseFloat(document.getElementById("spot-price").value.trim());

    if (!address || !postcode || !pricePerHour || availabilityData.length === 0) {
      alert("Please fill out all fields and set availability.");
      return;
    }

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        alert("You need to log in to save a parking spot.");
        window.location.href = "login_register.html";
        return;
      }

      const spotDetails = {
        address,
        postcode,
        pricePerHour,
        availability: availabilityData.map((range) => ({
          start: range.start.toISOString(),
          end: range.end.toISOString(),
        })),
        ownerId: userId,
      };

      await addDoc(collection(db, "parking-spots"), spotDetails);

      alert("Parking spot saved successfully!");
      parkingSpotForm.reset();
      availabilityData.length = 0;
      availabilityList.innerHTML = "";
    } catch (error) {
      console.error("Error saving parking spot:", error);
      alert("Failed to save parking spot. Please try again.");
    }
  });
}
