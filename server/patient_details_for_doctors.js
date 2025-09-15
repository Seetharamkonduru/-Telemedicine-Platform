document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const authButtonsDiv = document.getElementById('auth-buttons');
    const mainNav = document.getElementById('main-nav');

    const patientNameHeader = document.getElementById('patient-name-header');
    const patientProfileDiv = document.getElementById('patientProfile');
    const medicalHistoryListDiv = document.getElementById('medicalHistoryList');
    const noMedicalHistoryMsg = document.getElementById('no-medical-history-msg');

    // Get patientId from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');

    // Redirect if not logged in as a doctor or no patientId
    if (!token || userRole !== 'doctor' || !patientId) {
        alert("Access Denied. Please log in as a doctor and select a patient.");
        window.location.href = 'login.html'; // Or doctor_dashboard.html
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
            window.location.href = 'login.html';
        });

        // Ensure doctor dashboard link is present
        const existingDashboardLink = mainNav.querySelector('a[href="doctor_dashboard.html"]');
        if (!existingDashboardLink) {
            const dashboardLink = document.createElement('a');
            dashboardLink.href = 'doctor_dashboard.html';
            dashboardLink.textContent = 'My Dashboard';
            mainNav.appendChild(dashboardLink);
        }
    }

    updateUI();

    async function fetchPatientDetails() {
        try {
            const response = await fetch(`http://localhost:5000/api/doctors/patient/${patientId}`, {
                method: 'GET',
                headers: {
                    'x-auth-token': token, // Doctor's token for authentication
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'Failed to fetch patient details');
            }

            const data = await response.json();
            const patient = data.patient;
            const medicalHistory = data.medicalHistory;

            // Display patient profile
            patientNameHeader.innerText = `Patient Details: ${patient.name}`;
            document.getElementById("profileName").innerText = patient.name || 'N/A';
            document.getElementById("profileEmail").innerText = patient.email || 'N/A';

            // Display medical history documents
            displayMedicalHistoryFiles(medicalHistory);

        } catch (error) {
            console.error('Error fetching patient details:', error);
            patientNameHeader.innerText = 'Error Loading Patient Details';
            patientProfileDiv.innerHTML = `<p style="color: red;">Error loading patient profile: ${error.message}</p>`;
            medicalHistoryListDiv.innerHTML = `<p style="color: red;">Error loading medical history: ${error.message}</p>`;
        }
    }

    function displayMedicalHistoryFiles(filesList) {
        medicalHistoryListDiv.innerHTML = ''; // Clear previous content
        if (filesList.length === 0) {
            noMedicalHistoryMsg.style.display = 'block';
            return;
        }
        noMedicalHistoryMsg.style.display = 'none';

        filesList.forEach(file => {
            const fileCard = document.createElement('div');
            fileCard.classList.add('medical-history-card'); // Reuse medical-history-card styling
            fileCard.innerHTML = `
                <h4>${file.fileName}</h4>
                <p><strong>Uploaded:</strong> ${new Date(file.uploadedAt).toLocaleDateString()}</p>
                <p><strong>Type:</strong> ${file.fileMimeType}</p>
                <a href="http://localhost:5000${file.filePath}" target="_blank" class="view-details-btn">View Document</a>
            `;
            medicalHistoryListDiv.appendChild(fileCard);
        });
    }

    fetchPatientDetails();
});
