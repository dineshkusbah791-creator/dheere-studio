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

// Page Switcher
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

// Form Tab Switcher
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

// Feedback Form Handling (Simple Alert Mode)
const feedbackForm = document.querySelector('.feedback-form');

if (feedbackForm) {
    feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you! Your feedback has been received.');
        feedbackForm.reset();
    });
}
