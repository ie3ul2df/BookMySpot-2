// assets/js/firebase-config.js

// Import the required Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAnYnzeCi-02bh1bqMksHowEaLGGX0yZ68",
  authDomain: "bookmyspot-7fe47.firebaseapp.com",
  projectId: "bookmyspot-7fe47",
  storageBucket: "bookmyspot-7fe47.appspot.com",
  messagingSenderId: "444638578281",
  appId: "1:444638578281:web:07d8ea4d82a94e42f744f8",
  measurementId: "G-5TGWGD7F8R",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
const auth = getAuth(app); // Authentication service
const db = getFirestore(app); // Firestore database
const storage = getStorage(app);

// Export Firebase services for use in other files
export { auth, db, storage };
