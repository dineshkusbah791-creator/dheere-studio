/*
 * Dheere Studio — Homepage / Profile Script
 * ------------------------------------------------------------
 * Responsibilities:
 *   • Authentication state and canonical auth navigation
 *   • Homepage personalization
 *   • Profile menu, avatar, and profile data sync
 *   • Feedback, registration, login, and password UI helpers
 *   • Profile posts and session-aware UI
 *
 * Route/API contracts are intentionally preserved.
 */


// ======================================================
// TYPESCRIPT COMPATIBILITY
// ======================================================
// These declarations describe globals already used by the existing
// page scripts. They do not create or change any runtime behavior.
declare function stopNotificationRefresh(): void;
declare function resetNotificationsUI(): void;
declare function initializeNotificationUI(): void;
declare function startNotificationRefresh(): void;
declare function loadNotifications(): void;
declare const backToHome: EventListener;

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

const TOKEN_STORAGE_KEY =
    'dheereStudioToken';

const PROFILE_POSTS_PATH =
    'profile/profile.html#postsSection';

const AUTH_CHANGED_EVENT =
    'dheere:auth-changed';

const HOMEPAGE_REFRESH_EVENT =
    'dheere:homepage-personalization-refresh';


// ======================================================
// AUTH TOKEN HELPERS
// ======================================================

function getAuthToken() {

    return localStorage.getItem(
        TOKEN_STORAGE_KEY
    );

}


function getAuthHeaders() {

    const token =
        getAuthToken();


    const headers: Record<string, string> = {

        'Content-Type':
            'application/json'

    };


    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }


    return headers;

}


function clearAuthStorage() {

    localStorage.removeItem(
        USER_STORAGE_KEY
    );

    localStorage.removeItem(
        TOKEN_STORAGE_KEY
    );

}


async function parseJSONResponse(response) {

    const text =
        await response.text();


    if (!text) {

        return {};

    }


    try {

        return JSON.parse(text);

    } catch (error) {

        console.error(
            'Invalid JSON response:',
            error
        );


        return {

            success: false,

            error: 'The server returned an invalid response.'

        };

    }

}


// ======================================================

const homePage =
    document.getElementById('homepage');

const loginPage =
    document.getElementById('loginPage');


// ======================================================

let goToLoginBtn =
    document.getElementById('goToLoginBtn') as HTMLElement | null;

const backToHomeBtn =
    document.getElementById('backToHomeBtn') as HTMLElement | null;


// ======================================================
// CANONICAL AUTH NAVIGATION
// ======================================================

function openCanonicalLogin() {

    window.location.href =
        'auth/login.html';

}


if (goToLoginBtn) {

    goToLoginBtn.addEventListener(
        'click',
        openCanonicalLogin
    );

}


// ======================================================

const loginTabBtn =
    document.getElementById('loginTabBtn') as HTMLElement | null;

const registerTabBtn =
    document.getElementById('registerTabBtn') as HTMLElement | null;

const loginForm =
    document.getElementById('loginForm') as HTMLFormElement | null;

const registerForm =
    document.getElementById('registerForm') as HTMLFormElement | null;


// ======================================================
// PROFILE NAVIGATION
// ======================================================

let profileBtn =
    document.getElementById('profileBtn') as HTMLElement | null;

let profileMenuWrapper =
    document.getElementById('profileMenuWrapper') as HTMLElement | null;

let profileDropdown =
    document.getElementById('profileDropdown') as HTMLElement | null;

let profileMenuProfile =
    document.getElementById('profileMenuProfile') as HTMLAnchorElement | null;

let profileMenuPosts =
    document.getElementById('profileMenuPosts') as HTMLAnchorElement | null;

let profileMenuSettings =
    document.getElementById('profileMenuSettings') as HTMLAnchorElement | null;

let profileMenuLogout =
    document.getElementById('profileMenuLogout') as HTMLElement | null;

let navUsername =
    document.getElementById('navUsername') as HTMLElement | null;

let navProfileAvatar =
    document.getElementById('navProfileAvatar') as HTMLElement | null;


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

        const savedToken =
            localStorage.getItem(
                TOKEN_STORAGE_KEY
            );


        // --------------------------------------------------
        // NO USER
        // --------------------------------------------------

        if (!savedUser) {

            currentUser =
                null;

            return;

        }


        // --------------------------------------------------
        // OLD SESSION WITHOUT JWT
        //
        // User must login again after JWT update.
        // --------------------------------------------------

        if (!savedToken) {

            currentUser =
                null;


            localStorage.removeItem(
                USER_STORAGE_KEY
            );

            return;

        }


        currentUser =
            JSON.parse(
                savedUser
            );


    } catch (error) {

        console.error(
            'Saved user data error:',
            error
        );


        currentUser =
            null;


        clearAuthStorage();

    }

}

restoreUserFromStorage();


/* ======================================================
   HOMEPAGE PERSONALIZATION
   ------------------------------------------------------
   Logged out:
   - Original Dheere Studio homepage

   Logged in:
   - Same homepage
   - Only the existing hero title is personalized

   No extra greeting badge.
   No extra homepage sections.
   No duplicate authentication logic.
   ====================================================== */

function updateHomepagePersonalization() {

    const homepage =
        document.getElementById(
            'homepage'
        );


    const heroTitle =
        document.getElementById(
            'hero-title'
        );


    if (
        !homepage ||
        !heroTitle
    ) {

        return;

    }


    /*
     * Keep the original public homepage title unchanged
     * when the visitor is logged out.
     */

    const publicTitle =
        'Welcome to Dheere Studio.A Studio of Stories & World.';


    /*
     * Logged out state.
     */

    if (!currentUser) {

        heroTitle.textContent =
            publicTitle;


        return;

    }


    /*
     * Logged in state.
     */

    const name =
        String(

            currentUser?.name ||

            currentUser?.user?.name ||

            currentUser?.username ||

            currentUser?.user?.username ||

            'User'

        ).trim();


    heroTitle.textContent =
        `Welcome back, ${name}.`;

}


/*
 * Personalization watcher.
 *
 * The canonical auth system stores the user and JWT in
 * localStorage. We simply react to that existing state.
 */

let homepageAuthSnapshot =
    '';


function getHomepageAuthSnapshot() {

    return (

        localStorage.getItem(
            USER_STORAGE_KEY
        ) ||

        ''

    ) + '::' + (

        localStorage.getItem(
            TOKEN_STORAGE_KEY
        ) ||

        ''

    );

}


function syncHomepageAuthentication() {

    const nextSnapshot =
        getHomepageAuthSnapshot();


    if (
        nextSnapshot ===
        homepageAuthSnapshot
    ) {

        return;

    }


    homepageAuthSnapshot =
        nextSnapshot;


    restoreUserFromStorage();

    updateHomepagePersonalization();

    updateNavbar();

}


function refreshHomepageAuthenticationUI() {

    homepageAuthSnapshot =
        getHomepageAuthSnapshot();


    restoreUserFromStorage();

    updateHomepagePersonalization();

    updateNavbar();

}


homepageAuthSnapshot =
    getHomepageAuthSnapshot();


updateHomepagePersonalization();


window.addEventListener(
    'storage',
    refreshHomepageAuthenticationUI
);


window.addEventListener(
    'pageshow',
    refreshHomepageAuthenticationUI
);


window.addEventListener(
    AUTH_CHANGED_EVENT,
    refreshHomepageAuthenticationUI
);


window.addEventListener(
    HOMEPAGE_REFRESH_EVENT,
    updateHomepagePersonalization
);


/* ======================================================
   END HOMEPAGE PERSONALIZATION
   ====================================================== */



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
                `${API_BASE_URL}/profile/${encodeURIComponent(userId)}`,
                {
                    method:
                        'GET',

                    headers:
                        getAuthHeaders(),

                    cache:
                        'no-store'
                }
            );


        const result =
            await parseJSONResponse(response);


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



// ======================================================
// BACK TO HOME
// ======================================================



// ======================================================
// UPDATE NAVBAR
// ======================================================

function updateNavbar() {

    goToLoginBtn =
        document.getElementById(
            'goToLoginBtn'
        );


    syncProfileMenuElements();


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


        if (profileMenuWrapper) {

            profileMenuWrapper.style.display =
                'none';

            profileMenuWrapper.classList.add(
                'hidden-profile'
            );

        } else {

            profileBtn.style.display =
                'none';

        }


        closeProfileMenu();


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


    if (profileMenuWrapper) {

        profileMenuWrapper.style.display =
            'flex';

        profileMenuWrapper.classList.remove(
            'hidden-profile'
        );

    }


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
// PROFILE DROPDOWN
// ======================================================

let profileMenuReady = false;


function syncProfileMenuElements() {

    profileMenuWrapper =
        document.getElementById(
            'profileMenuWrapper'
        );

    profileBtn =
        document.getElementById(
            'profileBtn'
        );

    profileDropdown =
        document.getElementById(
            'profileDropdown'
        );

    profileMenuProfile =
        document.getElementById(
            'profileMenuProfile'
        ) as HTMLAnchorElement | null;

    profileMenuPosts =
        document.getElementById(
            'profileMenuPosts'
        ) as HTMLAnchorElement | null;

    profileMenuSettings =
        document.getElementById(
            'profileMenuSettings'
        ) as HTMLAnchorElement | null;

    profileMenuLogout =
        document.getElementById(
            'profileMenuLogout'
        );

}


function isProfileMenuOpen() {

    return Boolean(
        profileDropdown &&
        !profileDropdown.hidden
    );

}


function closeProfileMenu(
    restoreFocus = false
) {

    if (
        !profileDropdown ||
        !profileBtn
    ) {

        return;

    }


    profileDropdown.hidden =
        true;


    profileBtn.setAttribute(
        'aria-expanded',
        'false'
    );


    if (
        restoreFocus
    ) {

        profileBtn.focus();

    }

}


function openProfileMenu() {

    if (
        !profileDropdown ||
        !profileBtn ||
        !currentUser
    ) {

        return;

    }


    profileDropdown.hidden =
        false;


    profileBtn.setAttribute(
        'aria-expanded',
        'true'
    );

}


function toggleProfileMenu() {

    if (
        isProfileMenuOpen()
    ) {

        closeProfileMenu();

    } else {

        openProfileMenu();

    }

}


function handleProfileMenuClick(
    event
) {

    if (
        !profileBtn
    ) {

        return;

    }


    event.preventDefault();

    toggleProfileMenu();

}


function handleProfileMenuKeydown(
    event
) {

    if (
        !profileBtn
    ) {

        return;

    }


    if (
        event.key ===
        'Escape'
    ) {

        if (
            isProfileMenuOpen()
        ) {

            event.preventDefault();

            closeProfileMenu(
                true
            );

        }

        return;

    }


    if (
        event.key ===
        'ArrowDown' ||
        event.key ===
        'Enter' ||
        event.key ===
        ' '
    ) {

        event.preventDefault();

        if (
            !isProfileMenuOpen()
        ) {

            openProfileMenu();

        }


        profileDropdown
            ?.querySelector<HTMLElement>(
                '[role="menuitem"]'
            )
            ?.focus();

    }

}


function handleProfileDropdownKeydown(
    event
) {

    if (
        !profileDropdown
    ) {

        return;

    }


    const items =
        Array.from(
            profileDropdown.querySelectorAll<HTMLElement>(
                '[role="menuitem"]:not([disabled])'
            )
        );


    if (
        !items.length
    ) {

        return;

    }


    const currentIndex =
        items.indexOf(
            document.activeElement as HTMLElement
        );


    if (
        event.key ===
        'Escape'
    ) {

        event.preventDefault();

        closeProfileMenu(
            true
        );

        return;

    }


    if (
        event.key ===
        'ArrowDown'
    ) {

        event.preventDefault();

        items[
            currentIndex < 0
                ? 0
                : (currentIndex + 1) % items.length
        ].focus();

        return;

    }


    if (
        event.key ===
        'ArrowUp'
    ) {

        event.preventDefault();

        items[
            currentIndex <= 0
                ? items.length - 1
                : currentIndex - 1
        ].focus();

        return;

    }


    if (
        event.key ===
        'Home'
    ) {

        event.preventDefault();

        items[0].focus();

        return;

    }


    if (
        event.key ===
        'End'
    ) {

        event.preventDefault();

        items[
            items.length - 1
        ].focus();

    }

}


function logoutHomepageUser() {

    closeProfileMenu();


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


    clearAuthStorage();


    currentUser =
        null;


    updateHomepagePersonalization();

    updateNavbar();


    try {

        window.dispatchEvent(
            new CustomEvent(
                AUTH_CHANGED_EVENT,
                {
                    detail: {
                        authenticated:
                            false
                    }
                }
            )
        );

    } catch (
        error
    ) {

        console.error(
            'Could not dispatch auth change event:',
            error
        );

    }

}


function initializeProfileMenu() {

    syncProfileMenuElements();


    if (
        !profileMenuWrapper ||
        !profileBtn ||
        !profileDropdown
    ) {

        return;

    }


    if (
        profileMenuReady
    ) {

        return;

    }


    profileMenuReady =
        true;


    profileBtn.addEventListener(
        'click',
        handleProfileMenuClick
    );


    profileBtn.addEventListener(
        'keydown',
        handleProfileMenuKeydown
    );


    profileDropdown.addEventListener(
        'keydown',
        handleProfileDropdownKeydown
    );


    profileMenuLogout?.addEventListener(
        'click',
        logoutHomepageUser
    );


    /*
     * My Posts reuses the existing profile page and
     * opens the existing posts section when available.
     */
    if (profileMenuPosts) {

        profileMenuPosts.href =
            PROFILE_POSTS_PATH;

        profileMenuPosts.addEventListener(
            'click',
            () => closeProfileMenu()
        );

    }


    /*
     * My Profile and Settings remain normal links.
     * No URL replacement is performed here.
     */
    profileMenuProfile?.addEventListener(
        'click',
        () => closeProfileMenu()
    );


    profileMenuSettings?.addEventListener(
        'click',
        () => closeProfileMenu()
    );


    document.addEventListener(
        'click',
        (event) => {

            if (
                !profileMenuWrapper ||
                profileMenuWrapper.contains(
                    event.target as Node
                )
            ) {

                return;

            }


            closeProfileMenu();

        }
    );


    window.addEventListener(
        'resize',
        () => {

            if (
                window.innerWidth <= 650
            ) {

                closeProfileMenu();

            }

        }
    );

}


// ======================================================



if (backToHomeBtn) {

    backToHomeBtn.addEventListener(
        'click',
        backToHome
    );

}


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
// CANONICAL AUTH NAVIGATION
// ------------------------------------------------------
// Authentication UI lives under /auth.
// Keep the navigation paths explicit and stable.
// ======================================================

function openCanonicalRegister() {

    window.location.href =
        'auth/register.html';

}


// ======================================================
// FEEDBACK FORM
// ======================================================

// ======================================================

const feedbackForm =
    document.querySelector<HTMLFormElement>(
        '.feedback-form'
    );


if (feedbackForm) {

    feedbackForm.addEventListener(
        'submit',
        async (e) => {

            e.preventDefault();


            const nameInput =
                feedbackForm.querySelector<HTMLInputElement>(
                    'input[type="text"]'
                );

            const emailInput =
                feedbackForm.querySelector<HTMLInputElement>(
                    'input[type="email"]'
                );

            const messageInput =
                feedbackForm.querySelector<HTMLTextAreaElement>(
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
                    await parseJSONResponse(response);


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

const usernameInput =
    document.getElementById(
        'registerUsername'
    ) as HTMLInputElement | null;

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
            await parseJSONResponse(response);


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

if (registerForm) {

    registerForm.addEventListener(
        'submit',
        async (e) => {

            e.preventDefault();


            const nameInput =
                document.getElementById(
                    'registerName'
                ) as HTMLInputElement | null;

            const emailInput =
                document.getElementById(
                    'registerEmail'
                ) as HTMLInputElement | null;

            const passwordInput =
                document.getElementById(
                    'registerPassword'
                ) as HTMLInputElement | null;

            const confirmPasswordInput =
                document.getElementById(
                    'confirmPassword'
                ) as HTMLInputElement | null;


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
                    await parseJSONResponse(response);


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
                        ) as HTMLInputElement | null;


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
                ) as HTMLInputElement | null;

            const passwordInput =
                document.getElementById(
                    'loginPassword'
                ) as HTMLInputElement | null;


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
                    await parseJSONResponse(response);


                if (result.success) {

                    // ------------------------------------------
                    // JWT TOKEN CHECK
                    // ------------------------------------------

                    if (
                        !result.token ||
                        typeof result.token !==
                        'string'
                    ) {

                        console.error(
                            'Login successful but JWT token is missing.'
                        );


                        alert(
                            'Login token was not received. Please try again.'
                        );

                        return;

                    }


                    // ------------------------------------------
                    // SAVE CURRENT USER
                    // ------------------------------------------

                    currentUser =
                        result.user;


                    updateHomepagePersonalization();


                    localStorage.setItem(
                        USER_STORAGE_KEY,
                        JSON.stringify(
                            currentUser
                        )
                    );


                    // ------------------------------------------
                    // SAVE JWT TOKEN
                    // ------------------------------------------

                    localStorage.setItem(
                        TOKEN_STORAGE_KEY,
                        result.token
                    );


                    updateHomepagePersonalization();


                    // ------------------------------------------
                    // REFRESH PROFILE
                    // ------------------------------------------

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

const passwordToggleButtons =
    document.querySelectorAll<HTMLButtonElement>(
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
                    ) as HTMLInputElement | null;


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
    ) as HTMLElement | null;

const postsSection =
    document.getElementById(
        'postsSection'
    ) as HTMLElement | null;

const loginMessage =
    document.getElementById(
        'loginMessage'
    ) as HTMLElement | null;

const profileName =
    document.getElementById(
        'profileName'
    ) as HTMLElement | null;

const profileUsername =
    document.getElementById(
        'profileUsername'
    ) as HTMLElement | null;

const profileEmail =
    document.getElementById(
        'profileEmail'
    ) as HTMLElement | null;

const profileAvatar =
    document.getElementById(
        'profileAvatar'
    ) as HTMLElement | null;

const logoutBtn =
    document.getElementById(
        'logoutBtn'
    ) as HTMLElement | null;

const postContent =
    document.getElementById(
        'postContent'
    ) as HTMLTextAreaElement | null;

const postCharacterCount =
    document.getElementById(
        'postCharacterCount'
    ) as HTMLElement | null;

const createPostBtn =
    document.getElementById(
        'createPostBtn'
    ) as HTMLButtonElement | null;

const postsFeed =
    document.getElementById(
        'postsFeed'
    ) as HTMLElement | null;


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
            await parseJSONResponse(response);


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

            // ----------------------------------------------
            // CHECK LOGIN
            // ----------------------------------------------

            if (!currentUser) {

                alert(
                    'Please login first.'
                );

                return;

            }


            // ----------------------------------------------
            // CHECK JWT TOKEN
            // ----------------------------------------------

            const token =
                getAuthToken();


            if (!token) {

                alert(
                    'Your login session has expired. Please login again.'
                );

                clearAuthStorage();

                currentUser =
                    null;

                updateNavbar();

                return;

            }


            const content =
                postContent
                    ? postContent.value.trim()
                    : '';


            // ----------------------------------------------
            // VALIDATE CONTENT
            // ----------------------------------------------

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


            // ----------------------------------------------
            // LOADING STATE
            // ----------------------------------------------

            createPostBtn.disabled =
                true;

            createPostBtn.textContent =
                'Publishing...';


            try {

                // ------------------------------------------
                // AUTHENTICATED POST REQUEST
                // ------------------------------------------

                const response =
                    await fetch(
                        `${API_BASE_URL}/posts`,
                        {
                            method:
                                'POST',

                            headers:
                                getAuthHeaders(),

                            body:
                                JSON.stringify({

                                    content

                                })
                        }
                    );


                const result =
                    await parseJSONResponse(response);


                // ------------------------------------------
                // UNAUTHORIZED
                // ------------------------------------------

                if (
                    response.status ===
                    401
                ) {

                    alert(
                        result.error ||
                        'Your login session has expired. Please login again.'
                    );

                    clearAuthStorage();

                    currentUser =
                        null;

                    updateNavbar();

                    return;

                }


                // ------------------------------------------
                // OTHER ERROR
                // ------------------------------------------

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


                // ------------------------------------------
                // SUCCESS
                // ------------------------------------------

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


            // ----------------------------------------------
            // REMOVE USER + JWT TOKEN
            // ----------------------------------------------

            clearAuthStorage();


            currentUser =
                null;


            updateHomepagePersonalization();


            window.location.href =
                '../index.html';

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
            USER_STORAGE_KEY ||
            event.key ===
            TOKEN_STORAGE_KEY
        ) {

            restoreUserFromStorage();


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

initializeProfileMenu();

updateNavbar();

loadProfilePage();
