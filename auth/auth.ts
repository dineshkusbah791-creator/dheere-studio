/* ============================================================
   Dheere Studio — Authentication
   TypeScript migration.
   Runtime behavior and API/storage contracts preserved.
   ============================================================ */

(() => {
    "use strict";

    type ApiError = Error & {
        code?: string;
        status?: number;
        data?: unknown;
    };

/* ============================================================
       1. CONFIGURATION
       ============================================================ */

    const AUTH_CONFIG = Object.freeze({
        API_BASE_URL: "/api",

        STORAGE: Object.freeze({
            USER: "dheereStudioUser",
            TOKEN: "dheereStudioToken"
        }),

        ENDPOINTS: Object.freeze({
            LOGIN: "/login",

            REGISTER: "/register",

            CHECK_USERNAME: (username: string): string =>
                `/check-username/${encodeURIComponent(username)}`,

            FORGOT_REQUEST: "/forgot-password",

            RESET_PASSWORD: "/reset-password"
        }),

        DEFAULT_REDIRECT: "../index.html"
    });

    /* ============================================================
       2. DOM / GENERAL HELPERS
       ============================================================ */

    const $ = <T extends Element = Element>(
        selector: string,
        root: ParentNode = document
    ): T | null =>
        root.querySelector<T>(selector);

    const $$ = <T extends Element = Element>(
        selector: string,
        root: ParentNode = document
    ): T[] =>
        Array.from(
            root.querySelectorAll<T>(selector)
        );

    const text = (value: unknown): string =>
        String(value ?? "").trim();

    const normalizedEmail = (value: unknown): string =>
        text(value).toLowerCase();

    const sleep = (ms: number): Promise<void> =>
        new Promise((resolve) =>
            window.setTimeout(resolve, ms)
        );

    function getQueryParam(name: string): string {
        return (
            new URLSearchParams(
                window.location.search
            ).get(name) || ""
        );
    }

    function safeJsonParse<T = any>(value: string | null, fallback: T | null = null): T | null {
        try {
            return value
                ? JSON.parse(value)
                : fallback;
        } catch {
            return fallback;
        }
    }

    function getStoredToken(): string {
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

    function getStoredUser(): Record<string, unknown> | null {
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

    function saveSession(user: any, token: string): void {
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

    function clearSession(): void {
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

    function clearGuestMode(): void {
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

    function enterGuestMode(event?: Event): void {
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

    function isGuestMode(): boolean {
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

    function setupGuestModeLinks(): void {
        $$<HTMLAnchorElement>(".auth-guest-link").forEach(
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

    function getSafeRedirect(): string {
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

    function redirectAfterAuth(): void {
        window.location.assign(
            getSafeRedirect()
        );
    }

    /* ============================================================
       5. UI MESSAGES
       ============================================================ */

    function getMessageElement(id: string): HTMLElement | null {
        return document.getElementById(id);
    }

    function showMessage(
        id: string,
        message: unknown,
        type: string = "error"
    ): void {
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

    function hideMessage(id: string): void {
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
        message: unknown,
        type: string = "error"
    ): void {
        showMessage(
            "loginMessage",
            message,
            type
        );
    }

    function showRegisterMessage(
        message: unknown,
        type: string = "error"
    ): void {
        showMessage(
            "registerMessage",
            message,
            type
        );
    }

    function setLoading(
        button: HTMLButtonElement | null,
        loading: boolean,
        loadingText: string = "Please wait…"
    ): void {
        if (!button) {
            return;
        }

        if (loading) {
            if (
                !button.dataset.originalText
            ) {
                button.dataset.originalText =
                    (button.textContent || "").trim();
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
        element: Element | null,
        invalid: boolean
    ): void {
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
        data: any,
        fallback: string =
            "Something went wrong. Please try again."
    ): string {
        const candidate =
            data?.message ||
            data?.error ||
            data?.details ||
            data?.reason;

        return (
            typeof candidate === "string" &&
            candidate.trim()
                ? candidate
                : fallback
        );
    }

    function createNetworkError(): ApiError {
        const error =
            new Error(
                "Unable to reach Dheere Studio right now. Please check your connection and try again."
            ) as ApiError;

        error.code =
            "NETWORK_ERROR";

        return error;
    }

    function toApiError(error: unknown): ApiError | null {
        if (error instanceof Error) {
            return error as ApiError;
        }

        if (error && typeof error === "object") {
            return error as ApiError;
        }

        return null;
    }

    function getErrorMessage(
        error: unknown,
        fallback: string
    ): string {
        const apiError =
            toApiError(error);

        return (
            text(apiError?.message) ||
            fallback
        );
    }

    /* ============================================================
       7. API REQUEST
       ============================================================ */

    async function apiRequest(
        path: string,
        options: RequestInit = {}
    ): Promise<any> {
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
                ) as ApiError;

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

    function extractToken(data: any): string {
        return (
            data?.token ||
            data?.accessToken ||
            data?.data?.token ||
            data?.data?.accessToken ||
            ""
        );
    }

    function extractUser(data: any): Record<string, unknown> | null {
        return (
            data?.user ||
            data?.account ||
            data?.data?.user ||
            data?.profile ||
            null
        );
    }

    function extractRecoveryToken(
        data: any
    ): string {
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

    /* ============================================================
       9. VALIDATION HELPERS
       ============================================================ */

    function isValidEmail(value: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            normalizedEmail(value)
        );
    }

    function isValidUsername(value: string): boolean {
        return /^[a-z0-9_]{3,20}$/.test(
            text(value).toLowerCase()
        );
    }

    function passwordScore(value: string): number {
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
        score: number
    ): string {
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

    function setupPasswordToggles(): void {
        $$<HTMLButtonElement>(".auth-password-toggle").forEach(
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
                        ) as HTMLInputElement | null
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
        input: HTMLInputElement,
        meter: HTMLElement,
        valueElement: HTMLElement | null
    ): void {
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

    function setupPasswordStrength(): void {
        $$<HTMLInputElement>(
            "[data-strength-target]"
        ).forEach((input) => {
            const targetId =
                input.dataset
                    .strengthTarget;

            if (!targetId) {
                return;
            }

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
                    ) as HTMLInputElement | null,

                meter:
                    document.getElementById(
                        "registerPasswordStrength"
                    ) as HTMLElement | null,

                value:
                    document.getElementById(
                        "registerPasswordStrengthValue"
                    ) as HTMLElement | null
            },

            {
                input:
                    document.getElementById(
                        "newPassword"
                    ) as HTMLInputElement | null,

                meter:
                    document.getElementById(
                        "passwordStrength"
                    ) as HTMLElement | null,

                value:
                    document.getElementById(
                        "passwordStrengthValue"
                    ) as HTMLElement | null
            },

            {
                input:
                    document.getElementById(
                        "forgotNewPassword"
                    ) as HTMLInputElement | null,

                meter:
                    document.getElementById(
                        "forgotPasswordStrength"
                    ) as HTMLElement | null,

                value:
                    document.getElementById(
                        "forgotPasswordStrengthValue"
                    ) as HTMLElement | null
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
        username: string,
        message: string,
        type: string = ""
    ): void {
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
        value: unknown
    ): Promise<boolean> {
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
        email: string,
        password: string
    ): Promise<{ user: Record<string, unknown>; token: string }> {
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
        event: SubmitEvent
    ): Promise<void> {
        event.preventDefault();


        const emailInput =
            document.getElementById(
                "loginIdentifier"
            ) as HTMLInputElement | null;


        const passwordInput =
            document.getElementById(
                "loginPassword"
            ) as HTMLInputElement | null;

        const submitButton =
            document.getElementById(
                "loginSubmitButton"
            ) as HTMLButtonElement | null;

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
                toApiError(error)?.status === 401
            ) {
                showLoginMessage(
                    "Incorrect email or password."
                );
            } else if (
                toApiError(error)?.status === 429
            ) {
                showLoginMessage(
                    "Too many login attempts. Please wait a little and try again."
                );
            } else {
                showLoginMessage(
                    getErrorMessage(
                        error,
                        "Unable to sign in right now. Please try again."
                    )
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
        event: SubmitEvent
    ): Promise<void> {
        event.preventDefault();

        const name =
            text(
                $<HTMLInputElement>("#registerName")?.value
            );

        const username =
            text(
                $<HTMLInputElement>("#registerUsername")?.value
            ).toLowerCase();

        const email =
            normalizedEmail(
                $<HTMLInputElement>("#registerEmail")?.value
            );

        const password =
            $<HTMLInputElement>("#registerPassword")?.value || "";

        const confirm =
            $<HTMLInputElement>("#registerConfirmPassword")?.value || "";

        const terms =
            $<HTMLInputElement>("#registerTerms")?.checked === true;

        const submitButton =
            $<HTMLButtonElement>("#registerSubmitButton");

        hideMessage(
            "registerMessage"
        );

        [
            "registerName",
            "registerUsername",
            "registerEmail",
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
                    $<HTMLInputElement>("#registerName"),
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
                    $<HTMLInputElement>("#registerUsername"),
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
                    $<HTMLInputElement>("#registerEmail"),
                    true
                );

                throw new Error(
                    "Enter a valid email address."
                );
            }

            if (
                password.length < 8 ||
                password.length > 128
            ) {
                setFieldInvalid(
                    $<HTMLInputElement>("#registerPassword"),
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
                    $<HTMLInputElement>("#registerPassword"),
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
                    $<HTMLInputElement>("#registerConfirmPassword"),
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
                        method:
                            "POST",

                        body:
                            JSON.stringify({
                                name,
                                username,
                                email,
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
                toApiError(error)?.status === 409
            ) {
                showRegisterMessage(
                    getErrorMessage(
                        error,
                        "That username or email is already registered."
                    )
                );

            } else if (
                toApiError(error)?.status === 429
            ) {
                showRegisterMessage(
                    "Too many registration attempts. Please wait and try again."
                );

            } else {
                showRegisterMessage(
                    getErrorMessage(
                        error,
                        "Unable to create your account right now."
                    )
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
       17. FORGOT PASSWORD — EMAIL
       ============================================================ */

    async function requestPasswordReset(): Promise<void> {

        const emailInput =
            document.getElementById(
                "forgotIdentifier"
            ) as HTMLInputElement | null;

        const sendButton =
            document.getElementById(
                "sendRecoveryButton"
            ) as HTMLButtonElement | null;

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
                toApiError(error)?.status === 429
                    ? "Too many password-reset requests. Please wait and try again."
                    : getErrorMessage(
                        error,
                        "Unable to request a password reset right now."
                    )
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
       18. FORGOT PASSWORD — PAGE INIT
       ============================================================ */

    function setupForgotPage(): void {
        const form =
            document.getElementById(
                "forgotForm"
            ) as HTMLFormElement | null;

        if (!form) {
            return;
        }

        form.addEventListener(
            "submit",
            (event) => {
                event.preventDefault();
                requestPasswordReset();
            }
        );
    }

    /* ============================================================
       19. RESET PASSWORD
       ============================================================ */

    async function submitNewPassword(
        form: HTMLFormElement
    ): Promise<void> {
        const password =
            $<HTMLInputElement>(
                "#newPassword",
                form
            )?.value || "";

        const confirm =
            $<HTMLInputElement>(
                "#confirmNewPassword",
                form
            )?.value || "";

        const token =
            getQueryParam("token") ||
            getQueryParam("resetToken");

        const button =
            $<HTMLButtonElement>(
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
                ) ||
                document.getElementById(
                    "resetPasswordStep"
                );

            const successStep =
                document.getElementById(
                    "resetSuccessStep"
                ) ||
                document.getElementById(
                    "recoverySuccessStep"
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
                getErrorMessage(
                    error,
                    "Unable to update your password right now."
                )
            );

            setLoading(
                button,
                false,
                "Update Password"
            );
        }
    }

    function setupResetPasswordPage(): void {
        const form =
            document.getElementById(
                "resetPasswordForm"
            ) as HTMLFormElement | null;

        if (!form) {
            return;
        }

        const token =
            getQueryParam("token") ||
            getQueryParam("resetToken");


        const button =
            document.getElementById(
                "resetPasswordButton"
            ) as HTMLButtonElement | null;

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
        firstId: string,
        secondId: string,
        hintId: string
    ): void {

        const first =
            document.getElementById(
                firstId
            ) as HTMLInputElement | null;


        const second =
            document.getElementById(
                secondId
            ) as HTMLInputElement | null;

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
       21. ACCOUNT VERIFICATION
       ============================================================ */

    function setupVerifyPage(): void {
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
       22. LOGIN PAGE — EXISTING SESSION
       ============================================================ */

    function restoreExistingSession(): void {
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

    function setupGeneralFormUX(): void {
        $$<HTMLFormElement>("form").forEach(
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

    function setupLiveMessageDismissal(): void {
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

    function initLoginPage(): void {
        const form =
            document.getElementById(
                "loginForm"
            ) as HTMLFormElement | null;

        if (!form) {
            return;
        }

        form.addEventListener(
            "submit",
            handleLogin
        );

        restoreExistingSession();
    }

    function initRegisterPage(): void {
        const form =
            document.getElementById(
                "registerForm"
            ) as HTMLFormElement | null;

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
            ) as HTMLInputElement | null;

        let usernameTimer:
            ReturnType<typeof window.setTimeout> | null =
            null;

        username?.addEventListener(
            "input",
            () => {
                window.clearTimeout(
                    usernameTimer ?? undefined
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
setupPasswordMatchWatcher(
            "registerPassword",
            "registerConfirmPassword",
            "passwordMatchHint"
        );
    }

    /* ============================================================
       25. DEVTOOLS TEST SURFACE
       ============================================================ */

    function exposeDebugAPI(): void {
        (window as any).DheereAuth =
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

            setupGuestModeLinks();

            setupGeneralFormUX();

            setupLiveMessageDismissal();

            initLoginPage();

            initRegisterPage();

            setupForgotPage();

            setupResetPasswordPage();

            setupVerifyPage();

            exposeDebugAPI();
        }
    );
})();
