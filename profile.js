"use strict";

/* =========================================================
   CONFIG
   ========================================================= */

const API_BASE =
    "https://dheere-studio.onrender.com";

const STORAGE_KEY =
    "dheereStudioUser";


/* =========================================================
   STATE
   ========================================================= */

let currentUser = null;

let currentAvatar = null;

let aiBusy = false;

let usernameCheckTimer = null;

let usernameCheckToken = 0;

let usernameAvailable = false;


/* =========================================================
   ELEMENTS
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

const profilePostCount =
    document.getElementById(
        "profilePostCount"
    );

const editProfileBtn =
    document.getElementById(
        "editProfileBtn"
    );

const avatarQuickEdit =
    document.getElementById(
        "avatarQuickEdit"
    );

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

const postsFeed =
    document.getElementById(
        "postsFeed"
    );

const postContent =
    document.getElementById(
        "postContent"
    );

const postCharacterCount =
    document.getElementById(
        "postCharacterCount"
    );

const createPostBtn =
    document.getElementById(
        "createPostBtn"
    );

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

const editAvatar =
    document.getElementById(
        "editAvatar"
    );

const changePhotoBtn =
    document.getElementById(
        "changePhotoBtn"
    );

const removePhotoBtn =
    document.getElementById(
        "removePhotoBtn"
    );

const photoInput =
    document.getElementById(
        "photoInput"
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

const dheereAiForm =
    document.getElementById(
        "dheereAiForm"
    );

const dheereAiInput =
    document.getElementById(
        "dheereAiInput"
    );

const dheereAiSend =
    document.getElementById(
        "dheereAiSend"
    );

const dheereAiMessages =
    document.getElementById(
        "dheereAiMessages"
    );

const dheereAiTyping =
    document.getElementById(
        "dheereAiTyping"
    );

const dheereAiStatus =
    document.getElementById(
        "dheereAiStatus"
    );

const dheereAiStatusText =
    document.getElementById(
        "dheereAiStatusText"
    );


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        String(value ?? "");

    return div.innerHTML;

}


function getUserId(user) {

    return (
        user?._id ||
        user?.id ||
        user?.userId ||
        ""
    );

}


function getUsername(user) {

    return String(
        user?.username ||
        ""
    )
        .trim()
        .toLowerCase();

}


function getDisplayName(user) {

    return String(
        user?.name ||
        "User"
    ).trim();

}


function saveCurrentUser() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
            currentUser
        )
    );

}


/* =========================================================
   INITIALS
   ========================================================= */

function getInitials(name) {

    const value =
        String(
            name || "User"
        ).trim();

    if (!value) {
        return "U";
    }

    const parts =
        value.split(/\s+/);

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


/* =========================================================
   AVATAR
   ========================================================= */

function renderAvatar(
    element,
    name,
    image
) {

    if (!element) {
        return;
    }

    element.replaceChildren();


    if (image) {

        const img =
            document.createElement(
                "img"
            );

        img.src =
            image;

        img.alt =
            `${name || "Profile"} photo`;

        img.loading =
            "eager";

        img.decoding =
            "async";


        img.addEventListener(
            "error",
            () => {

                element.textContent =
                    getInitials(
                        name
                    );

            },
            {
                once: true
            }
        );


        element.appendChild(
            img
        );

        return;

    }


    element.textContent =
        getInitials(
            name
        );

}


function getAvatarUrl(user = currentUser) {

    return String(
        user?.avatarUrl ||
        ""
    ).trim();

}


/* =========================================================
   PROFILE PHOTO COMPRESSION
   ========================================================= */

function compressProfilePhoto(file) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const reader =
                new FileReader();


            reader.onerror =
                () => {

                    reject(
                        new Error(
                            "Could not read the selected image."
                        )
                    );

                };


            reader.onload =
                () => {

                    const image =
                        new Image();


                    image.onerror =
                        () => {

                            reject(
                                new Error(
                                    "The selected image could not be opened."
                                )
                            );

                        };


                    image.onload =
                        () => {

                            const MAX_SIZE =
                                1000;


                            let width =
                                image.naturalWidth;

                            let height =
                                image.naturalHeight;


                            if (
                                width >
                                    MAX_SIZE ||
                                height >
                                    MAX_SIZE
                            ) {

                                const ratio =
                                    Math.min(
                                        MAX_SIZE / width,
                                        MAX_SIZE / height
                                    );


                                width =
                                    Math.max(
                                        1,
                                        Math.round(
                                            width * ratio
                                        )
                                    );


                                height =
                                    Math.max(
                                        1,
                                        Math.round(
                                            height * ratio
                                        )
                                    );

                            }


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            canvas.width =
                                width;

                            canvas.height =
                                height;


                            const context =
                                canvas.getContext(
                                    "2d"
                                );


                            if (!context) {

                                reject(
                                    new Error(
                                        "Your browser cannot process this image."
                                    )
                                );

                                return;

                            }


                            context.drawImage(
                                image,
                                0,
                                0,
                                width,
                                height
                            );


                            let quality =
                                0.82;


                            let dataUrl =
                                canvas.toDataURL(
                                    "image/jpeg",
                                    quality
                                );


                            while (
                                dataUrl.length >
                                    2200000 &&
                                quality >
                                    0.45
                            ) {

                                quality -=
                                    0.07;


                                dataUrl =
                                    canvas.toDataURL(
                                        "image/jpeg",
                                        quality
                                    );

                            }


                            if (
                                dataUrl.length >
                                2200000
                            ) {

                                const smallerCanvas =
                                    document.createElement(
                                        "canvas"
                                    );


                                const smallerRatio =
                                    700 /
                                    Math.max(
                                        width,
                                        height
                                    );


                                const smallerWidth =
                                    Math.max(
                                        1,
                                        Math.round(
                                            width *
                                            smallerRatio
                                        )
                                    );


                                const smallerHeight =
                                    Math.max(
                                        1,
                                        Math.round(
                                            height *
                                            smallerRatio
                                        )
                                    );


                                smallerCanvas.width =
                                    smallerWidth;


                                smallerCanvas.height =
                                    smallerHeight;


                                const smallerContext =
                                    smallerCanvas.getContext(
                                        "2d"
                                    );


                                if (!smallerContext) {

                                    reject(
                                        new Error(
                                            "Your browser cannot process this image."
                                        )
                                    );

                                    return;

                                }


                                smallerContext.drawImage(
                                    image,
                                    0,
                                    0,
                                    smallerWidth,
                                    smallerHeight
                                );


                                dataUrl =
                                    smallerCanvas.toDataURL(
                                        "image/jpeg",
                                        0.70
                                    );

                            }


                            resolve(
                                dataUrl
                            );

                        };


                    image.src =
                        reader.result;

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


/* =========================================================
   REFRESH PROFILE FROM BACKEND
   ========================================================= */

async function refreshProfileFromServer() {

    const userId =
        getUserId(
            currentUser
        );


    if (!userId) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE}/profile/${encodeURIComponent(userId)}`,
                {
                    method:
                        "GET",

                    cache:
                        "no-store"
                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result?.success ||
            !result?.user
        ) {

            throw new Error(
                result?.error ||
                "Could not refresh profile."
            );

        }


        currentUser =
            {
                ...currentUser,
                ...result.user
            };


        saveCurrentUser();

        updateProfileDisplay();


        if (
            result.user.postCount !== undefined
        ) {

            profilePostCount.textContent =
                String(
                    result.user.postCount
                );

        }

    } catch (error) {

        console.warn(
            "Could not refresh profile from backend:",
            error
        );

    }

}


/* =========================================================
   BIO
   ========================================================= */

function updateBioCounter() {

    const length =
        editBio.value.length;

    bioCounter.textContent =
        `${length} / 150`;


    bioCounter.classList.toggle(
        "limit",
        length >= 150
    );

}


editBio.addEventListener(
    "input",
    updateBioCounter
);


/* =========================================================
   PROFILE DISPLAY
   ========================================================= */

function updateProfileDisplay() {

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
        currentUser.email ||
        "Not available";


    const bio =
        String(
            currentUser.bio ||
            ""
        ).trim();


    profileName.textContent =
        name;


    profileUsername.textContent =
        username
            ? `@${username}`
            : "@user";


    profileEmail.textContent =
        email;


    if (bio) {

        profileBio.textContent =
            bio;

        profileBio.classList.remove(
            "empty"
        );

    } else {

        profileBio.textContent =
            "Add a bio to tell people a little about yourself.";

        profileBio.classList.add(
            "empty"
        );

    }


    renderAvatar(
        profileAvatar,
        name,
        getAvatarUrl(currentUser)
    );

}


/* =========================================================
   LOAD PROFILE
   ========================================================= */

function loadProfile() {

    const rawUser =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (!rawUser) {

        authenticatedContent.style.display =
            "none";

        loginMessage.style.display =
            "block";

        return false;

    }


    try {

        currentUser =
            JSON.parse(
                rawUser
            );


        if (!currentUser) {

            throw new Error(
                "Invalid user."
            );

        }


        currentAvatar =
            getAvatarUrl(
                currentUser
            );


        updateProfileDisplay();


        authenticatedContent.style.display =
            "block";

        loginMessage.style.display =
            "none";


        return true;


    } catch (error) {

        console.error(
            "Profile load error:",
            error
        );


        localStorage.removeItem(
            STORAGE_KEY
        );


        authenticatedContent.style.display =
            "none";

        loginMessage.style.display =
            "block";


        return false;

    }

}


/* =========================================================
   EDIT MODAL
   ========================================================= */

function setUsernameStatus(
    message,
    type = ""
) {

    usernameStatus.textContent =
        message;

    usernameStatus.className =
        "username-status";


    if (type) {

        usernameStatus.classList.add(
            type
        );

    }

}


function resetUsernameState() {

    usernameAvailable =
        false;

    usernameCheckToken++;


    if (usernameCheckTimer) {

        clearTimeout(
            usernameCheckTimer
        );

        usernameCheckTimer =
            null;

    }


    editUsername.classList.remove(
        "input-valid",
        "input-invalid"
    );


    setUsernameStatus(
        ""
    );


    updateSaveButton();

}


function updateSaveButton() {

    const nameValid =
        editName.value.trim().length > 0;


    const username =
        editUsername.value
            .trim()
            .toLowerCase();


    const currentUsername =
        getUsername(
            currentUser
        );


    const usernameValid =
        /^[a-z0-9_]{3,20}$/.test(
            username
        );


    const usernameUnchanged =
        username ===
        currentUsername;


    const bioValid =
        editBio.value.length <= 150;


    const canSave =
        nameValid &&
        usernameValid &&
        bioValid &&
        (
            usernameUnchanged ||
            usernameAvailable
        );


    saveProfileBtn.disabled =
        !canSave;

}


function openEditModal() {

    if (!currentUser) {
        return;
    }


    editName.value =
        currentUser.name || "";


    editUsername.value =
        getUsername(
            currentUser
        );


    editBio.value =
        String(
            currentUser.bio ||
            ""
        ).slice(
            0,
            150
        );


    editEmail.value =
        currentUser.email || "";

    editDateOfBirth.value =
        currentUser.dateOfBirth || "";

    editGender.value =
        currentUser.gender || "";


    renderAvatar(
        editAvatar,
        getDisplayName(
            currentUser
        ),
        getAvatarUrl(currentUser)
    );


    updateBioCounter();


    resetUsernameState();


    usernameAvailable =
        true;


    editUsername.classList.add(
        "input-valid"
    );


    setUsernameStatus(
        "✓ This is your current username.",
        "available"
    );


    updateSaveButton();


    editOverlay.classList.add(
        "open"
    );


    editOverlay.setAttribute(
        "aria-hidden",
        "false"
    );


    setTimeout(
        () => {

            editName.focus();

        },
        50
    );

}


function closeEditModal() {

    editOverlay.classList.remove(
        "open"
    );


    editOverlay.setAttribute(
        "aria-hidden",
        "true"
    );


    resetUsernameState();

}


editProfileBtn.addEventListener(
    "click",
    openEditModal
);


avatarQuickEdit.addEventListener(
    "click",
    openEditModal
);


closeEditBtn.addEventListener(
    "click",
    closeEditModal
);


cancelEditBtn.addEventListener(
    "click",
    closeEditModal
);


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


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            editOverlay.classList.contains(
                "open"
            )
        ) {

            closeEditModal();

        }

    }
);


/* =========================================================
   USERNAME AVAILABILITY
   ========================================================= */

async function checkUsernameAvailability(
    username
) {

    const token =
        ++usernameCheckToken;


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


        editUsername.classList.remove(
            "input-invalid"
        );


        editUsername.classList.add(
            "input-valid"
        );


        setUsernameStatus(
            "✓ This is your current username.",
            "available"
        );


        updateSaveButton();

        return;

    }


    if (
        !/^[a-z0-9_]{3,20}$/.test(
            username
        )
    ) {

        usernameAvailable =
            false;


        editUsername.classList.remove(
            "input-valid"
        );


        editUsername.classList.add(
            "input-invalid"
        );


        setUsernameStatus(
            "Username must be 3–20 characters using lowercase letters, numbers or underscores.",
            "invalid"
        );


        updateSaveButton();

        return;

    }


    usernameAvailable =
        false;


    editUsername.classList.remove(
        "input-valid",
        "input-invalid"
    );


    setUsernameStatus(
        "Checking availability...",
        "checking"
    );


    updateSaveButton();


    try {

        const response =
            await fetch(
                `${API_BASE}/check-username/${encodeURIComponent(username)}?userId=${encodeURIComponent(getUserId(currentUser))}`
            );


        const result =
            await response.json();


        if (
            token !==
            usernameCheckToken
        ) {

            return;

        }


        if (!response.ok) {

            throw new Error(
                result?.error ||
                "Unable to check username."
            );

        }


        const available =
            result?.available === true;


        usernameAvailable =
            available;


        if (available) {

            editUsername.classList.remove(
                "input-invalid"
            );


            editUsername.classList.add(
                "input-valid"
            );


            setUsernameStatus(
                "✓ Username is available.",
                "available"
            );

        } else {

            editUsername.classList.remove(
                "input-valid"
            );


            editUsername.classList.add(
                "input-invalid"
            );


            setUsernameStatus(
                "✕ Username is already taken.",
                "taken"
            );

        }


    } catch (error) {

        if (
            token !==
            usernameCheckToken
        ) {

            return;

        }


        usernameAvailable =
            false;


        editUsername.classList.remove(
            "input-valid"
        );


        editUsername.classList.add(
            "input-invalid"
        );


        setUsernameStatus(
            "Could not check username availability. Try again.",
            "error"
        );


        console.error(
            "Username availability error:",
            error
        );

    }


    updateSaveButton();

}


editUsername.addEventListener(
    "input",
    () => {

        const username =
            editUsername.value
                .trim()
                .toLowerCase();


        editUsername.value =
            username;


        usernameAvailable =
            false;


        if (usernameCheckTimer) {

            clearTimeout(
                usernameCheckTimer
            );

        }


        usernameCheckTimer =
            setTimeout(
                () => {

                    checkUsernameAvailability(
                        username
                    );

                },
                350
            );


        updateSaveButton();

    }
);


editName.addEventListener(
    "input",
    updateSaveButton
);


/* =========================================================
   PHOTO SELECTION
   ========================================================= */

changePhotoBtn.addEventListener(
    "click",
    () => {

        photoInput.click();

    }
);


photoInput.addEventListener(
    "change",
    async event => {

        const file =
            event.target.files?.[0];


        if (!file) {
            return;
        }


        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            alert(
                "Please choose a JPG, PNG or WebP image."
            );


            photoInput.value =
                "";


            return;

        }


        if (
            file.size >
            3 * 1024 * 1024
        ) {

            alert(
                "Please choose an image smaller than 3 MB."
            );


            photoInput.value =
                "";


            return;

        }


        const userId =
            getUserId(
                currentUser
            );


        const username =
            getUsername(
                currentUser
            );


        if (
            !userId ||
            !username
        ) {

            alert(
                "Your login session is missing the user ID or username. Please log in again."
            );


            return;

        }


        changePhotoBtn.disabled =
            true;


        changePhotoBtn.textContent =
            "Uploading...";


        try {

            const imageData =
                await compressProfilePhoto(
                    file
                );


            const response =
                await fetch(
                    `${API_BASE}/profile/${encodeURIComponent(userId)}/photo`,
                    {
                        method:
                            "PUT",

                        headers:
                            {
                                "Content-Type":
                                    "application/json"
                            },

                        body:
                            JSON.stringify({
                                username,
                                image:
                                    imageData
                            })
                    }
                );


            const result =
                await response.json();


            if (
                !response.ok ||
                !result?.success ||
                !result?.avatarUrl
            ) {

                throw new Error(
                    result?.error ||
                    "Could not upload profile photo."
                );

            }


            currentAvatar =
                result.avatarUrl;


            currentUser.avatarUrl =
                result.avatarUrl;


            saveCurrentUser();


            renderAvatar(
                editAvatar,
                getDisplayName(
                    currentUser
                ),
                currentAvatar
            );


            renderAvatar(
                profileAvatar,
                getDisplayName(
                    currentUser
                ),
                currentAvatar
            );


            setUsernameStatus(
                "✓ Profile photo uploaded successfully.",
                "available"
            );


        } catch (error) {

            console.error(
                "Profile photo upload error:",
                error
            );


            alert(
                error.message ||
                "Could not upload the profile photo."
            );

        } finally {

            changePhotoBtn.disabled =
                false;


            changePhotoBtn.textContent =
                "Change photo";


            photoInput.value =
                "";

        }

    }
);


removePhotoBtn.addEventListener(
    "click",
    async () => {

        const userId =
            getUserId(
                currentUser
            );


        const username =
            getUsername(
                currentUser
            );


        if (
            !userId ||
            !username
        ) {

            alert(
                "Your login session is missing the user ID or username. Please log in again."
            );


            return;

        }


        if (
            !getAvatarUrl(
                currentUser
            )
        ) {

            return;

        }


        removePhotoBtn.disabled =
            true;


        removePhotoBtn.textContent =
            "Removing...";


        try {

            const response =
                await fetch(
                    `${API_BASE}/profile/${encodeURIComponent(userId)}/photo`,
                    {
                        method:
                            "DELETE",

                        headers:
                            {
                                "Content-Type":
                                    "application/json"
                            },

                        body:
                            JSON.stringify({
                                username
                            })
                    }
                );


            const result =
                await response.json();


            if (
                !response.ok ||
                !result?.success
            ) {

                throw new Error(
                    result?.error ||
                    "Could not remove profile photo."
                );

            }


            currentAvatar =
                "";


            currentUser.avatarUrl =
                "";


            saveCurrentUser();


            renderAvatar(
                editAvatar,
                getDisplayName(
                    currentUser
                ),
                ""
            );


            renderAvatar(
                profileAvatar,
                getDisplayName(
                    currentUser
                ),
                ""
            );


            setUsernameStatus(
                "Profile photo removed.",
                "available"
            );


        } catch (error) {

            console.error(
                "Remove profile photo error:",
                error
            );


            alert(
                error.message ||
                "Could not remove the profile photo."
            );

        } finally {

            removePhotoBtn.disabled =
                false;


            removePhotoBtn.textContent =
                "Remove";

        }

    }
);


/* =========================================================
   SAVE PROFILE
   ========================================================= */

saveProfileBtn.addEventListener(
    "click",
    async () => {

        if (!currentUser) {
            return;
        }


        const name =
            editName.value.trim();


        const username =
            editUsername.value
                .trim()
                .toLowerCase();


        const bio =
            editBio.value
                .trim();

        const dateOfBirth =
            editDateOfBirth.value
                .trim();

        const gender =
            editGender.value
                .trim()
                .toLowerCase();


        const currentUsername =
            getUsername(
                currentUser
            );


        if (!name) {

            alert(
                "Display name cannot be empty."
            );


            editName.focus();

            return;

        }


        if (
            !/^[a-z0-9_]{3,20}$/.test(
                username
            )
        ) {

            alert(
                "Username must be 3–20 characters using lowercase letters, numbers or underscores."
            );


            editUsername.focus();

            return;

        }


        if (
            bio.length >
            150
        ) {

            alert(
                "Bio cannot be longer than 150 characters."
            );


            editBio.focus();

            return;

        }


        if (
            username !==
            currentUsername &&
            !usernameAvailable
        ) {

            alert(
                "Please choose an available username first."
            );


            editUsername.focus();

            return;

        }


        const userId =
            getUserId(
                currentUser
            );


        if (!userId) {

            alert(
                "Your account ID is missing. Please log in again."
            );


            return;

        }


        saveProfileBtn.disabled =
            true;


        saveProfileBtn.textContent =
            "Saving...";


        try {

            if (
                username !==
                currentUsername
            ) {

                const availabilityResponse =
                    await fetch(
                        `${API_BASE}/check-username/${encodeURIComponent(username)}?userId=${encodeURIComponent(userId)}`
                    );


                const availabilityResult =
                    await availabilityResponse.json();


                if (
                    !availabilityResponse.ok ||
                    availabilityResult?.available !== true
                ) {

                    usernameAvailable =
                        false;


                    setUsernameStatus(
                        "✕ Username is no longer available.",
                        "taken"
                    );


                    throw new Error(
                        "Username is no longer available."
                    );

                }

            }


            const response =
                await fetch(
                    `${API_BASE}/profile/${encodeURIComponent(userId)}`,
                    {
                        method:
                            "PUT",

                        headers:
                            {
                                "Content-Type":
                                    "application/json"
                            },

                        body:
                            JSON.stringify({
                                currentUsername,
                                name,
                                username,
                                bio,
                                dateOfBirth,
                                gender
                            })

                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result?.error ||
                    "Profile update failed."
                );

            }


            const updatedUser =
                result?.user ||
                result?.profile ||
                null;


            if (updatedUser) {

                currentUser =
                    {
                        ...currentUser,
                        ...updatedUser
                    };

            }


            currentUser.name =
                name;

            currentUser.username =
                username;

            currentUser.bio =
                bio;

            currentUser.dateOfBirth =
                dateOfBirth;

            currentUser.gender =
                gender;


            saveCurrentUser();


            currentAvatar =
                getAvatarUrl(
                    currentUser
                );


            updateProfileDisplay();


            closeEditModal();


            await loadUserPosts();


        } catch (error) {

            console.error(
                "Save profile error:",
                error
            );


            alert(
                error.message ||
                "Unable to update your profile."
            );


        } finally {

            saveProfileBtn.textContent =
                "Save Changes";


            updateSaveButton();

        }

    }
);


/* =========================================================
   LOGOUT
   ========================================================= */

logoutBtn.addEventListener(
    "click",
    () => {

        localStorage.removeItem(
            STORAGE_KEY
        );


        window.location.href =
            "index.html";

    }
);


/* =========================================================
   DATE
   ========================================================= */

function formatPostDate(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleString(
        undefined,
        {
            dateStyle:
                "medium",

            timeStyle:
                "short"
        }
    );

}


/* =========================================================
   POSTS
   ========================================================= */

function renderPosts(
    posts
) {

    profilePostCount.textContent =
        String(
            posts.length
        );


    if (
        !posts.length
    ) {

        postsFeed.innerHTML = `

            <div class="empty-state">

                You haven't shared anything yet.

                <br>

                Your first post can start here.

            </div>

        `;


        return;

    }


    postsFeed.innerHTML =
        posts.map(
            post => {

                const author =
                    post.authorName ||
                    post.username ||
                    getDisplayName(
                        currentUser
                    );


                const username =
                    post.username ||
                    getUsername(
                        currentUser
                    );


                const date =
                    formatPostDate(
                        post.createdAt
                    );


                return `

                    <article class="post-card">

                        <div class="post-card-header">

                            <div class="post-author">

                                ${escapeHTML(
                                    author
                                )}

                                ${
                                    username
                                        ? ` · @${escapeHTML(username)}`
                                        : ""
                                }

                            </div>


                            <div class="post-date">

                                ${escapeHTML(
                                    date
                                )}

                            </div>

                        </div>


                        <div class="post-content">

                            ${escapeHTML(
                                post.content
                            )}

                        </div>


                        <div class="post-meta">

                            <span>
                                ${Number(
                                    post.likes || 0
                                )}
                                likes
                            </span>

                            <span>
                                ${Number(
                                    post.comments || 0
                                )}
                                comments
                            </span>

                        </div>

                    </article>

                `;

            }
        ).join("");

}


async function loadUserPosts() {

    if (!currentUser) {
        return;
    }


    const username =
        getUsername(
            currentUser
        );


    if (!username) {

        postsFeed.innerHTML = `

            <div class="empty-state error-state">

                Username is missing from your profile.

            </div>

        `;


        return;

    }


    postsFeed.innerHTML = `

        <div class="empty-state">

            Loading your posts...

        </div>

    `;


    try {

        const response =
            await fetch(
                `${API_BASE}/posts/user/${encodeURIComponent(username)}`
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result?.error ||
                "Could not load posts."
            );

        }


        if (
            !result ||
            !Array.isArray(
                result.posts
            )
        ) {

            throw new Error(
                "Invalid posts response."
            );

        }


        renderPosts(
            result.posts
        );


    } catch (error) {

        console.error(
            "Load posts error:",
            error
        );


        profilePostCount.textContent =
            "—";


        postsFeed.innerHTML = `

            <div class="empty-state error-state">

                Unable to load your posts right now.

            </div>

        `;

    }

}


/* =========================================================
   CREATE POST
   ========================================================= */

postContent.addEventListener(
    "input",
    () => {

        postCharacterCount.textContent =
            `${postContent.value.length} / 2000`;

    }
);


createPostBtn.addEventListener(
    "click",
    async () => {

        if (!currentUser) {
            return;
        }


        const content =
            postContent.value.trim();


        if (!content) {

            alert(
                "Write something before publishing."
            );


            return;

        }


        if (
            content.length >
            2000
        ) {

            alert(
                "Post cannot exceed 2000 characters."
            );


            return;

        }


        const username =
            getUsername(
                currentUser
            );


        const authorId =
            getUserId(
                currentUser
            );


        if (!username) {

            alert(
                "Your username is missing."
            );


            return;

        }


        if (!authorId) {

            alert(
                "Your account ID is missing. Please log in again."
            );


            return;

        }


        createPostBtn.disabled =
            true;


        createPostBtn.textContent =
            "Publishing...";


        try {

            const response =
                await fetch(
                    `${API_BASE}/posts`,
                    {
                        method:
                            "POST",

                        headers:
                            {
                                "Content-Type":
                                    "application/json"
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


            if (!response.ok) {

                throw new Error(
                    result?.error ||
                    "Unable to publish post."
                );

            }


            postContent.value =
                "";


            postCharacterCount.textContent =
                "0 / 2000";


            await loadUserPosts();


        } catch (error) {

            console.error(
                "Create post error:",
                error
            );


            alert(
                error.message ||
                "Unable to publish post."
            );

        } finally {

            createPostBtn.disabled =
                false;


            createPostBtn.textContent =
                "Publish Post";

        }

    }
);


/* =========================================================
   DHEERE AI
   ========================================================= */

function setAiStatus(
    text,
    online = false
) {

    dheereAiStatusText.textContent =
        text;


    dheereAiStatus.classList.toggle(
        "online",
        online
    );

}


function addAiMessage(
    text,
    type
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        `ai-message ${type}`;


    element.textContent =
        String(
            text || ""
        );


    dheereAiMessages.insertBefore(
        element,
        dheereAiTyping
    );


    dheereAiMessages.scrollTop =
        dheereAiMessages.scrollHeight;

}


async function sendAiMessage() {

    if (aiBusy) {
        return;
    }


    const message =
        dheereAiInput.value.trim();


    if (!message) {
        return;
    }


    addAiMessage(
        message,
        "user"
    );


    dheereAiInput.value =
        "";


    dheereAiInput.style.height =
        "auto";


    aiBusy =
        true;


    dheereAiSend.disabled =
        true;


    dheereAiTyping.classList.add(
        "visible"
    );


    setAiStatus(
        "Thinking..."
    );


    try {

        const response =
            await fetch(
                `${API_BASE}/ai-chat`,
                {
                    method:
                        "POST",

                    headers:
                        {
                            "Content-Type":
                                "application/json"
                        },

                    body:
                        JSON.stringify({
                            message
                        })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result?.error ||
                `AI request failed (${response.status}).`
            );

        }


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result?.error ||
                "Dheere AI returned an invalid response."
            );

        }


        if (
            typeof result.answer !==
                "string" ||
            !result.answer.trim()
        ) {

            throw new Error(
                "Dheere AI returned an empty response."
            );

        }


        addAiMessage(
            result.answer.trim(),
            "ai"
        );


        setAiStatus(
            "Ready",
            true
        );


    } catch (error) {

        console.error(
            "Dheere AI error:",
            error
        );


        addAiMessage(
            error.message ||
            "Unable to connect to Dheere AI.",
            "error"
        );


        setAiStatus(
            "Unavailable"
        );


    } finally {

        aiBusy =
            false;


        dheereAiSend.disabled =
            false;


        dheereAiTyping.classList.remove(
            "visible"
        );


        dheereAiInput.focus();


        dheereAiMessages.scrollTop =
            dheereAiMessages.scrollHeight;

    }

}


dheereAiForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        sendAiMessage();

    }
);


dheereAiInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendAiMessage();

        }

    }
);


dheereAiInput.addEventListener(
    "input",
    () => {

        dheereAiInput.style.height =
            "auto";


        dheereAiInput.style.height =
            Math.min(
                dheereAiInput.scrollHeight,
                125
            ) + "px";

    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

const profileLoaded =
    loadProfile();


if (profileLoaded) {

    loadUserPosts();

    refreshProfileFromServer();

    setAiStatus(
        "Ready",
        true
    );

}