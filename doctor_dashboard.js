document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId'); // Doctor's own MongoDB _id
    const userName = localStorage.getItem('userName'); // Doctor's name
    const userEmail = localStorage.getItem('userEmail'); // Doctor's email
    const userSpecialty = localStorage.getItem('userSpecialty'); // Correctly retrieve from localStorage
    const userHospital = localStorage.getItem('userHospital'); // Correctly retrieve from localStorage

    const authButtonsDiv = document.getElementById('auth-buttons');
    const mainNav = document.getElementById('main-nav');

    const doctorWelcomeHeader = document.getElementById('doctor-welcome');
    const doctorProfileDiv = document.getElementById('doctorProfile');
    const upcomingAppointmentsDiv = document.getElementById('upcomingAppointments');
    const pastAppointmentsDiv = document.getElementById('pastAppointments');

    const noUpcomingAppointmentsMsg = document.getElementById('no-upcoming-appointments-msg');
    const noPastAppointmentsMsg = document.getElementById('no-past-appointments-msg');

    // Redirect if not logged in or not a doctor
    if (!token || userRole !== 'doctor' || !userId) {
        alert("Access Denied. Please log in as a doctor.");
        window.location.href = 'login.html';
        return;
    }

    // Function to update navbar and auth buttons
    function updateUI() {
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
            alert('You have been logged out.');
            window.location.href = 'login.html'; // Redirect to login page
        });

        // Ensure doctor dashboard link is present
        const existingDashboardLink = mainNav.querySelector('a[href="doctor_dashboard.html"]');
        if (!existingDashboardLink) {
            const dashboardLink = document.createElement('a');
            dashboardLink.href = 'doctor_dashboard.html';
            dashboardLink.textContent = 'My Dashboard';
            mainNav.appendChild(dashboardLink);
        }
        // Remove "Book Appointments" if it somehow exists for a doctor
        const bookAppointmentsLink = mainNav.querySelector('a[href="Bookapp.html"]');
        if (bookAppointmentsLink) {
            bookAppointmentsLink.remove();
        }
    }

    updateUI();

    async function fetchDoctorData() {
        try {
            // Display doctor's own profile details using localStorage data
            doctorWelcomeHeader.innerText = `Welcome, Dr. ${userName || ''}!`;
            document.getElementById("profileName").innerText = userName || 'N/A';
            document.getElementById("profileEmail").innerText = userEmail || 'N/A';
            document.getElementById("profileSpecialty").innerText = userSpecialty || 'N/A'; // Now correctly populated
            document.getElementById("profileHospital").innerText = userHospital || 'N/A';   // Now correctly populated

            // Fetch doctor's appointments
            await fetchDoctorAppointments();

        } catch (error) {
            console.error('Error fetching doctor data:', error);
            doctorProfileDiv.innerHTML = `<p style="color: red;">Error loading profile: ${error.message}</p>`;
            upcomingAppointmentsDiv.innerHTML = `<p style="color: red;">Error loading appointments: ${error.message}</p>`;
            pastAppointmentsDiv.innerHTML = '';
        }
    }

    async function fetchDoctorAppointments() {
        try {
            const appointmentsResponse = await fetch(`http://localhost:5000/api/appointments/doctor/${userId}`, {
                method: 'GET',
                headers: {
                    'x-auth-token': token,
                },
            });

            if (!appointmentsResponse.ok) {
                const errorData = await appointmentsResponse.json();
                throw new Error(errorData.message || 'Failed to fetch doctor appointments');
            }

            const appointments = await appointmentsResponse.json();
            sortAndDisplayDoctorAppointments(appointments);

        } catch (error) {
            console.error('Error fetching doctor appointments:', error);
            upcomingAppointmentsDiv.innerHTML = `<p style="color: red;">Error loading appointments: ${error.message}</p>`;
            pastAppointmentsDiv.innerHTML = '';
        }
    }

    function sortAndDisplayDoctorAppointments(appointments) {
        const now = new Date();
        const upcoming = [];
        const past = [];

        appointments.forEach(appt => {
            const apptDateTime = new Date(`${appt.date} ${appt.time}`);
            if (apptDateTime >= now) {
                upcoming.push(appt);
            } else {
                past.push(appt);
            }
        });

        upcoming.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
        past.sort((a, b) => new Date(`${b.date} ${b.time}`) - new Date(`${a.date} ${b.time}`));

        displayAppointmentList(upcoming, upcomingAppointmentsDiv, noUpcomingAppointmentsMsg, 'Upcoming');
        displayAppointmentList(past, pastAppointmentsDiv, noPastAppointmentsMsg, 'Past');
    }

    function displayAppointmentList(appointmentsList, containerDiv, noAppointmentsMessageDiv, type) {
        containerDiv.innerHTML = ''; // Clear previous content

        if (appointmentsList.length === 0) {
            noAppointmentsMessageDiv.style.display = 'block';
            return;
        }
        noAppointmentsMessageDiv.style.display = 'none';

        appointmentsList.forEach(appt => {
            const appointmentCard = document.createElement('div');
            appointmentCard.classList.add('appointment-card');

            const patientName = appt.patient ? (appt.patient.patientProfile ? appt.patient.patientProfile.name : appt.patient.email) : 'N/A';

            appointmentCard.innerHTML = `
                <h4>${type} Appointment</h4>
                <p><strong>Patient:</strong> ${patientName}</p>
                <p><strong>Date:</strong> ${appt.date}</p>
                <p><strong>Time:</strong> ${appt.time}</p>
                <p><strong>Status:</strong> <span class="status ${appt.status}">${appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}</span></p>
                <p><strong>Booked At:</strong> ${new Date(appt.createdAt).toLocaleString()}</p>
                `;
            containerDiv.appendChild(appointmentCard);
        });
    }

    fetchDoctorData();
});
