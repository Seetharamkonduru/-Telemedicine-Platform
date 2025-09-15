const appointment = JSON.parse(localStorage.getItem("appointmentData"));

if (appointment) {
  document.getElementById("date").innerText = appointment.date;
  document.getElementById("time").innerText = appointment.time;
  document.getElementById("doctor-name").innerText = appointment.doctor.name;
  document.getElementById("doctor-specialty").innerText = appointment.doctor.specialty;
  document.getElementById("hospital-name").innerText = appointment.hospital.name;
  document.getElementById("hospital-address").innerText = appointment.hospital.address;
  document.getElementById("review-doctor-name").innerText = appointment.doctor.name;

  // NEW: Add a check for doctor price and display it
  const doctorDetailsSection = document.querySelector('.container h3:nth-of-type(1)').nextElementSibling; // Get the div after the first h3
  if (appointment.doctor.price !== undefined && appointment.doctor.price !== null) {
      const priceParagraph = document.createElement('p');
      priceParagraph.innerHTML = `<strong>💰 Price:</strong> ₹${appointment.doctor.price}/hour`;
      doctorDetailsSection.appendChild(priceParagraph);
  }

  // Check if the appointment has passed to show review section
  checkAppointmentStatus(appointment);

} else {
  // Use a custom modal or message box instead of alert
  const container = document.querySelector('.container');
  if (container) {
    container.innerHTML = `
      <h2>No Appointment Data Found</h2>
      <p>It seems like there's no appointment data to display.</p>
      <a href="BookApp.html" class="login-btn" style="display: block; width: fit-content; margin: 20px auto;">Book a New Appointment</a>
    `;
  }
}

// Function to check appointment status and display review section
function checkAppointmentStatus(app) {
    // Convert appointment date and time to a Date object
    const appointmentDateTime = new Date(`${app.date} ${app.time}`);
    const currentDateTime = new Date();

    const reviewSection = document.getElementById("review-section");
    const submitReviewBtn = document.getElementById("submitReviewBtn");
    const starRatingContainer = document.getElementById("starRating");
    let currentRating = 0; // To store the selected star rating

    // Check if the appointment date/time has passed AND it's not already reviewed
    if (appointmentDateTime < currentDateTime && !app.review) {
        reviewSection.style.display = "block";
        // Update status for review (this would be a backend call in a real app)
        app.status = 'completed';
        updateAppointmentInLocalStorage(app); // Update status in local storage for demo

        // Event listeners for star rating
        starRatingContainer.addEventListener("click", (e) => {
            if (e.target.classList.contains("fa-star") || e.target.classList.contains("star")) {
                let starValue = parseInt(e.target.closest(".star").dataset.value);
                setStars(starValue);
                currentRating = starValue;
            }
        });

        submitReviewBtn.addEventListener("click", () => {
            const comment = document.getElementById("review-comment").value.trim();
            if (currentRating === 0) {
                alert("Please select a star rating.");
                return;
            }

            const reviewData = {
                rating: currentRating,
                comment: comment,
                timestamp: new Date().toISOString()
            };

            // Update the appointment with review data
            app.review = reviewData;
            app.rating = currentRating; // Store the final rating for doctor dashboard
            // In a real app, this would be an API call to update the appointment in MongoDB
            // e.g., fetch('http://localhost:5000/api/appointments/review', { method: 'PUT', ... })
            updateAppointmentInLocalStorage(app);

            alert("Thank you for your review!");
            reviewSection.innerHTML = `<h3>Thank you for your review!</h3><p>You rated Dr. ${app.doctor.name} ${currentRating} stars.</p>`;
        });

    } else if (app.review) {
        // If already reviewed, display the existing review
        reviewSection.style.display = "block";
        reviewSection.innerHTML = `<h3>Your Review for Dr. ${app.doctor.name}:</h3>
                                    <p>Rating: ${'⭐'.repeat(app.review.rating)}</p>
                                    <p>Comment: ${app.review.comment || 'No comment provided.'}</p>`;
    }
}

// Helper function to set the visual state of stars
function setStars(rating) {
    const stars = document.querySelectorAll(".star");
    stars.forEach((star, index) => {
        const icon = star.querySelector("i");
        if (index < rating) {
            icon.classList.remove("far");
            icon.classList.add("fas"); // Filled star
        } else {
            icon.classList.remove("fas");
            icon.classList.add("far"); // Empty star
        }
    });
}

// Helper function to update the appointment in the "allAppointments" localStorage array
// In a real app, this would be an API call to your backend to update the appointment in MongoDB.
function updateAppointmentInLocalStorage(updatedAppointment) {
    let allAppointments = JSON.parse(localStorage.getItem("allAppointments")) || [];
    const index = allAppointments.findIndex(app => app.id === updatedAppointment.id); // Assuming 'id' is unique
    if (index !== -1) {
        allAppointments[index] = updatedAppointment;
    } else {
        // This case should ideally not happen if ID is unique and appointment is being updated
        allAppointments.push(updatedAppointment);
    }
    localStorage.setItem("allAppointments", JSON.stringify(allAppointments));
    localStorage.setItem("appointmentData", JSON.stringify(updatedAppointment)); // Also update the current appointment data
}
