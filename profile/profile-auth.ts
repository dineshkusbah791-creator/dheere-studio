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

const STORAGE_KEY = "dheereStudioUser";
const TOKEN_STORAGE_KEY = "dheereStudioToken";

type ProfileUser = Record<string, any>;
type AuthHeaders = Record<string, string>;

let currentUser: ProfileUser | null = null;

function getAuthToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function getAuthHeaders(): AuthHeaders {
    const token = getAuthToken();

    const headers: AuthHeaders = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

function hasValidLoginSession(): boolean {
    return Boolean(
        currentUser &&
        getAuthToken()
    );
}

function getCurrentUser(): ProfileUser | null {
    return currentUser;
}

function setCurrentUser(user: ProfileUser | null): void {
    currentUser = user || null;
}

function clearAuthStorage(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);

    currentUser = null;
}

function handleAuthError(message?: string): void {
    clearAuthStorage();

    alert(
        message ||
        "Authentication required. Please login again."
    );

    window.location.href = "../index.html";
}

function saveCurrentUser(
    user: ProfileUser | null = currentUser
): boolean {
    if (!user) {
        return false;
    }

    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(user)
        );

        return true;
    } catch (error) {
        console.error(
            "Could not save current user:",
            error
        );

        return false;
    }
}

function loadStoredUser(): boolean {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            currentUser = null;
            return false;
        }

        const token = getAuthToken();

        if (!token) {
            currentUser = null;
            return false;
        }

        const parsedUser: unknown = JSON.parse(saved);

        if (
            !parsedUser ||
            typeof parsedUser !== "object"
        ) {
            currentUser = null;
            clearAuthStorage();
            return false;
        }

        currentUser = parsedUser as ProfileUser;
        return true;
    } catch (error) {
        console.error(
            "Stored user error:",
            error
        );

        clearAuthStorage();
        return false;
    }
}

function updateCurrentUser(
    updates: ProfileUser | null
): boolean {
    if (
        !currentUser ||
        !updates ||
        typeof updates !== "object"
    ) {
        return false;
    }

    currentUser = {
        ...currentUser,
        ...updates
    };

    return true;
}

function getUserId(
    user: ProfileUser | null = currentUser
): string {
    return String(
        user?._id ||
        user?.id ||
        user?.userId ||
        user?.user?._id ||
        user?.user?.id ||
        ""
    ).trim();
}

function getUsername(
    user: ProfileUser | null = currentUser
): string {
    return String(
        user?.username ||
        user?.user?.username ||
        ""
    )
        .trim()
        .toLowerCase();
}

function getDisplayName(
    user: ProfileUser | null = currentUser
): string {
    return String(
        user?.name ||
        user?.user?.name ||
        user?.username ||
        "User"
    ).trim();
}

function getUserEmail(
    user: ProfileUser | null = currentUser
): string {
    return String(
        user?.email ||
        user?.user?.email ||
        ""
    ).trim();
}

function getAvatarUrl(
    user: ProfileUser | null = currentUser
): string {
    return String(
        user?.avatarUrl ||
        user?.avatar ||
        user?.user?.avatarUrl ||
        ""
    ).trim();
}

function getAuthState(): {
    user: ProfileUser | null;
    userId: string;
    username: string;
    token: string | null;
    authenticated: boolean;
} {
    return {
        user: currentUser,
        userId: getUserId(),
        username: getUsername(),
        token: getAuthToken(),
        authenticated: hasValidLoginSession()
    };
}

function logout(): void {
    clearAuthStorage();

    window.location.href = "../index.html";
}

function handleStorageChange(
    event: StorageEvent
): boolean {
    if (
        event.key === STORAGE_KEY ||
        event.key === TOKEN_STORAGE_KEY
    ) {
        const loaded = loadStoredUser();
        return loaded;
    }

    return false;
}

function initializeAuth(): boolean {
    return loadStoredUser();
}

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
