"use strict";

/* =========================================================
   PROFILE MAIN CONTROLLER
   =========================================================

   Responsibilities:
   - Initialize profile modules
   - Load stored authentication state
   - Load latest public profile data
   - Render profile identity
   - Handle logged-in / logged-out UI
   - React to profile updates
   - React to avatar updates
   - Cross-tab session synchronization
   - Page visibility refresh

   Module responsibilities:
   - profile-auth.js
       Authentication + current-user state

   - profile-editor.js
       Edit Profile + Save Changes

   - profile-media.js
       Avatar + profile photo

   - profile-social.js
       Posts + comments + likes

   Dheere AI is intentionally NOT handled here.
   ========================================================= */


/* =========================================================
   IMPORTS
   ========================================================= */

import {

    initializeAuth,

    getCurrentUser,

    getUserId,

    getDisplayName,

    getUsername,

    getAuthHeaders,

    hasValidLoginSession,

    saveCurrentUser,

    updateCurrentUser,

    clearAuthStorage,
    
    handleAuthError,
    
    logout,
    
    handleStorageChange

} from "./profile-auth.js";


import {

    initializeProfileEditor

} from "./profile-editor.js";


import {

    initializeProfileMedia,

    renderAvatar

} from "./profile-media.js";


import {

    initializeProfileSocial,

    loadUserPosts

} from "./profile-social.js";


/* =========================================================
   CONFIG
   ========================================================= */

const API_BASE =
    "https://dheere-studio.onrender.com";


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const authenticatedContent =
    document.getElementById(
        "authenticatedContent"
    );


const loginMessage =
    document.getElementById(
        "loginMessage"
    );


const profileName =
    document.getElementById(
        "profileName"
    );


const profileUsername =
    document.getElementById(
        "profileUsername"
    );


const profileEmail =
    document.getElementById(
        "profileEmail"
    );


const profileBio =
    document.getElementById(
        "profileBio"
    );


const profileAvatar =
    document.getElementById(
        "profileAvatar"
    );


const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


/* =========================================================
   PROFILE DISPLAY
   ========================================================= */

function updateProfileDisplay() {

    const currentUser =
        getCurrentUser();


    if (!currentUser) {

        return;

    }


    const name =
        getDisplayName(
            currentUser
        );


    const username =
        getUsername(
            currentUser
        );


    const email =
        String(

            currentUser?.email ||

            currentUser?.user?.email ||

            ""

        ).trim();


    const bio =
        String(

            currentUser?.bio ||

            ""

        );


    const avatar =
        String(

            currentUser?.avatarUrl ||

            currentUser?.avatar ||

            currentUser?.user?.avatarUrl ||

            ""

        ).trim();


    /* -----------------------------------------------------
       NAME
       ----------------------------------------------------- */

    if (profileName) {

        profileName.textContent =
            name;

    }


    /* -----------------------------------------------------
       USERNAME
       ----------------------------------------------------- */

    if (profileUsername) {

        profileUsername.textContent =

            username

                ? `@${username}`

                : "";

    }


    /* -----------------------------------------------------
       EMAIL
       ----------------------------------------------------- */

    if (profileEmail) {

        profileEmail.textContent =

            email ||

            "Not available";

    }


    /* -----------------------------------------------------
       BIO
       ----------------------------------------------------- */

    if (profileBio) {

        profileBio.textContent =
            bio ||
            "Add a bio to tell people a little about yourself.";


        profileBio.classList.toggle(

            "empty",

            !bio

        );

    }


    /* -----------------------------------------------------
       AVATAR
       ----------------------------------------------------- */

    renderAvatar(

        profileAvatar,

        name,

        avatar

    );

}


/* =========================================================
   LOGIN / LOGOUT UI
   ========================================================= */

function showLoginState() {

    if (authenticatedContent) {

        authenticatedContent.style.display =
            "none";

    }


    if (loginMessage) {

        loginMessage.style.display =
            "block";

    }

}


function showAuthenticatedState() {

    if (authenticatedContent) {

        authenticatedContent.style.display =
            "block";

    }


    if (loginMessage) {

        loginMessage.style.display =
            "none";

    }

}


/* =========================================================
   PROFILE LOAD STATE
   ========================================================= */

function loadProfileState() {

    const loaded =
        initializeAuth();


    if (!loaded) {

        showLoginState();

        return false;

    }


    if (!hasValidLoginSession()) {

        showLoginState();

        return false;

    }


    showAuthenticatedState();


    updateProfileDisplay();


    return true;

}


/* =========================================================
   SERVER PROFILE REFRESH
   ========================================================= */

async function refreshProfileFromServer() {

    const currentUser =
        getCurrentUser();


    if (
        !currentUser ||
        !hasValidLoginSession()
    ) {

        return false;

    }


    const userId =
        getUserId(
            currentUser
        );


    if (!userId) {

        console.error(
            "Profile refresh failed: user ID is missing."
        );


        return false;

    }


    try {

        const response =
            await fetch(

                `${API_BASE}/profile/${encodeURIComponent(userId)}`,

                {

                    method:
                        "GET",

                    /*
                     * The endpoint is public, but sending the
                     * token is harmless and keeps request handling
                     * consistent with the authenticated profile UI.
                     */

                    headers:
                        getAuthHeaders(),

                    cache:
                        "no-store"

                }

            );


        let result = {};


        try {

            result =
                await response.json();

        } catch {

            result =
                {};

        }


        /* -----------------------------------------------------
           SESSION EXPIRED
           ----------------------------------------------------- */

        if (
            response.status ===
            401
        ) {

            handleAuthError(
                result?.error
            );


            return false;

        }


        /* -----------------------------------------------------
           USER NOT FOUND
           ----------------------------------------------------- */

        if (
            response.status ===
            404
        ) {

            console.error(
                "Profile refresh: user not found."
            );


            /*
             * Do not immediately destroy a valid local
             * session here. The account may simply have
             * temporarily failed to load.
             */

            return false;

        }


        /* -----------------------------------------------------
           OTHER SERVER ERRORS
           ----------------------------------------------------- */

        if (
            !response.ok ||
            result?.success ===
                false
        ) {

            throw new Error(

                result?.error ||

                `Could not refresh profile (${response.status}).`

            );

        }


        const serverUser =
            result?.user ||
            result?.profile ||
            null;


        if (!serverUser) {

            return false;

        }


        /*
         * IMPORTANT:
         *
         * Merge server public profile fields into the local
         * user rather than replacing the entire user object.
         *
         * This preserves locally stored private fields such as
         * dateOfBirth and gender because the public GET endpoint
         * intentionally does not return them.
         */

        updateCurrentUser({

            ...serverUser

        });


        saveCurrentUser();


        updateProfileDisplay();


        return true;


    } catch (error) {

        console.error(

            "Refresh profile error:",

            error

        );


        return false;

    }

}


/* =========================================================
   REFRESH EVERYTHING
   ========================================================= */

async function refreshProfilePage() {

    const loaded =
        loadProfileState();


    if (!loaded) {

        return;

    }


    await refreshProfileFromServer();


    const currentUser =
        getCurrentUser();


    if (
        currentUser &&
        getUsername(
            currentUser
        )
    ) {

        await loadUserPosts();

    }

}


/* =========================================================
   PROFILE UPDATE EVENT
   ========================================================= */

function setupProfileUpdateListener() {

    window.addEventListener(

        "dheere:profile-updated",

        event => {

            const updatedUser =
                event?.detail?.user;


            if (
                updatedUser &&
                typeof updatedUser ===
                    "object"
            ) {

                updateCurrentUser(
                    updatedUser
                );

            }


            saveCurrentUser();


            updateProfileDisplay();


            /*
             * profile-social.js also listens for this event
             * and reloads posts using the new username.
             */

        }

    );

}


/* =========================================================
   AVATAR UPDATE EVENT
   ========================================================= */

function setupAvatarUpdateListener() {

    window.addEventListener(

        "dheere:profile-avatar-updated",

        event => {

            const avatarUrl =
                String(

                    event?.detail?.avatarUrl ||

                    ""

                ).trim();


            updateCurrentUser({

                avatarUrl

            });


            saveCurrentUser();


            updateProfileDisplay();

        }

    );

}


/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {

    if (!logoutBtn) {

        return;

    }


    logoutBtn.addEventListener(

        "click",

        event => {

            event.preventDefault();


            logout();

        }

    );

}


/* =========================================================
   CROSS-TAB AUTH SYNC
   ========================================================= */

function setupStorageSync() {

    window.addEventListener(

        "storage",

        event => {

            if (
                event.key !==
                    "dheereStudioUser" &&
                event.key !==
                    "dheereStudioToken"
            ) {

                return;

            }


            const loaded =
                handleStorageChange(
                    event
                );


            if (!loaded) {

                showLoginState();

                return;

            }


            showAuthenticatedState();


            updateProfileDisplay();


            refreshProfileFromServer();

            loadUserPosts();

        }

    );

}


/* =========================================================
   PAGE SHOW
   ========================================================= */

function setupPageShow() {

    window.addEventListener(

        "pageshow",

        async () => {

            await refreshProfilePage();

        }

    );

}


/* =========================================================
   VISIBILITY REFRESH
   ========================================================= */

function setupVisibilityRefresh() {

    document.addEventListener(

        "visibilitychange",

        async () => {

            if (
                document.visibilityState !==
                "visible"
            ) {

                return;

            }


            /*
             * Refresh only when the profile page becomes
             * visible again. This keeps data reasonably fresh
             * without continuously polling the backend.
             */

            const currentUser =
                getCurrentUser();


            if (
                currentUser &&
                hasValidLoginSession()
            ) {

                await refreshProfileFromServer();

                await loadUserPosts();

            }

        }

    );

}


/* =========================================================
   INITIALIZE MODULES
   ========================================================= */

function initializeModules() {

    /*
     * Editor:
     * Edit Profile / Save Changes
     */

    initializeProfileEditor();


    /*
     * Media:
     * Avatar / Change Photo / Remove Photo
     */

    initializeProfileMedia();


    /*
     * Social:
     * Posts / Comments / Likes / Create Post
     */

    initializeProfileSocial();

}


/* =========================================================
   MAIN INITIALIZATION
   ========================================================= */

async function initializeProfilePage() {

    /*
     * First initialize child modules so all event listeners
     * are ready before any user interaction is possible.
     */

    initializeModules();


    /*
     * Global events.
     */

    setupProfileUpdateListener();

    setupAvatarUpdateListener();

    setupLogout();

    setupStorageSync();

    setupPageShow();

    setupVisibilityRefresh();


    /*
     * Initial auth/profile state.
     */

    const loaded =
        loadProfileState();


    if (!loaded) {

        return;

    }


    /*
     * Fetch authoritative public profile data.
     */

    await refreshProfileFromServer();


    /*
     * Load posts after profile data has been synchronized.
     */

    await loadUserPosts();

}


/* =========================================================
   START
   ========================================================= */

initializeProfilePage();


/* =========================================================
   PUBLIC EXPORTS
   ========================================================= */

export {

    updateProfileDisplay,

    loadProfileState,

    refreshProfileFromServer,

    refreshProfilePage

};