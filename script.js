// ======================================================
// PAGES
// ======================================================

const homePage = document.getElementById('homepage');
const loginPage = document.getElementById('loginPage');


// ======================================================
// NAVIGATION BUTTONS
// ======================================================

const goToLoginBtn = document.getElementById('goToLoginBtn');
const backToHomeBtn = document.getElementById('backToHomeBtn');


// ======================================================
// AUTH FORMS
// ======================================================

const loginTabBtn = document.getElementById('loginTabBtn');
const registerTabBtn = document.getElementById('registerTabBtn');

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');


// ======================================================
// PROFILE NAVIGATION
// ======================================================

const profileBtn = document.getElementById('profileBtn');
const navUsername = document.getElementById('navUsername');


// ======================================================
// LOGIN STATE
// ======================================================

let currentUser = null;


// Restore saved login
try {

    const savedUser =
        localStorage.getItem('dheereStudioUser');

    if (savedUser) {

        currentUser = JSON.parse(savedUser);

    }

} catch (error) {

    console.error(
        'Saved user data error:',
        error
    );

    localStorage.removeItem(
        'dheereStudioUser'
    );

}


// ======================================================
// USER HELPERS
// ======================================================

function getUserName(user) {

    return (
        user?.name ||
        user?.username ||
        user?.user?.name ||
        user?.user?.username ||
        'User'
    );

}


function getUserEmail(user) {

    return (
        user?.email ||
        user?.user?.email ||
        'Not available'
    );

}


// ======================================================
// UPDATE NAVBAR
// ======================================================

function updateNavbar() {

    const navLogin =
        document.querySelector('.nav-login');

    if (!navLogin) {
        return;
    }


    if (currentUser) {

        // Logged in
        navLogin.innerHTML = `
            <a
                id="profileBtn"
                class="button"
                href="profile.html"
            >
                ${escapeHTML(getUserName(currentUser))}
            </a>
        `;

    } else {

        // Logged out
        navLogin.innerHTML = `
            <button
                id="goToLoginBtn"
                class="button"
                type="button"
            >
                Login
            </button>
        `;


        const newLoginBtn =
            document.getElementById('goToLoginBtn');


        if (newLoginBtn) {

            newLoginBtn.addEventListener(
                'click',
                openLoginPage
            );

        }

    }

}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHTML(value) {

    const div =
        document.createElement('div');

    div.textContent =
        String(value ?? '');

    return div.innerHTML;

}


// ======================================================
// OPEN LOGIN PAGE
// ======================================================

function openLoginPage() {

    if (!homePage || !loginPage) {
        return;
    }

    homePage.classList.add(
        'hidden-page'
    );

    loginPage.classList.remove(
        'hidden-page'
    );

    window.scrollTo(0, 0);

}


// ======================================================
// BACK TO HOME
// ======================================================

function backToHome() {

    if (!homePage || !loginPage) {
        return;
    }

    loginPage.classList.add(
        'hidden-page'
    );

    homePage.classList.remove(
        'hidden-page'
    );

    window.scrollTo(0, 0);

}


// ======================================================
// INITIAL NAVIGATION
// ======================================================

if (goToLoginBtn) {

    goToLoginBtn.addEventListener(
        'click',
        openLoginPage
    );

}


if (backToHomeBtn) {

    backToHomeBtn.addEventListener(
        'click',
        backToHome
    );

}


// ======================================================
// LOGIN / REGISTER TABS
// ======================================================

if (
    loginTabBtn &&
    registerTabBtn &&
    loginForm &&
    registerForm
) {

    loginTabBtn.addEventListener(
        'click',
        () => {

            loginTabBtn.classList.add(
                'active'
            );

            registerTabBtn.classList.remove(
                'active'
            );


            loginForm.classList.remove(
                'hidden-form'
            );

            registerForm.classList.add(
                'hidden-form'
            );

        }
    );


    registerTabBtn.addEventListener(
        'click',
        () => {

            registerTabBtn.classList.add(
                'active'
            );

            loginTabBtn.classList.remove(
                'active'
            );


            registerForm.classList.remove(
                'hidden-form'
            );

            loginForm.classList.add(
                'hidden-form'
            );

        }
    );

}


// ======================================================
// FEEDBACK FORM
// ======================================================

const feedbackForm =
    document.querySelector(
        '.feedback-form'
    );


if (feedbackForm) {

    feedbackForm.addEventListener(
        'submit',
        async (e) => {

            e.preventDefault();


            const nameInput =
                feedbackForm.querySelector(
                    'input[type="text"]'
                );


            const emailInput =
                feedbackForm.querySelector(
                    'input[type="email"]'
                );


            const messageInput =
                feedbackForm.querySelector(
                    'textarea'
                );


            const formData = {

                name: nameInput
                    ? nameInput.value.trim()
                    : '',

                email: emailInput
                    ? emailInput.value.trim()
                    : '',

                message: messageInput
                    ? messageInput.value.trim()
                    : ''

            };


            try {

                const response =
                    await fetch(
                        'https://dheere-studio.onrender.com/feedback',
                        {
                            method: 'POST',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body:
                                JSON.stringify(
                                    formData
                                )
                        }
                    );


                const result =
                    await response.json();


                if (result.success) {

                    alert(
                        'Thank you! Your feedback has been received.'
                    );

                    feedbackForm.reset();

                } else {

                    alert(
                        result.error ||
                        'Unable to submit feedback.'
                    );

                }

            } catch (error) {

                console.error(
                    'Backend Connection Error:',
                    error
                );

                alert(
                    'Backend server se connect nahi ho paya.'
                );

            }

        }
    );

}


// ======================================================
// REGISTER
// ======================================================

if (registerForm) {

    registerForm.addEventListener(
        'submit',
        async (e) => {

            e.preventDefault();


            const usernameInput =
                document.getElementById(
                    'registerName'
                );


            const emailInput =
                document.getElementById(
                    'registerEmail'
                );


            const passwordInput =
                document.getElementById(
                    'registerPassword'
                );


            const confirmPasswordInput =
                document.getElementById(
                    'confirmPassword'
                );


            const name =
                usernameInput
                    ? usernameInput.value.trim()
                    : '';


            const email =
                emailInput
                    ? emailInput.value.trim()
                    : '';


            const password =
                passwordInput
                    ? passwordInput.value
                    : '';


            const confirmPassword =
                confirmPasswordInput
                    ? confirmPasswordInput.value
                    : '';


            // Required fields
            if (!name || !email || !password) {

                alert(
                    'Please fill in all required fields.'
                );

                return;

            }


            // Password confirmation
            if (
                password !==
                confirmPassword
            ) {

                alert(
                    'Passwords do not match.'
                );

                return;

            }


            const userData = {

                name,
                email,
                password

            };


            try {

                const response =
                    await fetch(
                        'https://dheere-studio.onrender.com/register',
                        {
                            method: 'POST',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body:
                                JSON.stringify(
                                    userData
                                )
                        }
                    );


                const result =
                    await response.json();


                if (result.success) {

                    alert(
                        'Account created successfully! Please login.'
                    );


                    registerForm.reset();


                    // Switch to Login tab

                    registerTabBtn.classList.remove(
                        'active'
                    );

                    loginTabBtn.classList.add(
                        'active'
                    );


                    registerForm.classList.add(
                        'hidden-form'
                    );

                    loginForm.classList.remove(
                        'hidden-form'
                    );


                    // Put registered email
                    // into login field

                    const loginEmail =
                        document.getElementById(
                            'loginEmail'
                        );


                    if (loginEmail) {

                        loginEmail.value =
                            email;

                    }

                } else {

                    alert(
                        result.error ||
                        'Registration failed.'
                    );

                }

            } catch (error) {

                console.error(
                    'Registration Error:',
                    error
                );

                alert(
                    'Backend server se connect nahi ho paya.'
                );

            }

        }
    );

}


// ======================================================
// LOGIN
// ======================================================

if (loginForm) {

    loginForm.addEventListener(
        'submit',
        async (e) => {

            e.preventDefault();


            const emailInput =
                document.getElementById(
                    'loginEmail'
                );


            const passwordInput =
                document.getElementById(
                    'loginPassword'
                );


            const email =
                emailInput
                    ? emailInput.value.trim()
                    : '';


            const password =
                passwordInput
                    ? passwordInput.value
                    : '';


            if (!email || !password) {

                alert(
                    'Email and password are required.'
                );

                return;

            }


            const loginData = {

                email,
                password

            };


            try {

                const response =
                    await fetch(
                        'https://dheere-studio.onrender.com/login',
                        {
                            method: 'POST',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body:
                                JSON.stringify(
                                    loginData
                                )
                        }
                    );


                const result =
                    await response.json();


                // ==========================================
                // LOGIN SUCCESS
                // ==========================================

                if (result.success) {

                    currentUser =
                        result.user;


                    // Save login state

                    localStorage.setItem(
                        'dheereStudioUser',
                        JSON.stringify(
                            currentUser
                        )
                    );


                    loginForm.reset();


                    alert(
                        'Login successful!'
                    );


                    // Return to homepage

                    loginPage.classList.add(
                        'hidden-page'
                    );

                    homePage.classList.remove(
                        'hidden-page'
                    );


                    // Change Login → Username

                    updateNavbar();


                    window.scrollTo(
                        0,
                        0
                    );


                } else {

                    // ==========================================
                    // LOGIN FAILED
                    // ==========================================

                    alert(
                        result.error ||
                        'Login failed. Please try again.'
                    );

                }

            } catch (error) {

                console.error(
                    'Login Error:',
                    error
                );

                alert(
                    'Backend server se connect nahi ho paya. Please try again.'
                );

            }

        }
    );

}


// ======================================================
// PASSWORD SHOW / HIDE
// ======================================================

const passwordToggleButtons =
    document.querySelectorAll(
        '.password-toggle'
    );


passwordToggleButtons.forEach(
    (button) => {

        button.addEventListener(
            'click',
            () => {

                const targetId =
                    button.dataset.target;


                const passwordInput =
                    document.getElementById(
                        targetId
                    );


                if (!passwordInput) {
                    return;
                }


                if (
                    passwordInput.type ===
                    'password'
                ) {

                    passwordInput.type =
                        'text';


                    button.textContent =
                        '🙈';


                    button.setAttribute(
                        'aria-label',
                        'Hide password'
                    );


                } else {

                    passwordInput.type =
                        'password';


                    button.textContent =
                        '👁';


                    button.setAttribute(
                        'aria-label',
                        'Show password'
                    );

                }

            }
        );

    }
);


// ======================================================
// INITIALIZE AUTH UI
// ======================================================

updateNavbar();