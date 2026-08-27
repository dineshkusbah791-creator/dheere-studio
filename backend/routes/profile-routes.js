// ============================================================
// PROFILE ROUTES
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

                                email:
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

                        email:
                            user.email ||
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
    // UPDATE PROFILE PHOTO
    // ========================================================

    router.put(

        "/profile/:userId/photo",

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



                const {

                    username,

                    image

                } =
                    req.body;



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
                // VALIDATE USERNAME
                // ============================================

                const cleanUsername =
                    normalizeUsername(
                        username
                    );



                if (

                    !USERNAME_REGEX.test(
                        cleanUsername
                    )

                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Valid username is required"

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
                // VERIFY USER
                // ============================================

                const user =
                    await usersCollection.findOne({

                        _id:
                            new ObjectId(
                                userId
                            ),

                        username:
                            cleanUsername

                    });



                if (
                    !user
                ) {

                    return res.status(401).json({

                        success:
                            false,

                        error:
                            "User verification failed"

                    });

                }



                // ============================================
                // CHECK CLOUDINARY
                // ============================================

                if (

                    !process.env.CLOUDINARY_CLOUD_NAME

                    ||

                    !process.env.CLOUDINARY_API_KEY

                    ||

                    !process.env.CLOUDINARY_API_SECRET

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
                            user._id,

                        username:
                            cleanUsername

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
    // ========================================================

    router.delete(

        "/profile/:userId/photo",

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



                const {

                    username

                } =
                    req.body;



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
                // VALIDATE USERNAME
                // ============================================

                const cleanUsername =
                    normalizeUsername(
                        username
                    );



                if (

                    !USERNAME_REGEX.test(
                        cleanUsername
                    )

                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Valid username is required"

                    });

                }



                // ============================================
                // VERIFY USER
                // ============================================

                const user =
                    await usersCollection.findOne({

                        _id:
                            new ObjectId(
                                userId
                            ),

                        username:
                            cleanUsername

                    });



                if (
                    !user
                ) {

                    return res.status(401).json({

                        success:
                            false,

                        error:
                            "User verification failed"

                    });

                }



                // ============================================
                // DELETE FROM CLOUDINARY
                // ============================================

                if (
                    user.avatarPublicId
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



                return res.json({

                    success:
                        true,

                    message:
                        "Profile photo removed successfully",

                    avatarUrl:
                        ""

                });


            } catch (
                error
            ) {


                console.error(

                    "Remove profile photo error:",

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
    // UPDATE PROFILE
    // ========================================================

    router.put(

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



                const {

                    currentUsername,

                    name,

                    username,

                    bio

                } =
                    req.body;



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
                // VALIDATE REQUIRED VALUES
                // ============================================

                if (

                    typeof currentUsername !==
                    "string"

                    ||

                    typeof name !==
                    "string"

                    ||

                    typeof username !==
                    "string"

                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Name, username and current username are required"

                    });

                }



                // ============================================
                // CLEAN VALUES
                // ============================================

                const cleanCurrentUsername =
                    normalizeUsername(
                        currentUsername
                    );



                const cleanName =
                    cleanNameValue(
                        name
                    );



                const cleanUsername =
                    normalizeUsername(
                        username
                    );



                // ============================================
                // BIO TYPE
                // ============================================

                if (

                    bio !== undefined

                    &&

                    bio !== null

                    &&

                    typeof bio !==
                    "string"

                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Bio must be text"

                    });

                }



                const cleanBioValue =
                    cleanBio(
                        bio
                    );



                // ============================================
                // NAME VALIDATION
                // ============================================

                if (
                    !cleanName
                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            "Name cannot be empty"

                    });

                }



                if (

                    cleanName.length >

                    MAX_NAME_LENGTH

                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            `Name cannot exceed ${MAX_NAME_LENGTH} characters`

                    });

                }



                // ============================================
                // USERNAME VALIDATION
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
                            "Username must be 3-20 characters and contain only letters, numbers, and underscores."

                    });

                }



                // ============================================
                // BIO LENGTH VALIDATION
                // ============================================

                if (

                    typeof bio ===
                    "string"

                    &&

                    bio.trim().length >

                    MAX_BIO_LENGTH

                ) {

                    return res.status(400).json({

                        success:
                            false,

                        error:
                            `Bio cannot exceed ${MAX_BIO_LENGTH} characters`

                    });

                }



                // ============================================
                // VERIFY CURRENT USER
                // ============================================

                const user =
                    await usersCollection.findOne({

                        _id:
                            new ObjectId(
                                userId
                            ),

                        username:
                            cleanCurrentUsername

                    });



                if (
                    !user
                ) {

                    return res.status(401).json({

                        success:
                            false,

                        error:
                            "User verification failed"

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
                        await usersCollection.findOne({

                            username:
                                cleanUsername

                        });



                    if (

                        usernameOwner

                        &&

                        usernameOwner
                            ._id
                            .toString() !==
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
                                cleanName,

                            username:
                                cleanUsername,

                            bio:
                                cleanBioValue

                        }

                    }

                );



                // ============================================
                // SUCCESS RESPONSE
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
                            cleanName,

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
    // RETURN ROUTER
    // ========================================================

    return router;


}



// ============================================================
// MODULE EXPORT
// ============================================================

module.exports =
    createProfileRouter;