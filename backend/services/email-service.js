// ============================================================
// RESEND
// ============================================================

const {
    Resend
} =
    require(
        "resend"
    );



// ============================================================
// CONFIG
// ============================================================

const DEFAULT_EXPIRY_MINUTES =
    15;



const EMAIL_REGEX =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



// ============================================================
// RESEND CLIENT
// ============================================================

const resend =
    new Resend(
        process.env.RESEND_API_KEY
    );



// ============================================================
// VALIDATE RESET URL
// ============================================================

function validateResetUrl(
    resetUrl
) {

    if (
        typeof resetUrl !==
        "string"
    ) {

        return false;

    }



    try {

        const parsedUrl =
            new URL(
                resetUrl
            );



        return (

            parsedUrl.protocol ===
            "https:" ||

            parsedUrl.protocol ===
            "http:"

        );


    } catch {

        return false;

    }

}



// ============================================================
// SEND PASSWORD RESET EMAIL
// ============================================================

async function sendPasswordResetEmail(
    {
        email,
        resetUrl,
        expiryMinutes =
            DEFAULT_EXPIRY_MINUTES
    }
) {


    // ========================================================
    // VALIDATE EMAIL
    // ========================================================

    if (

        typeof email !==
        "string" ||

        !EMAIL_REGEX.test(
            email.trim()
        )

    ) {

        throw new Error(
            "A valid email address is required."
        );

    }



    const cleanEmail =
        email
            .trim()
            .toLowerCase();



    // ========================================================
    // VALIDATE RESET URL
    // ========================================================

    if (

        !validateResetUrl(
            resetUrl
        )

    ) {

        throw new Error(
            "A valid password reset URL is required."
        );

    }



    // ========================================================
    // VALIDATE EXPIRY
    // ========================================================

    const safeExpiryMinutes =
        Number.isInteger(
            expiryMinutes
        ) &&

        expiryMinutes > 0 &&

        expiryMinutes <= 60

            ? expiryMinutes

            : DEFAULT_EXPIRY_MINUTES;



    // ========================================================
    // RESEND API KEY CHECK
    // ========================================================

    if (
        !process.env.RESEND_API_KEY
    ) {

        throw new Error(
            "Email service is not configured."
        );

    }



    // ========================================================
    // SEND EMAIL
    // ========================================================

    const {
        data,
        error
    } =
        await resend.emails.send({

            from:

                process.env.RESEND_FROM_EMAIL ||

                "Dheere Studio <onboarding@resend.dev>",


            to:
                [cleanEmail],


            subject:
                "Reset your Dheere Studio password",



            // =================================================
            // PLAIN TEXT VERSION
            // =================================================

            text:

`DHEERE STUDIO

Password Reset Request

We received a request to reset the password for your Dheere Studio account.

To create a new password, open the link below:

${resetUrl}

This link will expire in ${safeExpiryMinutes} minutes and can only be used once.

If you did not request a password reset, no action is required. Your account will remain secure.

For your security, please do not share this link with anyone.

— Dheere Studio`,


            // =================================================
            // HTML VERSION
            // =================================================

            html:

`
<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>
        Reset your password
    </title>

</head>


<body
    style="
        margin:0;
        padding:0;
        background:#f4f4f4;
        font-family:
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            Arial,
            sans-serif;
        color:#1a1a1a;
    "
>


    <div
        style="
            width:100%;
            padding:40px 16px;
            box-sizing:border-box;
        "
    >


        <div
            style="
                max-width:560px;
                margin:0 auto;
                background:#ffffff;
                border-radius:12px;
                overflow:hidden;
            "
        >


            <!-- =========================================== -->
            <!-- HEADER -->
            <!-- =========================================== -->

            <div
                style="
                    padding:32px 36px;
                    border-bottom:1px solid #eaeaea;
                "
            >

                <div
                    style="
                        font-size:14px;
                        letter-spacing:1.5px;
                        font-weight:600;
                        color:#555555;
                        text-transform:uppercase;
                    "
                >

                    Dheere Studio

                </div>

            </div>



            <!-- =========================================== -->
            <!-- CONTENT -->
            <!-- =========================================== -->

            <div
                style="
                    padding:36px;
                "
            >


                <h1
                    style="
                        margin:0 0 20px;
                        font-size:26px;
                        line-height:1.3;
                        font-weight:600;
                        color:#111111;
                    "
                >

                    Reset your password

                </h1>


                <p
                    style="
                        margin:0 0 18px;
                        font-size:16px;
                        line-height:1.7;
                        color:#444444;
                    "
                >

                    We received a request to reset the password
                    for your Dheere Studio account.

                </p>


                <p
                    style="
                        margin:0 0 28px;
                        font-size:16px;
                        line-height:1.7;
                        color:#444444;
                    "
                >

                    Use the button below to create a new password.

                </p>



                <!-- ======================================= -->
                <!-- RESET BUTTON -->
                <!-- ======================================= -->

                <div
                    style="
                        margin:32px 0;
                    "
                >

                    <a

                        href="${resetUrl}"

                        style="
                            display:inline-block;
                            padding:14px 24px;
                            background:#111111;
                            color:#ffffff;
                            text-decoration:none;
                            border-radius:8px;
                            font-size:15px;
                            font-weight:600;

                        "

                    >

                        Reset Password

                    </a>

                </div>



                <!-- ======================================= -->
                <!-- EXPIRY -->
                <!-- ======================================= -->

                <div
                    style="
                        padding:16px;
                        background:#f7f7f7;
                        border-radius:8px;
                        font-size:14px;
                        line-height:1.6;
                        color:#555555;
                    "
                >

                    This link expires in
                    <strong>
                        ${safeExpiryMinutes} minutes
                    </strong>
                    and can only be used once.

                </div>



                <!-- ======================================= -->
                <!-- SECURITY NOTICE -->
                <!-- ======================================= -->

                <p
                    style="
                        margin:28px 0 0;
                        font-size:14px;
                        line-height:1.7;
                        color:#666666;
                    "
                >

                    If you did not request a password reset,
                    you can safely ignore this email.
                    Your password will not be changed.

                </p>


                <p
                    style="
                        margin:16px 0 0;
                        font-size:13px;
                        line-height:1.6;
                        color:#888888;
                    "
                >

                    For your security, do not forward or share
                    this password reset link with anyone.

                </p>


                <!-- ======================================= -->
                <!-- FALLBACK LINK -->
                <!-- ======================================= -->

                <p
                    style="
                        margin:28px 0 0;
                        font-size:12px;
                        line-height:1.6;
                        color:#999999;
                        word-break:break-all;
                    "
                >

                    If the button does not work, copy and paste
                    this link into your browser:

                    <br>
                    <br>

                    ${resetUrl}

                </p>


            </div>



            <!-- =========================================== -->
            <!-- FOOTER -->
            <!-- =========================================== -->

            <div
                style="
                    padding:24px 36px;
                    border-top:1px solid #eaeaea;
                    font-size:12px;
                    color:#888888;
                    line-height:1.6;
                "
            >

                © Dheere Studio

                <br>

                This is an automated security email.

            </div>


        </div>


    </div>


</body>

</html>
`

        });



    // ========================================================
    // RESEND ERROR
    // ========================================================

    if (
        error
    ) {

        console.error(

            "Password reset email failed:",

            error?.message ||

            error

        );



        throw new Error(
            "Could not send password reset email"
        );

    }



    // ========================================================
    // SUCCESS LOG
    // ========================================================

    console.log(
        "Password reset email sent successfully"
    );



    return data;

}



// ============================================================
// MODULE EXPORTS
// ============================================================

module.exports = {

    sendPasswordResetEmail

};