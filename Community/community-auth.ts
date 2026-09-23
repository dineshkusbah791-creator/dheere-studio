// ============================================================
// COMMUNITY AUTH
// Authentication helpers for Dheere Studio Community
// ============================================================

"use strict";


// ============================================================
// TYPES
// ============================================================

type CommunityUser = Record<string, any>;

type AuthError = Error & {
    code?: string;
};



// ============================================================
// STORAGE KEYS
// ============================================================

const USER_STORAGE_KEY =
    "dheereStudioUser";


const TOKEN_STORAGE_KEY =
    "dheereStudioToken";



// ============================================================
// GET AUTH TOKEN
// ============================================================

function getAuthToken(): string | null {

    return localStorage.getItem(
        TOKEN_STORAGE_KEY
    );

}



// ============================================================
// GET CURRENT USER
// ============================================================

function getCurrentUser(): CommunityUser | null {

    try {

        const savedUser =
            localStorage.getItem(
                USER_STORAGE_KEY
            );


        if (
            !savedUser
        ) {

            return null;

        }


        const user: unknown =
            JSON.parse(
                savedUser
            );


        if (
            !user ||
            typeof user !== "object"
        ) {

            return null;

        }


        return user as CommunityUser;


    } catch (
        error
    ) {

        console.error(
            "Community user data error:",
            error
        );


        clearAuthStorage();


        return null;

    }

}



// ============================================================
// GET USERNAME
// ============================================================

function getUsername(
    user: CommunityUser | null = getCurrentUser()
): string {

    return String(

        user?.username ||

        user?.user?.username ||

        ""

    ).trim();

}



// ============================================================
// GET USER ID
// ============================================================

function getUserId(
    user: CommunityUser | null = getCurrentUser()
): string {

    return String(

        user?.id ||

        user?._id ||

        user?.user?.id ||

        user?.user?._id ||

        ""

    ).trim();

}



// ============================================================
// CHECK LOGIN SESSION
// ============================================================

function hasValidLoginSession(): boolean {

    const user =
        getCurrentUser();


    const token =
        getAuthToken();


    return Boolean(
        user &&
        token
    );

}



// ============================================================
// GET AUTH HEADERS
// ============================================================

function getAuthHeaders(): Record<string, string> {

    const token =
        getAuthToken();


    const headers: Record<string, string> = {

        "Content-Type":
            "application/json",

        "Accept":
            "application/json"

    };


    if (
        token
    ) {

        headers.Authorization =
            `Bearer ${token}`;

    }


    return headers;

}



// ============================================================
// CLEAR AUTH STORAGE
// ============================================================

function clearAuthStorage(): void {

    try {

        localStorage.removeItem(
            USER_STORAGE_KEY
        );

    } catch (
        error
    ) {

        console.error(
            "Could not clear community user storage:",
            error
        );

    }


    try {

        localStorage.removeItem(
            TOKEN_STORAGE_KEY
        );

    } catch (
        error
    ) {

        console.error(
            "Could not clear community token storage:",
            error
        );

    }

}



// ============================================================
// HANDLE AUTH ERROR
// ============================================================

function handleAuthError(
    message = ""
): AuthError {

    clearAuthStorage();


    /*
     * Keep this function UI-agnostic.
     *
     * community.js will decide how the page should
     * react after the session is cleared.
     */

    const authError =
        new Error(

            message ||

            "Your login session has expired. Please login again."

        ) as AuthError;


    authError.code =
        "AUTH_REQUIRED";


    return authError;

}



// ============================================================
// REQUIRE AUTHENTICATION
// ============================================================

function requireAuthentication(): boolean {

    if (
        hasValidLoginSession()
    ) {

        return true;

    }


    return false;

}



// ============================================================
// HANDLE FETCH RESPONSE AUTH
// ============================================================

async function handleAuthenticatedResponse(
    response: Response
): Promise<AuthError | null> {

    if (
        response.status !==
        401
    ) {

        return null;

    }


    let result: CommunityUser | null =
        null;


    try {

        result =
            await response.clone().json();

    } catch (
        error
    ) {

        result =
            null;

    }


    return handleAuthError(
        result?.error
    );

}



// ============================================================
// MODULE EXPORTS
// ============================================================

export {

    USER_STORAGE_KEY,

    TOKEN_STORAGE_KEY,

    getAuthToken,

    getCurrentUser,

    getUsername,

    getUserId,

    hasValidLoginSession,

    getAuthHeaders,

    clearAuthStorage,

    handleAuthError,

    requireAuthentication,

    handleAuthenticatedResponse

};
