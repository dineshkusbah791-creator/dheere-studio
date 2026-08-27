// ============================================================
// VALIDATION CONSTANTS
// ============================================================

const USERNAME_REGEX =
    /^[a-z0-9_]{3,20}$/;


const MAX_NAME_LENGTH =
    80;


const MAX_BIO_LENGTH =
    500;



// ============================================================
// NORMALIZE USERNAME
// ============================================================

function normalizeUsername(value) {

    if (
        typeof value !== "string"
    ) {

        return "";

    }


    return value
        .trim()
        .toLowerCase();

}



// ============================================================
// NORMALIZE EMAIL
// ============================================================

function normalizeEmail(value) {

    if (
        typeof value !== "string"
    ) {

        return "";

    }


    return value
        .trim()
        .toLowerCase();

}



// ============================================================
// CLEAN NAME
// ============================================================

function cleanName(value) {

    if (
        typeof value !== "string"
    ) {

        return "";

    }


    return value.trim();

}



// ============================================================
// BACKWARD-COMPATIBLE NAME HELPER
// ============================================================

function cleanNameValue(value) {

    return cleanName(
        value
    );

}



// ============================================================
// CLEAN BIO
// ============================================================

function cleanBio(value) {

    if (
        typeof value !== "string"
    ) {

        return "";

    }


    return value
        .trim()
        .slice(
            0,
            MAX_BIO_LENGTH
        );

}



// ============================================================
// MODULE EXPORTS
// ============================================================

module.exports = {

    USERNAME_REGEX,

    MAX_NAME_LENGTH,

    MAX_BIO_LENGTH,

    normalizeUsername,

    normalizeEmail,

    cleanName,

    cleanNameValue,

    cleanBio

};