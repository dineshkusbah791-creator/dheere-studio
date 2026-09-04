/* ============================================================
   DHEERE STUDIO — AUTH SYSTEM
   Shared Authentication Controller
   ------------------------------------------------------------
   Works with:
   - login.html
   - register.html
   - forgot.html
   - reset-password.html
   - verify.html

   This version fixes the confirmed OTP issues while preserving
   the existing login, registration, recovery, and reset logic.

   IMPORTANT:
   MSG91 widget configuration is read from the page meta tags:
   - dheere-msg91-widget-id
   - dheere-msg91-widget-token

   Do NOT place MSG91_AUTH_KEY in this file.
   MSG91_AUTH_KEY belongs only on the backend / Render ENV.
   ============================================================ */

(() => {
    "use strict";

    /* ============================================================
       1. CONFIGURATION
       ============================================================ */

    const AUTH_CONFIG = Object.freeze({
        API_BASE_URL: "https://dheere-studio.onrender.com",

        STORAGE: Object.freeze({
            USER: "dheereStudioUser",
            TOKEN: "dheereStudioToken"
        }),

        ENDPOINTS: Object.freeze({
            LOGIN: "/login",

            REGISTER: "/register",

            CHECK_USERNAME: (username) =>
                `/check-username/${encodeURIComponent(username)}`,

            FORGOT_REQUEST: "/forgot-password",

            RESET_PASSWORD: "/reset-password",

            MOBILE_RECOVERY: "/forgot-password-mobile"
        }),

        MSG91: Object.freeze({
            WIDGET_ID_META:
                "dheere-msg91-widget-id",

            WIDGET_TOKEN_META:
                "dheere-msg91-widget-token",

            COUNTRY_CODE: "91",

            SDK_URL:
                "https://verify.msg91.com/otp-provider.js"
        }),

        DEFAULT_REDIRECT: "../index.html"
    });

    /* ============================================================
       2. DOM / GENERAL HELPERS
       ============================================================ */

    const $ = (selector, root = document) =>
        root.querySelector(selector);

    const $$ = (selector, root = document) =>
        Array.from(root.querySelectorAll(selector));

    const text = (value) =>
        String(value ?? "").trim();

    const normalizedEmail = (value) =>
        text(value).toLowerCase();

    const sleep = (ms) =>
        new Promise((resolve) =>
            window.setTimeout(resolve, ms)
        );

    function getQueryParam(name) {
        return (
            new URLSearchParams(
                window.location.search
            ).get(name) || ""
        );
    }

    function safeJsonParse(value, fallback = null) {
        try {
            return value
                ? JSON.parse(value)
                : fallback;
        } catch {
            return fallback;
        }
    }

    function getStoredToken() {
        try {
            return (
                localStorage.getItem(
                    AUTH_CONFIG.STORAGE.TOKEN
                ) || ""
            );
        } catch {
            return "";
        }
    }

    function getStoredUser() {
        try {
            return safeJsonParse(
                localStorage.getItem(
                    AUTH_CONFIG.STORAGE.USER
                ),
                null
            );
        } catch {
            return null;
        }
    }

    function saveSession(user, token) {
        if (!user || !token) {
            throw new Error(
                "A valid authentication session was not returned."
            );
        }

        try {
            localStorage.setItem(
                AUTH_CONFIG.STORAGE.USER,
                JSON.stringify(user)
            );

            localStorage.setItem(
                AUTH_CONFIG.STORAGE.TOKEN,
                token
            );
        } catch (error) {
            console.error(
                "Unable to save authentication session:",
                error
            );

            throw new Error(
                "Your account was authenticated, but the session could not be saved."
            );
        }

        window.dispatchEvent(
            new CustomEvent(
                "dheere:auth-changed",
                {
                    detail: {
                        authenticated: true,
                        user
                    }
                }
            )
        );
    }

    function clearSession() {
        try {
            localStorage.removeItem(
                AUTH_CONFIG.STORAGE.USER
            );

            localStorage.removeItem(
                AUTH_CONFIG.STORAGE.TOKEN
            );
        } catch (error) {
            console.error(
                "Unable to clear authentication session:",
                error
            );
        }

        window.dispatchEvent(
            new CustomEvent(
                "dheere:auth-changed",
                {
                    detail: {
                        authenticated: false
                    }
                }
            )
        );
    }

    /* ============================================================
       3. GUEST MODE
       ============================================================ */

    const GUEST_STORAGE_KEY =
        "dheereStudioGuest";

    const OTP_STATE = {
        registerMobile: "",

        registerAccessToken: "",

        registerReqId: "",

        recoveryMobile: "",

        recoveryAccessToken: "",

        recoveryReqId: "",

        recoveryResetToken: ""
    };

    function clearGuestMode() {
        try {
            sessionStorage.removeItem(
                GUEST_STORAGE_KEY
            );
        } catch (error) {
            console.error(
                "Unable to clear guest mode:",
                error
            );
        }
    }

    function enterGuestMode(event) {
        if (event) {
            event.preventDefault();
        }

        try {
            sessionStorage.setItem(
                GUEST_STORAGE_KEY,
                "true"
            );
        } catch (error) {
            console.error(
                "Unable to save guest mode:",
                error
            );
        }

        window.location.replace(
            "../index.html"
        );
    }

    function isGuestMode() {
        try {
            return (
                sessionStorage.getItem(
                    GUEST_STORAGE_KEY
                ) === "true"
            );
        } catch {
            return false;
        }
    }

    function setupGuestModeLinks() {
        $$(".auth-guest-link").forEach(
            (link) => {
                if (
                    link.dataset.guestBound ===
                    "true"
                ) {
                    return;
                }

                link.dataset.guestBound =
                    "true";

                link.addEventListener(
                    "click",
                    enterGuestMode
                );
            }
        );
    }

    /* ============================================================
       4. SAFE REDIRECT
       ============================================================ */

    function getSafeRedirect() {
        const requested =
            getQueryParam("redirect");

        if (
            requested &&
            requested.startsWith("/") &&
            !requested.startsWith("//") &&
            !requested.includes("\r") &&
            !requested.includes("\n")
        ) {
            return requested;
        }

        return AUTH_CONFIG.DEFAULT_REDIRECT;
    }

    function redirectAfterAuth() {
        window.location.assign(
            getSafeRedirect()
        );
    }

    /* ============================================================
       5. UI MESSAGES
       ============================================================ */

    function getMessageElement(id) {
        return document.getElementById(id);
    }

    function showMessage(
        id,
        message,
        type = "error"
    ) {
        const element =
            getMessageElement(id);

        if (!element) {
            return;
        }

        element.textContent =
            text(message);

        element.className =
            `auth-message ${type}`.trim();

        element.hidden =
            !text(message);
    }

    function hideMessage(id) {
        const element =
            getMessageElement(id);

        if (!element) {
            return;
        }

        element.textContent = "";

        element.className =
            "auth-message";

        element.hidden = true;
    }

    function showLoginMessage(
        message,
        type = "error"
    ) {
        showMessage(
            "loginMessage",
            message,
            type
        );
    }

    function showRegisterMessage(
        message,
        type = "error"
    ) {
        showMessage(
            "registerMessage",
            message,
            type
        );
    }

    function setLoading(
        button,
        loading,
        loadingText = "Please wait…"
    ) {
        if (!button) {
            return;
        }

        if (loading) {
            if (
                !button.dataset.originalText
            ) {
                button.dataset.originalText =
                    button.textContent.trim();
            }

            button.textContent =
                loadingText;

            button.disabled = true;

            button.classList.add(
                "is-loading"
            );

            button.setAttribute(
                "aria-busy",
                "true"
            );

            return;
        }

        button.textContent =
            button.dataset.originalText ||
            "Continue";

        button.disabled = false;

        button.classList.remove(
            "is-loading"
        );

        button.removeAttribute(
            "aria-busy"
        );
    }

    function setFieldInvalid(
        element,
        invalid
    ) {
        if (!element) {
            return;
        }

        if (invalid) {
            element.setAttribute(
                "aria-invalid",
                "true"
            );
        } else {
            element.removeAttribute(
                "aria-invalid"
            );
        }
    }

    /* ============================================================
       6. ERROR NORMALIZATION
       ============================================================ */

    function getApiErrorMessage(
        data,
        fallback =
            "Something went wrong. Please try again."
    ) {
        return (
            data?.message ||
            data?.error ||
            data?.details ||
            data?.reason ||
            fallback
        );
    }

    function createNetworkError() {
        const error =
            new Error(
                "Unable to reach Dheere Studio right now. Please check your connection and try again."
            );

        error.code =
            "NETWORK_ERROR";

        return error;
    }

    /* ============================================================
       7. API REQUEST
       ============================================================ */

    async function apiRequest(
        path,
        options = {}
    ) {
        const headers =
            new Headers(
                options.headers || {}
            );

        headers.set(
            "Accept",
            "application/json"
        );

        if (
            options.body &&
            !headers.has("Content-Type")
        ) {
            headers.set(
                "Content-Type",
                "application/json"
            );
        }

        const token =
            getStoredToken();

        if (
            token &&
            !headers.has("Authorization")
        ) {
            headers.set(
                "Authorization",
                `Bearer ${token}`
            );
        }

        let response;

        try {
            response =
                await fetch(
                    `${AUTH_CONFIG.API_BASE_URL}${path}`,
                    {
                        ...options,
                        headers,
                        credentials: "omit"
                    }
                );
        } catch {
            throw createNetworkError();
        }

        let data = null;

        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            const error =
                new Error(
                    getApiErrorMessage(
                        data,
                        `Request failed (${response.status}).`
                    )
                );

            error.status =
                response.status;

            error.data =
                data;

            throw error;
        }

        return data;
    }

    /* ============================================================
       8. RESPONSE EXTRACTION
       ============================================================ */

    function extractToken(data) {
        return (
            data?.token ||
            data?.accessToken ||
            data?.data?.token ||
            data?.data?.accessToken ||
            ""
        );
    }

    function extractUser(data) {
        return (
            data?.user ||
            data?.account ||
            data?.data?.user ||
            data?.profile ||
            null
        );
    }

    function extractRecoveryToken(
        data
    ) {
        return (
            data?.resetToken ||
            data?.recoveryToken ||
            data?.token ||
            data?.data?.resetToken ||
            data?.data?.recoveryToken ||
            data?.data?.token ||
            ""
        );
    }

    function extractMsg91AccessToken(
        response
    ) {
        return (
            response?.accessToken ||
            response?.["access-token"] ||
            response?.data?.accessToken ||
            response?.data?.["access-token"] ||
            response?.data?.token ||
            response?.token ||
            ""
        );
    }

    /* ============================================================
       9. VALIDATION HELPERS
       ============================================================ */

    function isValidEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            normalizedEmail(value)
        );
    }

    function isValidUsername(value) {
        return /^[a-z0-9_]{3,20}$/.test(
            text(value).toLowerCase()
        );
    }

    function normalizeMobile(value) {
        return text(value).replace(
            /\D/g,
            ""
        );
    }

    function isValidMobile(value) {
        return /^[0-9]{10}$/.test(
            normalizeMobile(value)
        );
    }

    function isValidOtp(value) {
        return /^[0-9]{4,8}$/.test(
            text(value)
        );
    }

    function passwordScore(value) {
        const password =
            String(value || "");

        if (!password) {
            return 0;
        }

        let score = 0;

        if (password.length >= 8) {
            score += 1;
        }

        if (password.length >= 12) {
            score += 1;
        }

        if (
            /[a-z]/.test(password) &&
            /[A-Z]/.test(password)
        ) {
            score += 1;
        }

        if (/\d/.test(password)) {
            score += 1;
        }

        if (
            /[^A-Za-z0-9]/.test(
                password
            )
        ) {
            score += 1;
        }

        return Math.min(
            score,
            5
        );
    }

    function passwordStrengthLabel(
        score
    ) {
        switch (score) {
            case 0:
                return "";

            case 1:
                return "Very weak";

            case 2:
                return "Weak";

            case 3:
                return "Fair";

            case 4:
                return "Good";

            case 5:
                return "Strong";

            default:
                return "";
        }
    }

    /* ============================================================
       10. PASSWORD VISIBILITY
       ============================================================ */

    function setupPasswordToggles() {
        $$(".auth-password-toggle").forEach(
            (button) => {
                if (
                    button.dataset.authBound ===
                    "true"
                ) {
                    return;
                }

                const targetId =
                    button.getAttribute(
                        "data-target"
                    );

                const input =
                    targetId
                        ? document.getElementById(
                            targetId
                        )
                        : null;

                if (!input) {
                    return;
                }

                button.dataset.authBound =
                    "true";

                const updateState = () => {
                    const visible =
                        input.type === "text";

                    button.dataset.passwordState =
                        visible
                            ? "visible"
                            : "hidden";

                    button.setAttribute(
                        "aria-label",
                        visible
                            ? "Hide password"
                            : "Show password"
                    );

                    button.setAttribute(
                        "title",
                        visible
                            ? "Hide password"
                            : "Show password"
                    );
                };

                button.addEventListener(
                    "click",
                    () => {
                        input.type =
                            input.type ===
                            "password"
                                ? "text"
                                : "password";

                        updateState();

                        input.focus({
                            preventScroll:
                                true
                        });
                    }
                );

                updateState();
            }
        );
    }

    /* ============================================================
       11. PASSWORD STRENGTH UI
       ============================================================ */

    function updateStrengthUI(
        input,
        meter,
        valueElement
    ) {
        if (!input || !meter) {
            return;
        }

        const score =
            passwordScore(
                input.value
            );

        meter.dataset.score =
            String(
                Math.min(
                    score,
                    5
                )
            );

        if (valueElement) {
            valueElement.textContent =
                input.value
                    ? passwordStrengthLabel(
                        score
                    )
                    : "";
        }
    }

    function setupPasswordStrength() {
        $$(
            "[data-strength-target]"
        ).forEach((input) => {
            const targetId =
                input.dataset
                    .strengthTarget;

            const meter =
                document.getElementById(
                    targetId
                );

            if (!meter) {
                return;
            }

            const valueElement =
                document.getElementById(
                    `${targetId}Value`
                );

            const update = () => {
                updateStrengthUI(
                    input,
                    meter,
                    valueElement
                );
            };

            input.addEventListener(
                "input",
                update
            );

            update();
        });

        const compatibilityInputs = [
            {
                input:
                    document.getElementById(
                        "registerPassword"
                    ),

                meter:
                    document.getElementById(
                        "registerPasswordStrength"
                    ),

                value:
                    document.getElementById(
                        "registerPasswordStrengthValue"
                    )
            },

            {
                input:
                    document.getElementById(
                        "newPassword"
                    ),

                meter:
                    document.getElementById(
                        "passwordStrength"
                    ),

                value:
                    document.getElementById(
                        "passwordStrengthValue"
                    )
            },

            {
                input:
                    document.getElementById(
                        "forgotNewPassword"
                    ),

                meter:
                    document.getElementById(
                        "forgotPasswordStrength"
                    ),

                value:
                    document.getElementById(
                        "forgotPasswordStrengthValue"
                    )
            }
        ];

        compatibilityInputs.forEach(
            ({
                input,
                meter,
                value
            }) => {
                if (
                    !input ||
                    !meter
                ) {
                    return;
                }

                const update = () => {
                    const score =
                        passwordScore(
                            input.value
                        );

                    meter.dataset.score =
                        String(
                            Math.min(
                                score,
                                5
                            )
                        );

                    if (value) {
                        value.textContent =
                            input.value
                                ? passwordStrengthLabel(
                                    score
                                )
                                : "";
                    }

                    if (
                        input.value &&
                        meter.hidden
                    ) {
                        meter.hidden =
                            false;
                    }
                };

                input.addEventListener(
                    "input",
                    update
                );

                update();
            }
        );
    }

    /* ============================================================
       12. USERNAME AVAILABILITY
       ============================================================ */

    let usernameRequestSequence = 0;

    function setUsernameStatus(
        username,
        message,
        type = ""
    ) {
        const status =
            document.getElementById(
                "usernameStatus"
            );

        if (!status) {
            return;
        }

        status.textContent =
            message || "";

        status.className =
            `auth-field-status ${type}`.trim();

        const input =
            document.getElementById(
                "registerUsername"
            );

        if (input) {
            setFieldInvalid(
                input,
                type === "error"
            );
        }
    }

    async function checkUsernameAvailability(
        value
    ) {
        const username =
            text(value).toLowerCase();

        const requestId =
            ++usernameRequestSequence;

        if (!username) {
            setUsernameStatus(
                "",
                ""
            );
            return false;
        }

        if (
            !isValidUsername(
                username
            )
        ) {
            setUsernameStatus(
                username,
                "Use 3–20 lowercase letters, numbers, or underscores.",
                "error"
            );
            return false;
        }

        try {
            setUsernameStatus(
                username,
                "Checking…",
                "loading"
            );

            const result =
                await apiRequest(
                    AUTH_CONFIG.ENDPOINTS
                        .CHECK_USERNAME(
                            username
                        )
                );

            if (
                requestId !==
                usernameRequestSequence
            ) {
                return false;
            }

            const available =
                result?.available ===
                true;

            if (!available) {
                setUsernameStatus(
                    username,
                    result?.message ||
                        "Username is already taken.",
                    "error"
                );
                return false;
            }

            setUsernameStatus(
                username,
                result?.message ||
                    "Username is available.",
                "success"
            );

            return true;
        } catch (error) {
            if (
                requestId !==
                usernameRequestSequence
            ) {
                return false;
            }

            console.error(
                "Username availability error:",
                error
            );

            setUsernameStatus(
                username,
                "Could not check username right now.",
                "error"
            );

            return false;
        }
    }

    /* ============================================================
       13. LOGIN
       ============================================================ */

    async function performLogin(
        email,
        password
    ) {
        const loginEmail =
            normalizedEmail(email);

        if (
            !isValidEmail(
                loginEmail
            )
        ) {
            throw new Error(
                "Enter a valid email address."
            );
        }

        if (!password) {
            throw new Error(
                "Enter your password."
            );
        }

        if (password.length < 8) {
            throw new Error(
                "Your password must be at least 8 characters."
            );
        }

        const result =
            await apiRequest(
                AUTH_CONFIG.ENDPOINTS.LOGIN,
                {
                    method: "POST",

                    body: JSON.stringify({
                        email: loginEmail,
                        password
                    })
                }
            );

        const token =
            extractToken(result);

        const user =
            extractUser(result);

        if (!token || !user) {
            throw new Error(
                "Login succeeded, but a valid session was not returned."
            );
        }

        clearGuestMode();

        saveSession(
            user,
            token
        );

        return {
            user,
            token
        };
    }

    async function handleLogin(
        event
    ) {
        event.preventDefault();

        const emailInput =
            document.getElementById(
                "loginIdentifier"
            );

        const passwordInput =
            document.getElementById(
                "loginPassword"
            );

        const submitButton =
            document.getElementById(
                "loginSubmitButton"
            );

        if (
            !emailInput ||
            !passwordInput ||
            !submitButton
        ) {
            return;
        }

        hideMessage(
            "loginMessage"
        );

        const email =
            normalizedEmail(
                emailInput.value
            );

        const password =
            passwordInput.value;

        setFieldInvalid(
            emailInput,
            false
        );

        setFieldInvalid(
            passwordInput,
            false
        );

        try {
            if (
                !isValidEmail(
                    email
                )
            ) {
                setFieldInvalid(
                    emailInput,
                    true
                );

                throw new Error(
                    "Enter your email address."
                );
            }

            if (!password) {
                setFieldInvalid(
                    passwordInput,
                    true
                );

                throw new Error(
                    "Enter your password."
                );
            }

            setLoading(
                submitButton,
                true,
                "Signing in…"
            );

            await performLogin(
                email,
                password
            );

            showLoginMessage(
                "Signed in successfully.",
                "success"
            );

            setLoading(
                submitButton,
                true,
                "Opening Dheere Studio…"
            );

            await sleep(350);

            redirectAfterAuth();
        } catch (error) {
            console.error(
                "Login error:",
                error
            );

            if (
                error?.status === 401
            ) {
                showLoginMessage(
                    "Incorrect email or password."
                );
            } else if (
                error?.status === 429
            ) {
                showLoginMessage(
                    "Too many login attempts. Please wait a little and try again."
                );
            } else {
                showLoginMessage(
                    error?.message ||
                        "Unable to sign in right now. Please try again."
                );
            }

            setLoading(
                submitButton,
                false,
                "Sign In"
            );
        }
    }

    /* ============================================================
       14. REGISTER
       ============================================================ */

    async function handleRegister(
        event
    ) {
        event.preventDefault();

        const name =
            text(
                $("#registerName")?.value
            );

        const username =
            text(
                $("#registerUsername")?.value
            ).toLowerCase();

        const email =
            normalizedEmail(
                $("#registerEmail")?.value
            );

        const mobile =
            normalizeMobile(
                $("#registerMobile")
                    ?.value || ""
            );

        const password =
            $("#registerPassword")
                ?.value || "";

        const confirm =
            $("#registerConfirmPassword")
                ?.value || "";

        const terms =
            $("#registerTerms")
                ?.checked === true;

        const submitButton =
            $("#registerSubmitButton");

        hideMessage(
            "registerMessage"
        );

        [
            "registerName",
            "registerUsername",
            "registerEmail",
            "registerMobile",
            "registerPassword",
            "registerConfirmPassword"
        ].forEach(
            (id) => {
                setFieldInvalid(
                    document.getElementById(id),
                    false
                );
            }
        );

        try {
            if (
                name.length < 2 ||
                name.length > 80
            ) {
                setFieldInvalid(
                    $("#registerName"),
                    true
                );

                throw new Error(
                    "Your name must be between 2 and 80 characters."
                );
            }

            if (
                !isValidUsername(
                    username
                )
            ) {
                setFieldInvalid(
                    $("#registerUsername"),
                    true
                );

                throw new Error(
                    "Choose a username using 3–20 lowercase letters, numbers, or underscores."
                );
            }

            if (
                !isValidEmail(
                    email
                )
            ) {
                setFieldInvalid(
                    $("#registerEmail"),
                    true
                );

                throw new Error(
                    "Enter a valid email address."
                );
            }

            if (
                !isValidMobile(
                    mobile
                )
            ) {
                setFieldInvalid(
                    $("#registerMobile"),
                    true
                );

                throw new Error(
                    "Enter a valid 10-digit mobile number."
                );
            }

            if (
                password.length < 8 ||
                password.length > 128
            ) {
                setFieldInvalid(
                    $("#registerPassword"),
                    true
                );

                throw new Error(
                    "Password must be between 8 and 128 characters."
                );
            }

            if (
                passwordScore(password) < 3
            ) {
                setFieldInvalid(
                    $("#registerPassword"),
                    true
                );

                throw new Error(
                    "Choose a stronger password with letters, numbers, and symbols."
                );
            }

            if (
                password !== confirm
            ) {
                setFieldInvalid(
                    $("#registerConfirmPassword"),
                    true
                );

                throw new Error(
                    "Passwords do not match."
                );
            }

            if (!terms) {
                throw new Error(
                    "Please accept the Privacy Policy and Terms."
                );
            }

            if (
                !OTP_STATE.registerAccessToken ||
                OTP_STATE.registerMobile !==
                    mobile
            ) {
                setFieldInvalid(
                    $("#registerMobile"),
                    true
                );

                throw new Error(
                    "Please verify your mobile number with OTP before creating your account."
                );
            }

            setLoading(
                submitButton,
                true,
                "Checking username…"
            );

            const available =
                await checkUsernameAvailability(
                    username
                );

            if (!available) {
                throw new Error(
                    "Please choose an available username."
                );
            }

            setLoading(
                submitButton,
                true,
                "Creating account…"
            );

            const result =
                await apiRequest(
                    AUTH_CONFIG.ENDPOINTS.REGISTER,
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                name,
                                username,
                                email,
                                password,
                                mobile,
                                mobileAccessToken:
                                    OTP_STATE
                                        .registerAccessToken
                            })
                    }
                );

            const token =
                extractToken(result);

            const user =
                extractUser(result);

            if (!token || !user) {
                throw new Error(
                    result?.message ||
                        "Your account was created, but the server did not return a login session."
                );
            }

            clearGuestMode();

            saveSession(
                user,
                token
            );

            showRegisterMessage(
                "Account created successfully.",
                "success"
            );

            await sleep(500);

            redirectAfterAuth();
        } catch (error) {
            console.error(
                "Registration error:",
                error
            );

            if (
                error?.status === 409
            ) {
                showRegisterMessage(
                    error?.message ||
                        "That username, email, or mobile number is already registered."
                );
            } else if (
                error?.status === 429
            ) {
                showRegisterMessage(
                    "Too many registration attempts. Please wait and try again."
                );
            } else {
                showRegisterMessage(
                    error?.message ||
                        "Unable to create your account right now."
                );
            }

            setLoading(
                submitButton,
                false,
                "Create Account"
            );
        }
    }

    /* ============================================================
       15. MSG91 OTP WIDGET
       ============================================================ */

    function readMsg91Config() {
        const widgetId =
            document.querySelector(
                `meta[name="${AUTH_CONFIG.MSG91.WIDGET_ID_META}"]`
            )?.getAttribute("content") ||
            "";

        const tokenAuth =
            document.querySelector(
                `meta[name="${AUTH_CONFIG.MSG91.WIDGET_TOKEN_META}"]`
            )?.getAttribute("content") ||
            "";

        return {
            widgetId: text(widgetId),
            tokenAuth: text(tokenAuth)
        };
    }

    function loadScriptOnce(
        src
    ) {
        return new Promise(
            (
                resolve,
                reject
            ) => {
                const existing =
                    document.querySelector(
                        `script[src="${src}"]`
                    );

                if (existing) {
                    if (
                        typeof window.initSendOTP ===
                        "function"
                    ) {
                        resolve();
                        return;
                    }

                    existing.addEventListener(
                        "load",
                        resolve,
                        {
                            once: true
                        }
                    );

                    existing.addEventListener(
                        "error",
                        () =>
                            reject(
                                new Error(
                                    "MSG91 OTP SDK could not be loaded."
                                )
                            ),
                        {
                            once: true
                        }
                    );

                    return;
                }

                const script =
                    document.createElement(
                        "script"
                    );

                script.type =
                    "text/javascript";

                script.src = src;

                script.onload =
                    resolve;

                script.onerror =
                    () =>
                        reject(
                            new Error(
                                "MSG91 OTP SDK could not be loaded."
                            )
                        );

                document.head.appendChild(
                    script
                );
            }
        );
    }

    async function loadMsg91Widget() {
        if (
            typeof window.sendOtp ===
                "function" &&
            typeof window.verifyOtp ===
                "function" &&
            typeof window.retryOtp ===
                "function"
        ) {
            return true;
        }

        const config =
            readMsg91Config();

        if (!config.widgetId) {
            throw new Error(
                "MSG91 widget ID is not configured on this page."
            );
        }

        if (!config.tokenAuth) {
            throw new Error(
                "MSG91 widget token is not configured on this page."
            );
        }

        if (
            typeof window.initSendOTP !==
            "function"
        ) {
            await loadScriptOnce(
                AUTH_CONFIG.MSG91.SDK_URL
            );
        }

        if (
            typeof window.initSendOTP !==
            "function"
        ) {
            throw new Error(
                "MSG91 Custom UI SDK loaded, but initSendOTP is unavailable."
            );
        }

        const configuration = {
            widgetId:
                config.widgetId,

            tokenAuth:
                config.tokenAuth,

            identifier:
                "",

            exposeMethods:
                true,

            captchaRenderId:
                "",

            success:
                () => {},

            failure:
                () => {}
        };

        try {
            window.initSendOTP(
                configuration
            );
        } catch (error) {
            console.error(
                "MSG91 initialization error:",
                error
            );

            throw new Error(
                error?.message ||
                    "Unable to initialize MSG91 OTP."
            );
        }

        for (
            let attempt = 0;
            attempt < 30;
            attempt += 1
        ) {
            if (
                typeof window.sendOtp ===
                    "function" &&
                typeof window.verifyOtp ===
                    "function" &&
                typeof window.retryOtp ===
                    "function"
            ) {
                return true;
            }

            await sleep(100);
        }

        throw new Error(
            "MSG91 OTP methods were not exposed after widget initialization."
        );
    }

    async function sendMsg91Otp(
        identifier,
        {
            onSuccess,
            onFailure
        } = {}
    ) {
        await loadMsg91Widget();

        return new Promise(
            (
                resolve,
                reject
            ) => {
                const success =
                    (response) => {
                        const reqId =
                            response?.reqId ||
                            response?.req_id ||
                            response?.data?.reqId ||
                            response?.data?.req_id ||
                            "";

                        onSuccess?.(
                            response
                        );

                        resolve({
                            success:
                                true,

                            reqId,

                            data:
                                response
                        });
                    };

                const failure =
                    (error) => {
                        onFailure?.(
                            error
                        );

                        const normalized =
                            new Error(
                                error?.message ||
                                    error?.error ||
                                    "Unable to send OTP."
                            );

                        normalized.data =
                            error;

                        reject(
                            normalized
                        );
                    };

                try {
                    window.sendOtp(
                        text(identifier),
                        success,
                        failure
                    );
                } catch (error) {
                    failure(
                        error
                    );
                }
            }
        );
    }

    async function verifyMsg91Otp(
        otp,
        reqId = ""
    ) {
        const cleanOtp =
            text(otp);

        if (!isValidOtp(cleanOtp)) {
            throw new Error(
                "Enter the OTP sent to your mobile number."
            );
        }

        await loadMsg91Widget();

        return new Promise(
            (
                resolve,
                reject
            ) => {
                const success =
                    (response) => {
                        resolve({
                            success:
                                true,

                            data:
                                response
                        });
                    };

                const failure =
                    (error) => {
                        const normalized =
                            new Error(
                                error?.message ||
                                    error?.error ||
                                    "Invalid or expired OTP."
                            );

                        normalized.data =
                            error;

                        reject(
                            normalized
                        );
                    };

                try {
                    window.verifyOtp(
                        cleanOtp,
                        success,
                        failure,
                        reqId || undefined
                    );
                } catch (error) {
                    failure(
                        error
                    );
                }
            }
        );
    }

    async function retryMsg91Otp(
        channel = "11",
        reqId = ""
    ) {
        await loadMsg91Widget();

        return new Promise(
            (
                resolve,
                reject
            ) => {
                const success =
                    (response) => {
                        resolve({
                            success:
                                true,

                            data:
                                response
                        });
                    };

                const failure =
                    (error) => {
                        const normalized =
                            new Error(
                                error?.message ||
                                    error?.error ||
                                    "Unable to resend OTP."
                            );

                        normalized.data =
                            error;

                        reject(
                            normalized
                        );
                    };

                try {
                    window.retryOtp(
                        channel,
                        success,
                        failure,
                        reqId || undefined
                    );
                } catch (error) {
                    failure(
                        error
                    );
                }
            }
        );
    }

    function setOtpUiState(
        root,
        visible
    ) {
        const panel =
            root?.querySelector(
                "[data-msg91-otp-panel]"
            );

        if (!panel) {
            return;
        }

        panel.hidden =
            !visible;
    }

    function setOtpMessage(
        id,
        message,
        type = "error"
    ) {
        if (
            !document.getElementById(id)
        ) {
            return;
        }

        showMessage(
            id,
            message,
            type
        );
    }

    /* ============================================================
       16. REGISTER OTP
       ============================================================ */

    async function beginRegisterMobileOtp(
        mobile
    ) {
        const normalized =
            normalizeMobile(
                mobile
            );

        if (
            !isValidMobile(
                normalized
            )
        ) {
            throw new Error(
                "Enter a valid 10-digit mobile number."
            );
        }

        const identifier =
            `${AUTH_CONFIG.MSG91.COUNTRY_CODE}${normalized}`;

        const result =
            await sendMsg91Otp(
                identifier
            );

        OTP_STATE.registerMobile =
            normalized;

        OTP_STATE.registerReqId =
            result.reqId || "";

        OTP_STATE.registerAccessToken =
            "";

        return result;
    }

    async function verifyRegisterMobileOtp(
        otp
    ) {
        if (
            !OTP_STATE.registerReqId
        ) {
            throw new Error(
                "Please send a new OTP before verifying."
            );
        }

        const result =
            await verifyMsg91Otp(
                otp,
                OTP_STATE.registerReqId
            );

        const accessToken =
            extractMsg91AccessToken(
                result?.data
            );

        if (!accessToken) {
            throw new Error(
                "OTP was verified, but MSG91 did not return a verification token."
            );
        }

        OTP_STATE.registerAccessToken =
            accessToken;

        return result;
    }

    function setRegisterOtpState(
        state
    ) {
        const mobile =
            document.getElementById(
                "registerMobile"
            );

        const panel =
            document.getElementById(
                "mobileOtpPanel"
            );

        const feedback =
            document.getElementById(
                "mobileOtpFeedback"
            );

        const status =
            document.getElementById(
                "mobileOtpStatus"
            );

        const sendButton =
            document.getElementById(
                "sendMobileOtpButton"
            );

        const verifyButton =
            document.getElementById(
                "verifyMobileOtpButton"
            );

        const otpInput =
            document.getElementById(
                "mobileOtp"
            );

        const resendButton =
            document.getElementById(
                "resendMobileOtpButton"
            );

        if (state === "sent") {
            if (panel) {
                panel.hidden =
                    false;
            }

            if (status) {
                status.textContent =
                    "OTP sent. Enter the code received by SMS or WhatsApp.";
            }

            if (feedback) {
                feedback.hidden =
                    true;
                feedback.textContent =
                    "";
            }

            if (verifyButton) {
                verifyButton.disabled =
                    false;
            }

            if (otpInput) {
                otpInput.disabled =
                    false;
                otpInput.value = "";
                otpInput.focus();
            }

            if (resendButton) {
                resendButton.disabled =
                    true;
            }

            if (sendButton) {
                sendButton.disabled =
                    false;
            }

            if (mobile) {
                mobile.readOnly =
                    false;
            }

            return;
        }

        if (state === "verified") {
            if (panel) {
                panel.hidden =
                    false;
            }

            if (status) {
                status.textContent =
                    "Mobile number verified successfully.";
            }

            if (feedback) {
                feedback.hidden =
                    false;
                feedback.textContent =
                    "You can now create your account.";
                feedback.classList.remove(
                    "error"
                );
                feedback.classList.add(
                    "success"
                );
            }

            if (verifyButton) {
                verifyButton.disabled =
                    true;
            }

            if (resendButton) {
                resendButton.disabled =
                    true;
            }

            if (otpInput) {
                otpInput.disabled =
                    true;
            }

            if (mobile) {
                mobile.readOnly =
                    true;
            }

            return;
        }

        if (state === "error") {
            if (feedback) {
                feedback.hidden =
                    false;
            }

            if (verifyButton) {
                verifyButton.disabled =
                    false;
            }

            if (otpInput) {
                otpInput.disabled =
                    false;
            }
        }
    }

    function startRegisterOtpTimer(
        seconds = 60
    ) {
        const countdown =
            document.getElementById(
                "mobileOtpCountdown"
            );

        const resendButton =
            document.getElementById(
                "resendMobileOtpButton"
            );

        if (!countdown || !resendButton) {
            return;
        }

        let remaining =
            Math.max(
                0,
                Number(seconds) || 60
            );

        if (
            countdown._dheereOtpTimer
        ) {
            window.clearInterval(
                countdown._dheereOtpTimer
            );
        }

        resendButton.disabled =
            true;

        const render = () => {
            countdown.textContent =
                remaining > 0
                    ? `Resend available in ${remaining}s`
                    : "You can resend the OTP now.";

            resendButton.disabled =
                remaining > 0;

            if (remaining <= 0) {
                window.clearInterval(
                    countdown._dheereOtpTimer
                );

                countdown._dheereOtpTimer =
                    null;

                return;
            }

            remaining -= 1;
        };

        render();

        countdown._dheereOtpTimer =
            window.setInterval(
                render,
                1000
            );
    }

    async function handleRegisterSendOtp() {
        const mobile =
            document.getElementById(
                "registerMobile"
            );

        const sendButton =
            document.getElementById(
                "sendMobileOtpButton"
            );

        const value =
            normalizeMobile(
                mobile?.value || ""
            );

        if (
            !isValidMobile(
                value
            )
        ) {
            setFieldInvalid(
                mobile,
                true
            );

            showRegisterMessage(
                "Enter a valid 10-digit mobile number."
            );

            mobile?.focus();

            return;
        }

        if (sendButton) {
            setLoading(
                sendButton,
                true,
                "Sending OTP…"
            );
        }

        try {
            setFieldInvalid(
                mobile,
                false
            );

            await beginRegisterMobileOtp(
                value
            );

            setRegisterOtpState(
                "sent"
            );

            startRegisterOtpTimer(
                60
            );

            showRegisterMessage(
                "OTP sent. Enter the code sent to your mobile number.",
                "success"
            );
        } catch (error) {
            console.error(
                "Register OTP send error:",
                error
            );

            showRegisterMessage(
                error?.message ||
                    "Unable to send OTP right now."
            );

            setRegisterOtpState(
                "error"
            );
        } finally {
            if (sendButton) {
                setLoading(
                    sendButton,
                    false,
                    "Send OTP"
                );
            }
        }
    }

    async function handleRegisterVerifyOtp() {
        const otpInput =
            document.getElementById(
                "mobileOtp"
            );

        const verifyButton =
            document.getElementById(
                "verifyMobileOtpButton"
            );

        const otp =
            text(
                otpInput?.value
            );

        if (
            !isValidOtp(
                otp
            )
        ) {
            if (otpInput) {
                setFieldInvalid(
                    otpInput,
                    true
                );
            }

            const feedback =
                document.getElementById(
                    "mobileOtpFeedback"
                );

            if (feedback) {
                feedback.hidden =
                    false;

                feedback.textContent =
                    "Enter the OTP sent to your mobile number.";

                feedback.classList.add(
                    "error"
                );
            }

            return;
        }

        setFieldInvalid(
            otpInput,
            false
        );

        setLoading(
            verifyButton,
            true,
            "Verifying…"
        );

        try {
            await verifyRegisterMobileOtp(
                otp
            );

            setRegisterOtpState(
                "verified"
            );

            showRegisterMessage(
                "Mobile number verified successfully.",
                "success"
            );
        } catch (error) {
            console.error(
                "Register OTP verification error:",
                error
            );

            if (otpInput) {
                setFieldInvalid(
                    otpInput,
                    true
                );
            }

            const feedback =
                document.getElementById(
                    "mobileOtpFeedback"
                );

            if (feedback) {
                feedback.hidden =
                    false;

                feedback.textContent =
                    error?.message ||
                    "Unable to verify OTP.";

                feedback.classList.remove(
                    "success"
                );

                feedback.classList.add(
                    "error"
                );
            }
        } finally {
            setLoading(
                verifyButton,
                false,
                "Verify"
            );
        }
    }

    async function handleRegisterResendOtp() {
        const mobile =
            normalizeMobile(
                document.getElementById(
                    "registerMobile"
                )?.value || ""
            );

        const resendButton =
            document.getElementById(
                "resendMobileOtpButton"
            );

        if (
            !isValidMobile(
                mobile
            )
        ) {
            showRegisterMessage(
                "Enter a valid 10-digit mobile number."
            );
            return;
        }

        setLoading(
            resendButton,
            true,
            "Resending…"
        );

        try {
            const result =
                await sendMsg91Otp(
                    `91${mobile}`
                );

            OTP_STATE.registerMobile =
                mobile;

            OTP_STATE.registerReqId =
                result.reqId || "";

            OTP_STATE.registerAccessToken =
                "";

            startRegisterOtpTimer(
                60
            );

            const otpInput =
                document.getElementById(
                    "mobileOtp"
                );

            if (otpInput) {
                otpInput.disabled =
                    false;
                otpInput.value = "";
                otpInput.focus();
            }

            setRegisterOtpState(
                "sent"
            );

            showRegisterMessage(
                "A new OTP has been sent.",
                "success"
            );
        } catch (error) {
            console.error(
                "Register OTP resend error:",
                error
            );

            showRegisterMessage(
                error?.message ||
                    "Unable to resend OTP."
            );
        } finally {
            setLoading(
                resendButton,
                false,
                "Resend OTP"
            );
        }
    }

    function handleRegisterChangeMobile() {
        const mobile =
            document.getElementById(
                "registerMobile"
            );

        const panel =
            document.getElementById(
                "mobileOtpPanel"
            );

        const otpInput =
            document.getElementById(
                "mobileOtp"
            );

        const feedback =
            document.getElementById(
                "mobileOtpFeedback"
            );

        OTP_STATE.registerMobile =
            "";

        OTP_STATE.registerReqId =
            "";

        OTP_STATE.registerAccessToken =
            "";

        if (mobile) {
            mobile.readOnly =
                false;
        }

        if (otpInput) {
            otpInput.disabled =
                false;
            otpInput.value =
                "";
        }

        if (feedback) {
            feedback.hidden =
                true;
            feedback.textContent =
                "";
        }

        if (panel) {
            panel.hidden =
                true;
        }

        showRegisterMessage(
            ""
        );

        mobile?.focus();
    }

    function setupRegisterMobileUI() {
        const mobile =
            document.getElementById(
                "registerMobile"
            );

        const sendButton =
            document.getElementById(
                "sendMobileOtpButton"
            );

        if (!mobile || !sendButton) {
            return;
        }

        sendButton.disabled =
            false;

        sendButton.removeAttribute(
            "aria-disabled"
        );

        sendButton.textContent =
            "Send OTP";

        sendButton.title =
            "Send a verification code to this mobile number";

        if (
            sendButton.dataset.otpBound !==
            "true"
        ) {
            sendButton.dataset.otpBound =
                "true";

            sendButton.addEventListener(
                "click",
                handleRegisterSendOtp
            );
        }

        const verifyButton =
            document.getElementById(
                "verifyMobileOtpButton"
            );

        if (
            verifyButton &&
            verifyButton.dataset.otpBound !==
                "true"
        ) {
            verifyButton.dataset.otpBound =
                "true";

            verifyButton.addEventListener(
                "click",
                handleRegisterVerifyOtp
            );
        }

        const resendButton =
            document.getElementById(
                "resendMobileOtpButton"
            );

        if (
            resendButton &&
            resendButton.dataset.otpBound !==
                "true"
        ) {
            resendButton.dataset.otpBound =
                "true";

            resendButton.addEventListener(
                "click",
                handleRegisterResendOtp
            );
        }

        const changeButton =
            document.getElementById(
                "changeMobileButton"
            );

        if (
            changeButton &&
            changeButton.dataset.otpBound !==
                "true"
        ) {
            changeButton.dataset.otpBound =
                "true";

            changeButton.addEventListener(
                "click",
                handleRegisterChangeMobile
            );
        }

        mobile.addEventListener(
            "input",
            () => {
                const normalized =
                    normalizeMobile(
                        mobile.value
                    );

                if (
                    normalized.length <=
                    10
                ) {
                    mobile.value =
                        normalized;
                }

                if (
                    OTP_STATE.registerMobile &&
                    OTP_STATE.registerMobile !==
                        normalized
                ) {
                    OTP_STATE.registerReqId =
                        "";

                    OTP_STATE
                        .registerAccessToken =
                        "";

                    const panel =
                        document.getElementById(
                            "mobileOtpPanel"
                        );

                    if (panel) {
                        panel.hidden =
                            true;
                    }
                }
            }
        );

        const otpInput =
            document.getElementById(
                "mobileOtp"
            );

        otpInput?.addEventListener(
            "input",
            () => {
                otpInput.value =
                    otpInput.value
                        .replace(
                            /\D/g,
                            ""
                        )
                        .slice(
                            0,
                            8
                        );
            }
        );
    }

    /* ============================================================
       17. FORGOT PASSWORD — EMAIL
       ============================================================ */

    async function requestPasswordReset() {
        const emailInput =
            document.getElementById(
                "forgotIdentifier"
            );

        const sendButton =
            document.getElementById(
                "sendRecoveryButton"
            );

        const email =
            normalizedEmail(
                emailInput?.value
            );

        hideMessage(
            "forgotMessage"
        );

        if (
            !isValidEmail(email)
        ) {
            setFieldInvalid(
                emailInput,
                true
            );

            showMessage(
                "forgotMessage",
                "Enter a valid email address."
            );

            emailInput?.focus();

            return;
        }

        setFieldInvalid(
            emailInput,
            false
        );

        try {
            setLoading(
                sendButton,
                true,
                "Sending reset link…"
            );

            const result =
                await apiRequest(
                    AUTH_CONFIG.ENDPOINTS
                        .FORGOT_REQUEST,
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                email
                            })
                    }
                );

            showMessage(
                "forgotMessage",
                result?.message ||
                    "If an account exists for this email, a password reset link has been sent.",
                "success"
            );
        } catch (error) {
            console.error(
                "Password recovery error:",
                error
            );

            showMessage(
                "forgotMessage",
                error?.status === 429
                    ? "Too many password-reset requests. Please wait and try again."
                    : error?.message ||
                        "Unable to request a password reset right now."
            );
        } finally {
            setLoading(
                sendButton,
                false,
                "Send Reset Link"
            );
        }
    }

    /* ============================================================
       18. RESET PASSWORD
       ============================================================ */

    async function submitNewPassword(
        form
    ) {
        const password =
            $(
                "#newPassword",
                form
            )?.value || "";

        const confirm =
            $(
                "#confirmNewPassword",
                form
            )?.value || "";

        const token =
            getQueryParam("token") ||
            getQueryParam("resetToken");

        const button =
            $(
                "#resetPasswordButton",
                form
            );

        const messageId =
            "resetMessage";

        hideMessage(
            messageId
        );

        setFieldInvalid(
            $("#newPassword", form),
            false
        );

        setFieldInvalid(
            $("#confirmNewPassword", form),
            false
        );

        if (!token) {
            showMessage(
                messageId,
                "This password reset link or recovery session is invalid or incomplete."
            );

            return;
        }

        if (
            password.length < 8 ||
            password.length > 128 ||
            passwordScore(password) < 3
        ) {
            setFieldInvalid(
                $("#newPassword", form),
                true
            );

            showMessage(
                messageId,
                "Choose a stronger password. Use at least 8 characters with a mix of letters, numbers, and symbols."
            );

            return;
        }

        if (
            password !== confirm
        ) {
            setFieldInvalid(
                $("#confirmNewPassword", form),
                true
            );

            showMessage(
                messageId,
                "Passwords do not match."
            );

            return;
        }

        try {
            setLoading(
                button,
                true,
                "Updating password…"
            );

            const result =
                await apiRequest(
                    AUTH_CONFIG.ENDPOINTS
                        .RESET_PASSWORD,
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                token,
                                password
                            })
                    }
                );

            clearSession();

            showMessage(
                messageId,
                result?.message ||
                    "Password updated successfully.",
                "success"
            );

            await sleep(350);

            const formStep =
                document.getElementById(
                    "resetFormStep"
                );

            const successStep =
                document.getElementById(
                    "resetSuccessStep"
                );

            if (
                formStep &&
                successStep
            ) {
                formStep.hidden =
                    true;

                successStep.hidden =
                    false;
            }
        } catch (error) {
            console.error(
                "Password reset error:",
                error
            );

            showMessage(
                messageId,
                error?.message ||
                    "Unable to update your password right now."
            );

            setLoading(
                button,
                false,
                "Update Password"
            );
        }
    }

    function setupResetPasswordPage() {
        const form =
            document.getElementById(
                "resetPasswordForm"
            );

        if (!form) {
            return;
        }

        const token =
            getQueryParam("token") ||
            getQueryParam("resetToken");

        const button =
            document.getElementById(
                "resetPasswordButton"
            );

        if (!token) {
            showMessage(
                "resetMessage",
                "This password reset link is invalid, expired, or incomplete."
            );

            if (button) {
                button.disabled =
                    true;
            }

            return;
        }

        form.addEventListener(
            "submit",
            (event) => {
                event.preventDefault();

                submitNewPassword(
                    form
                );
            }
        );

        setupPasswordMatchWatcher(
            "newPassword",
            "confirmNewPassword",
            "passwordMatchHint"
        );
    }

    function setupPasswordMatchWatcher(
        firstId,
        secondId,
        hintId
    ) {
        const first =
            document.getElementById(
                firstId
            );

        const second =
            document.getElementById(
                secondId
            );

        const hint =
            document.getElementById(
                hintId
            );

        if (
            !first ||
            !second ||
            !hint
        ) {
            return;
        }

        const update = () => {
            const a =
                first.value;

            const b =
                second.value;

            if (!b) {
                hint.hidden =
                    true;

                hint.textContent =
                    "";

                return;
            }

            hint.hidden =
                false;

            if (a === b) {
                hint.textContent =
                    "Passwords match.";

                hint.classList.remove(
                    "error"
                );

                hint.classList.add(
                    "success"
                );
            } else {
                hint.textContent =
                    "Passwords do not match.";

                hint.classList.remove(
                    "success"
                );

                hint.classList.add(
                    "error"
                );
            }
        };

        first.addEventListener(
            "input",
            update
        );

        second.addEventListener(
            "input",
            update
        );

        update();
    }

    /* ============================================================
       19. FORGOT PAGE
       ============================================================ */

    let recoveryTimerId = null;

    function clearRecoveryTimer() {
        if (recoveryTimerId) {
            window.clearInterval(
                recoveryTimerId
            );

            recoveryTimerId =
                null;
        }

        const countdown =
            document.getElementById(
                "recoveryOtpCountdown"
            );

        const resendButton =
            document.getElementById(
                "resendRecoveryOtpButton"
            );

        if (countdown) {
            countdown.textContent =
                "Resend available";
        }

        if (resendButton) {
            resendButton.disabled =
                false;
        }
    }

    function startRecoveryTimer(
        seconds = 60
    ) {
        clearRecoveryTimer();

        let remaining =
            Math.max(
                0,
                Number(seconds) || 60
            );

        const countdown =
            document.getElementById(
                "recoveryOtpCountdown"
            );

        const resendButton =
            document.getElementById(
                "resendRecoveryOtpButton"
            );

        const render = () => {
            if (countdown) {
                countdown.textContent =
                    remaining > 0
                        ? `Resend available in ${remaining}s`
                        : "You can resend the OTP now.";
            }

            if (resendButton) {
                resendButton.disabled =
                    remaining > 0;
            }

            if (remaining <= 0) {
                clearRecoveryTimer();
                return;
            }

            remaining -= 1;
        };

        render();

        recoveryTimerId =
            window.setInterval(
                render,
                1000
            );
    }

    function setRecoveryStep(
        step
    ) {
        const steps = [
            "recoveryStartStep",
            "recoveryOtpStep",
            "resetPasswordStep",
            "recoverySuccessStep"
        ];

        steps.forEach(
            (id, index) => {
                const element =
                    document.getElementById(
                        id
                    );

                if (!element) {
                    return;
                }

                element.hidden =
                    index !==
                    step - 1;
            }
        );
    }

    async function verifyRecoveryCode() {
        const otpInput =
            document.getElementById(
                "recoveryOtp"
            );

        const otp =
            text(
                otpInput?.value
            );

        if (
            !isValidOtp(otp)
        ) {
            showMessage(
                "recoveryOtpMessage",
                "Enter the OTP sent to your mobile number."
            );

            return;
        }

        if (
            !OTP_STATE.recoveryReqId
        ) {
            showMessage(
                "recoveryOtpMessage",
                "Please send a new OTP before verifying."
            );

            return;
        }

        try {
            setLoading(
                document.getElementById(
                    "verifyRecoveryOtpButton"
                ),
                true,
                "Verifying…"
            );

            const result =
                await verifyMsg91Otp(
                    otp,
                    OTP_STATE
                        .recoveryReqId
                );

            OTP_STATE.recoveryAccessToken =
                extractMsg91AccessToken(
                    result?.data
                );

            if (
                !OTP_STATE
                    .recoveryAccessToken
            ) {
                throw new Error(
                    "OTP verified, but MSG91 did not return a verification token."
                );
            }

            const recoveryResult =
                await apiRequest(
                    AUTH_CONFIG.ENDPOINTS
                        .MOBILE_RECOVERY,
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                mobile:
                                    OTP_STATE
                                        .recoveryMobile,

                                accessToken:
                                    OTP_STATE
                                        .recoveryAccessToken
                            })
                    }
                );

            const resetToken =
                extractRecoveryToken(
                    recoveryResult
                );

            if (!resetToken) {
                throw new Error(
                    "Mobile verification succeeded, but the server did not return a password reset token."
                );
            }

            OTP_STATE.recoveryResetToken =
                resetToken;

            const currentUrl =
                new URL(
                    window.location.href
                );

            currentUrl.searchParams.set(
                "token",
                resetToken
            );

            window.history.replaceState(
                {},
                "",
                currentUrl.toString()
            );

            setRecoveryStep(3);

            showMessage(
                "recoveryOtpMessage",
                "Mobile number verified successfully. You can now create a new password.",
                "success"
            );
        } catch (error) {
            console.error(
                "Recovery OTP verification error:",
                error
            );

            showMessage(
                "recoveryOtpMessage",
                error?.message ||
                    "Unable to verify OTP."
            );
        } finally {
            setLoading(
                document.getElementById(
                    "verifyRecoveryOtpButton"
                ),
                false,
                "Verify OTP"
            );
        }
    }

    async function resendRecoveryCode() {
        if (
            !OTP_STATE.recoveryReqId
        ) {
            showMessage(
                "recoveryOtpMessage",
                "Please send an OTP first."
            );

            return;
        }

        try {
            const result =
                await retryMsg91Otp(
                    "11",
                    OTP_STATE.recoveryReqId
                );

            /*
             * If MSG91 supplies a new request ID, use it.
             * Otherwise preserve the current one.
             */
            const newReqId =
                result?.data?.reqId ||
                result?.data?.req_id ||
                result?.data?.data?.reqId ||
                result?.data?.data?.req_id ||
                OTP_STATE
                    .recoveryReqId;

            OTP_STATE.recoveryReqId =
                newReqId;

            startRecoveryTimer(
                60
            );

            showMessage(
                "recoveryOtpMessage",
                "A new OTP has been sent.",
                "success"
            );
        } catch (error) {
            console.error(
                "Recovery OTP resend error:",
                error
            );

            showMessage(
                "recoveryOtpMessage",
                error?.message ||
                    "Unable to resend OTP."
            );
        }
    }

    async function sendRecoveryMobileOtp() {
        const mobileInput =
            document.getElementById(
                "forgotMobile"
            );

        const mobile =
            normalizeMobile(
                mobileInput?.value || ""
            );

        if (
            !isValidMobile(mobile)
        ) {
            setFieldInvalid(
                mobileInput,
                true
            );

            showMessage(
                "forgotMessage",
                "Enter a valid 10-digit mobile number."
            );

            return;
        }

        try {
            await loadMsg91Widget();

            const result =
                await sendMsg91Otp(
                    `91${mobile}`
                );

            OTP_STATE.recoveryMobile =
                mobile;

            OTP_STATE.recoveryReqId =
                result.reqId || "";

            OTP_STATE.recoveryAccessToken =
                "";

            OTP_STATE.recoveryResetToken =
                "";

            setRecoveryStep(2);

            startRecoveryTimer(
                60
            );

            showMessage(
                "recoveryOtpMessage",
                "OTP sent to your mobile number.",
                "success"
            );
        } catch (error) {
            console.error(
                "Mobile recovery send error:",
                error
            );

            showMessage(
                "forgotMessage",
                error?.message ||
                    "Unable to send OTP."
            );
        }
    }

    function bindForgotEmailForm() {
        const form =
            document.getElementById(
                "forgotForm"
            );

        if (!form) {
            return;
        }

        if (
            form.dataset.forgotBound ===
            "true"
        ) {
            return;
        }

        form.dataset.forgotBound =
            "true";

        form.addEventListener(
            "submit",
            (event) => {
                event.preventDefault();

                requestPasswordReset();
            }
        );

        const identifier =
            document.getElementById(
                "forgotIdentifier"
            );

        identifier?.addEventListener(
            "input",
            () => {
                setFieldInvalid(
                    identifier,
                    false
                );

                hideMessage(
                    "forgotMessage"
                );
            }
        );
    }

    function setupForgotPage() {
        bindForgotEmailForm();

        document.getElementById(
            "recoveryOtp"
        )?.addEventListener(
            "input",
            (event) => {
                event.currentTarget.value =
                    event.currentTarget.value
                        .replace(
                            /\D/g,
                            ""
                        )
                        .slice(
                            0,
                            8
                        );
            }
        );

        document.getElementById(
            "verifyRecoveryOtpButton"
        )?.addEventListener(
            "click",
            verifyRecoveryCode
        );

        document.getElementById(
            "resendRecoveryOtpButton"
        )?.addEventListener(
            "click",
            resendRecoveryCode
        );

        document.getElementById(
            "changeRecoveryIdentifier"
        )?.addEventListener(
            "click",
            () => {
                clearRecoveryTimer();

                setRecoveryStep(1);

                OTP_STATE.recoveryMobile =
                    "";

                OTP_STATE.recoveryReqId =
                    "";

                OTP_STATE.recoveryAccessToken =
                    "";

                OTP_STATE.recoveryResetToken =
                    "";

                hideMessage(
                    "recoveryOtpMessage"
                );

                document
                    .getElementById(
                        "forgotIdentifier"
                    )
                    ?.focus();
            }
        );

        document.getElementById(
            "recoveryUseEmailButton"
        )?.addEventListener(
            "click",
            () => {
                clearRecoveryTimer();

                setRecoveryStep(1);

                OTP_STATE.recoveryMobile =
                    "";

                OTP_STATE.recoveryReqId =
                    "";

                OTP_STATE.recoveryAccessToken =
                    "";

                OTP_STATE.recoveryResetToken =
                    "";

                document.getElementById(
                    "forgotIdentifier"
                )?.focus();
            }
        );

        const mobileButton =
            document.getElementById(
                "sendRecoveryOtpButton"
            );

        if (
            mobileButton &&
            mobileButton.dataset.otpBound !==
                "true"
        ) {
            mobileButton.dataset.otpBound =
                "true";

            mobileButton.addEventListener(
                "click",
                sendRecoveryMobileOtp
            );
        }

        document.getElementById(
            "forgotMobile"
        )?.addEventListener(
            "input",
            (event) => {
                event.currentTarget.value =
                    event.currentTarget.value
                        .replace(
                            /\D/g,
                            ""
                        )
                        .slice(
                            0,
                            10
                        );
            }
        );

        const resetForm =
            document.getElementById(
                "resetPasswordForm"
            );

        if (resetForm) {
            resetForm.addEventListener(
                "submit",
                (event) => {
                    event.preventDefault();

                    submitNewPassword(
                        resetForm
                    );
                }
            );

            setupPasswordMatchWatcher(
                "newPassword",
                "confirmNewPassword",
                "passwordMatchHint"
            );
        }
    }

    /* ============================================================
       20. ACCOUNT VERIFICATION
       ============================================================ */

    function setupVerifyPage() {
        const verifyStep =
            document.getElementById(
                "verifyStep"
            );

        const verifyButton =
            document.getElementById(
                "verifyAccountButton"
            );

        if (
            !verifyStep &&
            !verifyButton
        ) {
            return;
        }

        const statusEyebrow =
            document.getElementById(
                "verifyStatusEyebrow"
            );

        const statusTitle =
            document.getElementById(
                "verifyStatusTitle"
            );

        const statusMessage =
            document.getElementById(
                "verifyStatusMessage"
            );

        const statusIcon =
            document.getElementById(
                "verifyStatusIcon"
            );

        const verifyMessage =
            document.getElementById(
                "verifyMessage"
            );

        const successStep =
            document.getElementById(
                "verifySuccessStep"
            );

        const errorStep =
            document.getElementById(
                "verifyErrorStep"
            );

        const errorMessage =
            document.getElementById(
                "verifyErrorMessage"
            );

        if (statusEyebrow) {
            statusEyebrow.textContent =
                "Not connected";
        }

        if (statusTitle) {
            statusTitle.textContent =
                "Verification is not connected yet";
        }

        if (statusMessage) {
            statusMessage.textContent =
                "The current Dheere Studio backend supports registration, login, and password reset, but it does not currently expose an account-verification endpoint.";
        }

        if (statusIcon) {
            statusIcon.textContent =
                "!";
        }

        if (verifyMessage) {
            verifyMessage.hidden =
                true;
        }

        if (successStep) {
            successStep.hidden =
                true;
        }

        if (errorStep) {
            errorStep.hidden =
                false;
        }

        if (errorMessage) {
            errorMessage.textContent =
                "There is currently no account-verification endpoint connected to this page.";
        }

        if (
            verifyButton &&
            verifyButton.tagName ===
                "BUTTON"
        ) {
            verifyButton.textContent =
                "Verification Not Connected";

            verifyButton.addEventListener(
                "click",
                (event) => {
                    event.preventDefault();

                    showMessage(
                        "verifyMessage",
                        "Account verification is not connected to the current backend yet."
                    );
                }
            );
        }
    }

    /* ============================================================
       21. GOOGLE BUTTONS
       ------------------------------------------------------------
       Google OAuth backend is not yet implemented in the current
       auth-routes.js. Therefore these buttons remain honest
       placeholders instead of pretending authentication works.
       ============================================================ */

    function setupGoogleButtons() {
        const loginButton =
            document.getElementById(
                "googleLoginButton"
            );

        const registerButton =
            document.getElementById(
                "googleRegisterButton"
            );

        loginButton?.addEventListener(
            "click",
            () => {
                showLoginMessage(
                    "Google sign-in is not connected yet. The backend OAuth route must be added first."
                );
            }
        );

        registerButton?.addEventListener(
            "click",
            () => {
                showRegisterMessage(
                    "Google registration is not connected yet. The backend OAuth route must be added first."
                );
            }
        );
    }

    /* ============================================================
       22. LOGIN PAGE — EXISTING SESSION
       ============================================================ */

    function restoreExistingSession() {
        const token =
            getStoredToken();

        const user =
            getStoredUser();

        if (
            !token ||
            !user
        ) {
            return;
        }

        window.setTimeout(
            () => {
                redirectAfterAuth();
            },
            100
        );
    }

    /* ============================================================
       23. GENERAL FORM UX
       ============================================================ */

    function setupGeneralFormUX() {
        $$("form").forEach(
            (form) => {
                if (
                    form.dataset.enterBound ===
                    "true"
                ) {
                    return;
                }

                form.dataset.enterBound =
                    "true";

                form.addEventListener(
                    "keydown",
                    (event) => {
                        if (
                            event.key !==
                            "Enter"
                        ) {
                            return;
                        }

                        const target =
                            event.target;

                        if (
                            target instanceof
                            HTMLButtonElement
                        ) {
                            return;
                        }

                        if (
                            target instanceof
                            HTMLTextAreaElement
                        ) {
                            return;
                        }

                        if (
                            typeof form.requestSubmit ===
                            "function"
                        ) {
                            event.preventDefault();

                            form.requestSubmit();
                        }
                    }
                );
            }
        );
    }

    function setupLiveMessageDismissal() {
        const messagePairs = [
            [
                "loginIdentifier",
                "loginMessage"
            ],

            [
                "loginPassword",
                "loginMessage"
            ],

            [
                "registerName",
                "registerMessage"
            ],

            [
                "registerUsername",
                "registerMessage"
            ],

            [
                "registerEmail",
                "registerMessage"
            ],

            [
                "registerPassword",
                "registerMessage"
            ],

            [
                "forgotIdentifier",
                "forgotMessage"
            ]
        ];

        messagePairs.forEach(
            (
                [
                    inputId,
                    messageId
                ]
            ) => {
                const input =
                    document.getElementById(
                        inputId
                    );

                if (!input) {
                    return;
                }

                input.addEventListener(
                    "input",
                    () => {
                        hideMessage(
                            messageId
                        );
                    }
                );
            }
        );
    }

    /* ============================================================
       24. PAGE-SPECIFIC INITIALIZATION
       ============================================================ */

    function initLoginPage() {
        const form =
            document.getElementById(
                "loginForm"
            );

        if (!form) {
            return;
        }

        form.addEventListener(
            "submit",
            handleLogin
        );

        restoreExistingSession();
    }

    function initRegisterPage() {
        const form =
            document.getElementById(
                "registerForm"
            );

        if (!form) {
            return;
        }

        form.addEventListener(
            "submit",
            handleRegister
        );

        const username =
            document.getElementById(
                "registerUsername"
            );

        let usernameTimer =
            null;

        username?.addEventListener(
            "input",
            () => {
                window.clearTimeout(
                    usernameTimer
                );

                usernameTimer =
                    window.setTimeout(
                        () => {
                            checkUsernameAvailability(
                                username.value
                            );
                        },
                        450
                    );
            }
        );

        setupRegisterMobileUI();

        setupPasswordMatchWatcher(
            "registerPassword",
            "registerConfirmPassword",
            "passwordMatchHint"
        );
    }

    /* ============================================================
       25. DEVTOOLS TEST SURFACE
       ============================================================ */

    function exposeDebugAPI() {
        window.DheereAuth =
            Object.freeze({
                isAuthenticated: () =>
                    Boolean(
                        getStoredToken() &&
                            getStoredUser()
                    ),

                getUser: () =>
                    getStoredUser(),

                hasToken: () =>
                    Boolean(
                        getStoredToken()
                    ),

                isGuestMode,

                clearSession,

                sendRegisterOtp:
                    beginRegisterMobileOtp,

                verifyRegisterOtp:
                    verifyRegisterMobileOtp,

                config:
                    AUTH_CONFIG
            });
    }

    /* ============================================================
       26. INIT
       ============================================================ */

    document.addEventListener(
        "DOMContentLoaded",
        () => {
            setupPasswordToggles();

            setupPasswordStrength();

            setupGoogleButtons();

            setupGuestModeLinks();

            setupGeneralFormUX();

            setupLiveMessageDismissal();

            initLoginPage();

            initRegisterPage();

            setupForgotPage();

            setupVerifyPage();

            exposeDebugAPI();
        }
    );
})();
