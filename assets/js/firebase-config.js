// assets/js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-firestore.js";

// Replace these placeholders with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAnYnzeCi-02bh1bqMksHowEaLGGX0yZ68",
  authDomain: "bookmyspot-7fe47.firebaseapp.com",
  projectId: "bookmyspot-7fe47",
  storageBucket: "bookmyspot-7fe47.firebasestorage.app",
  messagingSenderId: "444638578281",
  appId: "1:444638578281:web:07d8ea4d82a94e42f744f8",
  measurementId: "G-5TGWGD7F8R",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // For authentication
const db = getFirestore(app); // For Firestore database

// Export the initialized Firebase services
export { auth, db };
