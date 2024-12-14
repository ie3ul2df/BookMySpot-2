// Import Firebase modules and services
import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/9.19.1/firebase-auth.js";
import {
  setDoc,
  doc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.19.1/firebase-firestore.js";

//---------------------------- Function to handle login ----------------------------
export async function handleLoginForm(e) {
  e.preventDefault();
  const email = e.target.querySelector('input[name="email"]').value;
  const password = e.target.querySelector('input[name="password"]').value;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("User logged in:", userCredential.user);
    alert("Login successful!");
    window.location.href = "dashboard.html"; // Redirect to dashboard
  } catch (error) {
    console.error("Login error:", error.message);
    alert(error.message);
  }
}

//---------------------------- Function to handle registration ----------------------------
export async function handleRegisterForm(e) {
  e.preventDefault();

  // Get form values
  const email = e.target.querySelector('input[name="email"]').value;
  const password = e.target.querySelector('input[name="password"]').value;
  const address = e.target.querySelector('input[name="address"]').value;
  const address2 = e.target.querySelector('input[name="address2"]').value || ""; // Optional
  const city = e.target.querySelector('input[name="city"]').value;
  const zip = e.target.querySelector('input[name="zip"]').value;

  // Validate checkbox
  const termsAccepted = e.target.querySelector("#gridCheck").checked;
  if (!termsAccepted) {
    alert("You must agree to the terms and conditions to register.");
    return;
  }

  try {
    // Register the user with Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Save user details in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email,
      address,
      address2,
      city,
      zip,
      createdAt: serverTimestamp(),
    });

    console.log("User registered successfully:", user);
    alert("Registration successful! Please log in.");
    // Switch to the login form (reuse your existing form toggle function)
    document.querySelector("#show-login-form").click();
  } catch (error) {
    console.error("Registration error:", error.message);
    alert(error.message);
  }
}

//---------------------------- Function to handle forgot password ----------------------------
export async function handleForgotPasswordForm(e) {
  e.preventDefault();
  const email = e.target.querySelector('input[name="email"]').value;

  try {
    await sendPasswordResetEmail(auth, email);
    console.log("Password reset email sent to:", email);
    alert("Password reset email sent. Check your inbox.");
    // Switch to login form (you already have a function for toggling forms)
    document.querySelector("#show-login-form").click();
  } catch (error) {
    console.error("Forgot password error:", error.message);
    alert(error.message);
  }
}
