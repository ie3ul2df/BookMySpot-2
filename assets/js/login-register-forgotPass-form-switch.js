//_____________________________________ Login / Register / Forgot Password toggle _____________________________________//
document.addEventListener("DOMContentLoaded", function () {
  // Select all forms
  const loginForm = document.getElementById("site-login-form");
  const registerForm = document.getElementById("site-register-form");
  const forgotPasswordForm = document.getElementById(
    "site-forgot-password-form"
  );

  // Select all links with unique IDs
  const showLoginFormLink = document.querySelectorAll("#show-login-form");
  const showRegisterFormLink = document.querySelectorAll("#show-register-form");
  const showForgotPasswordFormLogin = document.getElementById(
    "show-forgot-password-form-login"
  );
  const showForgotPasswordFormRegister = document.getElementById(
    "show-forgot-password-form-register"
  );

  // Utility function to show one form and hide others
  function showForm(formToShow) {
    [loginForm, registerForm, forgotPasswordForm].forEach((form) => {
      form.classList.add("d-none"); // Hide all forms
    });
    formToShow.classList.remove("d-none"); // Show the selected form
  }

  // Add event listeners for links

  // Login Form Links
  showLoginFormLink.forEach((link) => {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      showForm(loginForm);
    });
  });

  // Register Form Links
  showRegisterFormLink.forEach((link) => {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      showForm(registerForm);
    });
  });

  // Forgot Password Links
  if (showForgotPasswordFormLogin) {
    showForgotPasswordFormLogin.addEventListener("click", function (event) {
      event.preventDefault();
      showForm(forgotPasswordForm);
    });
  }

  if (showForgotPasswordFormRegister) {
    showForgotPasswordFormRegister.addEventListener("click", function (event) {
      event.preventDefault();
      showForm(forgotPasswordForm);
    });
  }
});
