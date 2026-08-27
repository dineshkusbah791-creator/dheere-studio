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
    // GET PROFILE
    //
    // Public route.
    //
    // Email is intentionally NOT exposed.
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

                    bio

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

                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Invalid profile data"

                    });

                }



                // ============================================
                // CLEAN VALUES
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

                    MAX_BIO_LENGTH

                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            `Bio must not exceed ${MAX_BIO_LENGTH} characters`

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
                // CHECK USERNAME
                // ============================================

                const usernameChanged =
                    user.username !==
                    cleanUsername;



                if (

                    usernameChanged

                ) {

                    const usernameOwner =
                        await usersCollection.findOne(

                            {

                                username:
                                    cleanUsername

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
                // UPDATE USER
                // ============================================

                await usersCollection.updateOne(

                    {

                        _id:
                            user._id

                    },

                    {

                        $set: {

                            name:
                                cleanedName,

                            username:
                                cleanUsername,

                            bio:
                                cleanBioValue

                        }

                    }

                );



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
                // CHECK CLOUDINARY
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