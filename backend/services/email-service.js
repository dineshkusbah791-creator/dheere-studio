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
// RESEND CLIENT
// ============================================================

const resend =
    new Resend(
        process.env.RESEND_API_KEY
    );



// ============================================================
// SEND PASSWORD RESET EMAIL
// ============================================================

async function sendPasswordResetEmail(
    {
        email,
        resetUrl,
        expiryMinutes
    }
) {

    if (
        !email ||
        !resetUrl
    ) {

        throw new Error(
            "Email and reset URL are required."
        );

    }



    const {
        data,
        error
    } =
        await resend.emails.send({

            from:
                process.env.RESEND_FROM_EMAIL ||
                "Dheere Studio <onboarding@resend.dev>",

            to:
                [email],

            subject:
                "Reset your Dheere Studio password",



            // ------------------------------------------------
            // PLAIN TEXT VERSION
            // ------------------------------------------------

            text:

`You requested a password reset for your Dheere Studio account.

Use the link below to create a new password:

${resetUrl}

This link expires in ${expiryMinutes} minutes and can only be used once.

If you did not request this, you can safely ignore this email.`,



            // ------------------------------------------------
            // HTML VERSION
            // ------------------------------------------------

            html:

`
<!DOCTYPE html>

<html>

<head>

    <meta charset="UTF-8">

    <title>
        Reset your Dheere Studio password
    </title>

</head>


<body
    style="
        margin:0;
        padding:40px 20px;
        background:#f5f5f5;
        font-family:Arial,sans-serif;
    "
>


    <div
        style="
            max-width:520px;
            margin:auto;
            background:white;
            padding:35px;
            border-radius:12px;
        "
    >


        <h2>
            Reset your password
        </h2>


        <p>

            We received a request to reset your
            Dheere Studio password.

        </p>


        <p>

            Click the button below to create a
            new password.

        </p>


        <p
            style="
                margin:30px 0;
            "
        >


            <a
                href="${resetUrl}"
                style="
                    display:inline-block;
                    padding:12px 22px;
                    background:#111;
                    color:#fff;
                    text-decoration:none;
                    border-radius:8px;
                "
            >

                Create New Password

            </a>


        </p>


        <p>

            This link expires in
            ${expiryMinutes}
            minutes and can only be used once.

        </p>


        <p>

            If you did not request this,
            you can safely ignore this email.

        </p>


        <hr>


        <p
            style="
                font-size:12px;
                color:#777;
            "
        >

            Dheere Studio

        </p>


    </div>


</body>

</html>
`

        });



    // ========================================================
    // RESEND ERROR
    // ========================================================

    if (error) {

        console.error(
            "Resend email error:",
            error
        );



        throw new Error(
            "Could not send password reset email"
        );

    }



    // ========================================================
    // SUCCESS LOGS
    // ========================================================

    console.log(
        "Password reset email sent to:",
        email
    );



    console.log(
        "Resend email ID:",
        data?.id
    );



    return data;

}



// ============================================================
// MODULE EXPORTS
// ============================================================

module.exports = {

    sendPasswordResetEmail

};