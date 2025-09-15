document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');

    const backendBaseUrl = 'http://localhost:5000/api/users'; // Base URL for auth routes

    // Handle Login Form Submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const role = document.querySelector('input[name="login-role"]:checked').value;

        try {
            const response = await fetch(`${backendBaseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, role }), // Send role to backend
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userRole', data.role); // Store user role
                localStorage.setItem('userId', data.userId); // Store user ID
                localStorage.setItem('userName', data.userName); // Store user name (patient or doctor)
                localStorage.setItem('userEmail', email); // Store user email

                // Store doctor-specific profile data if applicable
                if (data.role === 'doctor') {
                    localStorage.setItem('userSpecialty', data.userSpecialty || 'N/A'); // Ensure 'N/A' if undefined
                    localStorage.setItem('userHospital', data.userHospital || 'N/A');   // Ensure 'N/A' if undefined
                } else {
                    localStorage.removeItem('userSpecialty'); // Clear if not a doctor
                    localStorage.removeItem('userHospital');
                }

                loginMessage.textContent = data.message;
                loginMessage.style.color = 'green';

                // Redirect based on role
                if (data.role === 'doctor') {
                    window.location.href = 'doctor_dashboard.html';
                } else {
                    window.location.href = 'patient_dashboard.html'; // Redirect patients to their dashboard
                }
            } else {
                loginMessage.textContent = data.message || 'Login failed';
                loginMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('Error during login:', error);
            loginMessage.textContent = 'Network error. Please try again.';
            loginMessage.style.color = 'red';
        }
    });
});
