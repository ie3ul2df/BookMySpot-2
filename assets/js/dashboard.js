import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-storage.js";

const storage = getStorage();
const userDetailsForm = document.getElementById("user-details-form");
const profileImage = document.getElementById("profile-image");
const profileImageInput = document.getElementById("profile-image-input");
// const logoutButton = document.getElementById("logout");

//--------------------- Gravatar for user profile ---------------------
function getGravatarUrl(email) {
  const md5 = CryptoJS.MD5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${md5}?s=150&d=identicon`;
}

//--------------------- Handle User Authentication State ---------------------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        const email = data.email || "";

        // Use Gravatar for the profile image
        const gravatarUrl = getGravatarUrl(email);
        profileImage.src = gravatarUrl;

        // Populate user details in the form
        document.getElementById("email").value = email;
        document.getElementById("address").value = data.address || "";
        document.getElementById("address2").value = data.address2 || "";
        document.getElementById("zip").value = data.zip || "";
        document.getElementById("phone").value = data.phone || "";
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  } else {
    // Redirect to login if user is not authenticated
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
      const userDocRef = doc(db, "users", user.uid);

      // Update Firestore with new user details
      await updateDoc(userDocRef, { address, address2, zip, phone });

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    }
  });
} else {
  console.error("User details form not found!");
}

//--------------------- Handle User Logout ---------------------
// if (logoutButton) {
//   logoutButton.addEventListener("click", async () => {
//     try {
//       await signOut(auth);
//       alert("Logged out successfully!");
//       window.location.href = "login_register.html";
//     } catch (error) {
//       console.error("Logout error:", error.message);
//     }
//   });
// } else {
//   console.error("Logout button not found!");
// }
