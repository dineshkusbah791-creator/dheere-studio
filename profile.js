"use strict";

/* =========================================================
   CONFIG
   ========================================================= */

const API_BASE =
    "https://dheere-studio.onrender.com";

const STORAGE_KEY =
    "dheereStudioUser";

const TOKEN_STORAGE_KEY =
    "dheereStudioToken";


/* =========================================================
   STATE
   ========================================================= */

let currentUser = null;

let currentAvatar = null;

let aiBusy = false;

let usernameCheckTimer = null;

let usernameCheckToken = 0;

let usernameAvailable = false;


/* =========================================================
   ELEMENTS
   ========================================================= */

const authenticatedContent =
    document.getElementById(
        "authenticatedContent"
    );

const loginMessage =
    document.getElementById(
        "loginMessage"
    );

const profileName =
    document.getElementById(
        "profileName"
    );

const profileUsername =
    document.getElementById(
        "profileUsername"
    );

const profileEmail =
    document.getElementById(
        "profileEmail"
    );

const profileBio =
    document.getElementById(
        "profileBio"
    );

const profileAvatar =
    document.getElementById(
        "profileAvatar"
    );

const profilePostCount =
    document.getElementById(
        "profilePostCount"
    );

const editProfileBtn =
    document.getElementById(
        "editProfileBtn"
    );

const avatarQuickEdit =
    document.getElementById(
        "avatarQuickEdit"
    );

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

const postsFeed =
    document.getElementById(
        "postsFeed"
    );

const postContent =
    document.getElementById(
        "postContent"
    );

const postCharacterCount =
    document.getElementById(
        "postCharacterCount"
    );

const createPostBtn =
    document.getElementById(
        "createPostBtn"
    );

const editOverlay =
    document.getElementById(
        "editOverlay"
    );

const closeEditBtn =
    document.getElementById(
        "closeEditBtn"
    );

const cancelEditBtn =
    document.getElementById(
        "cancelEditBtn"
    );

const saveProfileBtn =
    document.getElementById(
        "saveProfileBtn"
    );

const editAvatar =
    document.getElementById(
        "editAvatar"
    );

const changePhotoBtn =
    document.getElementById(
        "changePhotoBtn"
    );

const removePhotoBtn =
    document.getElementById(
        "removePhotoBtn"
    );

const photoInput =
    document.getElementById(
        "photoInput"
    );

const editName =
    document.getElementById(
        "editName"
    );

const editUsername =
    document.getElementById(
        "editUsername"
    );

const editBio =
    document.getElementById(
        "editBio"
    );

const bioCounter =
    document.getElementById(
        "bioCounter"
    );

const editEmail =
    document.getElementById(
        "editEmail"
    );

const editDateOfBirth =
    document.getElementById(
        "editDateOfBirth"
    );

const editGender =
    document.getElementById(
        "editGender"
    );

const usernameStatus =
    document.getElementById(
        "usernameStatus"
    );

const dheereAiForm =
    document.getElementById(
        "dheereAiForm"
    );

const dheereAiInput =
    document.getElementById(
        "dheereAiInput"
    );

const dheereAiSend =
    document.getElementById(
        "dheereAiSend"
    );

const dheereAiMessages =
    document.getElementById(
        "dheereAiMessages"
    );

const dheereAiTyping =
    document.getElementById(
        "dheereAiTyping"
    );

const dheereAiStatus =
    document.getElementById(
        "dheereAiStatus"
    );

const dheereAiStatusText =
    document.getElementById(
        "dheereAiStatusText"
    );


/* =========================================================
   AUTH HELPERS
   ========================================================= */

function getAuthToken() {

    return localStorage.getItem(
        TOKEN_STORAGE_KEY
    );

}


function getAuthHeaders() {

    const token =
        getAuthToken();


    const headers = {
        "Content-Type":
            "application/json"
    };


    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }


    return headers;

}


function hasValidLoginSession() {

    return Boolean(
        currentUser &&
        getAuthToken()
    );

}


function clearAuthStorage() {

    localStorage.removeItem(
        STORAGE_KEY
    );


    localStorage.removeItem(
        TOKEN_STORAGE_KEY
    );


    currentUser =
        null;

}


function handleAuthError(
    message
) {

    clearAuthStorage();


    alert(
        message ||
        "Authentication required. Please login again."
    );


    window.location.href =
        "index.html";

}


/* =========================================================
   RESPONSE HELPER
   ========================================================= */

async function parseResponse(
    response
) {

    try {

        return await response.json();

    } catch {

        return {};

    }

}


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(
            value ?? ""
        );


    return div.innerHTML;

}


function getUserId(user) {

    return String(
        user?._id ||
        user?.id ||
        user?.userId ||
        user?.user?._id ||
        user?.user?.id ||
        ""
    ).trim();

}


function getUsername(user) {

    return String(
        user?.username ||
        user?.user?.username ||
        ""
    )
        .trim()
        .toLowerCase();

}


function getDisplayName(user) {

    return String(
        user?.name ||
        user?.user?.name ||
        user?.username ||
        "User"
    ).trim();

}


function getAvatarUrl(user) {

    return String(
        user?.avatarUrl ||
        user?.avatar ||
        user?.user?.avatarUrl ||
        ""
    ).trim();

}


function saveCurrentUser() {

    if (!currentUser) {

        return;

    }


    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
            currentUser
        )
    );

}


function loadStoredUser() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!saved) {

            currentUser =
                null;


            return false;

        }


        const token =
            getAuthToken();


        if (!token) {

            currentUser =
                null;


            return false;

        }


        currentUser =
            JSON.parse(
                saved
            );


        return Boolean(
            currentUser
        );

    } catch (error) {

        console.error(
            "Stored user error:",
            error
        );


        clearAuthStorage();


        return false;

    }

}


/* =========================================================
   INITIALS
   ========================================================= */

function getInitials(name) {

    const value =
        String(
            name || "User"
        ).trim();


    if (!value) {

        return "U";

    }


    const parts =
        value.split(
            /\s+/
        );


    if (parts.length === 1) {

        return parts[0]
            .charAt(0)
            .toUpperCase();

    }


    return (
        parts[0]
            .charAt(0) +
        parts[
            parts.length - 1
        ]
            .charAt(0)
    ).toUpperCase();

}


/* =========================================================
   AVATAR
   ========================================================= */

function renderAvatar(
    element,
    name,
    image
) {

    if (!element) {

        return;

    }


    element.replaceChildren();


    if (image) {

        const img =
            document.createElement(
                "img"
            );


        img.src =
            image;


        img.alt =
            `${name || "Profile"} photo`;


        img.loading =
            "eager";


        img.decoding =
            "async";


        img.addEventListener(
            "error",
            () => {

                element.replaceChildren();


                element.textContent =
                    getInitials(
                        name
                    );

            }
        );


        element.appendChild(
            img
        );


        return;

    }


    element.textContent =
        getInitials(
            name
        );

}


/* =========================================================
   PROFILE DISPLAY
   ========================================================= */

function updateProfileDisplay() {

    if (!currentUser) {

        return;

    }


    const name =
        getDisplayName(
            currentUser
        );


    const username =
        getUsername(
            currentUser
        );


    const email =
        currentUser.email ||
        currentUser?.user?.email ||
        "";


    const bio =
        currentUser.bio ||
        "";


    currentAvatar =
        getAvatarUrl(
            currentUser
        );


    if (profileName) {

        profileName.textContent =
            name;

    }


    if (profileUsername) {

        profileUsername.textContent =
            username
                ? `@${username}`
                : "";

    }


    if (profileEmail) {

        profileEmail.textContent =
            email;

    }


    if (profileBio) {

        profileBio.textContent =
            bio ||
            "";

    }


    renderAvatar(
        profileAvatar,
        name,
        currentAvatar
    );

}


/* =========================================================
   PROFILE AUTH UI
   ========================================================= */

function showLoginState() {

    if (authenticatedContent) {

        authenticatedContent.style.display =
            "none";

    }


    if (loginMessage) {

        loginMessage.style.display =
            "block";

    }

}


function showAuthenticatedState() {

    if (authenticatedContent) {

        authenticatedContent.style.display =
            "block";

    }


    if (loginMessage) {

        loginMessage.style.display =
            "none";

    }

}


/* =========================================================
   LOAD PROFILE
   ========================================================= */

function loadProfile() {

    const loaded =
        loadStoredUser();


    if (!loaded) {

        showLoginState();


        return false;

    }


    showAuthenticatedState();


    updateProfileDisplay();


    return true;

}


/* =========================================================
   REFRESH PROFILE FROM SERVER
   ========================================================= */

async function refreshProfileFromServer() {

    if (
        !currentUser ||
        !hasValidLoginSession()
    ) {

        return;

    }


    const userId =
        getUserId(
            currentUser
        );


    if (!userId) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE}/profile/${encodeURIComponent(userId)}`,
                {
                    headers:
                        getAuthHeaders(),

                    cache:
                        "no-store"
                }
            );


        const result =
            await parseResponse(
                response
            );


        if (
            response.status ===
            401
        ) {

            handleAuthError(
                result?.error
            );


            return;

        }


        if (
            !response.ok
        ) {

            throw new Error(
                result?.error ||
                "Could not refresh profile."
            );

        }


        const user =
            result?.user ||
            result?.profile ||
            null;


        if (!user) {

            return;

        }


        currentUser = {
            ...currentUser,
            ...user
        };


        saveCurrentUser();


        updateProfileDisplay();


    } catch (error) {

        console.error(
            "Refresh profile error:",
            error
        );

    }

}


/* =========================================================
   EDIT MODAL
   ========================================================= */

function openEditModal() {

    if (
        !currentUser ||
        !editOverlay
    ) {

        return;

    }


    const name =
        getDisplayName(
            currentUser
        );


    const username =
        getUsername(
            currentUser
        );


    if (editName) {

        editName.value =
            name;

    }


    if (editUsername) {

        editUsername.value =
            username;

    }


    if (editBio) {

        editBio.value =
            currentUser.bio ||
            "";

    }


    if (editEmail) {

        editEmail.value =
            currentUser.email ||
            "";

    }


    if (editDateOfBirth) {

        editDateOfBirth.value =
            currentUser.dateOfBirth ||
            "";

    }


    if (editGender) {

        editGender.value =
            currentUser.gender ||
            "";

    }


    currentAvatar =
        getAvatarUrl(
            currentUser
        );


    renderAvatar(
        editAvatar,
        name,
        currentAvatar
    );


    usernameAvailable =
        true;


    updateBioCounter();


    setUsernameStatus(
        "",
        ""
    );


    editOverlay.classList.add(
        "active"
    );


    editOverlay.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeEditModal() {

    if (!editOverlay) {

        return;

    }


    editOverlay.classList.remove(
        "active"
    );


    editOverlay.setAttribute(
        "aria-hidden",
        "true"
    );


    if (photoInput) {

        photoInput.value =
            "";

    }

}


/* =========================================================
   USERNAME STATUS
   ========================================================= */

function setUsernameStatus(
    message,
    type
) {

    if (!usernameStatus) {

        return;

    }


    usernameStatus.textContent =
        message ||
        "";


    usernameStatus.classList.remove(
        "available",
        "taken",
        "checking"
    );


    if (type) {

        usernameStatus.classList.add(
            type
        );

    }

}


/* =========================================================
   BIO COUNTER
   ========================================================= */

function updateBioCounter() {

    if (
        !editBio ||
        !bioCounter
    ) {

        return;

    }


    bioCounter.textContent =
        `${editBio.value.length} / 150`;

}


/* =========================================================
   USERNAME AVAILABILITY
   ========================================================= */

async function checkUsernameAvailability() {

    if (
        !editUsername ||
        !currentUser
    ) {

        return;

    }


    const username =
        editUsername.value
            .trim()
            .toLowerCase();


    const currentUsername =
        getUsername(
            currentUser
        );


    if (!username) {

        usernameAvailable =
            false;


        setUsernameStatus(
            "",
            ""
        );


        return;

    }


    if (
        username ===
        currentUsername
    ) {

        usernameAvailable =
            true;


        setUsernameStatus(
            "✓ Current username",
            "available"
        );


        return;

    }


    if (
        !/^[a-z0-9_]{3,20}$/.test(
            username
        )
    ) {

        usernameAvailable =
            false;


        setUsernameStatus(
            "Username must be 3–20 characters using lowercase letters, numbers or underscores.",
            "taken"
        );


        return;

    }


    const userId =
        getUserId(
            currentUser
        );


    const requestToken =
        ++usernameCheckToken;


    setUsernameStatus(
        "Checking username...",
        "checking"
    );


    usernameAvailable =
        false;


    try {

        const response =
            await fetch(
                `${API_BASE}/check-username/${encodeURIComponent(username)}?userId=${encodeURIComponent(userId)}`
            );


        const result =
            await parseResponse(
                response
            );


        if (
            requestToken !==
            usernameCheckToken
        ) {

            return;

        }


        if (
            !response.ok
        ) {

            throw new Error(
                result?.error ||
                "Could not check username."
            );

        }


        usernameAvailable =
            result?.available ===
            true;


        setUsernameStatus(
            usernameAvailable
                ? "✓ Username is available."
                : "✕ Username is already taken.",
            usernameAvailable
                ? "available"
                : "taken"
        );


    } catch (error) {

        console.error(
            "Username check error:",
            error
        );


        usernameAvailable =
            false;


        setUsernameStatus(
            "Could not check username.",
            "taken"
        );

    }

}


/* =========================================================
   IMAGE COMPRESSION
   ========================================================= */

function compressProfilePhoto(
    file
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const reader =
                new FileReader();


            reader.onerror =
                () => {

                    reject(
                        new Error(
                            "Could not read image."
                        )
                    );

                };


            reader.onload =
                event => {

                    const image =
                        new Image();


                    image.onerror =
                        () => {

                            reject(
                                new Error(
                                    "Could not process image."
                                )
                            );

                        };


                    image.onload =
                        () => {

                            const maxSize =
                                900;


                            let width =
                                image.width;


                            let height =
                                image.height;


                            if (
                                width >
                                maxSize
                            ) {

                                height =
                                    Math.round(
                                        height *
                                        (
                                            maxSize /
                                            width
                                        )
                                    );


                                width =
                                    maxSize;

                            }


                            if (
                                height >
                                maxSize
                            ) {

                                width =
                                    Math.round(
                                        width *
                                        (
                                            maxSize /
                                            height
                                        )
                                    );


                                height =
                                    maxSize;

                            }


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            canvas.width =
                                width;


                            canvas.height =
                                height;


                            const context =
                                canvas.getContext(
                                    "2d"
                                );


                            if (!context) {

                                reject(
                                    new Error(
                                        "Image processing is unavailable."
                                    )
                                );


                                return;

                            }


                            context.drawImage(
                                image,
                                0,
                                0,
                                width,
                                height
                            );


                            resolve(
                                canvas.toDataURL(
                                    "image/jpeg",
                                    0.85
                                )
                            );

                        };


                    image.src =
                        event.target.result;

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


/* =========================================================
   DATE
   ========================================================= */

function formatPostDate(
    value
) {

    if (!value) {

        return "";

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleString(
        undefined,
        {
            dateStyle:
                "medium",

            timeStyle:
                "short"
        }
    );

}


/* =========================================================
   POST HELPERS
   ========================================================= */

function getPostId(post) {

    return String(
        post?.id ||
        post?._id ||
        ""
    ).trim();

}


function getPostLikes(post) {

    const value =
        Number(
            post?.likes
        );


    return Number.isFinite(
        value
    )
        ? Math.max(
            0,
            value
        )
        : 0;

}


function getPostCommentsCount(post) {

    const value =
        Number(
            post?.comments ??
            post?.commentCount ??
            0
        );


    return Number.isFinite(
        value
    )
        ? Math.max(
            0,
            value
        )
        : 0;

}


function isPostLiked(post) {

    return (
        post?.liked === true ||
        post?.isLiked === true
    );

}


/* =========================================================
   RENDER COMMENTS
   ========================================================= */

function renderComments(
    container,
    comments
) {

    if (!container) {

        return;

    }


    if (
        !Array.isArray(
            comments
        ) ||
        comments.length === 0
    ) {

        container.innerHTML = `

            <div class="post-comments-empty">
                No comments yet.
            </div>

        `;


        return;

    }


    container.innerHTML =
        comments.map(
            comment => {

                const username =
                    comment.username ||
                    "Dheere User";


                const content =
                    comment.content ||
                    "";


                const date =
                    formatPostDate(
                        comment.createdAt
                    );


                return `

                    <div class="post-comment">

                        <div class="post-comment-header">

                            <strong>
                                @${escapeHTML(username)}
                            </strong>

                            ${
                                date
                                    ? `
                                        <span>
                                            ${escapeHTML(date)}
                                        </span>
                                    `
                                    : ""
                            }

                        </div>

                        <div class="post-comment-content">
                            ${escapeHTML(content)}
                        </div>

                    </div>

                `;

            }
        )
        .join("");

}


/* =========================================================
   LOAD COMMENTS
   ========================================================= */

async function loadPostComments(
    postId,
    commentsContainer,
    commentCountElement
) {

    if (
        !postId ||
        !commentsContainer
    ) {

        return;

    }


    commentsContainer.innerHTML = `

        <div class="post-comments-loading">
            Loading comments...
        </div>

    `;


    try {

        const response =
            await fetch(
                `${API_BASE}/posts/${encodeURIComponent(postId)}/comments`
            );


        const result =
            await parseResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                result?.error ||
                "Could not load comments."
            );

        }


        const comments =
            Array.isArray(
                result?.comments
            )
                ? result.comments
                : [];


        renderComments(
            commentsContainer,
            comments
        );


        if (
            commentCountElement
        ) {

            commentCountElement.textContent =
                String(
                    comments.length
                );

        }


    } catch (error) {

        console.error(
            "Load comments error:",
            error
        );


        commentsContainer.innerHTML = `

            <div class="post-comments-error">
                Unable to load comments right now.
            </div>

        `;

    }

}


/* =========================================================
   CREATE COMMENT
   ========================================================= */

async function createPostComment(
    postId,
    input,
    submitButton,
    commentsContainer,
    commentCountElement
) {

    if (
        !hasValidLoginSession()
    ) {

        alert(
            "Please login first."
        );


        return;

    }


    if (!postId) {

        return;

    }


    const content =
        input?.value
            .trim();


    if (!content) {

        input?.focus();


        return;

    }


    if (
        content.length >
        1000
    ) {

        alert(
            "Comment cannot exceed 1000 characters."
        );


        return;

    }


    submitButton.disabled =
        true;


    submitButton.textContent =
        "Posting...";


    try {

        const response =
            await fetch(
                `${API_BASE}/posts/${encodeURIComponent(postId)}/comments`,
                {
                    method:
                        "POST",

                    headers:
                        getAuthHeaders(),

                    body:
                        JSON.stringify({
                            content
                        })
                }
            );


        const result =
            await parseResponse(
                response
            );


        if (
            response.status ===
            401
        ) {

            handleAuthError(
                result?.error
            );


            return;

        }


        if (!response.ok) {

            throw new Error(
                result?.error ||
                "Could not add comment."
            );

        }


        input.value =
            "";


        if (
            result?.comment
        ) {

            const comment =
                result.comment;


            const emptyState =
                commentsContainer?.querySelector(
                    ".post-comments-empty"
                );


            if (emptyState) {

                commentsContainer.innerHTML =
                    "";

            }


            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "post-comment";


            element.innerHTML = `

                <div class="post-comment-header">

                    <strong>
                        @${escapeHTML(
                            comment.username ||
                            getUsername(currentUser) ||
                            "user"
                        )}
                    </strong>

                    ${
                        comment.createdAt
                            ? `
                                <span>
                                    ${escapeHTML(
                                        formatPostDate(
                                            comment.createdAt
                                        )
                                    )}
                                </span>
                            `
                            : ""
                    }

                </div>

                <div class="post-comment-content">
                    ${escapeHTML(
                        comment.content ||
                        content
                    )}
                </div>

            `;


            commentsContainer?.appendChild(
                element
            );


            if (
                commentCountElement
            ) {

                const count =
                    Number(
                        commentCountElement.textContent
                    ) || 0;


                commentCountElement.textContent =
                    String(
                        count + 1
                    );

            }


        } else {

            await loadPostComments(
                postId,
                commentsContainer,
                commentCountElement
            );

        }


    } catch (error) {

        console.error(
            "Create comment error:",
            error
        );


        alert(
            error.message ||
            "Unable to add comment."
        );


    } finally {

        submitButton.disabled =
            false;


        submitButton.textContent =
            "Comment";

    }

}


/* =========================================================
   TOGGLE LIKE
   ========================================================= */

async function toggleLike(
    postId,
    button,
    countElement
) {

    if (
        !hasValidLoginSession()
    ) {

        alert(
            "Please login first."
        );


        return;

    }


    if (
        button.dataset.busy ===
        "true"
    ) {

        return;

    }


    button.dataset.busy =
        "true";


    button.disabled =
        true;


    try {

        const response =
            await fetch(
                `${API_BASE}/posts/${encodeURIComponent(postId)}/like`,
                {
                    method:
                        "POST",

                    headers:
                        getAuthHeaders()
                }
            );


        const result =
            await parseResponse(
                response
            );


        if (
            response.status ===
            401
        ) {

            handleAuthError(
                result?.error
            );


            return;

        }


        if (!response.ok) {

            throw new Error(
                result?.error ||
                "Could not update like."
            );

        }


        const liked =
            result?.liked ===
            true;


        const likes =
            Math.max(
                0,
                Number(
                    result?.likes
                ) || 0
            );


        if (
            countElement
        ) {

            countElement.textContent =
                String(
                    likes
                );

        }


        button.classList.toggle(
            "liked",
            liked
        );


        button.dataset.liked =
            liked
                ? "true"
                : "false";


        button.setAttribute(
            "aria-pressed",
            liked
                ? "true"
                : "false"
        );


        const icon =
            button.querySelector(
                ".post-action-icon"
            );


        const text =
            button.querySelector(
                ".post-action-text"
            );


        if (icon) {

            icon.textContent =
                liked
                    ? "♥"
                    : "♡";

        }


        if (text) {

            text.textContent =
                liked
                    ? "Liked"
                    : "Like";

        }


    } catch (error) {

        console.error(
            "Like error:",
            error
        );


        alert(
            error.message ||
            "Unable to update like."
        );


    } finally {

        button.disabled =
            false;


        button.dataset.busy =
            "false";

    }

}


/* =========================================================
   RENDER POSTS
   ========================================================= */

function renderPosts(
    posts
) {

    if (!postsFeed) {

        return;

    }


    if (
        !Array.isArray(posts) ||
        posts.length === 0
    ) {

        postsFeed.innerHTML = `

            <div class="empty-state">
                No posts yet.
            </div>

        `;


        if (
            profilePostCount
        ) {

            profilePostCount.textContent =
                "0";

        }


        return;

    }


    if (
        profilePostCount
    ) {

        profilePostCount.textContent =
            String(
                posts.length
            );

    }


    postsFeed.innerHTML =
        posts.map(
            post => {

                const postId =
                    getPostId(
                        post
                    );


                const username =
                    post.username ||
                    getUsername(
                        currentUser
                    ) ||
                    "user";


                const content =
                    post.content ||
                    "";


                const date =
                    formatPostDate(
                        post.createdAt
                    );


                const likes =
                    getPostLikes(
                        post
                    );


                const comments =
                    getPostCommentsCount(
                        post
                    );


                const liked =
                    isPostLiked(
                        post
                    );


                return `

                    <article
                        class="post-card"
                        data-post-id="${escapeHTML(postId)}"
                    >

                        <div class="post-header">

                            <div class="post-author">

                                @${escapeHTML(
                                    username
                                )}

                            </div>

                            <div class="post-date">

                                ${escapeHTML(
                                    date
                                )}

                            </div>

                        </div>


                        <div class="post-content">

                            ${escapeHTML(
                                content
                            )}

                        </div>


                        <div class="post-actions">

                            <button
                                type="button"
                                class="post-action post-like-btn ${liked ? "liked" : ""}"
                                data-liked="${liked ? "true" : "false"}"
                                aria-pressed="${liked ? "true" : "false"}"
                            >

                                <span class="post-action-icon">
                                    ${liked ? "♥" : "♡"}
                                </span>

                                <span class="post-action-text">
                                    ${liked ? "Liked" : "Like"}
                                </span>

                                <span class="post-like-count">
                                    ${likes}
                                </span>

                            </button>


                            <button
                                type="button"
                                class="post-action post-comment-toggle"
                            >

                                <span class="post-action-icon">
                                    💬
                                </span>

                                <span class="post-action-text">
                                    Comment
                                </span>

                                <span class="post-comment-count">
                                    ${comments}
                                </span>

                            </button>

                        </div>


                        <div
                            class="post-comments"
                            hidden
                        >

                            <div
                                class="post-comments-list"
                            >

                                <div class="post-comments-empty">
                                    No comments loaded yet.
                                </div>

                            </div>


                            <div
                                class="post-comment-form"
                            >

                                <textarea
                                    class="post-comment-input"
                                    maxlength="1000"
                                    placeholder="Write a comment..."
                                ></textarea>


                                <button
                                    type="button"
                                    class="post-submit-comment"
                                >
                                    Comment
                                </button>

                            </div>

                        </div>

                    </article>

                `;

            }
        )
        .join("");

}


/* =========================================================
   LOAD USER POSTS
   ========================================================= */

async function loadUserPosts() {

    if (
        !currentUser ||
        !postsFeed
    ) {

        return;

    }


    const username =
        getUsername(
            currentUser
        );


    const userId =
        getUserId(
            currentUser
        );


    if (!username) {

        postsFeed.innerHTML = `

            <div class="empty-state error-state">
                Username is missing from your profile.
            </div>

        `;


        return;

    }


    postsFeed.innerHTML = `

        <div class="empty-state">
            Loading your posts...
        </div>

    `;


    try {

        const query =
            userId
                ? `?userId=${encodeURIComponent(userId)}`
                : "";


        const response =
            await fetch(
                `${API_BASE}/posts/user/${encodeURIComponent(username)}${query}`,
                {
                    cache:
                        "no-store"
                }
            );


        const result =
            await parseResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                result?.error ||
                "Could not load posts."
            );

        }


        if (
            !Array.isArray(
                result?.posts
            )
        ) {

            throw new Error(
                "Invalid posts response."
            );

        }


        renderPosts(
            result.posts
        );


    } catch (error) {

        console.error(
            "Load posts error:",
            error
        );


        if (
            profilePostCount
        ) {

            profilePostCount.textContent =
                "—";

        }


        postsFeed.innerHTML = `

            <div class="empty-state error-state">
                Unable to load your posts right now.
            </div>

        `;

    }

}


/* =========================================================
   POST ACTIONS
   ========================================================= */

function setupPostActions() {

    if (!postsFeed) {

        return;

    }


    postsFeed.addEventListener(
        "click",
        async event => {

            const likeButton =
                event.target.closest(
                    ".post-like-btn"
                );


            if (likeButton) {

                const postCard =
                    likeButton.closest(
                        ".post-card"
                    );


                const postId =
                    postCard?.dataset.postId;


                const countElement =
                    likeButton.querySelector(
                        ".post-like-count"
                    );


                if (postId) {

                    await toggleLike(
                        postId,
                        likeButton,
                        countElement
                    );

                }


                return;

            }


            const commentToggle =
                event.target.closest(
                    ".post-comment-toggle"
                );


            if (commentToggle) {

                const postCard =
                    commentToggle.closest(
                        ".post-card"
                    );


                const postId =
                    postCard?.dataset.postId;


                const commentsBox =
                    postCard?.querySelector(
                        ".post-comments"
                    );


                const commentsList =
                    postCard?.querySelector(
                        ".post-comments-list"
                    );


                const countElement =
                    postCard?.querySelector(
                        ".post-comment-count"
                    );


                if (!commentsBox) {

                    return;

                }


                const opening =
                    commentsBox.hidden;


                commentsBox.hidden =
                    !opening;


                if (
                    opening &&
                    postId &&
                    commentsList
                ) {

                    await loadPostComments(
                        postId,
                        commentsList,
                        countElement
                    );

                }


                return;

            }


            const submitButton =
                event.target.closest(
                    ".post-submit-comment"
                );


            if (submitButton) {

                const postCard =
                    submitButton.closest(
                        ".post-card"
                    );


                const postId =
                    postCard?.dataset.postId;


                const input =
                    postCard?.querySelector(
                        ".post-comment-input"
                    );


                const commentsContainer =
                    postCard?.querySelector(
                        ".post-comments-list"
                    );


                const countElement =
                    postCard?.querySelector(
                        ".post-comment-count"
                    );


                if (
                    postId &&
                    input &&
                    commentsContainer
                ) {

                    await createPostComment(
                        postId,
                        input,
                        submitButton,
                        commentsContainer,
                        countElement
                    );

                }

            }

        }
    );


    postsFeed.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Enter" ||
                event.shiftKey
            ) {

                return;

            }


            const input =
                event.target.closest(
                    ".post-comment-input"
                );


            if (!input) {

                return;

            }


            event.preventDefault();


            const postCard =
                input.closest(
                    ".post-card"
                );


            const submitButton =
                postCard?.querySelector(
                    ".post-submit-comment"
                );


            if (submitButton) {

                submitButton.click();

            }

        }
    );

}


/* =========================================================
   CREATE POST
   ========================================================= */

if (postContent) {

    postContent.addEventListener(
        "input",
        () => {

            if (
                postCharacterCount
            ) {

                postCharacterCount.textContent =
                    `${postContent.value.length} / 2000`;

            }

        }
    );

}


if (createPostBtn) {

    createPostBtn.addEventListener(
        "click",
        async () => {

            if (
                !hasValidLoginSession()
            ) {

                alert(
                    "Please login first."
                );


                return;

            }


            const content =
                postContent?.value
                    .trim();


            if (!content) {

                alert(
                    "Write something before publishing."
                );


                return;

            }


            if (
                content.length >
                2000
            ) {

                alert(
                    "Post cannot exceed 2000 characters."
                );


                return;

            }


            createPostBtn.disabled =
                true;


            createPostBtn.textContent =
                "Publishing...";


            try {

                const response =
                    await fetch(
                        `${API_BASE}/posts`,
                        {
                            method:
                                "POST",

                            headers:
                                getAuthHeaders(),

                            body:
                                JSON.stringify({
                                    content
                                })
                        }
                    );


                const result =
                    await parseResponse(
                        response
                    );


                if (
                    response.status ===
                    401
                ) {

                    handleAuthError(
                        result?.error
                    );


                    return;

                }


                if (
                    !response.ok ||
                    result?.success === false
                ) {

                    throw new Error(
                        result?.error ||
                        "Unable to publish post."
                    );

                }


                postContent.value =
                    "";


                if (
                    postCharacterCount
                ) {

                    postCharacterCount.textContent =
                        "0 / 2000";

                }


                await loadUserPosts();


            } catch (error) {

                console.error(
                    "Create post error:",
                    error
                );


                alert(
                    error.message ||
                    "Unable to publish post."
                );


            } finally {

                createPostBtn.disabled =
                    false;


                createPostBtn.textContent =
                    "Publish Post";

            }

        }
    );

}


/* =========================================================
   EDIT BUTTONS
   ========================================================= */

if (editProfileBtn) {

    editProfileBtn.addEventListener(
        "click",
        openEditModal
    );

}


if (avatarQuickEdit) {

    avatarQuickEdit.addEventListener(
        "click",
        openEditModal
    );

}


if (closeEditBtn) {

    closeEditBtn.addEventListener(
        "click",
        closeEditModal
    );

}


if (cancelEditBtn) {

    cancelEditBtn.addEventListener(
        "click",
        closeEditModal
    );

}


if (editOverlay) {

    editOverlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                editOverlay
            ) {

                closeEditModal();

            }

        }
    );

}


/* =========================================================
   EDIT INPUT EVENTS
   ========================================================= */

if (editBio) {

    editBio.addEventListener(
        "input",
        updateBioCounter
    );

}


if (editUsername) {

    editUsername.addEventListener(
        "input",
        () => {

            clearTimeout(
                usernameCheckTimer
            );


            usernameAvailable =
                false;


            usernameCheckTimer =
                setTimeout(
                    checkUsernameAvailability,
                    450
                );

        }
    );

}


/* =========================================================
   CHANGE PHOTO
   ========================================================= */

if (
    changePhotoBtn &&
    photoInput
) {

    changePhotoBtn.addEventListener(
        "click",
        () => {

            photoInput.click();

        }
    );

}


if (photoInput) {

    photoInput.addEventListener(
        "change",
        async event => {

            const file =
                event.target.files?.[0];


            if (!file) {

                return;

            }


            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];


            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {

                alert(
                    "Please choose a JPG, PNG or WebP image."
                );


                photoInput.value =
                    "";


                return;

            }


            if (
                file.size >
                3 * 1024 * 1024
            ) {

                alert(
                    "Please choose an image smaller than 3 MB."
                );


                photoInput.value =
                    "";


                return;

            }


            if (
                !hasValidLoginSession()
            ) {

                alert(
                    "Please login again."
                );


                return;

            }


            const userId =
                getUserId(
                    currentUser
                );


            if (!userId) {

                alert(
                    "Your account ID is missing. Please login again."
                );


                return;

            }


            if (changePhotoBtn) {

                changePhotoBtn.disabled =
                    true;


                changePhotoBtn.textContent =
                    "Uploading...";

            }


            try {

                const imageData =
                    await compressProfilePhoto(
                        file
                    );


                const response =
                    await fetch(
                        `${API_BASE}/profile/${encodeURIComponent(userId)}/photo`,
                        {
                            method:
                                "PUT",

                            headers:
                                getAuthHeaders(),

                            body:
                                JSON.stringify({
                                    image:
                                        imageData
                                })
                        }
                    );


                const result =
                    await parseResponse(
                        response
                    );


                if (
                    response.status ===
                    401
                ) {

                    handleAuthError(
                        result?.error
                    );


                    return;

                }


                if (
                    !response.ok ||
                    !result?.success ||
                    !result?.avatarUrl
                ) {

                    throw new Error(
                        result?.error ||
                        "Could not upload profile photo."
                    );

                }


                currentAvatar =
                    result.avatarUrl;


                currentUser.avatarUrl =
                    result.avatarUrl;


                saveCurrentUser();


                updateProfileDisplay();


                renderAvatar(
                    editAvatar,
                    getDisplayName(
                        currentUser
                    ),
                    currentAvatar
                );


                setUsernameStatus(
                    "✓ Profile photo uploaded successfully.",
                    "available"
                );


            } catch (error) {

                console.error(
                    "Profile photo upload error:",
                    error
                );


                alert(
                    error.message ||
                    "Could not upload the profile photo."
                );


            } finally {

                if (changePhotoBtn) {

                    changePhotoBtn.disabled =
                        false;


                    changePhotoBtn.textContent =
                        "Change photo";

                }


                photoInput.value =
                    "";

            }

        }
    );

}


/* =========================================================
   REMOVE PHOTO
   ========================================================= */

if (removePhotoBtn) {

    removePhotoBtn.addEventListener(
        "click",
        async () => {

            if (
                !hasValidLoginSession()
            ) {

                alert(
                    "Please login again."
                );


                return;

            }


            const userId =
                getUserId(
                    currentUser
                );


            if (!userId) {

                alert(
                    "Your account ID is missing."
                );


                return;

            }


            if (
                !getAvatarUrl(
                    currentUser
                )
            ) {

                return;

            }


            removePhotoBtn.disabled =
                true;


            removePhotoBtn.textContent =
                "Removing...";


            try {

                const response =
                    await fetch(
                        `${API_BASE}/profile/${encodeURIComponent(userId)}/photo`,
                        {
                            method:
                                "DELETE",

                            headers:
                                getAuthHeaders()
                        }
                    );


                const result =
                    await parseResponse(
                        response
                    );


                if (
                    response.status ===
                    401
                ) {

                    handleAuthError(
                        result?.error
                    );


                    return;

                }


                if (
                    !response.ok ||
                    result?.success === false
                ) {

                    throw new Error(
                        result?.error ||
                        "Could not remove profile photo."
                    );

                }


                currentAvatar =
                    "";


                currentUser.avatarUrl =
                    "";


                saveCurrentUser();


                updateProfileDisplay();


                renderAvatar(
                    editAvatar,
                    getDisplayName(
                        currentUser
                    ),
                    ""
                );


                setUsernameStatus(
                    "Profile photo removed.",
                    "available"
                );


            } catch (error) {

                console.error(
                    "Remove profile photo error:",
                    error
                );


                alert(
                    error.message ||
                    "Could not remove the profile photo."
                );


            } finally {

                removePhotoBtn.disabled =
                    false;


                removePhotoBtn.textContent =
                    "Remove";

            }

        }
    );

}


/* =========================================================
   SAVE PROFILE
   ========================================================= */

if (saveProfileBtn) {

    saveProfileBtn.addEventListener(
        "click",
        async () => {

            if (
                !currentUser ||
                !hasValidLoginSession()
            ) {

                alert(
                    "Please login again."
                );


                return;

            }


            const name =
                editName?.value
                    .trim() ||
                "";


            const username =
                editUsername?.value
                    .trim()
                    .toLowerCase() ||
                "";


            const bio =
                editBio?.value
                    .trim() ||
                "";


            const dateOfBirth =
                editDateOfBirth?.value
                    .trim() ||
                "";


            const gender =
                editGender?.value
                    .trim()
                    .toLowerCase() ||
                "";


            const currentUsername =
                getUsername(
                    currentUser
                );


            if (!name) {

                alert(
                    "Display name cannot be empty."
                );


                editName?.focus();


                return;

            }


            if (
                !/^[a-z0-9_]{3,20}$/.test(
                    username
                )
            ) {

                alert(
                    "Username must be 3–20 characters using lowercase letters, numbers or underscores."
                );


                editUsername?.focus();


                return;

            }


            if (
                bio.length >
                150
            ) {

                alert(
                    "Bio cannot be longer than 150 characters."
                );


                editBio?.focus();


                return;

            }


            if (
                username !==
                currentUsername &&
                !usernameAvailable
            ) {

                alert(
                    "Please choose an available username first."
                );


                editUsername?.focus();


                return;

            }


            const userId =
                getUserId(
                    currentUser
                );


            if (!userId) {

                alert(
                    "Your account ID is missing. Please log in again."
                );


                return;

            }


            saveProfileBtn.disabled =
                true;


            saveProfileBtn.textContent =
                "Saving...";


            try {

                if (
                    username !==
                    currentUsername
                ) {

                    const availabilityResponse =
                        await fetch(
                            `${API_BASE}/check-username/${encodeURIComponent(username)}?userId=${encodeURIComponent(userId)}`
                        );


                    const availabilityResult =
                        await parseResponse(
                            availabilityResponse
                        );


                    if (
                        !availabilityResponse.ok ||
                        availabilityResult?.available !==
                        true
                    ) {

                        usernameAvailable =
                            false;


                        setUsernameStatus(
                            "✕ Username is no longer available.",
                            "taken"
                        );


                        throw new Error(
                            "Username is no longer available."
                        );

                    }

                }


                const response =
                    await fetch(
                        `${API_BASE}/profile/${encodeURIComponent(userId)}`,
                        {
                            method:
                                "PUT",

                            headers:
                                getAuthHeaders(),

                            body:
                                JSON.stringify({
                                    name,
                                    username,
                                    bio,
                                    dateOfBirth,
                                    gender
                                })
                        }
                    );


                const result =
                    await parseResponse(
                        response
                    );


                if (
                    response.status ===
                    401
                ) {

                    handleAuthError(
                        result?.error
                    );


                    return;

                }


                if (!response.ok) {

                    throw new Error(
                        result?.error ||
                        "Profile update failed."
                    );

                }


                const updatedUser =
                    result?.user ||
                    result?.profile ||
                    null;


                if (updatedUser) {

                    currentUser = {
                        ...currentUser,
                        ...updatedUser
                    };

                }


                currentUser.name =
                    name;


                currentUser.username =
                    username;


                currentUser.bio =
                    bio;


                currentUser.dateOfBirth =
                    dateOfBirth;


                currentUser.gender =
                    gender;


                saveCurrentUser();


                currentAvatar =
                    getAvatarUrl(
                        currentUser
                    );


                updateProfileDisplay();


                closeEditModal();


                await loadUserPosts();


            } catch (error) {

                console.error(
                    "Save profile error:",
                    error
                );


                alert(
                    error.message ||
                    "Unable to update your profile."
                );


            } finally {

                saveProfileBtn.disabled =
                    false;


                saveProfileBtn.textContent =
                    "Save Changes";

            }

        }
    );

}


/* =========================================================
   LOGOUT
   ========================================================= */

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        () => {

            clearAuthStorage();


            window.location.href =
                "index.html";

        }
    );

}


/* =========================================================
   DHEERE AI
   ========================================================= */

function setAiStatus(
    text,
    online = false
) {

    if (dheereAiStatusText) {

        dheereAiStatusText.textContent =
            text;

    }


    if (dheereAiStatus) {

        dheereAiStatus.classList.toggle(
            "online",
            online
        );

    }

}


function addAiMessage(
    text,
    type
) {

    if (!dheereAiMessages) {

        return;

    }


    const element =
        document.createElement(
            "div"
        );


    element.className =
        `ai-message ${type}`;


    element.textContent =
        String(
            text || ""
        );


    if (dheereAiTyping) {

        dheereAiMessages.insertBefore(
            element,
            dheereAiTyping
        );

    } else {

        dheereAiMessages.appendChild(
            element
        );

    }


    dheereAiMessages.scrollTop =
        dheereAiMessages.scrollHeight;

}


async function sendAiMessage() {

    if (
        aiBusy ||
        !dheereAiInput
    ) {

        return;

    }


    const message =
        dheereAiInput.value
            .trim();


    if (!message) {

        return;

    }


    addAiMessage(
        message,
        "user"
    );


    dheereAiInput.value =
        "";


    dheereAiInput.style.height =
        "auto";


    aiBusy =
        true;


    if (dheereAiSend) {

        dheereAiSend.disabled =
            true;

    }


    if (dheereAiTyping) {

        dheereAiTyping.classList.add(
            "visible"
        );

    }


    setAiStatus(
        "Thinking..."
    );


    try {

        const response =
            await fetch(
                `${API_BASE}/ai-chat`,
                {
                    method:
                        "POST",

                    headers:
                        {
                            "Content-Type":
                                "application/json"
                        },

                    body:
                        JSON.stringify({
                            message
                        })
                }
            );


        const result =
            await parseResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                result?.error ||
                `AI request failed (${response.status}).`
            );

        }


        if (
            !result ||
            result.success !==
            true
        ) {

            throw new Error(
                result?.error ||
                "Dheere AI returned an invalid response."
            );

        }


        if (
            typeof result.answer !==
            "string" ||
            !result.answer.trim()
        ) {

            throw new Error(
                "Dheere AI returned an empty response."
            );

        }


        addAiMessage(
            result.answer.trim(),
            "ai"
        );


        setAiStatus(
            "Ready",
            true
        );


    } catch (error) {

        console.error(
            "Dheere AI error:",
            error
        );


        addAiMessage(
            error.message ||
            "Unable to connect to Dheere AI.",
            "error"
        );


        setAiStatus(
            "Unavailable"
        );


    } finally {

        aiBusy =
            false;


        if (dheereAiSend) {

            dheereAiSend.disabled =
                false;

        }


        if (dheereAiTyping) {

            dheereAiTyping.classList.remove(
                "visible"
            );

        }


        dheereAiInput.focus();


        if (dheereAiMessages) {

            dheereAiMessages.scrollTop =
                dheereAiMessages.scrollHeight;

        }

    }

}


/* =========================================================
   AI EVENTS
   ========================================================= */

if (dheereAiForm) {

    dheereAiForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            sendAiMessage();

        }
    );

}


if (dheereAiInput) {

    dheereAiInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();


                sendAiMessage();

            }

        }
    );


    dheereAiInput.addEventListener(
        "input",
        () => {

            dheereAiInput.style.height =
                "auto";


            dheereAiInput.style.height =
                Math.min(
                    dheereAiInput.scrollHeight,
                    125
                ) + "px";

        }
    );

}


/* =========================================================
   CROSS TAB SYNC
   ========================================================= */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key ===
            STORAGE_KEY ||
            event.key ===
            TOKEN_STORAGE_KEY
        ) {

            loadProfile();


            if (currentUser) {

                refreshProfileFromServer();

                loadUserPosts();

            }

        }

    }
);


/* =========================================================
   PAGE SHOW
   ========================================================= */

window.addEventListener(
    "pageshow",
    async () => {

        const loaded =
            loadProfile();


        if (loaded) {

            await refreshProfileFromServer();

            await loadUserPosts();

        }

    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

setupPostActions();


const profileLoaded =
    loadProfile();


if (profileLoaded) {

    loadUserPosts();

    refreshProfileFromServer();

    setAiStatus(
        "Ready",
        true
    );

}