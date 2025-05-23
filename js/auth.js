document.addEventListener('DOMContentLoaded', function () {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const signupError = document.getElementById('signup-error');
    const signupSuccess = document.getElementById('signup-success');
    const loginError = document.getElementById('login-error');
    const loginSuccess = document.getElementById('login-success');

    const BASE_URL = 'http://34.44.154.88:3001';

    // Signup Form Submission
    if (signupForm) {
        signupForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const username = document.getElementById('signup-username').value;
            const password = document.getElementById('signup-password').value;

            try {
                const response = await fetch(`${BASE_URL}/api/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });
                const data = await response.json();
                if (response.ok) {
                    signupSuccess.textContent = 'Signup successful! Redirecting to login...';
                    signupSuccess.classList.remove('hidden');
                    signupError.classList.add('hidden');
                    setTimeout(() => window.location.href = '/login.html', 2000);
                } else {
                    throw new Error(data.error || 'Signup failed');
                }
            } catch (err) {
                signupError.textContent = err.message;
                signupError.classList.remove('hidden');
                signupSuccess.classList.add('hidden');
            }
        });
    }

    // Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch(`${BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });
                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    loginSuccess.textContent = 'Login successful! Redirecting to dashboard...';
                    loginSuccess.classList.remove('hidden');
                    loginError.classList.add('hidden');
                    setTimeout(() => window.location.href = '/index.html', 2000);
                } else {
                    throw new Error(data.error || 'Login failed');
                }
            } catch (err) {
                loginError.textContent = err.message;
                loginError.classList.remove('hidden');
                loginSuccess.classList.add('hidden');
            }
        });
    }
});
