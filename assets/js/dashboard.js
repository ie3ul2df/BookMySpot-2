import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { doc, getDoc, updateDoc, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

const userDetailsForm = document.getElementById("user-details-form");
const profileImage = document.getElementById("profile-image");
const parkingForm = document.getElementById("parking-spot-form");
const spotsTable = document.getElementById("parking-spots-table");

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

//--------------------- Handle User Authentication to Show Tabs on Dashboard ---------------------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userData = await fetchUserData(user.uid);
      if (!userData) {
        console.error("User data not found");
        return;
      }

      populateUserProfile(userData);

      // Show tabs based on user role
      const ownerPannel = document.getElementById("owner-pannel-li");
      const adminPannel = document.getElementById("admin-pannel-li");

      if (userData.role === "owner") {
        ownerPannel.classList.remove("d-none");
        loadParkingSpots(user.uid); // Load parking spots for the owner
      } else {
        ownerPannel.classList.add("d-none");
      }

      if (userData.role === "admin") {
        adminPannel.classList.remove("d-none");
      } else {
        adminPannel.classList.add("d-none");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  } else {
    // Redirect to login if not authenticated
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

//--------------------- Handle Parking Spot Form Submission ---------------------
if (parkingForm) {
  parkingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const address = document.getElementById("spot-address").value;
    const postcode = document.getElementById("spot-postcode").value;
    const price = document.getElementById("spot-price").value;

    // Get selected availability
    const availability = document.querySelector('input[name="spot-availability"]:checked').value;

    const parkingSpot = {
      address,
      postcode,
      price,
      availability,
      ownerId: auth.currentUser.uid,
    };

    try {
      await addDoc(collection(db, "parking-spots"), parkingSpot);
      alert("Parking spot added successfully!");
      parkingForm.reset();
      loadParkingSpots(auth.currentUser.uid); // Refresh parking spots
    } catch (error) {
      console.error("Error adding parking spot:", error);
    }
  });
}

//--------------------- Fetch and Display Parking Spots ---------------------
async function loadParkingSpots(ownerId) {
  try {
    const parkingRef = collection(db, "parking-spots");
    const querySnapshot = await getDocs(parkingRef);

    spotsTable.innerHTML = ""; // Clear table
    querySnapshot.forEach((doc) => {
      const spot = doc.data();
      if (spot.ownerId === ownerId) {
        const row = `
          <tr>
            <td>${spot.address}</td>
            <td>${spot.postcode}</td>
            <td>${spot.price}</td>
            <td>${spot.availability}</td>
          </tr>`;
        spotsTable.insertAdjacentHTML("beforeend", row);
      }
    });
  } catch (error) {
    console.error("Error loading parking spots:", error);
  }
}
