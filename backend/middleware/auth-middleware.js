// ============================================================
// DEPENDENCIES
// ============================================================

const jwt =
    require(
        "jsonwebtoken"
    );



// ============================================================
// AUTH MIDDLEWARE
// ============================================================

function authenticateToken(
    req,
    res,
    next
) {

    try {

        // ====================================================
        // GET AUTHORIZATION HEADER
        // ====================================================

        const authorizationHeader =
            req.headers.authorization;



        // ====================================================
        // VALIDATE HEADER
        // ====================================================

        if (
            !authorizationHeader ||
            !authorizationHeader.startsWith(
                "Bearer "
            )
        ) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "Authentication required"

            });

        }



        // ====================================================
        // EXTRACT TOKEN
        // ====================================================

        const token =
            authorizationHeader.slice(
                7
            ).trim();



        if (
            !token
        ) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "Authentication required"

            });

        }



        // ====================================================
        // JWT SECRET CHECK
        // ====================================================

        if (
            !process.env.JWT_SECRET
        ) {

            console.error(
                "JWT_SECRET is missing"
            );



            return res.status(500).json({

                success:
                    false,

                error:
                    "Server authentication is not configured"

            });

        }



        // ====================================================
        // VERIFY TOKEN
        // ====================================================

        const decoded =
            jwt.verify(

                token,

                process.env.JWT_SECRET

            );



        // ====================================================
        // VALIDATE TOKEN PAYLOAD
        // ====================================================

        if (
            !decoded ||
            !decoded.userId
        ) {

            return res.status(401).json({

                success:
                    false,

                error:
                    "Invalid authentication token"

            });

        }



        // ====================================================
        // ATTACH AUTHENTICATED USER
        // ====================================================

        req.user = {

            userId:
                String(
                    decoded.userId
                )

        };



        return next();


    } catch (error) {

        // ====================================================
        // TOKEN ERROR
        // ====================================================

        return res.status(401).json({

            success:
                false,

            error:
                "Invalid or expired authentication token"

        });

    }

}



// ============================================================
// MODULE EXPORTS
// ============================================================

module.exports = {

    authenticateToken

};