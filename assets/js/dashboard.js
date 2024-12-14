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
const uploadImageBtn = document.getElementById("upload-image-btn");
const logoutButton = document.getElementById("logout");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      document.getElementById("email").value = data.email || "";
      document.getElementById("address").value = data.address || "";
      document.getElementById("postcode").value = data.postcode || "";
      document.getElementById("phone").value = data.phone || "";

      if (data.profileImageUrl) {
        profileImage.src = data.profileImageUrl;
      }
    }
  } else {
    window.location.href = "login_register.html";
  }
});

userDetailsForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const address = document.getElementById("address").value;
  const postcode = document.getElementById("postcode").value;
  const phone = document.getElementById("phone").value;

  try {
    const user = auth.currentUser;
    const userDocRef = doc(db, "users", user.uid);

    await updateDoc(userDocRef, { address, postcode, phone });

    alert("Profile updated successfully!");
  } catch (error) {
    console.error("Error updating profile:", error);
    alert("Error updating profile. Please try again.");
  }
});

uploadImageBtn.addEventListener("click", () => {
  profileImageInput.click();
});

profileImageInput.addEventListener("change", async () => {
  const file = profileImageInput.files[0];
  if (!file) return;

  try {
    const user = auth.currentUser;
    const storageRef = ref(storage, `profile-images/${user.uid}`);
    await uploadBytes(storageRef, file);

    const imageUrl = await getDownloadURL(storageRef);
    profileImage.src = imageUrl;

    const userDocRef = doc(db, "users", user.uid);
    await updateDoc(userDocRef, { profileImageUrl: imageUrl });

    alert("Profile image updated successfully!");
  } catch (error) {
    console.error("Error uploading profile image:", error);
    alert("Error uploading profile image. Please try again.");
  }
});

logoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
    alert("Logged out successfully!");
    window.location.href = "login_register.html";
  } catch (error) {
    console.error("Logout error:", error.message);
  }
});
