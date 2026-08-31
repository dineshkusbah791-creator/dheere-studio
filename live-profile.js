"use strict";


/* ============================================================
   LIVE PROFILE
   Public profile page
   ============================================================ */


/* ============================================================
   API CONFIG
   ============================================================ */

const API_BASE =
    "https://dheere-studio.onrender.com";


const USER_STORAGE_KEY =
    "dheereStudioUser";


const TOKEN_STORAGE_KEY =
    "dheereStudioToken";


/* ============================================================
   DOM REFERENCES
   ============================================================ */

const profileLoading =
    document.getElementById(
        "profileLoading"
    );


const profileError =
    document.getElementById(
        "profileError"
    );


const profileErrorText =
    document.getElementById(
        "profileErrorText"
    );


const retryProfileBtn =
    document.getElementById(
        "retryProfileBtn"
    );


const publicProfileContent =
    document.getElementById(
        "publicProfileContent"
    );


const publicProfileAvatar =
    document.getElementById(
        "publicProfileAvatar"
    );


const publicProfileName =
    document.getElementById(
        "publicProfileName"
    );


const publicProfileUsername =
    document.getElementById(
        "publicProfileUsername"
    );


const publicProfileBio =
    document.getElementById(
        "publicProfileBio"
    );


const publicPostCount =
    document.getElementById(
        "publicPostCount"
    );


const publicProfileStatus =
    document.getElementById(
        "publicProfileStatus"
    );


const publicJoinedDate =
    document.getElementById(
        "publicJoinedDate"
    );


const publicPostsUsername =
    document.getElementById(
        "publicPostsUsername"
    );


const publicPostsLoading =
    document.getElementById(
        "publicPostsLoading"
    );


const publicPostsError =
    document.getElementById(
        "publicPostsError"
    );


const retryPostsBtn =
    document.getElementById(
        "retryPostsBtn"
    );


const publicPostsEmpty =
    document.getElementById(
        "publicPostsEmpty"
    );


const publicPostsFeed =
    document.getElementById(
        "publicPostsFeed"
    );


/* ============================================================
   STATE
   ============================================================ */

let currentUsername = "";

let currentProfile = null;

let currentPosts = [];


/* ============================================================
   CURRENT USER
   ============================================================ */

function getCurrentUser() {

    try {

        const savedUser =
            localStorage.getItem(
                USER_STORAGE_KEY
            );


        if (!savedUser) {

            return null;

        }


        return JSON.parse(
            savedUser
        );

    } catch (error) {

        console.error(
            "Could not read current user:",
            error
        );

        return null;

    }

}


function getCurrentUserId() {

    const user =
        getCurrentUser();


    return (
        user?.id ||
        user?._id ||
        user?.user?.id ||
        user?.user?._id ||
        ""
    );

}


/* ============================================================
   AUTH HEADERS
   ============================================================ */

function getAuthHeaders() {

    const token =
        localStorage.getItem(
            TOKEN_STORAGE_KEY
        );


    const headers = {

        "Content-Type":
            "application/json",

        "Accept":
            "application/json"

    };


    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }


    return headers;

}


/* ============================================================
   USERNAME FROM URL
   ============================================================ */

function getUsernameFromUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const username =
        params.get(
            "username"
        );


    if (
        typeof username !==
        "string"
    ) {

        return "";

    }


    return username
        .trim()
        .replace(
            /^@/,
            ""
        )
        .toLowerCase();

}


/* ============================================================
   ESCAPE HTML
   ============================================================ */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* ============================================================
   INITIAL
   ============================================================ */

function getInitial(
    name,
    username
) {

    const source =
        String(
            name ||
            username ||
            "U"
        ).trim();


    if (!source) {

        return "U";

    }


    return source
        .charAt(0)
        .toUpperCase();

}


/* ============================================================
   DATE FORMAT
   ============================================================ */

function formatJoinedDate(
    dateValue
) {

    if (!dateValue) {

        return "—";

    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return date.toLocaleDateString(
        undefined,
        {
            month:
                "short",

            year:
                "numeric"
        }
    );

}


/* ============================================================
   POST DATE FORMAT
   ============================================================ */

function formatPostDate(
    dateValue
) {

    if (!dateValue) {

        return "";

    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleDateString(
        undefined,
        {
            day:
                "numeric",

            month:
                "short",

            year:
                "numeric"
        }
    );

}


/* ============================================================
   POST ID
   ============================================================ */

function getPostId(
    post
) {

    return String(
        post?._id ||
        post?.id ||
        ""
    ).trim();

}


/* ============================================================
   LOADING STATE
   ============================================================ */

function showProfileLoading() {

    profileLoading.hidden =
        false;


    profileError.hidden =
        true;


    publicProfileContent.hidden =
        true;

}


/* ============================================================
   ERROR STATE
   ============================================================ */

function showProfileError(
    message
) {

    profileLoading.hidden =
        true;


    profileError.hidden =
        false;


    publicProfileContent.hidden =
        true;


    profileErrorText.textContent =
        message ||
        "We couldn't load this profile right now.";

}


/* ============================================================
   SHOW PROFILE
   ============================================================ */

function showProfileContent() {

    profileLoading.hidden =
        true;


    profileError.hidden =
        true;


    publicProfileContent.hidden =
        false;

}


/* ============================================================
   AVATAR
   ============================================================ */

function renderAvatar(
    user
) {

    publicProfileAvatar.innerHTML =
        "";


    const avatarUrl =
        typeof user?.avatarUrl ===
        "string"
            ? user.avatarUrl.trim()
            : "";


    if (avatarUrl) {

        const image =
            document.createElement(
                "img"
            );


        image.src =
            avatarUrl;


        image.alt =
            `${
                user.name ||
                user.username ||
                "User"
            } profile photo`;


        image.loading =
            "eager";


        image.decoding =
            "async";


        image.addEventListener(
            "error",
            () => {

                publicProfileAvatar.textContent =
                    getInitial(
                        user.name,
                        user.username
                    );

            }
        );


        publicProfileAvatar.appendChild(
            image
        );


        return;

    }


    publicProfileAvatar.textContent =
        getInitial(
            user.name,
            user.username
        );

}


/* ============================================================
   PROFILE DATA
   ============================================================ */

function renderProfile(
    user,
    posts
) {

    if (!user) {

        return;

    }


    currentProfile =
        user;


    currentPosts =
        Array.isArray(posts)
            ? posts
            : [];


    const name =
        typeof user.name ===
        "string"
            ? user.name.trim()
            : "";


    const username =
        typeof user.username ===
        "string"
            ? user.username.trim()
            : "";


    const bio =
        typeof user.bio ===
        "string"
            ? user.bio.trim()
            : "";


    publicProfileName.textContent =
        name ||
        "User";


    publicProfileUsername.textContent =
        username
            ? `@${username}`
            : "";


    publicPostsUsername.textContent =
        username
            ? `@${username}`
            : "";


    publicProfileBio.textContent =
        bio;


    publicProfileBio.style.display =
        bio
            ? ""
            : "none";


    publicPostCount.textContent =
        String(
            currentPosts.length
        );


    publicProfileStatus.textContent =
        "Public";


    publicJoinedDate.textContent =
        formatJoinedDate(
            user.createdAt
        );


    renderAvatar(
        user
    );


    document.title =
        name
            ? `${name} — Dheere Studio`
            : username
                ? `@${username} — Dheere Studio`
                : "Profile — Dheere Studio";


    renderPosts(
        currentPosts
    );

}


/* ============================================================
   FETCH PUBLIC PROFILE
   ============================================================ */

async function fetchPublicProfile() {

    if (!currentUsername) {

        throw new Error(
            "No username was provided."
        );

    }


    const viewerId =
        getCurrentUserId();


    const query =
        viewerId
            ? `?userId=${encodeURIComponent(
                viewerId
            )}`
            : "";


    const url =
        `${API_BASE}/public-profile/${encodeURIComponent(
            currentUsername
        )}${query}`;


    const response =
        await fetch(
            url,
            {
                method:
                    "GET",

                headers: {
                    "Accept":
                        "application/json"
                },

                cache:
                    "no-store"
            }
        );


    let result =
        null;


    try {

        result =
            await response.json();

    } catch {

        throw new Error(
            `Server returned an invalid response (${response.status}).`
        );

    }


    if (!response.ok) {

        throw new Error(
            result?.error ||
            `Unable to load profile (${response.status}).`
        );

    }


    if (
        !result ||
        result.success !== true
    ) {

        throw new Error(
            result?.error ||
            "Unable to load this profile."
        );

    }


    if (!result.user) {

        throw new Error(
            "Profile data was not returned by the server."
        );

    }


    return result;

}


/* ============================================================
   LOAD PROFILE
   ============================================================ */

async function loadProfile() {

    showProfileLoading();


    try {

        const result =
            await fetchPublicProfile();


        renderProfile(
            result.user,
            result.posts
        );


        showProfileContent();


    } catch (error) {

        console.error(
            "Live profile error:",
            error
        );


        showProfileError(
            error?.message ||
            "Unable to load this profile right now."
        );

    }

}


/* ============================================================
   COMMENT DATE
   ============================================================ */

function formatCommentDate(
    dateValue
) {

    if (!dateValue) {

        return "";

    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleDateString(
        undefined,
        {
            day:
                "numeric",

            month:
                "short",

            year:
                "numeric"
        }
    );

}


/* ============================================================
   GET LIKE COUNT
   ============================================================ */

function getLikeCount(
    post
) {

    const value =
        Number(
            post?.likes ||
            0
        );


    if (
        !Number.isFinite(
            value
        )
    ) {

        return 0;

    }


    return Math.max(
        0,
        value
    );

}


/* ============================================================
   GET COMMENT COUNT
   ============================================================ */

function getCommentCount(
    post
) {

    const value =
        Number(
            post?.comments ||
            post?.commentCount ||
            0
        );


    if (
        !Number.isFinite(
            value
        )
    ) {

        return 0;

    }


    return Math.max(
        0,
        value
    );

}


/* ============================================================
   CHECK LIKE STATE
   ============================================================ */

function isPostLiked(
    post
) {

    return (
        post?.liked === true ||
        post?.isLiked === true
    );

}


/* ============================================================
   LOAD COMMENTS
   ============================================================ */

async function loadComments(
    postId,
    commentsList,
    countElement
) {

    if (
        !postId ||
        !commentsList
    ) {

        return;

    }


    commentsList.innerHTML = `

        <div class="live-comments-loading">

            Loading comments...

        </div>

    `;


    try {

        const response =
            await fetch(
                `${API_BASE}/posts/${encodeURIComponent(
                    postId
                )}/comments`,
                {
                    method:
                        "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    },

                    cache:
                        "no-store"
                }
            );


        const result =
            await response.json();


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


        if (
            countElement &&
            Array.isArray(comments)
        ) {

            countElement.textContent =
                String(
                    comments.length
                );

        }


        if (
            comments.length ===
            0
        ) {

            commentsList.innerHTML = `

                <div class="live-comments-empty">

                    No comments yet.

                </div>

            `;

            return;

        }


        commentsList.innerHTML =
            comments.map(
                comment => {

                    const username =
                        comment?.username ||
                        "user";


                    const content =
                        comment?.content ||
                        "";


                    const date =
                        formatCommentDate(
                            comment?.createdAt
                        );


                    return `

                        <div
                            class="live-comment"
                        >

                            <div
                                class="live-comment-header"
                            >

                                <strong>
                                    @${escapeHtml(
                                        username
                                    )}
                                </strong>

                                ${
                                    date
                                        ? `
                                            <span>
                                                ${escapeHtml(
                                                    date
                                                )}
                                            </span>
                                        `
                                        : ""
                                }

                            </div>


                            <div
                                class="live-comment-content"
                            >

                                ${escapeHtml(
                                    content
                                )}

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    } catch (error) {

        console.error(
            "Live profile comments error:",
            error
        );


        commentsList.innerHTML = `

            <div class="live-comments-error">

                Unable to load comments right now.

            </div>

        `;

    }

}


/* ============================================================
   ADD COMMENT
   ============================================================ */

async function addComment(
    postId,
    input,
    submitButton,
    commentsList,
    countElement
) {

    const userId =
        getCurrentUserId();


    if (!userId) {

        alert(
            "Please login first."
        );

        return;

    }


    const content =
        input.value.trim();


    if (!content) {

        input.focus();

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
                `${API_BASE}/posts/${encodeURIComponent(
                    postId
                )}/comments`,
                {
                    method:
                        "POST",

                    headers:
                        getAuthHeaders(),

                    body:
                        JSON.stringify({
                            userId,
                            content
                        })
                }
            );


        const result =
            await response.json();


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

            await loadComments(
                postId,
                commentsList,
                countElement
            );

        } else {

            await loadComments(
                postId,
                commentsList,
                countElement
            );

        }


    } catch (error) {

        console.error(
            "Add live profile comment error:",
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


/* ============================================================
   TOGGLE LIKE
   ============================================================ */

async function toggleLike(
    postId,
    button,
    countElement
) {

    const userId =
        getCurrentUserId();


    if (!userId) {

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
                `${API_BASE}/posts/${encodeURIComponent(
                    postId
                )}/like`,
                {
                    method:
                        "POST",

                    headers:
                        getAuthHeaders(),

                    body:
                        JSON.stringify({
                            userId
                        })
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result?.error ||
                "Could not update like."
            );

        }


        const liked =
            result?.liked === true;


        const likes =
            Math.max(
                0,
                Number(
                    result?.likes
                ) || 0
            );


        countElement.textContent =
            String(
                likes
            );


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
                ".live-post-action-icon"
            );


        const text =
            button.querySelector(
                ".live-post-action-text"
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
            "Live profile like error:",
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


/* ============================================================
   RENDER POSTS
   ============================================================ */

function renderPosts(
    posts
) {

    publicPostsLoading.hidden =
        true;


    publicPostsError.hidden =
        true;


    publicPostsEmpty.hidden =
        true;


    publicPostsFeed.innerHTML =
        "";


    if (
        !Array.isArray(posts) ||
        posts.length === 0
    ) {

        publicPostsEmpty.hidden =
            false;

        return;

    }


    const fragment =
        document.createDocumentFragment();


    posts.forEach(
        post => {

            fragment.appendChild(
                createPostElement(
                    post
                )
            );

        }
    );


    publicPostsFeed.appendChild(
        fragment
    );

}


/* ============================================================
   CREATE POST
   ============================================================ */

function createPostElement(
    post
) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "public-post-card";


    const postId =
        getPostId(
            post
        );


    article.dataset.postId =
        postId;


    /* ----------------------------------------
       HEADER
       ---------------------------------------- */

    const header =
        document.createElement(
            "div"
        );


    header.className =
        "public-post-header";


    const author =
        document.createElement(
            "span"
        );


    author.className =
        "public-post-author";


    const username =
        typeof post?.username ===
        "string"
            ? post.username.trim()
            : currentUsername;


    author.textContent =
        username
            ? `@${username}`
            : "";


    const date =
        document.createElement(
            "time"
        );


    date.className =
        "public-post-date";


    const dateText =
        formatPostDate(
            post?.createdAt
        );


    date.textContent =
        dateText;


    if (post?.createdAt) {

        const parsedDate =
            new Date(
                post.createdAt
            );


        if (
            !Number.isNaN(
                parsedDate.getTime()
            )
        ) {

            date.dateTime =
                parsedDate.toISOString();

        }

    }


    header.appendChild(
        author
    );


    header.appendChild(
        date
    );


    /* ----------------------------------------
       CONTENT
       ---------------------------------------- */

    const content =
        document.createElement(
            "div"
        );


    content.className =
        "public-post-content";


    content.textContent =
        typeof post?.content ===
        "string"
            ? post.content
            : "";


    /* ----------------------------------------
       ACTION FOOTER
       ---------------------------------------- */

    const footer =
        document.createElement(
            "div"
        );


    footer.className =
        "public-post-footer";


    const likeButton =
        document.createElement(
            "button"
        );


    likeButton.type =
        "button";


    likeButton.className =
        "live-post-action-button live-post-like-button";


    const liked =
        isPostLiked(
            post
        );


    if (liked) {

        likeButton.classList.add(
            "liked"
        );

    }


    likeButton.dataset.postId =
        postId;


    likeButton.dataset.liked =
        liked
            ? "true"
            : "false";


    likeButton.setAttribute(
        "aria-pressed",
        liked
            ? "true"
            : "false"
    );


    likeButton.innerHTML = `

        <span
            class="live-post-action-icon"
        >
            ${
                liked
                    ? "♥"
                    : "♡"
            }
        </span>


        <span
            class="live-post-action-text"
        >
            ${
                liked
                    ? "Liked"
                    : "Like"
            }
        </span>


        <span
            class="live-post-action-count live-post-like-count"
        >
            ${getLikeCount(post)}
        </span>

    `;


    const commentButton =
        document.createElement(
            "button"
        );


    commentButton.type =
        "button";


    commentButton.className =
        "live-post-action-button live-post-comment-button";


    commentButton.dataset.postId =
        postId;


    commentButton.setAttribute(
        "aria-expanded",
        "false"
    );


    commentButton.innerHTML = `

        <span
            class="live-post-action-icon"
        >
            💬
        </span>


        <span>
            Comment
        </span>


        <span
            class="live-post-action-count live-post-comment-count"
        >
            ${getCommentCount(post)}
        </span>

    `;


    footer.appendChild(
        likeButton
    );


    footer.appendChild(
        commentButton
    );


    /* ----------------------------------------
       COMMENTS PANEL
       ---------------------------------------- */

    const commentsPanel =
        document.createElement(
            "div"
        );


    commentsPanel.className =
        "live-post-comments-panel";


    commentsPanel.innerHTML = `

        <div
            class="live-comments-list"
        ></div>


        <div
            class="live-comment-form"
        >

            <input
                type="text"
                class="live-comment-input"
                maxlength="1000"
                placeholder="Write a comment..."
                autocomplete="off"
            >


            <button
                type="button"
                class="live-submit-comment"
            >
                Comment
            </button>

        </div>

    `;


    article.appendChild(
        header
    );


    article.appendChild(
        content
    );


    article.appendChild(
        footer
    );


    article.appendChild(
        commentsPanel
    );


    return article;

}


/* ============================================================
   POST EVENT DELEGATION
   ============================================================ */

if (publicPostsFeed) {

    publicPostsFeed.addEventListener(
        "click",
        async event => {

            /* ----------------------------------------
               LIKE
               ---------------------------------------- */

            const likeButton =
                event.target.closest(
                    ".live-post-like-button"
                );


            if (likeButton) {

                const postCard =
                    likeButton.closest(
                        ".public-post-card"
                    );


                const postId =
                    likeButton.dataset.postId;


                const countElement =
                    postCard?.querySelector(
                        ".live-post-like-count"
                    );


                if (
                    postId &&
                    countElement
                ) {

                    await toggleLike(
                        postId,
                        likeButton,
                        countElement
                    );

                }


                return;

            }


            /* ----------------------------------------
               COMMENT TOGGLE
               ---------------------------------------- */

            const commentButton =
                event.target.closest(
                    ".live-post-comment-button"
                );


            if (commentButton) {

                const postCard =
                    commentButton.closest(
                        ".public-post-card"
                    );


                if (!postCard) {

                    return;

                }


                const postId =
                    commentButton.dataset.postId;


                const panel =
                    postCard.querySelector(
                        ".live-post-comments-panel"
                    );


                const commentsList =
                    postCard.querySelector(
                        ".live-comments-list"
                    );


                const countElement =
                    postCard.querySelector(
                        ".live-post-comment-count"
                    );


                if (
                    !postId ||
                    !panel ||
                    !commentsList
                ) {

                    return;

                }


                const isOpen =
                    panel.classList.contains(
                        "open"
                    );


                if (isOpen) {

                    panel.classList.remove(
                        "open"
                    );


                    commentButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );


                    return;

                }


                panel.classList.add(
                    "open"
                );


                commentButton.setAttribute(
                    "aria-expanded",
                    "true"
                );


                await loadComments(
                    postId,
                    commentsList,
                    countElement
                );


                const input =
                    postCard.querySelector(
                        ".live-comment-input"
                    );


                if (input) {

                    input.focus();

                }


                return;

            }


            /* ----------------------------------------
               COMMENT SUBMIT
               ---------------------------------------- */

            const submitButton =
                event.target.closest(
                    ".live-submit-comment"
                );


            if (submitButton) {

                const postCard =
                    submitButton.closest(
                        ".public-post-card"
                    );


                if (!postCard) {

                    return;

                }


                const postId =
                    postCard.dataset.postId;


                const input =
                    postCard.querySelector(
                        ".live-comment-input"
                    );


                const commentsList =
                    postCard.querySelector(
                        ".live-comments-list"
                    );


                const countElement =
                    postCard.querySelector(
                        ".live-post-comment-count"
                    );


                if (
                    postId &&
                    input &&
                    commentsList &&
                    countElement
                ) {

                    await addComment(
                        postId,
                        input,
                        submitButton,
                        commentsList,
                        countElement
                    );

                }

            }

        }
    );


    /* ----------------------------------------
       ENTER TO COMMENT
       ---------------------------------------- */

    publicPostsFeed.addEventListener(
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
                    ".live-comment-input"
                );


            if (!input) {

                return;

            }


            event.preventDefault();


            const postCard =
                input.closest(
                    ".public-post-card"
                );


            const submitButton =
                postCard?.querySelector(
                    ".live-submit-comment"
                );


            if (submitButton) {

                submitButton.click();

            }

        }
    );

}


/* ============================================================
   RETRY PROFILE
   ============================================================ */

if (retryProfileBtn) {

    retryProfileBtn.addEventListener(
        "click",
        () => {

            loadProfile();

        }
    );

}


/* ============================================================
   RETRY POSTS
   ============================================================ */

if (retryPostsBtn) {

    retryPostsBtn.addEventListener(
        "click",
        () => {

            loadProfile();

        }
    );

}


/* ============================================================
   URL VALIDATION
   ============================================================ */

function validateUsername(
    username
) {

    if (!username) {

        return false;

    }


    return /^[a-z0-9_]{3,20}$/i.test(
        username
    );

}


/* ============================================================
   INITIALIZE
   ============================================================ */

function initializeLiveProfile() {

    currentUsername =
        getUsernameFromUrl();


    if (
        !validateUsername(
            currentUsername
        )
    ) {

        showProfileError(
            "The profile username in this URL is invalid."
        );


        return;

    }


    loadProfile();

}


/* ============================================================
   START
   ============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeLiveProfile,
        {
            once:
                true
        }
    );

} else {

    initializeLiveProfile();

}