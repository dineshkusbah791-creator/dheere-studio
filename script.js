// ======================================================
// CONFIG
// ======================================================

const API_BASE_URL =
    'https://dheere-studio.onrender.com';


// ======================================================
// PAGES
// ======================================================

const homePage =
    document.getElementById('homepage');

const loginPage =
    document.getElementById('loginPage');


// ======================================================
// NAVIGATION BUTTONS
// ======================================================

const goToLoginBtn =
    document.getElementById('goToLoginBtn');

const backToHomeBtn =
    document.getElementById('backToHomeBtn');


// ======================================================
// AUTH FORMS
// ======================================================

const loginTabBtn =
    document.getElementById('loginTabBtn');

const registerTabBtn =
    document.getElementById('registerTabBtn');

const loginForm =
    document.getElementById('loginForm');

const registerForm =
    document.getElementById('registerForm');


// ======================================================
// PROFILE NAVIGATION
// ======================================================

let profileBtn =
    document.getElementById('profileBtn');

let navUsername =
    document.getElementById('navUsername');


// ======================================================
// LOGIN STATE
// ======================================================

let currentUser = null;


// Restore saved login
try {

    const savedUser =
        localStorage.getItem(
            'dheereStudioUser'
        );

    if (savedUser) {

        currentUser =
            JSON.parse(savedUser);

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

function getUserId(user) {

    return (
        user?.id ||
        user?._id ||
        user?.user?.id ||
        user?.user?._id ||
        ''
    );

}


function getUserName(user) {

    return (
        user?.name ||
        user?.username ||
        user?.user?.name ||
        user?.user?.username ||
        'User'
    );

}


function getUserUsername(user) {

    return (
        user?.username ||
        user?.user?.username ||
        ''
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

    window.scrollTo(
        0,
        0
    );

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

    window.scrollTo(
        0,
        0
    );

}


// ======================================================
// UPDATE NAVBAR
// ======================================================

function updateNavbar() {

    const navLogin =
        document.querySelector(
            '.nav-login'
        );

    if (!navLogin) {
        return;
    }


    if (currentUser) {

        const username =
            getUserUsername(
                currentUser
            );


        const name =
            getUserName(
                currentUser
            );


        navLogin.innerHTML = `

            <a
                id="profileBtn"
                class="button"
                href="profile.html"
            >
                ${escapeHTML(
                    username ||
                    name
                )}
            </a>

        `;


        profileBtn =
            document.getElementById(
                'profileBtn'
            );


        navUsername =
            document.getElementById(
                'navUsername'
            );


    } else {

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
            document.getElementById(
                'goToLoginBtn'
            );


        if (newLoginBtn) {

            newLoginBtn.addEventListener(
                'click',
                openLoginPage
            );

        }

    }

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

                name:
                    nameInput
                        ? nameInput.value.trim()
                        : '',

                email:
                    emailInput
                        ? emailInput.value.trim()
                        : '',

                message:
                    messageInput
                        ? messageInput.value.trim()
                        : ''

            };


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/feedback`,
                        {
                            method:
                                'POST',

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
// USERNAME AVAILABILITY
// ======================================================

const usernameInput =
    document.getElementById(
        'registerUsername'
    );


const usernameStatus =
    document.getElementById(
        'usernameStatus'
    );


let usernameCheckTimer =
    null;


let usernameAvailable =
    false;


// ======================================================
// CHECK USERNAME
// ======================================================

async function checkUsernameAvailability() {

    if (!usernameInput) {
        return;
    }


    const username =
        usernameInput.value
            .trim()
            .toLowerCase();


    usernameAvailable =
        false;


    if (!username) {

        if (usernameStatus) {

            usernameStatus.textContent =
                '';

            usernameStatus.className =
                'username-status';

        }

        return;

    }


    const usernameRegex =
        /^[a-z0-9_]{3,20}$/;


    if (!usernameRegex.test(username)) {

        if (usernameStatus) {

            usernameStatus.textContent =
                'Username must be 3-20 characters. Use only letters, numbers, and _.';

            usernameStatus.className =
                'username-status unavailable';

        }

        return;

    }


    if (usernameStatus) {

        usernameStatus.textContent =
            'Checking...';

        usernameStatus.className =
            'username-status checking';

    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/check-username/${encodeURIComponent(username)}`
            );


        const result =
            await response.json();


        if (
            result.success &&
            result.available
        ) {

            usernameAvailable =
                true;


            if (usernameStatus) {

                usernameStatus.textContent =
                    '✓ Username available';

                usernameStatus.className =
                    'username-status available';

            }

        } else {

            usernameAvailable =
                false;


            if (usernameStatus) {

                usernameStatus.textContent =
                    result.message ||
                    'Username is already taken.';

                usernameStatus.className =
                    'username-status unavailable';

            }

        }


    } catch (error) {

        usernameAvailable =
            false;


        console.error(
            'Username Check Error:',
            error
        );


        if (usernameStatus) {

            usernameStatus.textContent =
                'Unable to check username right now.';

            usernameStatus.className =
                'username-status unavailable';

        }

    }

}


// ======================================================
// USERNAME INPUT LISTENER
// ======================================================

if (usernameInput) {

    usernameInput.addEventListener(
        'input',
        () => {

            usernameAvailable =
                false;


            clearTimeout(
                usernameCheckTimer
            );


            usernameCheckTimer =
                setTimeout(
                    checkUsernameAvailability,
                    400
                );

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


            const nameInput =
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
                nameInput
                    ? nameInput.value.trim()
                    : '';


            const username =
                usernameInput
                    ? usernameInput.value
                        .trim()
                        .toLowerCase()
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


            if (
                !name ||
                !username ||
                !email ||
                !password ||
                !confirmPassword
            ) {

                alert(
                    'Please fill in all required fields.'
                );

                return;

            }


            const usernameRegex =
                /^[a-z0-9_]{3,20}$/;


            if (
                !usernameRegex.test(
                    username
                )
            ) {

                alert(
                    'Username must be 3-20 characters and contain only letters, numbers, and underscores.'
                );

                return;

            }


            if (!usernameAvailable) {

                await checkUsernameAvailability();


                if (!usernameAvailable) {

                    alert(
                        'Please choose an available username.'
                    );

                    return;

                }

            }


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
                username,
                email,
                password

            };


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/register`,
                        {
                            method:
                                'POST',

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


                    usernameAvailable =
                        false;


                    if (usernameStatus) {

                        usernameStatus.textContent =
                            '';

                        usernameStatus.className =
                            'username-status';

                    }


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
                        `${API_BASE_URL}/login`,
                        {
                            method:
                                'POST',

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


                if (result.success) {

                    currentUser =
                        result.user;


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


                    loginPage.classList.add(
                        'hidden-page'
                    );

                    homePage.classList.remove(
                        'hidden-page'
                    );


                    updateNavbar();


                    window.scrollTo(
                        0,
                        0
                    );


                } else {

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
// PROFILE PAGE
// ======================================================

const profileCard =
    document.getElementById(
        'profileCard'
    );


const postsSection =
    document.getElementById(
        'postsSection'
    );


const loginMessage =
    document.getElementById(
        'loginMessage'
    );


const profileName =
    document.getElementById(
        'profileName'
    );


const profileUsername =
    document.getElementById(
        'profileUsername'
    );


const profileEmail =
    document.getElementById(
        'profileEmail'
    );


const profileAvatar =
    document.getElementById(
        'profileAvatar'
    );


const logoutBtn =
    document.getElementById(
        'logoutBtn'
    );


const postContent =
    document.getElementById(
        'postContent'
    );


const postCharacterCount =
    document.getElementById(
        'postCharacterCount'
    );


const createPostBtn =
    document.getElementById(
        'createPostBtn'
    );


const postsFeed =
    document.getElementById(
        'postsFeed'
    );


// ======================================================
// LOAD PROFILE
// ======================================================

function loadProfilePage() {

    if (!profileCard) {
        return;
    }


    if (!currentUser) {

        profileCard.style.display =
            'none';


        if (postsSection) {

            postsSection.style.display =
                'none';

        }


        if (loginMessage) {

            loginMessage.style.display =
                'block';

        }


        return;

    }


    const name =
        getUserName(
            currentUser
        );


    const username =
        getUserUsername(
            currentUser
        );


    const email =
        getUserEmail(
            currentUser
        );


    if (profileName) {

        profileName.textContent =
            name;

    }


    if (profileUsername) {

        profileUsername.textContent =
            '@' + username;

    }


    if (profileEmail) {

        profileEmail.textContent =
            email;

    }


    if (profileAvatar) {

        profileAvatar.textContent =
            name
                .charAt(0)
                .toUpperCase();

    }


    profileCard.style.display =
        'block';


    if (postsSection) {

        postsSection.style.display =
            'block';

    }


    if (loginMessage) {

        loginMessage.style.display =
            'none';

    }


    loadUserPosts();

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatPostDate(dateValue) {

    if (!dateValue) {

        return '';

    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return '';

    }


    return date.toLocaleString(
        'en-IN',
        {
            day:
                'numeric',

            month:
                'short',

            year:
                'numeric',

            hour:
                'numeric',

            minute:
                '2-digit'
        }
    );

}


// ======================================================
// RENDER POSTS
// ======================================================

function renderPosts(posts) {

    if (!postsFeed) {
        return;
    }


    if (
        !Array.isArray(posts) ||
        posts.length === 0
    ) {

        postsFeed.innerHTML = `

            <div class="empty-posts">

                No posts yet.
                Your first post can start here.

            </div>

        `;

        return;

    }


    postsFeed.innerHTML =
        posts.map(
            (post) => {

                const username =
                    post.username ||
                    'user';


                const content =
                    post.content ||
                    '';


                const date =
                    formatPostDate(
                        post.createdAt
                    );


                const likes =
                    Number(
                        post.likes || 0
                    );


                return `

                    <article class="post-card">

                        <div class="post-header">

                            <span class="post-author">

                                @${escapeHTML(
                                    username
                                )}

                            </span>


                            <span class="post-date">

                                ${escapeHTML(
                                    date
                                )}

                            </span>

                        </div>


                        <div class="post-content">

                            ${escapeHTML(
                                content
                            )}

                        </div>


                        <div class="post-meta">

                            <span>
                                ♥ ${likes} likes
                            </span>

                        </div>

                    </article>

                `;

            }
        )
        .join('');

}


// ======================================================
// LOAD USER POSTS
// ======================================================

async function loadUserPosts() {

    if (
        !postsFeed ||
        !currentUser
    ) {

        return;

    }


    const username =
        getUserUsername(
            currentUser
        );


    if (!username) {

        postsFeed.innerHTML = `

            <div class="empty-posts">

                Username information is missing.

            </div>

        `;

        return;

    }


    postsFeed.innerHTML = `

        <div class="empty-posts">

            Loading your posts...

        </div>

    `;


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/posts/user/${encodeURIComponent(username)}`
            );


        const result =
            await response.json();


        if (!response.ok || !result.success) {

            throw new Error(
                result.error ||
                'Could not load posts'
            );

        }


        renderPosts(
            result.posts
        );


    } catch (error) {

        console.error(
            'Load posts error:',
            error
        );


        postsFeed.innerHTML = `

            <div class="empty-posts">

                Unable to load posts right now.

            </div>

        `;

    }

}


// ======================================================
// POST CHARACTER COUNT
// ======================================================

if (postContent) {

    postContent.addEventListener(
        'input',
        () => {

            const length =
                postContent.value.length;


            if (postCharacterCount) {

                postCharacterCount.textContent =
                    `${length} / 2000`;

            }

        }
    );

}


// ======================================================
// CREATE POST
// ======================================================

if (createPostBtn) {

    createPostBtn.addEventListener(
        'click',
        async () => {

            if (!currentUser) {

                alert(
                    'Please login first.'
                );

                return;

            }


            const authorId =
                getUserId(
                    currentUser
                );


            const username =
                getUserUsername(
                    currentUser
                );


            const content =
                postContent
                    ? postContent.value.trim()
                    : '';


            if (!authorId) {

                alert(
                    'Your login session is missing the user ID. Please logout and login again.'
                );

                return;

            }


            if (!username) {

                alert(
                    'Your username is missing. Please logout and login again.'
                );

                return;

            }


            if (!content) {

                alert(
                    'Write something before publishing.'
                );

                return;

            }


            if (
                content.length >
                2000
            ) {

                alert(
                    'Post cannot exceed 2000 characters.'
                );

                return;

            }


            createPostBtn.disabled =
                true;


            createPostBtn.textContent =
                'Publishing...';


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/posts`,
                        {
                            method:
                                'POST',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body:
                                JSON.stringify({

                                    authorId,

                                    username,

                                    content

                                })
                        }
                    );


                const result =
                    await response.json();


                if (!response.ok || !result.success) {

                    alert(
                        result.error ||
                        'Could not publish post.'
                    );

                    return;

                }


                // ==========================================
                // CLEAR FORM
                // ==========================================

                if (postContent) {

                    postContent.value =
                        '';

                }


                if (postCharacterCount) {

                    postCharacterCount.textContent =
                        '0 / 2000';

                }


                // ==========================================
                // LOAD UPDATED POSTS
                // ==========================================

                await loadUserPosts();


            } catch (error) {

                console.error(
                    'Create post error:',
                    error
                );


                alert(
                    'Backend server se connect nahi ho paya.'
                );


            } finally {

                createPostBtn.disabled =
                    false;


                createPostBtn.textContent =
                    'Publish Post';

            }

        }
    );

}


// ======================================================
// LOGOUT
// ======================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        'click',
        () => {

            localStorage.removeItem(
                'dheereStudioUser'
            );


            currentUser =
                null;


            window.location.href =
                'index.html';

        }
    );

}


// ======================================================
// INITIALIZE AUTH UI
// ======================================================

updateNavbar();


// ======================================================
// INITIALIZE PROFILE PAGE
// ======================================================

loadProfilePage();