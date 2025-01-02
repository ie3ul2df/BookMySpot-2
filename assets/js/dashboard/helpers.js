/**
 * Create a Cancel Booking button element with event listener to delete the
 * booking from Firestore and reload the user's bookings list on success or
 * display an error message on failure.
 */
export const createCancelButton = (bookingId) => {
  const button = document.createElement("button");
  button.className = "btn btn-danger mt-2";
  button.textContent = "Cancel Booking";

  button.addEventListener("click", async () => {
    if (confirm("Are you sure you want to cancel this booking?")) {
      try {
        await deleteDoc(doc(db, "bookings", bookingId));
        alert("Booking canceled successfully.");
        fetchUserBookings();
      } catch (error) {
        console.error("Error canceling booking:", error);
        alert("Failed to cancel booking. Please try again.");
      }
    }
  });

  return button;
};
