document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const authButtonsDiv = document.getElementById('auth-buttons');
    const mainNav = document.getElementById('main-nav');
    const doctorListElement = document.getElementById("doctorList");

    // Function to update navbar and auth buttons based on login status and role
    function updateUI() {
        // Clear existing dynamic links first to prevent duplicates
        const existingPatientDashboardLink = mainNav.querySelector('a[href="patient_dashboard.html"]');
        if (existingPatientDashboardLink) existingPatientDashboardLink.remove();
        const existingDoctorDashboardLink = mainNav.querySelector('a[href="doctor_dashboard.html"]');
        if (existingDoctorDashboardLink) existingDoctorDashboardLink.remove();
        const existingBookAppointmentsLink = mainNav.querySelector('a[href="FDoctors.html"]'); // Check if it's the 'Book Appointments' link
        if (existingBookAppointmentsLink && existingBookAppointmentsLink.textContent === 'Book Appointments') {
             existingBookAppointmentsLink.remove(); // Remove if it's the generic one
        }


        if (!token || !userRole) {
            // Not logged in
            authButtonsDiv.innerHTML = `
                <a href="login.html" class="sign-in-button">
                    <button class="sign-in">Sign In</button>
                </a>
                <a href="register.html" class="register-button">
                    <button class="register">Register</button>
                </a>
            `;
            // Add "Book Appointments" link if not logged in
            const bookAppointmentsLink = document.createElement('a');
            bookAppointmentsLink.href = 'FDoctors.html';
            bookAppointmentsLink.textContent = 'Book Appointments';
            // Insert it after "Find Doctors"
            const findDoctorsLink = mainNav.querySelector('a[href="FDoctors.html"]');
            if (findDoctorsLink) {
                mainNav.insertBefore(bookAppointmentsLink, findDoctorsLink.nextSibling);
            } else {
                mainNav.appendChild(bookAppointmentsLink);
            }

        } else {
            // Logged in
            authButtonsDiv.innerHTML = `
                <button class="logout-btn">Logout</button>
            `;
            document.querySelector('.logout-btn').addEventListener('click', () => {
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                localStorage.removeItem('userId');
                localStorage.removeItem('userName');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userSpecialty'); // Clear doctor specific items
                localStorage.removeItem('userHospital');
                localStorage.removeItem('userPrice'); // NEW: Clear userPrice
                alert('You have been logged out.');
                window.location.href = 'login.html'; // Redirect to login page
            });

            // Adjust navigation based on role
            if (userRole === 'patient') {
                const patientDashboardLink = document.createElement('a');
                patientDashboardLink.href = 'patient_dashboard.html';
                patientDashboardLink.textContent = 'My Dashboard';
                // Insert after "Find Doctors" or "Book Appointments"
                const findDoctorsLink = mainNav.querySelector('a[href="FDoctors.html"]');
                if (findDoctorsLink) {
                    mainNav.insertBefore(patientDashboardLink, findDoctorsLink.nextSibling);
                } else {
                    mainNav.appendChild(patientDashboardLink);
                }

            } else if (userRole === 'doctor') {
                const doctorDashboardLink = document.createElement('a');
                doctorDashboardLink.href = 'doctor_dashboard.html';
                doctorDashboardLink.textContent = 'My Dashboard';
                // Insert after "Find Doctors"
                const findDoctorsLink = mainNav.querySelector('a[href="FDoctors.html"]');
                if (findDoctorsLink) {
                    mainNav.insertBefore(doctorDashboardLink, findDoctorsLink.nextSibling);
                } else {
                    mainNav.appendChild(doctorDashboardLink);
                }
            }
        }
    }

    updateUI(); // Initial UI update

    let doctors = []; // Will store doctors fetched from backend

    // Function to fetch doctors from the backend
    async function fetchDoctors() {
        try {
            const response = await fetch('http://localhost:5000/api/appointments/doctors'); // Using the new doctors endpoint
            if (!response.ok) {
                throw new Error('Failed to fetch doctors');
            }
            const data = await response.json();
            doctors = data; // Store fetched doctors
            displayDoctors(doctors); // Display all fetched doctors initially
        } catch (error) {
            console.error('Error fetching doctors:', error);
            doctorListElement.innerHTML = '<p>Error loading doctors. Please try again later.</p>';
        }
    }

    // Function to display doctors
    function displayDoctors(filteredDoctors) {
        doctorListElement.innerHTML = "";  // Clear existing doctor list
        if (filteredDoctors.length === 0) {
            doctorListElement.innerHTML = '<p>No doctors found matching your search.</p>';
            return;
        }
        filteredDoctors.forEach(doctor => {
            const doctorDiv = document.createElement("div");
            doctorDiv.classList.add("doctor");

            doctorDiv.innerHTML = `
                <h3>${doctor.name}</h3>
                <p>${doctor.specialty}</p>
                <p>⭐ ${doctor.rating} (${doctor.reviews} reviews)</p>
                <p>${doctor.hospital}</p>
                <p>₹ ${doctor.price}/hour</p>
                <a class="book-button" href="Bookapp.html?doctorId=${doctor._id}&doctorName=${encodeURIComponent(doctor.name)}&doctorSpecialty=${encodeURIComponent(doctor.specialty)}&doctorHospital=${encodeURIComponent(doctor.hospital)}&doctorPrice=${doctor.price}">Book Now</a>
            `; // NEW: Pass doctorPrice
            doctorListElement.appendChild(doctorDiv);
        });
    }

    // Function to handle search functionality
    window.searchDoctors = function () {
        const query = document.getElementById("searchInput").value.toLowerCase();
        const filteredDoctors = doctors.filter(doctor =>
            doctor.name.toLowerCase().includes(query) ||
            doctor.specialty.toLowerCase().includes(query) ||
            doctor.hospital.toLowerCase().includes(query)
        );
        displayDoctors(filteredDoctors);  // Display filtered doctors
    };

    // Function for starting a video consultation
    window.startVideoConsultation = function () {
        alert("Starting video consultation...");
    };

    // Initial fetch of doctors when the page loads
    fetchDoctors();

    // Optional: Enter key triggers search
    document.getElementById("searchInput").addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            searchDoctors();
        }
    });
});
