// Pages
const homePage = document.getElementById('homepage');
const loginPage = document.getElementById('loginPage');

// Navigation Buttons
const goToLoginBtn = document.getElementById('goToLoginBtn');
const backToHomeBtn = document.getElementById('backToHomeBtn');

// Form Elements
const loginTabBtn = document.getElementById('loginTabBtn');
const registerTabBtn = document.getElementById('registerTabBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// ==========================================
// PAGE SWITCHER
// ==========================================

if (goToLoginBtn && homePage && loginPage) {
    goToLoginBtn.addEventListener('click', () => {
        homePage.classList.add('hidden-page');
        loginPage.classList.remove('hidden-page');
        window.scrollTo(0, 0);
    });
}

if (backToHomeBtn && homePage && loginPage) {
    backToHomeBtn.addEventListener('click', () => {
        loginPage.classList.add('hidden-page');
        homePage.classList.remove('hidden-page');
    });
}

// ==========================================
// FORM TAB SWITCHER
// ==========================================

if (loginTabBtn && registerTabBtn && loginForm && registerForm) {
    loginTabBtn.addEventListener('click', () => {
        loginTabBtn.classList.add('active');
        registerTabBtn.classList.remove('active');

        loginForm.classList.remove('hidden-form');
        registerForm.classList.add('hidden-form');
    });

    registerTabBtn.addEventListener('click', () => {
        registerTabBtn.classList.add('active');
        loginTabBtn.classList.remove('active');

        registerForm.classList.remove('hidden-form');
        loginForm.classList.add('hidden-form');
    });
}

// ==========================================
// FEEDBACK FORM
// ==========================================

const feedbackForm = document.querySelector('.feedback-form');

if (feedbackForm) {
    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameInput = feedbackForm.querySelector('input[type="text"]');
        const emailInput = feedbackForm.querySelector('input[type="email"]');
        const messageInput = feedbackForm.querySelector('textarea');

        const formData = {
            name: nameInput ? nameInput.value.trim() : '',
            email: emailInput ? emailInput.value.trim() : '',
            message: messageInput ? messageInput.value.trim() : ''
        };

        try {
            const response = await fetch('http://localhost:3000/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert('Thank you! Your feedback has been received.');
                feedbackForm.reset();
            } else {
                alert('Error: ' + result.error);
            }

        } catch (error) {
            console.error('Backend Connection Error:', error);
            alert('Backend server se connect nahi ho paya.');
        }
    });
}

// ==========================================
// REGISTER FORM
// ==========================================

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usernameInput = registerForm.querySelector('input[type="text"]');
        const emailInput = registerForm.querySelector('input[type="email"]');

        const passwordInput = document.getElementById('registerPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        const password = passwordInput ? passwordInput.value : '';
        const confirmPassword = confirmPasswordInput
            ? confirmPasswordInput.value
            : '';

        // Check passwords
        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        const userData = {
            name: usernameInput ? usernameInput.value.trim() : '',
            email: emailInput ? emailInput.value.trim() : '',
            password: password
        };

        try {
            const response = await fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (result.success) {
                alert('Account created successfully!');

                registerForm.reset();

                // Switch back to Login tab
                registerTabBtn.classList.remove('active');
                loginTabBtn.classList.add('active');

                registerForm.classList.add('hidden-form');
                loginForm.classList.remove('hidden-form');

            } else {
                alert('Registration failed: ' + result.error);
            }

        } catch (error) {
            console.error('Registration Error:', error);
            alert('Backend server se connect nahi ho paya.');
        }
    });
}

// ==========================================
// LOGIN FORM
// ==========================================

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');

        const loginData = {
            email: emailInput ? emailInput.value.trim() : '',
            password: passwordInput ? passwordInput.value : ''
        };

        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (result.success) {
                alert('Login successful!');

                loginForm.reset();

                // Login page se homepage par wapas jao
                loginPage.classList.add('hidden-page');
                homePage.classList.remove('hidden-page');

            } else {
                alert('Login failed: ' + result.error);
            }

        } catch (error) {
            console.error('Login Error:', error);
            alert('Backend server se connect nahi ho paya.');
        }
    });
}

// ==========================================
// PASSWORD SHOW / HIDE
// ==========================================

const passwordToggleButtons = document.querySelectorAll('.password-toggle');

passwordToggleButtons.forEach((button) => {

    button.addEventListener('click', () => {

        const targetId = button.dataset.target;
        const passwordInput = document.getElementById(targetId);

        if (!passwordInput) {
            return;
        }

        if (passwordInput.type === 'password') {

            passwordInput.type = 'text';
            button.textContent = '🙈';
            button.setAttribute('aria-label', 'Hide password');

        } else {

            passwordInput.type = 'password';
            button.textContent = '👁';
            button.setAttribute('aria-label', 'Show password');

        }
    });

});