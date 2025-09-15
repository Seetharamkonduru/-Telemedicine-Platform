// This array is a placeholder for the available slots a doctor might have.
// In a real application, these slots would be dynamic, fetched from the backend
// based on the selected doctor's availability.
const slots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"
];

let selectedDate = "";
let selectedDoctorId = "";
let selectedDoctorDetails = null; // To store the full doctor object fetched from backend
let doctorPrice = 0; // NEW: To store the doctor's price

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    selectedDoctorId = urlParams.get('doctorId');
    doctorPrice = parseFloat(urlParams.get('doctorPrice')) || 0; // NEW: Get doctorPrice from URL

    // Check if user is logged in as a patient
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    if (!token || userRole !== 'patient') {
        alert("You must be logged in as a patient to book an appointment.");
        window.location.href = 'login.html';
        return;
    }


    if (selectedDoctorId) {
        // Fetch full doctor details from backend using the ID
        try {
            const response = await fetch(`http://localhost:5000/api/appointments/doctors`); // Fetch all doctors
            if (!response.ok) {
                throw new Error('Failed to fetch doctors');
            }
            const doctors = await response.json();
            selectedDoctorDetails = doctors.find(doc => doc._id === selectedDoctorId);

            if (selectedDoctorDetails) {
                displayDoctorInfo(selectedDoctorDetails);
            } else {
                alert("Doctor not found.");
                window.location.href = "FDoctors.html";
            }
        } catch (error) {
            console.error('Error fetching doctor details:', error);
            alert('Error loading doctor details. Please try again.');
            window.location.href = "FDoctors.html";
        }
    } else {
        alert("No doctor selected. Please go back to 'Find Doctors' page.");
        window.location.href = "FDoctors.html";
    }
});

// Displays the selected doctor's information on the booking page
function displayDoctorInfo(doctor) {
    const doctorInfoContainer = document.getElementById("doctorInfoBooking");
    doctorInfoContainer.innerHTML = `
        <h3>Booking Appointment with:</h3>
        <p><strong>Dr. ${doctor.name}</strong> (${doctor.specialty})</p>
        <p>${doctor.hospital}</p>
        <p><strong>Price:</strong> ₹${doctorPrice}/hour</p> <hr>
    `;
}

// Handles date selection from the calendar input
function selectDate(event) {
  selectedDate = event.target.value;
  if (selectedDate) {
    document.getElementById("selected-date").innerText = `Selected Date: ${selectedDate}`;
    document.getElementById("availability").innerText = "Available Slots";
    renderSlots(); // Render available slots for the selected date
  } else {
    document.getElementById("selected-date").innerText = "Select a Date";
    document.getElementById("availability").innerText = "";
    document.getElementById("slots").innerHTML = "";
  }
}

// Renders the time slots as clickable buttons
function renderSlots() {
  const slotsContainer = document.getElementById("slots");
  slotsContainer.innerHTML = ""; // Clear existing slots
  slots.forEach(slot => {
    const button = document.createElement("button");
    button.className = "slot-button";
    button.innerText = slot;
    button.onclick = () => bookSlot(slot); // Attach booking function to button click
    slotsContainer.appendChild(button);
  });
}

// Handles the booking of a selected slot
async function bookSlot(time) {
  if (!selectedDate) {
    alert("Please select a date first.");
    return;
  }
  if (!selectedDoctorId || !selectedDoctorDetails) {
    alert("Doctor details are missing. Please re-select a doctor.");
    window.location.href = "FDoctors.html";
    return;
  }

  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const patientUserId = localStorage.getItem('userId'); // Patient's MongoDB _id
  const patientUserName = localStorage.getItem('userName'); // Patient's name from login

  // Ensure user is logged in as a patient (redundant check, but good for safety)
  if (!token || userRole !== 'patient' || !patientUserId) {
    alert("You must be logged in as a patient to book an appointment.");
    window.location.href = 'login.html';
    return;
  }

  // Data to send to the backend for appointment booking
  const appointmentData = {
    doctorId: selectedDoctorId,
    date: selectedDate,
    time: time,
    // patientId is sent implicitly via token on the backend
  };

  try {
    const response = await fetch('http://localhost:5000/api/appointments/book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token, // Send the JWT token for authentication
      },
      body: JSON.stringify(appointmentData),
    });

    const data = await response.json();

    if (response.ok) {
      // Store full appointment data for the confirmation page
      // This data is fetched from the backend response or constructed for display
      const fullAppointmentDetails = {
        id: data.appointment._id, // Get the MongoDB _id of the new appointment
        date: selectedDate,
        time: time,
        doctor: {
          name: selectedDoctorDetails.name,
          specialty: selectedDoctorDetails.specialty,
          price: doctorPrice // NEW: Include price in appointment details
        },
        hospital: {
          name: selectedDoctorDetails.hospital,
          address: "Dr.Chandamma Sagar Institution,DEVARAKAGGALAHALLI, HAROHALLI, Kanakapura Main Rd, Kanakapura, Karnataka 562112"
        },
        patient: {
            name: patientUserName
        },
        status: data.appointment.status,
        review: null,
        rating: 0
      };
      localStorage.setItem("appointmentData", JSON.stringify(fullAppointmentDetails));
      alert(data.message);
      window.location.href = "appointment.html";
    } else {
      alert(data.message || 'Failed to book appointment.');
    }
  } catch (error) {
    console.error('Error booking appointment:', error);
    alert('Network error or server issue. Please try again.');
  }
}
