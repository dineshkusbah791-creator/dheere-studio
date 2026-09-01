"use strict";

/* =========================================================
   PROFILE AUTH MODULE
   =========================================================
   
   Responsibilities:
   - JWT token access
   - Authorization headers
   - Current user session
   - LocalStorage persistence
   - Login-session validation
   - Logout / auth cleanup
   - Auth failure handling
   - User identity helpers

   This file intentionally does NOT handle:
   - Profile editing
   - Avatar/photo
   - Posts/comments
   - Dheere AI
   ========================================================= */


/* =========================================================
   CONFIG
   ========================================================= */

const STORAGE_KEY =
    "dheereStudioUser";

const TOKEN_STORAGE_KEY =
    "dheereStudioToken";


/* =========================================================
   STATE
   ========================================================= */

let currentUser =
    null;


/* =========================================================
   TOKEN
   ========================================================= */

function getAuthToken() {

    return localStorage.getItem(
        TOKEN_STORAGE_KEY
    );

}


/* =========================================================
   AUTH HEADERS
   ========================================================= */

function getAuthHeaders() {

    const token =
        getAuthToken();


    const headers = {

        "Content-Type":
            "application/json",

        "Accept":
            "application/json"

    };


    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }


    return headers;

}


/* =========================================================
   SESSION CHECK
   ========================================================= */

function hasValidLoginSession() {

    return Boolean(

        currentUser &&

        getAuthToken()

    );

}


/* =========================================================
   CURRENT USER
   ========================================================= */

function getCurrentUser() {

    return currentUser;

}


function setCurrentUser(
    user
) {

    currentUser =
        user || null;

}


/* =========================================================
   CLEAR AUTH STORAGE
   ========================================================= */

function clearAuthStorage() {

    localStorage.removeItem(
        STORAGE_KEY
    );


    localStorage.removeItem(
        TOKEN_STORAGE_KEY
    );


    currentUser =
        null;

}


/* =========================================================
   AUTH ERROR
   ========================================================= */

function handleAuthError(
    message
) {

    clearAuthStorage();


    alert(

        message ||

        "Authentication required. Please login again."

    );


    window.location.href =
        "../index.html";

}


/* =========================================================
   SAVE CURRENT USER
   ========================================================= */

function saveCurrentUser(
    user = currentUser
) {

    if (!user) {

        return false;

    }


    try {

        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(
                user
            )

        );


        return true;

    } catch (
        error
    ) {

        console.error(

            "Could not save current user:",

            error

        );


        return false;

    }

}


/* =========================================================
   LOAD STORED USER
   ========================================================= */

function loadStoredUser() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!saved) {

            currentUser =
                null;

            return false;

        }


        const token =
            getAuthToken();


        if (!token) {

            currentUser =
                null;

            return false;

        }


        const parsedUser =
            JSON.parse(
                saved
            );


        if (
            !parsedUser ||
            typeof parsedUser !==
            "object"
        ) {

            currentUser =
                null;

            clearAuthStorage();

            return false;

        }


        currentUser =
            parsedUser;


        return true;

    } catch (
        error
    ) {

        console.error(

            "Stored user error:",

            error

        );


        clearAuthStorage();


        return false;

    }

}


/* =========================================================
   UPDATE CURRENT USER
   ========================================================= */

function updateCurrentUser(
    updates
) {

    if (
        !currentUser ||
        !updates ||
        typeof updates !==
            "object"
    ) {

        return false;

    }


    currentUser = {

        ...currentUser,

        ...updates

    };


    return true;

}


/* =========================================================
   USER ID
   ========================================================= */

function getUserId(
    user = currentUser
) {

    return String(

        user?._id ||

        user?.id ||

        user?.userId ||

        user?.user?._id ||

        user?.user?.id ||

        ""

    ).trim();

}


/* =========================================================
   USERNAME
   ========================================================= */

function getUsername(
    user = currentUser
) {

    return String(

        user?.username ||

        user?.user?.username ||

        ""

    )
        .trim()
        .toLowerCase();

}


/* =========================================================
   DISPLAY NAME
   ========================================================= */

function getDisplayName(
    user = currentUser
) {

    return String(

        user?.name ||

        user?.user?.name ||

        user?.username ||

        "User"

    ).trim();

}


/* =========================================================
   EMAIL
   ========================================================= */

function getUserEmail(
    user = currentUser
) {

    return String(

        user?.email ||

        user?.user?.email ||

        ""

    ).trim();

}


/* =========================================================
   AVATAR URL
   ========================================================= */

function getAvatarUrl(
    user = currentUser
) {

    return String(

        user?.avatarUrl ||

        user?.avatar ||

        user?.user?.avatarUrl ||

        ""

    ).trim();

}


/* =========================================================
   AUTH STORAGE SNAPSHOT
   ========================================================= */

function getAuthState() {

    return {

        user:
            currentUser,

        userId:
            getUserId(),

        username:
            getUsername(),

        token:
            getAuthToken(),

        authenticated:
            hasValidLoginSession()

    };

}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {

    clearAuthStorage();


    window.location.href =
        "../index.html";

}


/* =========================================================
   STORAGE EVENT
   ========================================================= */

function handleStorageChange(
    event
) {

    if (
        event.key ===
            STORAGE_KEY ||
        event.key ===
            TOKEN_STORAGE_KEY
    ) {

        const loaded =
            loadStoredUser();


        return loaded;

    }


    return false;

}


/* =========================================================
   INITIALIZE AUTH
   ========================================================= */

function initializeAuth() {

    return loadStoredUser();

}


/* =========================================================
   EXPORTS
   ========================================================= */

export {

    STORAGE_KEY,

    TOKEN_STORAGE_KEY,

    getAuthToken,

    getAuthHeaders,

    hasValidLoginSession,

    getCurrentUser,

    setCurrentUser,

    updateCurrentUser,

    clearAuthStorage,

    handleAuthError,

    saveCurrentUser,

    loadStoredUser,

    initializeAuth,

    getAuthState,

    getUserId,

    getUsername,

    getDisplayName,

    getUserEmail,

    getAvatarUrl,

    handleStorageChange,

    logout

};