// ======================================================
// CONFIG
// ======================================================

const API_BASE_URL =
    'https://dheere-studio.onrender.com';


// ======================================================
// STORAGE KEYS
// ======================================================

const USER_STORAGE_KEY =
    'dheereStudioUser';


// ======================================================
// PAGES
// ======================================================

const homePage =
    document.getElementById('homepage');

const loginPage =
    document.getElementById('loginPage');


// ======================================================
// NAVIGATION
// ======================================================

let goToLoginBtn =
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

let navProfileAvatar =
    document.getElementById('navProfileAvatar');


// ======================================================
// SEARCH
// ======================================================

const userSearchInput =
    document.getElementById('userSearchInput');

const searchResults =
    document.getElementById('searchResults');

let searchTimer = null;

let searchRequestId = 0;


// ======================================================
// LOGIN STATE
// ======================================================

let currentUser = null;


// ======================================================
// RESTORE LOGIN STATE
// ======================================================

function restoreUserFromStorage() {

    try {

        const savedUser =
            localStorage.getItem(
                USER_STORAGE_KEY
            );

        currentUser =
            savedUser
                ? JSON.parse(savedUser)
                : null;

    } catch (error) {

        console.error(
            'Saved user data error:',
            error
        );

        currentUser = null;

        localStorage.removeItem(
            USER_STORAGE_KEY
        );

    }

}

restoreUserFromStorage();


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
        user?.user?.name ||
        user?.username ||
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
// PROFILE DATA FROM SERVER
// ======================================================

async function getFreshProfile() {

    if (!currentUser) {
        return null;
    }

    const userId =
        getUserId(currentUser);

    if (!userId) {

        console.error(
            'Cannot load profile: user ID is missing.'
        );

        return null;

    }

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/profile/${encodeURIComponent(userId)}`
            );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success ||
            !result.user
        ) {

            throw new Error(
                result.error ||
                'Could not load profile'
            );

        }

        return result.user;

    } catch (error) {

        console.error(
            'Get fresh profile error:',
            error
        );

        return null;

    }

}


// ======================================================
// APPLY SERVER PROFILE TO CURRENT USER
// ======================================================

function applyProfileToCurrentUser(profile) {

    if (
        !profile ||
        !currentUser
    ) {
        return;
    }


    currentUser = {

        ...currentUser,

        id:
            profile.id ||
            currentUser.id,

        _id:
            profile.id ||
            currentUser._id,

        name:
            profile.name ??
            currentUser.name,

        username:
            profile.username ??
            currentUser.username,

        email:
            profile.email ??
            currentUser.email,

        bio:
            profile.bio ??
            currentUser.bio ??
            '',

        avatarUrl:
            profile.avatarUrl ??
            ''

    };


    try {

        localStorage.setItem(
            USER_STORAGE_KEY,
            JSON.stringify(
                currentUser
            )
        );

    } catch (error) {

        console.error(
            'Could not save current user state:',
            error
        );

    }

}


// ======================================================
// REFRESH CURRENT PROFILE
// ======================================================

async function refreshCurrentProfile() {

    const profile =
        await getFreshProfile();

    if (!profile) {
        return null;
    }

    applyProfileToCurrentUser(
        profile
    );

    return profile;

}


// ======================================================
// USER INITIALS
// ======================================================

function getUserInitials(user) {

    const name =
        String(
            getUserName(user) || 'User'
        ).trim();

    if (!name) {
        return 'U';
    }

    const parts =
        name.split(/\s+/);

    if (parts.length === 1) {

        return parts[0]
            .charAt(0)
            .toUpperCase();

    }

    return (
        parts[0].charAt(0) +
        parts[parts.length - 1].charAt(0)
    ).toUpperCase();

}


// ======================================================
// RENDER AVATAR ELEMENT
// ======================================================

function renderAvatarElement(
    container,
    avatarUrl,
    user
) {

    if (!container) {
        return;
    }


    const initials =
        getUserInitials(user);


    container.replaceChildren();


    if (
        typeof avatarUrl !== 'string' ||
        !avatarUrl.trim()
    ) {

        container.textContent =
            initials;

        return;

    }


    const img =
        document.createElement('img');


    img.src =
        avatarUrl;


    img.alt =
        `${getUserName(user)} profile photo`;


    img.loading =
        'eager';


    img.decoding =
        'async';


    img.addEventListener(
        'error',
        () => {

            container.replaceChildren();

            container.textContent =
                initials;

        },
        {
            once: true
        }
    );


    container.appendChild(img);

}


// ======================================================
// RENDER NAVBAR AVATAR
// ======================================================

function renderHomepageAvatar() {

    if (!navProfileAvatar) {
        return;
    }


    const avatarUrl =
        currentUser?.avatarUrl ||
        '';


    renderAvatarElement(
        navProfileAvatar,
        avatarUrl,
        currentUser
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
// OPEN LOGIN
// ======================================================

function openLoginPage() {

    if (
        !homePage ||
        !loginPage
    ) {
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

    if (
        !homePage ||
        !loginPage
    ) {
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

    goToLoginBtn =
        document.getElementById(
            'goToLoginBtn'
        );

    profileBtn =
        document.getElementById(
            'profileBtn'
        );

    navUsername =
        document.getElementById(
            'navUsername'
        );

    navProfileAvatar =
        document.getElementById(
            'navProfileAvatar'
        );


    if (
        !goToLoginBtn ||
        !profileBtn
    ) {
        return;
    }


    // --------------------------------------------------
    // LOGGED OUT
    // --------------------------------------------------

    if (!currentUser) {

        goToLoginBtn.style.display =
            '';

        profileBtn.style.display =
            'none';

        profileBtn.classList.add(
            'hidden-profile'
        );


        if (
            typeof stopNotificationRefresh ===
            'function'
        ) {

            stopNotificationRefresh();

        }


        if (
            typeof resetNotificationsUI ===
            'function'
        ) {

            resetNotificationsUI();

        }


        return;

    }


    // --------------------------------------------------
    // LOGGED IN
    // --------------------------------------------------

    goToLoginBtn.style.display =
        'none';

    profileBtn.style.display =
        'flex';

    profileBtn.classList.remove(
        'hidden-profile'
    );


    profileBtn.classList.remove(
        'button'
    );

    profileBtn.classList.add(
        'nav-profile-link'
    );


    const username =
        getUserUsername(
            currentUser
        );

    const name =
        getUserName(
            currentUser
        );


    if (navUsername) {

        navUsername.textContent =
            username
                ? `@${username}`
                : name;

    }


    renderHomepageAvatar();


    /*
     * notification.js is loaded separately.
     *
     * These checks prevent script.js from throwing
     * an error if notification.js has not loaded yet.
     */

    if (
        typeof initializeNotificationUI ===
        'function'
    ) {

        initializeNotificationUI();

    }


    if (
        typeof startNotificationRefresh ===
        'function'
    ) {

        startNotificationRefresh();

    }

}


// ======================================================
// SEARCH HELPERS
// ======================================================

function getSearchResultUsername(user) {

    return (
        user?.username ||
        user?.user?.username ||
        ''
    );

}


function getSearchResultName(user) {

    return (
        user?.name ||
        user?.user?.name ||
        getSearchResultUsername(user) ||
        'User'
    );

}


function getSearchResultAvatar(user) {

    return (
        user?.avatarUrl ||
        user?.avatar ||
        user?.profilePhoto ||
        user?.profileImage ||
        ''
    );

}


// ======================================================
// CLEAR SEARCH RESULTS
// ======================================================

function clearSearchResults() {

    if (!searchResults) {
        return;
    }

    searchResults.replaceChildren();

    searchResults.classList.remove(
        'active'
    );

}


// ======================================================
// SHOW SEARCH MESSAGE
// ======================================================

function showSearchMessage(message) {

    if (!searchResults) {
        return;
    }


    searchResults.innerHTML = `

        <div class="search-message">

            ${escapeHTML(message)}

        </div>

    `;


    searchResults.classList.add(
        'active'
    );

}


// ======================================================
// OPEN PUBLIC PROFILE
// ======================================================

function openPublicProfile(username) {

    if (!username) {
        return;
    }


    const cleanUsername =
        String(username)
            .trim()
            .replace(/^@/, '');


    if (!cleanUsername) {
        return;
    }


    clearSearchResults();


    if (userSearchInput) {

        userSearchInput.value =
            '';

    }


    window.location.href =
        `live-profile.html?username=${encodeURIComponent(cleanUsername)}`;

}


// ======================================================
// CREATE SEARCH RESULT
// ======================================================

function createSearchResultItem(user) {

    const username =
        getSearchResultUsername(user);

    const name =
        getSearchResultName(user);

    const avatarUrl =
        getSearchResultAvatar(user);


    if (!username) {
        return null;
    }


    const button =
        document.createElement('button');


    button.type =
        'button';


    button.className =
        'search-result-item';


    button.setAttribute(
        'role',
        'option'
    );


    // --------------------------------------------------
    // AVATAR
    // --------------------------------------------------

    const avatar =
        document.createElement('span');


    avatar.className =
        'search-result-avatar';


    if (avatarUrl) {

        const img =
            document.createElement('img');


        img.src =
            avatarUrl;


        img.alt =
            `${name} profile photo`;


        img.loading =
            'lazy';


        img.addEventListener(
            'error',
            () => {

                avatar.replaceChildren();

                avatar.textContent =
                    getUserInitials({
                        name,
                        username
                    });

            },
            {
                once: true
            }
        );


        avatar.appendChild(
            img
        );

    } else {

        avatar.textContent =
            getUserInitials({
                name,
                username
            });

    }


    // --------------------------------------------------
    // USER INFO
    // --------------------------------------------------

    const info =
        document.createElement('span');


    info.className =
        'search-result-info';


    const nameElement =
        document.createElement('span');


    nameElement.className =
        'search-result-name';


    nameElement.textContent =
        name;


    const usernameElement =
        document.createElement('span');


    usernameElement.className =
        'search-result-username';


    usernameElement.textContent =
        `@${username}`;


    info.appendChild(
        nameElement
    );

    info.appendChild(
        usernameElement
    );


    button.appendChild(
        avatar
    );

    button.appendChild(
        info
    );


    button.addEventListener(
        'click',
        () => {

            openPublicProfile(
                username
            );

        }
    );


    return button;

}


// ======================================================
// RENDER SEARCH RESULTS
// ======================================================

function renderSearchResults(users) {

    if (!searchResults) {
        return;
    }


    searchResults.replaceChildren();


    if (
        !Array.isArray(users) ||
        users.length === 0
    ) {

        showSearchMessage(
            'No users found.'
        );

        return;

    }


    users.forEach(
        (user) => {

            const item =
                createSearchResultItem(
                    user
                );


            if (item) {

                searchResults.appendChild(
                    item
                );

            }

        }
    );


    if (
        !searchResults.children.length
    ) {

        showSearchMessage(
            'No users found.'
        );

        return;

    }


    searchResults.classList.add(
        'active'
    );

}


// ======================================================
// SEARCH USERS
// ======================================================

async function searchUsers(query) {

    const requestId =
        ++searchRequestId;


    if (!searchResults) {
        return;
    }


    const cleanQuery =
        String(query || '')
            .trim();


    if (!cleanQuery) {

        clearSearchResults();

        return;

    }


    if (cleanQuery.length < 2) {

        showSearchMessage(
            'Type at least 2 characters.'
        );

        return;

    }


    showSearchMessage(
        'Searching...'
    );


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/search-users?q=${encodeURIComponent(cleanQuery)}`
            );


        const result =
            await response.json();


        if (
            requestId !==
            searchRequestId
        ) {

            return;

        }


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.error ||
                'Search failed'
            );

        }


        const users =
            Array.isArray(
                result.users
            )
                ? result.users
                : Array.isArray(
                    result.results
                )
                    ? result.results
                    : [];


        renderSearchResults(
            users
        );


    } catch (error) {

        if (
            requestId !==
            searchRequestId
        ) {

            return;

        }


        console.error(
            'User search error:',
            error
        );


        showSearchMessage(
            'Unable to search right now.'
        );

    }

}


// ======================================================
// SEARCH INPUT
// ======================================================

if (userSearchInput) {

    userSearchInput.addEventListener(
        'input',
        () => {

            clearTimeout(
                searchTimer
            );


            const query =
                userSearchInput.value
                    .trim();


            if (!query) {

                clearSearchResults();

                return;

            }


            searchTimer =
                setTimeout(
                    () => {

                        searchUsers(
                            query
                        );

                    },
                    300
                );

        }
    );


    userSearchInput.addEventListener(
        'keydown',
        (event) => {

            if (
                event.key ===
                'Escape'
            ) {

                userSearchInput.value =
                    '';

                clearSearchResults();

                userSearchInput.blur();

            }


            if (
                event.key ===
                'Enter'
            ) {

                const firstResult =
                    searchResults
                        ?.querySelector(
                            '.search-result-item'
                        );


                if (firstResult) {

                    event.preventDefault();

                    firstResult.click();

                }

            }

        }
    );

}


// ======================================================
// CLOSE SEARCH WHEN CLICKING OUTSIDE
// ======================================================

document.addEventListener(
    'click',
    (event) => {

        if (
            !searchResults ||
            !userSearchInput
        ) {
            return;
        }


        const searchContainer =
            document.getElementById(
                'userSearch'
            );


        if (
            searchContainer &&
            !searchContainer.contains(
                event.target
            )
        ) {

            clearSearchResults();

        }

    }
);


// ======================================================
// LOGIN BUTTON
// ======================================================

if (goToLoginBtn) {

    goToLoginBtn.addEventListener(
        'click',
        openLoginPage
    );

}


// ======================================================
// BACK HOME BUTTON
// ======================================================

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

let usernameCheckTimer = null;

let usernameAvailable = false;


// ======================================================
// CHECK USERNAME AVAILABILITY
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


    if (
        !usernameRegex.test(
            username
        )
    ) {

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
// USERNAME INPUT
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


            if (
                !email ||
                !password
            ) {

                alert(
                    'Email and password are required.'
                );

                return;

            }


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
                                JSON.stringify({
                                    email,
                                    password
                                })
                        }
                    );


                const result =
                    await response.json();


                if (result.success) {

                    currentUser =
                        result.user;


                    localStorage.setItem(
                        USER_STORAGE_KEY,
                        JSON.stringify(
                            currentUser
                        )
                    );


                    await refreshCurrentProfile();


                    loginForm.reset();


                    alert(
                        'Login successful!'
                    );


                    if (loginPage) {

                        loginPage.classList.add(
                            'hidden-page'
                        );

                    }


                    if (homePage) {

                        homePage.classList.remove(
                            'hidden-page'
                        );

                    }


                    updateNavbar();


                    if (
                        typeof loadNotifications ===
                        'function'
                    ) {

                        await loadNotifications();

                    }


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
// PROFILE PAGE ELEMENTS
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

async function loadProfilePage() {

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


    const profile =
        await refreshCurrentProfile();


    const user =
        profile ||
        currentUser;


    const name =
        getUserName(user);

    const username =
        getUserUsername(user);

    const email =
        getUserEmail(user);


    if (profileName) {

        profileName.textContent =
            name;

    }


    if (profileUsername) {

        profileUsername.textContent =
            username
                ? `@${username}`
                : '';

    }


    if (profileEmail) {

        profileEmail.textContent =
            email;

    }


    if (profileAvatar) {

        renderAvatarElement(
            profileAvatar,
            user?.avatarUrl || '',
            user
        );

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
// FORMAT POST DATE
// ======================================================

function formatPostDate(dateValue) {

    if (!dateValue) {
        return '';
    }


    const date =
        new Date(dateValue);


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
        posts
            .map(
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


        if (
            !response.ok ||
            !result.success
        ) {

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


                if (
                    !response.ok ||
                    !result.success
                ) {

                    alert(
                        result.error ||
                        'Could not publish post.'
                    );

                    return;

                }


                if (postContent) {

                    postContent.value =
                        '';

                }


                if (postCharacterCount) {

                    postCharacterCount.textContent =
                        '0 / 2000';

                }


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

            if (
                typeof stopNotificationRefresh ===
                'function'
            ) {

                stopNotificationRefresh();

            }


            if (
                typeof resetNotificationsUI ===
                'function'
            ) {

                resetNotificationsUI();

            }


            localStorage.removeItem(
                USER_STORAGE_KEY
            );


            currentUser =
                null;


            window.location.href =
                'index.html';

        }
    );

}


// ======================================================
// CROSS-TAB USER SYNC
// ======================================================

window.addEventListener(
    'storage',
    (event) => {

        if (
            event.key ===
            USER_STORAGE_KEY
        ) {

            try {

                currentUser =
                    event.newValue
                        ? JSON.parse(
                            event.newValue
                        )
                        : null;

            } catch {

                currentUser =
                    null;

            }


            updateNavbar();

            loadProfilePage();

        }

    }
);


// ======================================================
// PAGE SHOW SYNC
// ======================================================

window.addEventListener(
    'pageshow',
    async () => {

        restoreUserFromStorage();


        if (currentUser) {

            await refreshCurrentProfile();

        }


        updateNavbar();

        loadProfilePage();

    }
);


// ======================================================
// INITIALIZE
// ======================================================

updateNavbar();

loadProfilePage();