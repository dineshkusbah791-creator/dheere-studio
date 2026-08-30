// ============================================================
// PROFILE ROUTES
// ============================================================


// ============================================================
// DEPENDENCIES
// ============================================================

const express =
    require(
        "express"
    );


const {
    ObjectId
} =
    require(
        "mongodb"
    );


const cloudinary =
    require(
        "cloudinary"
    ).v2;


// ============================================================
// AUTH
// ============================================================

const {
    authenticateToken
} =
    require(
        "../middleware/auth-middleware"
    );


// ============================================================
// VALIDATORS
// ============================================================

const {
    USERNAME_REGEX,

    MAX_NAME_LENGTH,

    MAX_BIO_LENGTH,

    normalizeUsername,

    cleanNameValue,

    cleanBio

} =
    require(
        "../utils/validators"
    );


// ============================================================
// IMAGE UTILITIES
// ============================================================

const {
    PROFILE_PHOTO_FOLDER,

    validateProfilePhoto

} =
    require(
        "../utils/image-utils"
    );


// ============================================================
// PROFILE CONSTANTS
// ============================================================

// Frontend currently uses 150 characters.
const PROFILE_BIO_MAX_LENGTH =
    150;


// Supported private gender values.
const ALLOWED_GENDER_VALUES = new Set([
    "",
    "male",
    "female",
    "other"
]);


// Strict YYYY-MM-DD format.
const DATE_OF_BIRTH_REGEX =
    /^\d{4}-\d{2}-\d{2}$/;


// ============================================================
// OBJECT ID VALIDATION
// ============================================================

function isValidObjectId(
    value
) {

    return (

        typeof value ===
        "string"

        &&

        ObjectId.isValid(
            value
        )

    );

}


// ============================================================
// AUTHORIZATION CHECK
// ============================================================

function isAuthorizedUser(

    requestedUserId,

    authenticatedUserId

) {

    if (

        !isValidObjectId(
            requestedUserId
        )

        ||

        !isValidObjectId(
            authenticatedUserId
        )

    ) {

        return false;

    }


    return (

        requestedUserId ===
        authenticatedUserId

    );

}


// ============================================================
// DATE OF BIRTH VALIDATION
// ============================================================

function isValidDateOfBirth(
    value
) {

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
        !DATE_OF_BIRTH_REGEX.test(
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
        )

        ||

        !Number.isInteger(
            month
        )

        ||

        !Number.isInteger(
            day
        )
    ) {

        return false;

    }


    if (
        month < 1 ||
        month > 12
    ) {

        return false;

    }


    const daysInMonth =
        new Date(
            year,
            month,
            0
        ).getDate();


    if (
        day < 1 ||
        day > daysInMonth
    ) {

        return false;

    }


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const selectedDate =
        new Date(
            year,
            month - 1,
            day
        );


    if (
        selectedDate >
        today
    ) {

        return false;

    }


    return true;

}


// ============================================================
// CONFIGURE CLOUDINARY
// ============================================================

function configureCloudinary() {

    cloudinary.config({

        cloud_name:
            process.env.CLOUDINARY_CLOUD_NAME,

        api_key:
            process.env.CLOUDINARY_API_KEY,

        api_secret:
            process.env.CLOUDINARY_API_SECRET

    });

}


// ============================================================
// CHECK CLOUDINARY CONFIGURATION
// ============================================================

function isCloudinaryConfigured() {

    return Boolean(

        process.env.CLOUDINARY_CLOUD_NAME

        &&

        process.env.CLOUDINARY_API_KEY

        &&

        process.env.CLOUDINARY_API_SECRET

    );

}


// ============================================================
// CREATE PROFILE ROUTER
// ============================================================

function createProfileRouter(
    {
        usersCollection
    }
) {


    const router =
        express.Router();


    // ========================================================
    // CHECK USERNAME
    //
    // Public route.
    //
    // Optional ?userId= allows the current user's own username
    // to be treated as available.
    // ========================================================

    router.get(

        "/check-username/:username",

        async (

            req,

            res

        ) => {

            try {

                const username =
                    typeof req.params.username ===
                    "string"

                        ? normalizeUsername(
                            req.params.username
                        )

                        : "";


                const currentUserId =
                    typeof req.query.userId ===
                    "string"

                        ? req.query.userId.trim()

                        : "";


                // ============================================
                // VALIDATE USERNAME
                // ============================================

                if (

                    !USERNAME_REGEX.test(
                        username
                    )

                ) {

                    return res.status(400).json({

                        success:
                            false,

                        available:
                            false,

                        error:
                            "Username must be 3-20 characters and contain only lowercase letters, numbers, and underscores"

                    });

                }


                // ============================================
                // FIND USERNAME OWNER
                // ============================================

                const owner =
                    await usersCollection.findOne(

                        {

                            username:
                                username

                        },

                        {

                            projection: {

                                _id:
                                    1

                            }

                        }

                    );


                // ============================================
                // USERNAME DOES NOT EXIST
                // ============================================

                if (
                    !owner
                ) {

                    return res.json({

                        success:
                            true,

                        available:
                            true

                    });

                }


                // ============================================
                // CURRENT USER OWNS THIS USERNAME
                // ============================================

                if (

                    isValidObjectId(
                        currentUserId
                    )

                    &&

                    owner
                        ._id
                        .toString() ===
                    currentUserId

                ) {

                    return res.json({

                        success:
                            true,

                        available:
                            true

                    });

                }


                // ============================================
                // USERNAME TAKEN
                // ============================================

                return res.json({

                    success:
                        true,

                    available:
                        false

                });


            } catch (
                error
            ) {

                console.error(

                    "Check username error:",

                    error

                );


                return res.status(500).json({

                    success:
                        false,

                    available:
                        false,

                    error:
                        "Could not check username"

                });

            }

        }

    );


    // ========================================================
    // GET PROFILE
    //
    // Public route.
    //
    // Private fields such as dateOfBirth and gender are NOT
    // exposed here.
    // ========================================================

    router.get(

        "/profile/:userId",

        async (

            req,

            res

        ) => {

            try {

                const userId =
                    typeof req.params.userId ===
                    "string"

                        ? req.params.userId.trim()

                        : "";


                // ============================================
                // VALIDATE USER ID
                // ============================================

                if (

                    !isValidObjectId(
                        userId
                    )

                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Invalid user ID"

                    });

                }


                // ============================================
                // FIND USER
                // ============================================

                const user =
                    await usersCollection.findOne(

                        {

                            _id:
                                new ObjectId(
                                    userId
                                )

                        },

                        {

                            projection: {

                                name:
                                    1,

                                username:
                                    1,

                                bio:
                                    1,

                                avatarUrl:
                                    1,

                                createdAt:
                                    1

                            }

                        }

                    );


                // ============================================
                // USER NOT FOUND
                // ============================================

                if (
                    !user
                ) {

                    return res.status(404).json({

                        success:
                            false,

                        error:
                            "User not found"

                    });

                }


                // ============================================
                // SUCCESS
                // ============================================

                return res.json({

                    success:
                        true,

                    user: {

                        id:
                            user
                                ._id
                                .toString(),

                        name:
                            user.name ||
                            "",

                        username:
                            user.username ||
                            "",

                        bio:
                            user.bio ||
                            "",

                        avatarUrl:
                            user.avatarUrl ||
                            "",

                        createdAt:
                            user.createdAt

                    }

                });


            } catch (
                error
            ) {

                console.error(

                    "Get profile error:",

                    error

                );


                return res.status(500).json({

                    success:
                        false,

                    error:
                        "Could not load profile"

                });

            }

        }

    );


    // ========================================================
    // UPDATE PROFILE
    //
    // Protected route.
    // JWT user must match :userId.
    // ========================================================

    router.put(

        "/profile/:userId",

        authenticateToken,

        async (

            req,

            res

        ) => {

            try {

                const userId =
                    typeof req.params.userId ===
                    "string"

                        ? req.params.userId.trim()

                        : "";


                const authenticatedUserId =
                    req.user?.userId;


                const {

                    name,

                    username,

                    bio,

                    dateOfBirth,

                    gender

                } =
                    req.body ||
                    {};


                // ============================================
                // VALIDATE USER ID
                // ============================================

                if (

                    !isValidObjectId(
                        userId
                    )

                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Invalid user ID"

                    });

                }


                // ============================================
                // AUTHORIZATION
                // ============================================

                if (

                    !isAuthorizedUser(

                        userId,

                        authenticatedUserId

                    )

                ) {

                    return res.status(403).json({

                        success:
                            false,

                        error:
                            "You are not authorized to modify this profile"

                    });

                }


                // ============================================
                // VALIDATE INPUT TYPES
                // ============================================

                if (

                    typeof name !==
                    "string"

                    ||

                    typeof username !==
                    "string"

                    ||

                    (

                        bio !== undefined

                        &&

                        typeof bio !==
                        "string"

                    )

                    ||

                    (

                        dateOfBirth !== undefined

                        &&

                        typeof dateOfBirth !==
                        "string"

                    )

                    ||

                    (

                        gender !== undefined

                        &&

                        typeof gender !==
                        "string"

                    )

                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Invalid profile data"

                    });

                }


                // ============================================
                // CLEAN BASIC VALUES
                // ============================================

                const cleanedName =
                    cleanNameValue(
                        name
                    );


                const cleanUsername =
                    normalizeUsername(
                        username
                    );


                const cleanBioValue =
                    cleanBio(
                        bio ||
                        ""
                    );


                const cleanDateOfBirth =
                    (
                        dateOfBirth ||
                        ""
                    )
                        .trim();


                const cleanGender =
                    (
                        gender ||
                        ""
                    )
                        .trim()
                        .toLowerCase();


                // ============================================
                // VALIDATE NAME
                // ============================================

                if (
                    !cleanedName
                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Name is required"

                    });

                }


                if (

                    cleanedName.length >
                    MAX_NAME_LENGTH

                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            `Name must not exceed ${MAX_NAME_LENGTH} characters`

                    });

                }


                // ============================================
                // VALIDATE USERNAME
                // ============================================

                if (

                    !USERNAME_REGEX.test(
                        cleanUsername
                    )

                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Username must be 3-20 characters and contain only lowercase letters, numbers, and underscores"

                    });

                }


                // ============================================
                // VALIDATE BIO
                // ============================================

                if (

                    cleanBioValue.length >
                    PROFILE_BIO_MAX_LENGTH

                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            `Bio must not exceed ${PROFILE_BIO_MAX_LENGTH} characters`

                    });

                }


                // ============================================
                // VALIDATE DATE OF BIRTH
                // ============================================

                if (

                    !isValidDateOfBirth(
                        cleanDateOfBirth
                    )

                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Invalid date of birth"

                    });

                }


                // ============================================
                // VALIDATE GENDER
                // ============================================

                if (

                    !ALLOWED_GENDER_VALUES.has(
                        cleanGender
                    )

                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Invalid gender value"

                    });

                }


                // ============================================
                // FIND AUTHENTICATED USER
                // ============================================

                const user =
                    await usersCollection.findOne(

                        {

                            _id:
                                new ObjectId(
                                    authenticatedUserId
                                )

                        }

                    );


                if (
                    !user
                ) {

                    return res.status(404).json({

                        success:
                            false,

                        error:
                            "User not found"

                    });

                }


                // ============================================
                // CHECK USERNAME CONFLICT
                // ============================================

                const usernameChanged =
                    (
                        user.username ||
                        ""
                    )
                    !==
                    cleanUsername;


                if (
                    usernameChanged
                ) {

                    const usernameOwner =
                        await usersCollection.findOne(

                            {

                                username:
                                    cleanUsername

                            },

                            {

                                projection: {

                                    _id:
                                        1

                                }

                            }

                        );


                    if (

                        usernameOwner

                        &&

                        usernameOwner
                            ._id
                            .toString()
                        !==
                        user
                            ._id
                            .toString()

                    ) {

                        return res.status(409).json({

                            success:
                                false,

                            error:
                                "Username already taken"

                        });

                    }

                }


                // ============================================
                // BUILD UPDATE
                //
                // Supports existing accounts that may not yet
                // have private profile fields.
                // ============================================

                const updateFields = {

                    name:
                        cleanedName,

                    username:
                        cleanUsername,

                    bio:
                        cleanBioValue,

                    dateOfBirth:
                        cleanDateOfBirth,

                    gender:
                        cleanGender

                };


                // ============================================
                // UPDATE USER
                // ============================================

                const updateResult =
                    await usersCollection.updateOne(

                        {

                            _id:
                                user._id

                        },

                        {

                            $set:
                                updateFields

                        }

                    );


                if (
                    updateResult.matchedCount ===
                    0
                ) {

                    return res.status(404).json({

                        success:
                            false,

                        error:
                            "User not found"

                    });

                }


                // ============================================
                // SUCCESS
                // ============================================

                return res.json({

                    success:
                        true,

                    message:
                        "Profile updated successfully",

                    user: {

                        id:
                            user
                                ._id
                                .toString(),

                        name:
                            cleanedName,

                        username:
                            cleanUsername,

                        email:
                            user.email ||
                            "",

                        bio:
                            cleanBioValue,

                        dateOfBirth:
                            cleanDateOfBirth,

                        gender:
                            cleanGender,

                        avatarUrl:
                            user.avatarUrl ||
                            ""

                    }

                });


            } catch (
                error
            ) {

                // ============================================
                // DUPLICATE USERNAME
                // ============================================

                if (

                    error
                    &&
                    error.code ===
                    11000

                ) {

                    return res.status(409).json({

                        success:
                            false,

                        error:
                            "Username already taken"

                    });

                }


                console.error(

                    "Update profile error:",

                    error

                );


                return res.status(500).json({

                    success:
                        false,

                    error:
                        "Could not update profile"

                });

            }

        }

    );


    // ========================================================
    // UPDATE PROFILE PHOTO
    //
    // Protected route.
    // JWT user must match :userId.
    // ========================================================

    router.put(

        "/profile/:userId/photo",

        authenticateToken,

        async (

            req,

            res

        ) => {

            try {

                const userId =
                    typeof req.params.userId ===
                    "string"

                        ? req.params.userId.trim()

                        : "";


                const authenticatedUserId =
                    req.user?.userId;


                const {
                    image
                } =
                    req.body ||
                    {};


                // ============================================
                // VALIDATE USER ID
                // ============================================

                if (

                    !isValidObjectId(
                        userId
                    )

                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Invalid user ID"

                    });

                }


                // ============================================
                // AUTHORIZE USER
                // ============================================

                if (

                    !isAuthorizedUser(

                        userId,

                        authenticatedUserId

                    )

                ) {

                    return res.status(403).json({

                        success:
                            false,

                        error:
                            "You are not authorized to modify this profile"

                    });

                }


                // ============================================
                // VALIDATE IMAGE
                // ============================================

                const validation =
                    validateProfilePhoto(
                        image
                    );


                if (
                    !validation.valid
                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            validation.error

                    });

                }


                // ============================================
                // FIND USER
                // ============================================

                const user =
                    await usersCollection.findOne(

                        {

                            _id:
                                new ObjectId(
                                    authenticatedUserId
                                )

                        }

                    );


                if (
                    !user
                ) {

                    return res.status(404).json({

                        success:
                            false,

                        error:
                            "User not found"

                    });

                }


                // ============================================
                // CLOUDINARY CONFIG CHECK
                // ============================================

                if (

                    !isCloudinaryConfigured()

                ) {

                    console.error(

                        "Cloudinary environment variables are missing"

                    );


                    return res.status(500).json({

                        success:
                            false,

                        error:
                            "Profile photo storage is not configured"

                    });

                }


                // ============================================
                // CONFIGURE CLOUDINARY
                // ============================================

                configureCloudinary();


                // ============================================
                // UPLOAD IMAGE
                // ============================================

                const uploadResult =
                    await cloudinary.uploader.upload(

                        image,

                        {

                            folder:
                                PROFILE_PHOTO_FOLDER,

                            public_id:
                                user
                                    ._id
                                    .toString(),

                            overwrite:
                                true,

                            resource_type:
                                "image",

                            type:
                                "upload",

                            invalidate:
                                true

                        }

                    );


                const avatarUrl =
                    uploadResult.secure_url;


                const avatarPublicId =
                    uploadResult.public_id;


                if (

                    !avatarUrl

                    ||

                    !avatarPublicId

                ) {

                    throw new Error(

                        "Cloudinary did not return a valid asset"

                    );

                }


                // ============================================
                // SAVE IMAGE DATA
                // ============================================

                await usersCollection.updateOne(

                    {

                        _id:
                            user._id

                    },

                    {

                        $set: {

                            avatarUrl:
                                avatarUrl,

                            avatarPublicId:
                                avatarPublicId

                        }

                    }

                );


                console.log(

                    "Profile photo updated:",

                    user
                        ._id
                        .toString()

                );


                // ============================================
                // SUCCESS
                // ============================================

                return res.json({

                    success:
                        true,

                    message:
                        "Profile photo updated successfully",

                    avatarUrl:
                        avatarUrl

                });


            } catch (
                error
            ) {

                console.error(

                    "Profile photo upload error:",

                    error

                );


                return res.status(500).json({

                    success:
                        false,

                    error:
                        "Could not save profile photo"

                });

            }

        }

    );


    // ========================================================
    // REMOVE PROFILE PHOTO
    //
    // Protected route.
    // JWT user must match :userId.
    // ========================================================

    router.delete(

        "/profile/:userId/photo",

        authenticateToken,

        async (

            req,

            res

        ) => {

            try {

                const userId =
                    typeof req.params.userId ===
                    "string"

                        ? req.params.userId.trim()

                        : "";


                const authenticatedUserId =
                    req.user?.userId;


                // ============================================
                // VALIDATE USER ID
                // ============================================

                if (

                    !isValidObjectId(
                        userId
                    )

                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Invalid user ID"

                    });

                }


                // ============================================
                // AUTHORIZE USER
                // ============================================

                if (

                    !isAuthorizedUser(

                        userId,

                        authenticatedUserId

                    )

                ) {

                    return res.status(403).json({

                        success:
                            false,

                        error:
                            "You are not authorized to modify this profile"

                    });

                }


                // ============================================
                // FIND USER
                // ============================================

                const user =
                    await usersCollection.findOne(

                        {

                            _id:
                                new ObjectId(
                                    authenticatedUserId
                                )

                        }

                    );


                if (
                    !user
                ) {

                    return res.status(404).json({

                        success:
                            false,

                        error:
                            "User not found"

                    });

                }


                // ============================================
                // DELETE FROM CLOUDINARY
                // ============================================

                if (

                    user.avatarPublicId

                    &&

                    isCloudinaryConfigured()

                ) {

                    try {

                        configureCloudinary();


                        await cloudinary.uploader.destroy(

                            user.avatarPublicId,

                            {

                                resource_type:
                                    "image",

                                type:
                                    "upload",

                                invalidate:
                                    true

                            }

                        );

                    } catch (
                        cloudinaryError
                    ) {

                        console.error(

                            "Cloudinary photo delete error:",

                            cloudinaryError

                        );

                    }

                }


                // ============================================
                // REMOVE FROM DATABASE
                // ============================================

                await usersCollection.updateOne(

                    {

                        _id:
                            user._id

                    },

                    {

                        $unset: {

                            avatarUrl:
                                "",

                            avatarPublicId:
                                ""

                        }

                    }

                );


                console.log(

                    "Profile photo removed:",

                    user
                        ._id
                        .toString()

                );


                // ============================================
                // SUCCESS
                // ============================================

                return res.json({

                    success:
                        true,

                    message:
                        "Profile photo removed successfully"

                });


            } catch (
                error
            ) {

                console.error(

                    "Profile photo delete error:",

                    error

                );


                return res.status(500).json({

                    success:
                        false,

                    error:
                        "Could not remove profile photo"

                });

            }

        }

    );


    // ========================================================
    // RETURN ROUTER
    // ========================================================

    return router;

}


// ============================================================
// MODULE EXPORT
// ============================================================

module.exports =
    createProfileRouter;