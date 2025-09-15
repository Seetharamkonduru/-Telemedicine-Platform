document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const registerMessage = document.getElementById('registerMessage');
    const doctorFields = document.getElementById('doctor-fields');
    const patientFields = document.getElementById('patient-fields');
    const registerRoleRadios = document.querySelectorAll('input[name="register-role"]');

    const backendBaseUrl = 'http://localhost:5000/api/users'; // Base URL for auth routes

    // Toggle doctor/patient specific fields based on role selection during registration
    registerRoleRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (document.getElementById('register-doctor-role').checked) {
                doctorFields.style.display = 'block';
                patientFields.style.display = 'none'; // Hide patient fields

                // Make doctor-specific fields required
                document.getElementById('doctor-name').setAttribute('required', 'required');
                document.getElementById('doctor-specialty').setAttribute('required', 'required');
                document.getElementById('doctor-hospital').setAttribute('required', 'required');
                document.getElementById('doctor-price').setAttribute('required', 'required'); // NEW: Make price required

                // Remove required from patient fields
                document.getElementById('patient-name').removeAttribute('required');
            } else { // Patient role selected
                doctorFields.style.display = 'none';
                patientFields.style.display = 'block'; // Show patient fields

                // Remove required from doctor fields
                document.getElementById('doctor-name').removeAttribute('required');
                document.getElementById('doctor-specialty').removeAttribute('required');
                document.getElementById('doctor-hospital').removeAttribute('required');
                document.getElementById('doctor-price').removeAttribute('required'); // NEW: Remove required from price

                // Make patient-specific fields required
                document.getElementById('patient-name').setAttribute('required', 'required');
            }
        });
    });

    // Handle Register Form Submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const role = document.querySelector('input[name="register-role"]:checked').value;

        if (password !== confirmPassword) {
            registerMessage.textContent = 'Passwords do not match!';
            registerMessage.style.color = 'red';
            return;
        }

        let endpoint = '';
        let requestBody = { email, password };

        if (role === 'patient') {
            endpoint = `${backendBaseUrl}/register/patient`;
            requestBody = {
                ...requestBody,
                name: document.getElementById('patient-name').value, // Capture patient name
            };
        } else if (role === 'doctor') {
            endpoint = `${backendBaseUrl}/register/doctor`;
            requestBody = {
                ...requestBody,
                name: document.getElementById('doctor-name').value,
                specialty: document.getElementById('doctor-specialty').value,
                hospital: document.getElementById('doctor-hospital').value,
                price: parseFloat(document.getElementById('doctor-price').value), // NEW: Capture and parse price
            };
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userRole', data.role);
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('userName', data.userName);
                localStorage.setItem('userEmail', email);
                if (data.role === 'doctor') {
                    localStorage.setItem('userSpecialty', data.userSpecialty || 'N/A');
                    localStorage.setItem('userHospital', data.userHospital || 'N/A');
                    localStorage.setItem('userPrice', data.userPrice || '0'); // NEW: Store price
                } else {
                    localStorage.removeItem('userSpecialty');
                    localStorage.removeItem('userHospital');
                    localStorage.removeItem('userPrice'); // NEW: Clear price if not doctor
                }

                registerMessage.textContent = data.message;
                registerMessage.style.color = 'green';
                alert(data.message + ". Redirecting to login page...");
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } else {
                registerMessage.textContent = data.message || 'Registration failed';
                registerMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('Error during registration:', error);
            registerMessage.textContent = 'Network error. Please try again.';
            registerMessage.style.color = 'red';
        }
    });
});
