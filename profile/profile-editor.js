"use strict";

/* =========================================================
   PROFILE EDITOR MODULE
   =========================================================
   
   Responsibilities:
   - Edit Profile modal
   - Display name
   - Username
   - Username availability check
   - Bio
   - Date of birth
   - Gender
   - Email display
   - Profile save
   - Profile validation
   - Modal open / close

   This file intentionally does NOT handle:
   - Authentication implementation
   - Avatar upload/remove
   - Posts/comments/likes
   - Dheere AI
   ========================================================= */


/* =========================================================
   IMPORTS
   ========================================================= */

import {

    getCurrentUser,

    getUserId,

    getUsername,

    getAuthHeaders,

    hasValidLoginSession,

    saveCurrentUser,

    updateCurrentUser,

    handleAuthError

} from "./profile-auth.js";


/* =========================================================
   CONFIG
   ========================================================= */

const API_BASE =
    "https://dheere-studio.onrender.com";


const PROFILE_BIO_MAX_LENGTH =
    150;


const PROFILE_GENDERS =
    new Set([
        "",
        "male",
        "female",
        "other"
    ]);


const PROFILE_DATE_REGEX =
    /^\d{4}-\d{2}-\d{2}$/;


const PROFILE_USERNAME_REGEX =
    /^[a-z0-9_]{3,20}$/;


/* =========================================================
   STATE
   ========================================================= */

let usernameCheckTimer =
    null;


let usernameCheckToken =
    0;


let usernameAvailable =
    false;


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const editOverlay =
    document.getElementById(
        "editOverlay"
    );


const closeEditBtn =
    document.getElementById(
        "closeEditBtn"
    );


const cancelEditBtn =
    document.getElementById(
        "cancelEditBtn"
    );


const saveProfileBtn =
    document.getElementById(
        "saveProfileBtn"
    );


const editName =
    document.getElementById(
        "editName"
    );


const editUsername =
    document.getElementById(
        "editUsername"
    );


const editBio =
    document.getElementById(
        "editBio"
    );


const bioCounter =
    document.getElementById(
        "bioCounter"
    );


const editEmail =
    document.getElementById(
        "editEmail"
    );


const editDateOfBirth =
    document.getElementById(
        "editDateOfBirth"
    );


const editGender =
    document.getElementById(
        "editGender"
    );


const usernameStatus =
    document.getElementById(
        "usernameStatus"
    );


/* =========================================================
   RESPONSE HELPER
   ========================================================= */

async function parseResponse(
    response
) {

    try {

        return await response.json();

    } catch {

        return {};

    }

}


/* =========================================================
   DATE VALIDATION
   ========================================================= */

function isValidDateOfBirth(
    value
) {

    /*
     * Empty DOB is allowed because the field is optional.
     */

    if (
        value === ""
    ) {

        return true;

    }


    if (
        typeof value !==
        "string"
    ) {

        return false;

    }


    if (
        !PROFILE_DATE_REGEX.test(
            value
        )
    ) {

        return false;

    }


    const [
        year,
        month,
        day
    ] =
        value
            .split("-")
            .map(
                Number
            );


    if (
        !Number.isInteger(
            year
        ) ||

        !Number.isInteger(
            month
        ) ||

        !Number.isInteger(
            day
        )
    ) {

        return false;

    }


    const date =
        new Date(
            year,
            month - 1,
            day
        );


    /*
     * Prevent JavaScript from normalizing invalid dates.
     *
     * Example:
     * 2026-02-31 should NOT become March 3.
     */

    if (
        date.getFullYear() !==
            year ||

        date.getMonth() !==
            month - 1 ||

        date.getDate() !==
            day
    ) {

        return false;

    }


    /*
     * Future DOB is not allowed.
     */

    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    return (
        date <=
        today
    );

}


/* =========================================================
   USERNAME STATUS
   ========================================================= */

function setUsernameStatus(
    message,
    type = ""
) {

    if (!usernameStatus) {

        return;

    }


    usernameStatus.textContent =
        message ||
        "";


    usernameStatus.classList.remove(

        "available",

        "taken",

        "checking"

    );


    if (type) {

        usernameStatus.classList.add(
            type
        );

    }

}


/* =========================================================
   BIO COUNTER
   ========================================================= */

function updateBioCounter() {

    if (
        !editBio ||
        !bioCounter
    ) {

        return;

    }


    bioCounter.textContent =
        `${editBio.value.length} / ${PROFILE_BIO_MAX_LENGTH}`;

}


/* =========================================================
   SET SAVE BUTTON STATE
   ========================================================= */

function setSaveButtonState(
    disabled,
    text = "Save Changes"
) {

    if (!saveProfileBtn) {

        return;

    }


    saveProfileBtn.disabled =
        disabled;


    saveProfileBtn.textContent =
        text;

}


/* =========================================================
   OPEN MODAL
   ========================================================= */

function openEditModal() {

    const currentUser =
        getCurrentUser();


    if (
        !currentUser ||
        !editOverlay
    ) {

        return false;

    }


    const name =
        String(
            currentUser.name ||
            currentUser.username ||
            "User"
        ).trim();


    const username =
        getUsername(
            currentUser
        );


    /*
     * Fill existing values.
     */

    if (editName) {

        editName.value =
            name;

    }


    if (editUsername) {

        editUsername.value =
            username;

    }


    if (editBio) {

        editBio.value =
            String(
                currentUser.bio ||
                ""
            );

    }


    if (editEmail) {

        editEmail.value =
            String(
                currentUser.email ||
                ""
            );

    }


    if (editDateOfBirth) {

        editDateOfBirth.value =
            String(
                currentUser.dateOfBirth ||
                ""
            );

    }


    if (editGender) {

        editGender.value =
            String(
                currentUser.gender ||
                ""
            )
                .trim()
                .toLowerCase();

    }


    /*
     * Reset username-check state.
     */

    usernameCheckToken++;


    clearTimeout(
        usernameCheckTimer
    );


    usernameAvailable =
        true;


    updateBioCounter();


    setUsernameStatus(
        "",
        ""
    );


    /*
     * Open modal.
     */

    editOverlay.classList.add(
        "active"
    );


    editOverlay.setAttribute(
        "aria-hidden",
        "false"
    );


    setSaveButtonState(
        false,
        "Save Changes"
    );


    return true;

}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeEditModal() {

    if (!editOverlay) {

        return;

    }


    clearTimeout(
        usernameCheckTimer
    );


    usernameCheckToken++;


    editOverlay.classList.remove(
        "active"
    );


    editOverlay.setAttribute(
        "aria-hidden",
        "true"
    );


    usernameAvailable =
        false;

}


/* =========================================================
   USERNAME AVAILABILITY
   ========================================================= */

async function checkUsernameAvailability() {

    const currentUser =
        getCurrentUser();


    if (
        !currentUser ||
        !editUsername
    ) {

        return;

    }


    const username =
        editUsername.value
            .trim()
            .toLowerCase();


    const currentUsername =
        getUsername(
            currentUser
        );


    const userId =
        getUserId(
            currentUser
        );


    /*
     * Empty username.
     */

    if (!username) {

        usernameAvailable =
            false;


        setUsernameStatus(
            "Username is required.",
            "taken"
        );


        return;

    }


    /*
     * User is keeping existing username.
     */

    if (
        username ===
        currentUsername
    ) {

        usernameAvailable =
            true;


        setUsernameStatus(
            "✓ Current username",
            "available"
        );


        return;

    }


    /*
     * Local format validation.
     */

    if (
        !PROFILE_USERNAME_REGEX.test(
            username
        )
    ) {

        usernameAvailable =
            false;


        setUsernameStatus(

            "Username must be 3–20 characters using lowercase letters, numbers or underscores.",

            "taken"

        );


        return;

    }


    if (!userId) {

        usernameAvailable =
            false;


        setUsernameStatus(
            "Your account ID is missing.",
            "taken"
        );


        return;

    }


    const requestToken =
        ++usernameCheckToken;


    setUsernameStatus(
        "Checking username...",
        "checking"
    );


    usernameAvailable =
        false;


    try {

        const response =
            await fetch(

                `${API_BASE}/check-username/${encodeURIComponent(username)}?userId=${encodeURIComponent(userId)}`,

                {

                    method:
                        "GET",

                    headers: {

                        "Accept":
                            "application/json"

                    },

                    cache:
                        "no-store"

                }

            );


        const result =
            await parseResponse(
                response
            );


        /*
         * Ignore stale request.
         */

        if (
            requestToken !==
            usernameCheckToken
        ) {

            return;

        }


        if (
            response.status ===
            401
        ) {

            handleAuthError(
                result?.error
            );


            return;

        }


        /*
         * Explicitly unavailable.
         */

        if (
            response.ok &&
            result?.available ===
                false
        ) {

            usernameAvailable =
                false;


            setUsernameStatus(
                "✕ Username is already taken.",
                "taken"
            );


            return;

        }


        /*
         * Explicitly available.
         */

        if (
            response.ok &&
            result?.available ===
                true
        ) {

            usernameAvailable =
                true;


            setUsernameStatus(
                "✓ Username is available.",
                "available"
            );


            return;

        }


        /*
         * Any unexpected result.
         *
         * The PUT request remains the final authority.
         */

        usernameAvailable =
            false;


        setUsernameStatus(
            "Username will be verified when you save.",
            "checking"
        );


    } catch (error) {

        if (
            requestToken !==
            usernameCheckToken
        ) {

            return;

        }


        console.warn(

            "Username availability check failed:",

            error

        );


        /*
         * IMPORTANT:
         *
         * Do not block profile saving because a
         * pre-check failed.
         *
         * The backend PUT route independently checks
         * username uniqueness.
         */

        usernameAvailable =
            false;


        setUsernameStatus(

            "Username will be verified when you save.",

            "checking"

        );

    }

}


/* =========================================================
   USERNAME INPUT
   ========================================================= */

function handleUsernameInput() {

    clearTimeout(
        usernameCheckTimer
    );


    usernameCheckToken++;


    usernameAvailable =
        false;


    if (!editUsername) {

        return;

    }


    const username =
        editUsername.value
            .trim()
            .toLowerCase();


    const currentUser =
        getCurrentUser();


    const currentUsername =
        getUsername(
            currentUser
        );


    /*
     * Empty input.
     */

    if (!username) {

        setUsernameStatus(
            "Username is required.",
            "taken"
        );


        return;

    }


    /*
     * Same username.
     */

    if (
        username ===
        currentUsername
    ) {

        usernameAvailable =
            true;


        setUsernameStatus(
            "✓ Current username",
            "available"
        );


        return;

    }


    /*
     * Start visual loading state.
     */

    setUsernameStatus(
        "Checking username...",
        "checking"
    );


    /*
     * Debounce network request.
     */

    usernameCheckTimer =
        setTimeout(
            checkUsernameAvailability,
            450
        );

}


/* =========================================================
   FORM VALIDATION
   ========================================================= */

function validateProfileForm() {

    const name =
        editName?.value
            .trim() ||
        "";


    const username =
        editUsername?.value
            .trim()
            .toLowerCase() ||
        "";


    const bio =
        editBio?.value
            .trim() ||
        "";


    const dateOfBirth =
        editDateOfBirth?.value
            .trim() ||
        "";


    const gender =
        editGender?.value
            .trim()
            .toLowerCase() ||
        "";


    /*
     * Name.
     */

    if (!name) {

        alert(
            "Display name cannot be empty."
        );


        editName?.focus();


        return null;

    }


    if (
        name.length >
        80
    ) {

        alert(
            "Display name cannot exceed 80 characters."
        );


        editName?.focus();


        return null;

    }


    /*
     * Username.
     */

    if (
        !PROFILE_USERNAME_REGEX.test(
            username
        )
    ) {

        alert(

            "Username must be 3–20 characters using lowercase letters, numbers or underscores."

        );


        editUsername?.focus();


        return null;

    }


    /*
     * Bio.
     */

    if (
        bio.length >
        PROFILE_BIO_MAX_LENGTH
    ) {

        alert(

            `Bio cannot be longer than ${PROFILE_BIO_MAX_LENGTH} characters.`

        );


        editBio?.focus();


        return null;

    }


    /*
     * DOB.
     */

    if (
        !isValidDateOfBirth(
            dateOfBirth
        )
    ) {

        alert(
            "Please enter a valid date of birth."
        );


        editDateOfBirth?.focus();


        return null;

    }


    /*
     * Gender.
     */

    if (
        !PROFILE_GENDERS.has(
            gender
        )
    ) {

        alert(
            "Please select a valid gender option."
        );


        editGender?.focus();


        return null;

    }


    return {

        name,

        username,

        bio,

        dateOfBirth,

        gender

    };

}


/* =========================================================
   SAVE PROFILE
   ========================================================= */

async function saveProfile() {

    /*
     * Always read the latest current user from
     * the authentication module.
     */

    const currentUser =
        getCurrentUser();


    if (
        !currentUser ||
        !hasValidLoginSession()
    ) {

        alert(
            "Please login again."
        );


        return false;

    }


    /*
     * Validate form.
     */

    const formData =
        validateProfileForm();


    if (!formData) {

        return false;

    }


    const userId =
        getUserId(
            currentUser
        );


    if (!userId) {

        alert(
            "Your account ID is missing. Please log in again."
        );


        return false;

    }


    const currentUsername =
        getUsername(
            currentUser
        );


    /*
     * Disable save button during request.
     */

    setSaveButtonState(
        true,
        "Saving..."
    );


    try {

        /*
         * Optional username pre-check.
         *
         * IMPORTANT:
         * This is NOT required for save.
         * The backend remains authoritative.
         */

        if (
            formData.username !==
            currentUsername
        ) {

            try {

                const availabilityResponse =
                    await fetch(

                        `${API_BASE}/check-username/${encodeURIComponent(formData.username)}?userId=${encodeURIComponent(userId)}`,

                        {

                            method:
                                "GET",

                            headers: {

                                "Accept":
                                    "application/json"

                            },

                            cache:
                                "no-store"

                        }

                    );


                const availabilityResult =
                    await parseResponse(
                        availabilityResponse
                    );


                /*
                 * Explicit server confirmation that username
                 * is taken. Stop before the PUT.
                 */

                if (
                    availabilityResponse.ok
                    &&
                    availabilityResult?.available ===
                        false
                ) {

                    usernameAvailable =
                        false;


                    setUsernameStatus(
                        "✕ Username is already taken.",
                        "taken"
                    );


                    alert(
                        "Username is already taken."
                    );


                    editUsername?.focus();


                    return false;

                }

            } catch (availabilityError) {

                /*
                 * Do nothing here.
                 *
                 * The main PUT request must still happen.
                 */

                console.warn(

                    "Username pre-check failed; continuing with profile save:",

                    availabilityError

                );

            }

        }


        /*
         * AUTHORITATIVE PROFILE UPDATE.
         */

        const response =
            await fetch(

                `${API_BASE}/profile/${encodeURIComponent(userId)}`,

                {

                    method:
                        "PUT",

                    headers:
                        getAuthHeaders(),

                    body:
                        JSON.stringify({

                            name:
                                formData.name,

                            username:
                                formData.username,

                            bio:
                                formData.bio,

                            dateOfBirth:
                                formData.dateOfBirth,

                            gender:
                                formData.gender

                        })

                }

            );


        const result =
            await parseResponse(
                response
            );


        /*
         * Unauthorized.
         */

        if (
            response.status ===
            401
        ) {

            handleAuthError(
                result?.error
            );


            return false;

        }


        /*
         * Forbidden.
         */

        if (
            response.status ===
            403
        ) {

            alert(

                result?.error ||

                "You are not authorized to update this profile."

            );


            return false;

        }


        /*
         * Username conflict.
         */

        if (
            response.status ===
            409
        ) {

            usernameAvailable =
                false;


            setUsernameStatus(
                "✕ Username is already taken.",
                "taken"
            );


            editUsername?.focus();


            alert(

                result?.error ||

                "Username is already taken."

            );


            return false;

        }


        /*
         * Any other unsuccessful response.
         */

        if (
            !response.ok ||
            result?.success !==
                true
        ) {

            throw new Error(

                result?.error ||

                `Profile update failed (${response.status}).`

            );

        }


        /*
         * Backend returns the updated user.
         */

        const updatedUser =
            result?.user ||
            result?.profile ||
            null;


        /*
         * Update auth module state.
         */

        if (updatedUser) {

            updateCurrentUser(
                updatedUser
            );

        }


        /*
         * Ensure the fields from the form are present even
         * when backend response omits an optional field.
         */

        updateCurrentUser({

            name:
                formData.name,

            username:
                formData.username,

            bio:
                formData.bio,

            dateOfBirth:
                formData.dateOfBirth,

            gender:
                formData.gender

        });


        /*
         * Persist to localStorage.
         */

        saveCurrentUser();


        /*
         * Notify the main profile module.
         *
         * profile/profile.js can listen to this event and
         * refresh the visible profile UI.
         */

        window.dispatchEvent(

            new CustomEvent(
                "dheere:profile-updated",
                {
                    detail: {

                        user:
                            getCurrentUser()

                    }
                }
            )

        );


        /*
         * Close modal only AFTER successful server save.
         */

        closeEditModal();


        return true;


    } catch (error) {

        console.error(
            "Save profile error:",
            error
        );


        alert(

            error?.message ||

            "Unable to update your profile."

        );


        return false;


    } finally {

        /*
         * Always restore button state.
         */

        setSaveButtonState(
            false,
            "Save Changes"
        );

    }

}


/* =========================================================
   EVENT SETUP
   ========================================================= */

function setupEditorEvents() {

    if (closeEditBtn) {

        closeEditBtn.addEventListener(
            "click",
            closeEditModal
        );

    }


    if (cancelEditBtn) {

        cancelEditBtn.addEventListener(
            "click",
            closeEditModal
        );

    }


    /*
     * Click outside modal.
     */

    if (editOverlay) {

        editOverlay.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    editOverlay
                ) {

                    closeEditModal();

                }

            }
        );

    }


    /*
     * Escape key.
     */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            if (
                editOverlay?.classList.contains(
                    "active"
                )
            ) {

                closeEditModal();

            }

        }
    );


    /*
     * Username.
     */

    if (editUsername) {

        editUsername.addEventListener(
            "input",
            handleUsernameInput
        );


        editUsername.addEventListener(
            "blur",
            () => {

                clearTimeout(
                    usernameCheckTimer
                );


                const currentUser =
                    getCurrentUser();


                const username =
                    editUsername.value
                        .trim()
                        .toLowerCase();


                const currentUsername =
                    getUsername(
                        currentUser
                    );


                if (
                    username ===
                    currentUsername
                ) {

                    usernameAvailable =
                        true;


                    setUsernameStatus(
                        "✓ Current username",
                        "available"
                    );


                    return;

                }


                checkUsernameAvailability();

            }
        );

    }


    /*
     * Bio counter.
     */

    if (editBio) {

        editBio.addEventListener(
            "input",
            updateBioCounter
        );

    }


    /*
     * Save button.
     */

    if (saveProfileBtn) {

        saveProfileBtn.addEventListener(
            "click",
            async event => {

                event.preventDefault();

                await saveProfile();

            }
        );

    }


}


/* =========================================================
   PUBLIC INITIALIZATION
   ========================================================= */

function initializeProfileEditor() {

    setupEditorEvents();


    /*
     * Profile page's main Edit Profile button is intentionally
     * wired here so profile.js does not need to know editor DOM.
     */

    const editProfileBtn =
        document.getElementById(
            "editProfileBtn"
        );


    const avatarQuickEdit =
        document.getElementById(
            "avatarQuickEdit"
        );


    if (editProfileBtn) {

        editProfileBtn.addEventListener(
            "click",
            openEditModal
        );

    }


    if (avatarQuickEdit) {

        avatarQuickEdit.addEventListener(
            "click",
            openEditModal
        );

    }


    /*
     * Initial button state.
     */

    setSaveButtonState(
        false,
        "Save Changes"
    );


    updateBioCounter();

}


/* =========================================================
   EXPORTS
   ========================================================= */

export {

    initializeProfileEditor,

    openEditModal,

    closeEditModal,

    saveProfile,

    checkUsernameAvailability,

    updateBioCounter,

    setUsernameStatus,

    isValidDateOfBirth

};