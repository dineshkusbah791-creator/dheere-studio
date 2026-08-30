"use strict";

/* =========================================================
   PROFILE MEDIA MODULE
   =========================================================

   Responsibilities:
   - Profile avatar rendering
   - Initials fallback
   - Profile photo compression
   - Change photo
   - Remove photo
   - Cloudinary profile-photo API calls

   This file intentionally does NOT handle:
   - Authentication implementation
   - Profile text editing
   - Username availability
   - Posts/comments/likes
   - Dheere AI
   ========================================================= */


/* =========================================================
   IMPORTS
   ========================================================= */

import {

    getCurrentUser,

    getUserId,

    getDisplayName,

    getAvatarUrl,

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


const MAX_PHOTO_FILE_SIZE =
    3 * 1024 * 1024;


const MAX_IMAGE_DIMENSION =
    900;


const ALLOWED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp"
]);


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const profileAvatar =
    document.getElementById(
        "profileAvatar"
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


const editOverlay =
    document.getElementById(
        "editOverlay"
    );


/* =========================================================
   INITIALS
   ========================================================= */

function getInitials(
    name
) {

    const value =
        String(
            name || "User"
        ).trim();


    if (!value) {

        return "U";

    }


    const parts =
        value.split(
            /\s+/
        );


    if (
        parts.length ===
        1
    ) {

        return parts[0]
            .charAt(0)
            .toUpperCase();

    }


    return (

        parts[0]
            .charAt(0) +

        parts[
            parts.length - 1
        ]
            .charAt(0)

    ).toUpperCase();

}


/* =========================================================
   RENDER AVATAR
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


    if (
        image
        &&
        typeof image ===
        "string"
    ) {

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

                element.replaceChildren();


                element.textContent =
                    getInitials(
                        name
                    );

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


/* =========================================================
   RENDER ALL PROFILE AVATARS
   ========================================================= */

function renderProfileAvatars() {

    const user =
        getCurrentUser();


    if (!user) {

        return;

    }


    const name =
        getDisplayName(
            user
        );


    const avatar =
        getAvatarUrl(
            user
        );


    renderAvatar(
        profileAvatar,
        name,
        avatar
    );


    renderAvatar(
        editAvatar,
        name,
        avatar
    );

}


/* =========================================================
   IMAGE FILE VALIDATION
   ========================================================= */

function validateImageFile(
    file
) {

    if (!file) {

        return {

            valid:
                false,

            error:
                "Please choose an image."

        };

    }


    if (
        !ALLOWED_IMAGE_TYPES.has(
            file.type
        )
    ) {

        return {

            valid:
                false,

            error:
                "Please choose a JPG, PNG or WebP image."

        };

    }


    if (
        file.size >
        MAX_PHOTO_FILE_SIZE
    ) {

        return {

            valid:
                false,

            error:
                "Please choose an image smaller than 3 MB."

        };

    }


    return {

        valid:
            true,

        error:
            ""

    };

}


/* =========================================================
   COMPRESS PROFILE PHOTO
   ========================================================= */

function compressProfilePhoto(
    file
) {

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
                            "Could not read image."
                        )
                    );

                };


            reader.onload =
                event => {

                    const image =
                        new Image();


                    image.onerror =
                        () => {

                            reject(
                                new Error(
                                    "Could not process image."
                                )
                            );

                        };


                    image.onload =
                        () => {

                            let width =
                                image.width;


                            let height =
                                image.height;


                            const largestDimension =
                                Math.max(
                                    width,
                                    height
                                );


                            if (
                                largestDimension >
                                MAX_IMAGE_DIMENSION
                            ) {

                                const scale =
                                    MAX_IMAGE_DIMENSION /
                                    largestDimension;


                                width =
                                    Math.round(
                                        width *
                                        scale
                                    );


                                height =
                                    Math.round(
                                        height *
                                        scale
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
                                        "Image processing is unavailable."
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


                            const compressedImage =
                                canvas.toDataURL(

                                    "image/jpeg",

                                    0.85

                                );


                            if (
                                !compressedImage ||
                                !compressedImage.startsWith(
                                    "data:image/"
                                )
                            ) {

                                reject(
                                    new Error(
                                        "Could not prepare image for upload."
                                    )
                                );


                                return;

                            }


                            resolve(
                                compressedImage
                            );

                        };


                    image.src =
                        String(
                            event.target.result ||
                            ""
                        );

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


/* =========================================================
   BUTTON STATE
   ========================================================= */

function setChangePhotoButtonState(
    disabled,
    text = "Change photo"
) {

    if (!changePhotoBtn) {

        return;

    }


    changePhotoBtn.disabled =
        disabled;


    changePhotoBtn.textContent =
        text;

}


function setRemovePhotoButtonState(
    disabled,
    text = "Remove"
) {

    if (!removePhotoBtn) {

        return;

    }


    removePhotoBtn.disabled =
        disabled;


    removePhotoBtn.textContent =
        text;

}


/* =========================================================
   UPLOAD PROFILE PHOTO
   ========================================================= */

async function uploadProfilePhoto(
    file
) {

    const user =
        getCurrentUser();


    if (
        !user ||
        !hasValidLoginSession()
    ) {

        alert(
            "Please login again."
        );


        return false;

    }


    const validation =
        validateImageFile(
            file
        );


    if (
        !validation.valid
    ) {

        alert(
            validation.error
        );


        return false;

    }


    const userId =
        getUserId(
            user
        );


    if (!userId) {

        alert(
            "Your account ID is missing. Please login again."
        );


        return false;

    }


    setChangePhotoButtonState(
        true,
        "Uploading..."
    );


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
                        getAuthHeaders(),

                    body:
                        JSON.stringify({

                            image:
                                imageData

                        })

                }

            );


        const result =
            await response.json()
                .catch(
                    () => ({})
                );


        if (
            response.status ===
            401
        ) {

            handleAuthError(
                result?.error
            );


            return false;

        }


        if (
            response.status ===
            403
        ) {

            alert(

                result?.error ||

                "You are not authorized to update this profile photo."

            );


            return false;

        }


        if (
            !response.ok ||
            result?.success !==
                true ||
            !result?.avatarUrl
        ) {

            throw new Error(

                result?.error ||

                `Could not upload profile photo (${response.status}).`

            );

        }


        /*
         * Keep auth/session object synchronized.
         */

        updateCurrentUser({

            avatarUrl:
                result.avatarUrl

        });


        saveCurrentUser();


        /*
         * Refresh local avatar immediately.
         */

        renderProfileAvatars();


        /*
         * Notify profile controller.
         */

        window.dispatchEvent(

            new CustomEvent(

                "dheere:profile-avatar-updated",

                {

                    detail: {

                        avatarUrl:
                            result.avatarUrl

                    }

                }

            )

        );


        return true;


    } catch (error) {

        console.error(

            "Profile photo upload error:",

            error

        );


        alert(

            error?.message ||

            "Could not upload the profile photo."

        );


        return false;


    } finally {

        setChangePhotoButtonState(
            false,
            "Change photo"
        );


        if (photoInput) {

            photoInput.value =
                "";

        }

    }

}


/* =========================================================
   REMOVE PROFILE PHOTO
   ========================================================= */

async function removeProfilePhoto() {

    const user =
        getCurrentUser();


    if (
        !user ||
        !hasValidLoginSession()
    ) {

        alert(
            "Please login again."
        );


        return false;

    }


    const userId =
        getUserId(
            user
        );


    if (!userId) {

        alert(
            "Your account ID is missing. Please login again."
        );


        return false;

    }


    const currentAvatar =
        getAvatarUrl(
            user
        );


    if (!currentAvatar) {

        return true;

    }


    const confirmed =
        window.confirm(
            "Remove your profile photo?"
        );


    if (!confirmed) {

        return false;

    }


    setRemovePhotoButtonState(
        true,
        "Removing..."
    );


    try {

        const response =
            await fetch(

                `${API_BASE}/profile/${encodeURIComponent(userId)}/photo`,

                {

                    method:
                        "DELETE",

                    headers:
                        getAuthHeaders()

                }

            );


        const result =
            await response.json()
                .catch(
                    () => ({})
                );


        if (
            response.status ===
            401
        ) {

            handleAuthError(
                result?.error
            );


            return false;

        }


        if (
            response.status ===
            403
        ) {

            alert(

                result?.error ||

                "You are not authorized to remove this profile photo."

            );


            return false;

        }


        if (
            !response.ok ||
            result?.success !==
                true
        ) {

            throw new Error(

                result?.error ||

                `Could not remove profile photo (${response.status}).`

            );

        }


        /*
         * Clear local avatar state.
         */

        updateCurrentUser({

            avatarUrl:
                ""

        });


        saveCurrentUser();


        /*
         * Refresh visible avatars.
         */

        renderProfileAvatars();


        /*
         * Notify profile controller.
         */

        window.dispatchEvent(

            new CustomEvent(

                "dheere:profile-avatar-updated",

                {

                    detail: {

                        avatarUrl:
                            ""

                    }

                }

            )

        );


        return true;


    } catch (error) {

        console.error(

            "Remove profile photo error:",

            error

        );


        alert(

            error?.message ||

            "Could not remove the profile photo."

        );


        return false;


    } finally {

        setRemovePhotoButtonState(
            false,
            "Remove"
        );

    }

}


/* =========================================================
   PHOTO INPUT
   ========================================================= */

function handlePhotoInputChange(
    event
) {

    const file =
        event.target
            ?.files
            ?.[0];


    if (!file) {

        return;

    }


    uploadProfilePhoto(
        file
    );

}


/* =========================================================
   SETUP MEDIA EVENTS
   ========================================================= */

function setupMediaEvents() {

    /*
     * Change photo.
     */

    if (
        changePhotoBtn &&
        photoInput
    ) {

        changePhotoBtn.addEventListener(

            "click",

            event => {

                event.preventDefault();

                photoInput.click();

            }

        );

    }


    /*
     * File selected.
     */

    if (photoInput) {

        photoInput.addEventListener(

            "change",

            handlePhotoInputChange

        );

    }


    /*
     * Remove photo.
     */

    if (removePhotoBtn) {

        removePhotoBtn.addEventListener(

            "click",

            async event => {

                event.preventDefault();

                await removeProfilePhoto();

            }

        );

    }


    /*
     * If profile editor closes, clear the selected
     * file input.
     */

    if (editOverlay) {

        editOverlay.addEventListener(

            "transitionend",

            () => {

                if (
                    !editOverlay.classList.contains(
                        "active"
                    ) &&
                    photoInput
                ) {

                    photoInput.value =
                        "";

                }

            }

        );

    }


    /*
     * Profile itself may be updated by
     * profile-editor.js.
     */

    window.addEventListener(

        "dheere:profile-updated",

        () => {

            renderProfileAvatars();

        }

    );

}


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeProfileMedia() {

    setupMediaEvents();

    renderProfileAvatars();

}


/* =========================================================
   EXPORTS
   ========================================================= */

export {

    initializeProfileMedia,

    renderAvatar,

    renderProfileAvatars,

    validateImageFile,

    compressProfilePhoto,

    uploadProfilePhoto,

    removeProfilePhoto

};