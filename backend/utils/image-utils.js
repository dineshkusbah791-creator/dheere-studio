// ============================================================
// PROFILE PHOTO CONSTANTS
// ============================================================

const MAX_PROFILE_PHOTO_BYTES =
    3 * 1024 * 1024;


const PROFILE_PHOTO_FOLDER =
    "dheere-studio/profile-photos";


const ALLOWED_PROFILE_PHOTO_TYPES = [

    "image/jpeg",

    "image/png",

    "image/webp"

];



// ============================================================
// GET DATA URI MIME TYPE
// ============================================================

function getDataUriMimeType(
    dataUri
) {

    if (
        typeof dataUri !==
        "string"
    ) {

        return "";

    }


    const match =
        dataUri.match(
            /^data:(image\/[a-zA-Z0-9.+-]+);base64,/i
        );


    if (!match) {

        return "";

    }


    return match[1]
        .toLowerCase();

}



// ============================================================
// GET DATA URI INFO
// ============================================================

function getDataUriInfo(
    dataUri
) {

    if (
        typeof dataUri !==
        "string"
    ) {

        return null;

    }


    const match =
        dataUri.match(
            /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i
        );


    if (!match) {

        return null;

    }


    const mimeType =
        match[1]
            .toLowerCase();


    const base64Data =
        match[2];


    // --------------------------------------------------------
    // VALIDATE IMAGE TYPE
    // --------------------------------------------------------

    if (
        !ALLOWED_PROFILE_PHOTO_TYPES.includes(
            mimeType
        )
    ) {

        return null;

    }


    // --------------------------------------------------------
    // ESTIMATE DECODED FILE SIZE
    // --------------------------------------------------------

    const padding =
        (
            base64Data.endsWith("==")
                ? 2
                : base64Data.endsWith("=")
                    ? 1
                    : 0
        );


    const estimatedBytes =
        Math.floor(
            (base64Data.length * 3) /
            4
        ) -
        padding;


    return {

        mimeType,

        base64Data,

        estimatedBytes

    };

}



// ============================================================
// VALIDATE PROFILE PHOTO
// ============================================================

function validateProfilePhoto(
    image
) {

    const imageInfo =
        getDataUriInfo(
            image
        );


    if (!imageInfo) {

        return {

            valid:
                false,

            error:
                "Only JPEG, PNG, and WebP images are allowed."

        };

    }


    if (
        imageInfo.estimatedBytes >
        MAX_PROFILE_PHOTO_BYTES
    ) {

        return {

            valid:
                false,

            error:
                "Profile photo must be smaller than 3 MB."

        };

    }


    return {

        valid:
            true,

        imageInfo

    };

}



// ============================================================
// MODULE EXPORTS
// ============================================================

module.exports = {

    MAX_PROFILE_PHOTO_BYTES,

    PROFILE_PHOTO_FOLDER,

    ALLOWED_PROFILE_PHOTO_TYPES,

    getDataUriMimeType,

    getDataUriInfo,

    validateProfilePhoto

};