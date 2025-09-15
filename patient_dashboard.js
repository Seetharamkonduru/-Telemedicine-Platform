document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId'); // Patient's own MongoDB _id
    const userName = localStorage.getItem('userName'); // Patient's name
    const authButtonsDiv = document.getElementById('auth-buttons');
    const mainNav = document.getElementById('main-nav');

    const patientWelcomeHeader = document.getElementById('patient-welcome');
    const patientProfileDiv = document.getElementById('patientProfile');
    const upcomingAppointmentsDiv = document.getElementById('upcomingAppointments');
    const pastAppointmentsDiv = document.getElementById('pastAppointments');
    const medicalHistoryListDiv = document.getElementById('medicalHistoryList');

    const noUpcomingAppointmentsMsg = document.getElementById('no-upcoming-appointments-msg');
    const noPastAppointmentsMsg = document.getElementById('no-past-appointments-msg');
    const noMedicalHistoryMsg = document.getElementById('no-medical-history-msg');

    const medicalFile = document.getElementById('medicalFile');
    const uploadMedicalFileBtn = document.getElementById('uploadMedicalFileBtn');
    const uploadMessage = document.getElementById('uploadMessage');


    // Redirect if not logged in or not a patient
    if (!token || userRole !== 'patient' || !userId) {
        alert("Access Denied. Please log in as a patient.");
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

        // Ensure patient dashboard link is present
        const existingDashboardLink = mainNav.querySelector('a[href="patient_dashboard.html"]');
        if (!existingDashboardLink) {
            const dashboardLink = document.createElement('a');
            dashboardLink.href = 'patient_dashboard.html';
            dashboardLink.textContent = 'My Dashboard';
            mainNav.appendChild(dashboardLink);
        }
        // Ensure "Book Appointments" link is present for patients
        const existingBookAppointmentsLink = mainNav.querySelector('a[href="FDoctors.html"]');
        if (!existingBookAppointmentsLink) {
            const bookAppointmentsLink = document.createElement('a');
            bookAppointmentsLink.href = 'FDoctors.html';
            bookAppointmentsLink.textContent = 'Book Appointments';
            mainNav.appendChild(bookAppointmentsLink);
        }
    }

    updateUI(); // Initial UI update

    // Fetch patient's profile, appointments, and medical history
    async function fetchPatientData() {
        try {
            // 1. Display patient's own profile details (from localStorage for simplicity, or fetch from backend /api/users/:id)
            patientWelcomeHeader.innerText = `Welcome, ${userName || 'Patient'}!`;
            document.getElementById("profileName").innerText = userName || 'N/A';
            document.getElementById("profileEmail").innerText = localStorage.getItem('userEmail') || 'N/A'; // Assuming userEmail is stored

            // 2. Fetch patient's appointments
            const appointmentsResponse = await fetch(`http://localhost:5000/api/appointments/patient/${userId}`, {
                method: 'GET',
                headers: {
                    'x-auth-token': token, // Send token for authentication
                },
            });

            if (!appointmentsResponse.ok) {
                const errorData = await appointmentsResponse.json();
                throw new Error(errorData.message || 'Failed to fetch appointments');
            }

            const appointments = await appointmentsResponse.json();
            sortAndDisplayAppointments(appointments);

            // 3. Fetch patient's medical history files
            await fetchMedicalHistoryFiles();

        } catch (error) {
            console.error('Error fetching patient data:', error);
            patientProfileDiv.innerHTML = `<p style="color: red;">Error loading profile: ${error.message}</p>`;
            upcomingAppointmentsDiv.innerHTML = `<p style="color: red;">Error loading appointments: ${error.message}</p>`;
            pastAppointmentsDiv.innerHTML = '';
            medicalHistoryListDiv.innerHTML = `<p style="color: red;">Error loading medical history: ${error.message}</p>`;
        }
    }

    // Sorts appointments into upcoming and past, then displays them
    function sortAndDisplayAppointments(appointments) {
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

        // Sort upcoming by date/time ascending
        upcoming.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
        // Sort past by date/time descending
        past.sort((a, b) => new Date(`${b.date} ${b.time}`) - new Date(`${a.date} ${a.time}`));

        displayAppointmentList(upcoming, upcomingAppointmentsDiv, noUpcomingAppointmentsMsg, 'Upcoming');
        displayAppointmentList(past, pastAppointmentsDiv, noPastAppointmentsMsg, 'Past');
    }

    // Displays a list of appointments in a given container
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

            const doctorName = appt.doctor ? (appt.doctor.doctorProfile ? appt.doctor.doctorProfile.name : appt.doctor.email) : 'N/A'; // Use doctor's name from profile or email

            appointmentCard.innerHTML = `
                <h4>${type} Appointment</h4>
                <p><strong>Doctor:</strong> ${doctorName}</p>
                <p><strong>Date:</strong> ${appt.date}</p>
                <p><strong>Time:</strong> ${appt.time}</p>
                <p><strong>Status:</strong> <span class="status ${appt.status}">${appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}</span></p>
                <p><strong>Booked At:</strong> ${new Date(appt.createdAt).toLocaleString()}</p>
                `;
            containerDiv.appendChild(appointmentCard);
        });
    }

    // Function to fetch and display medical history files
    async function fetchMedicalHistoryFiles() {
        try {
            const response = await fetch(`http://localhost:5000/api/patients/medicalHistoryFiles`, {
                method: 'GET',
                headers: {
                    'x-auth-token': token,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'Failed to fetch medical history files');
            }

            const files = await response.json();
            displayMedicalHistoryFiles(files);

        } catch (error) {
            console.error('Error fetching medical history files:', error);
            medicalHistoryListDiv.innerHTML = `<p style="color: red;">Error loading medical history: ${error.message}</p>`;
        }
    }

    // Displays medical history files
    function displayMedicalHistoryFiles(filesList) {
        medicalHistoryListDiv.innerHTML = ''; // Clear previous content
        if (filesList.length === 0) {
            noMedicalHistoryMsg.style.display = 'block';
            return;
        }
        noMedicalHistoryMsg.style.display = 'none';

        filesList.forEach(file => {
            const fileCard = document.createElement('div');
            fileCard.classList.add('medical-history-card');
            fileCard.innerHTML = `
                <h4>${file.fileName}</h4>
                <p><strong>Uploaded:</strong> ${new Date(file.uploadedAt).toLocaleDateString()}</p>
                <p><strong>Type:</strong> ${file.fileMimeType}</p>
                <a href="http://localhost:5000${file.filePath}" target="_blank" class="view-details-btn">View Document</a>
            `;
            medicalHistoryListDiv.appendChild(fileCard);
        });
    }

    // Event listener for file upload button
    uploadMedicalFileBtn.addEventListener('click', async () => {
        const file = medicalFile.files[0];
        if (!file) {
            uploadMessage.textContent = 'Please select a file to upload.';
            uploadMessage.style.color = 'red';
            return;
        }

        const formData = new FormData();
        formData.append('medicalHistoryFile', file); // 'medicalHistoryFile' must match the name in multer config

        uploadMessage.textContent = 'Uploading...';
        uploadMessage.style.color = 'blue';

        try {
            const response = await fetch('http://localhost:5000/api/patients/uploadMedicalHistory', {
                method: 'POST',
                headers: {
                    'x-auth-token': token, // Send the JWT token
                },
                body: formData, // FormData handles Content-Type automatically
            });

            const data = await response.json();

            if (response.ok) {
                uploadMessage.textContent = data.msg;
                uploadMessage.style.color = 'green';
                medicalFile.value = ''; // Clear the file input
                // Re-fetch and display files to show the newly uploaded one
                await fetchMedicalHistoryFiles();
            } else {
                uploadMessage.textContent = data.msg || 'File upload failed.';
                uploadMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            uploadMessage.textContent = 'Network error during upload. Please try again.';
            uploadMessage.style.color = 'red';
        }
    });

    // Initial fetch and display of patient data and appointments
    fetchPatientData();
});
