"use strict";

/* =========================================================
   PROFILE SOCIAL MODULE
   =========================================================

   Responsibilities:
   - User posts
   - Post composer
   - Post rendering
   - Like / unlike
   - Comments
   - Comment loading
   - Comment submission
   - Posts count
   - Social UI events

   This file intentionally does NOT handle:
   - Authentication implementation
   - Profile editing
   - Avatar/photo
   - Dheere AI
   ========================================================= */


/* =========================================================
   IMPORTS
   ========================================================= */

import {

    getCurrentUser,

    getUsername,

    getAuthHeaders,

    hasValidLoginSession,

    handleAuthError

} from "./profile-auth.js";


/* =========================================================
   CONFIG
   ========================================================= */

const API_BASE =
    "https://dheere-studio.onrender.com";


const MAX_POST_LENGTH =
    2000;


const MAX_COMMENT_LENGTH =
    1000;


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const postsFeed =
    document.getElementById(
        "postsFeed"
    );


const profilePostCount =
    document.getElementById(
        "profilePostCount"
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
   HTML ESCAPING
   ========================================================= */

function escapeHTML(
    value
) {

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


/* =========================================================
   POST ID
   ========================================================= */

function getPostId(
    post
) {

    return String(

        post?.id ||

        post?._id ||

        ""

    ).trim();

}


/* =========================================================
   POST LIKES
   ========================================================= */

function getPostLikes(
    post
) {

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


/* =========================================================
   POST COMMENT COUNT
   ========================================================= */

function getPostCommentsCount(
    post
) {

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


/* =========================================================
   POST LIKE STATE
   ========================================================= */

function isPostLiked(
    post
) {

    return (

        post?.liked === true ||

        post?.isLiked === true

    );

}


/* =========================================================
   FORMAT DATE
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
        )
        ||
        comments.length ===
            0
    ) {

        container.innerHTML = `

            <div class="post-comments-empty">
                No comments yet.
            </div>

        `;


        return;

    }


    container.innerHTML =

        comments

            .map(
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
                                    @${escapeHTML(
                                        username
                                    )}
                                </strong>

                                ${
                                    date
                                        ? `
                                            <span>
                                                ${escapeHTML(
                                                    date
                                                )}
                                            </span>
                                        `
                                        : ""
                                }

                            </div>


                            <div class="post-comment-content">

                                ${escapeHTML(
                                    content
                                )}

                            </div>

                        </div>

                    `;

                }
            )

            .join("");

}


/* =========================================================
   LOAD POST COMMENTS
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

                `${API_BASE}/posts/${encodeURIComponent(postId)}/comments`,

                {

                    method:
                        "GET",

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
            ?.trim() ||
        "";


    if (!content) {

        input?.focus();


        return;

    }


    if (
        content.length >
        MAX_COMMENT_LENGTH
    ) {

        alert(

            `Comment cannot exceed ${MAX_COMMENT_LENGTH} characters.`

        );


        return;

    }


    if (submitButton) {

        submitButton.disabled =
            true;


        submitButton.textContent =
            "Posting...";

    }


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


        if (input) {

            input.value =
                "";

        }


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

                            getUsername() ||

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

        if (submitButton) {

            submitButton.disabled =
                false;


            submitButton.textContent =
                "Comment";

        }

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


    if (!postId || !button) {

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
        !Array.isArray(posts)
        ||
        posts.length ===
            0
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

        posts

            .map(
                post => {

                    const postId =
                        getPostId(
                            post
                        );


                    const username =
                        post.username ||

                        getUsername() ||

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
                            data-post-id="${escapeHTML(
                                postId
                            )}"
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
                                    class="post-action post-like-btn ${
                                        liked
                                            ? "liked"
                                            : ""
                                    }"
                                    data-liked="${
                                        liked
                                            ? "true"
                                            : "false"
                                    }"
                                    aria-pressed="${
                                        liked
                                            ? "true"
                                            : "false"
                                    }"
                                >

                                    <span class="post-action-icon">
                                        ${
                                            liked
                                                ? "♥"
                                                : "♡"
                                        }
                                    </span>

                                    <span class="post-action-text">
                                        ${
                                            liked
                                                ? "Liked"
                                                : "Like"
                                        }
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
                                        maxlength="${MAX_COMMENT_LENGTH}"
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

    const currentUser =
        getCurrentUser();


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
        String(

            currentUser?._id ||

            currentUser?.id ||

            currentUser?.userId ||

            ""

        ).trim();


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

                    method:
                        "GET",

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
   CREATE POST
   ========================================================= */

async function createPost() {

    if (
        !hasValidLoginSession()
    ) {

        alert(
            "Please login first."
        );


        return false;

    }


    const content =
        postContent?.value
            ?.trim() ||
        "";


    if (!content) {

        alert(
            "Write something before publishing."
        );


        postContent?.focus();


        return false;

    }


    if (
        content.length >
        MAX_POST_LENGTH
    ) {

        alert(

            `Post cannot exceed ${MAX_POST_LENGTH} characters.`

        );


        return false;

    }


    if (createPostBtn) {

        createPostBtn.disabled =
            true;


        createPostBtn.textContent =
            "Publishing...";

    }


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


            return false;

        }


        if (
            !response.ok ||
            result?.success !==
                true
        ) {

            throw new Error(

                result?.error ||

                "Unable to publish post."

            );

        }


        if (postContent) {

            postContent.value =
                "";

        }


        updatePostCharacterCount();


        /*
         * Reload feed so server-generated post data,
         * timestamps and counts are authoritative.
         */

        await loadUserPosts();


        return true;


    } catch (error) {

        console.error(

            "Create post error:",

            error

        );


        alert(

            error.message ||

            "Unable to publish post."

        );


        return false;


    } finally {

        if (createPostBtn) {

            createPostBtn.disabled =
                false;


            createPostBtn.textContent =
                "Publish Post";

        }

    }

}


/* =========================================================
   UPDATE POST CHARACTER COUNT
   ========================================================= */

function updatePostCharacterCount() {

    if (
        !postContent ||
        !postCharacterCount
    ) {

        return;

    }


    postCharacterCount.textContent =

        `${postContent.value.length} / ${MAX_POST_LENGTH}`;

}


/* =========================================================
   POST CLICK HANDLER
   ========================================================= */

async function handlePostClick(
    event
) {

    if (!postsFeed) {

        return;

    }


    /* ---------------------------------------------
       LIKE
       --------------------------------------------- */

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


    /* ---------------------------------------------
       COMMENT TOGGLE
       --------------------------------------------- */

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


    /* ---------------------------------------------
       COMMENT SUBMIT
       --------------------------------------------- */

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


/* =========================================================
   POST KEYBOARD HANDLER
   ========================================================= */

function handlePostKeydown(
    event
) {

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


/* =========================================================
   SETUP EVENTS
   ========================================================= */

function setupSocialEvents() {

    if (postsFeed) {

        postsFeed.addEventListener(

            "click",

            handlePostClick

        );


        postsFeed.addEventListener(

            "keydown",

            handlePostKeydown

        );

    }


    if (postContent) {

        postContent.addEventListener(

            "input",

            updatePostCharacterCount

        );

    }


    if (createPostBtn) {

        createPostBtn.addEventListener(

            "click",

            async event => {

                event.preventDefault();

                await createPost();

            }

        );

    }

}


/* =========================================================
   PROFILE UPDATE REACTION
   =========================================================

   Username changes affect the user's post lookup path.
   Reloading posts after a profile update keeps the feed
   consistent with the new username.
   ========================================================= */

function setupProfileUpdateListener() {

    window.addEventListener(

        "dheere:profile-updated",

        async () => {

            await loadUserPosts();

        }

    );

}


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeProfileSocial() {

    setupSocialEvents();

    setupProfileUpdateListener();

    updatePostCharacterCount();

}


/* =========================================================
   EXPORTS
   ========================================================= */

export {

    initializeProfileSocial,

    loadUserPosts,

    renderPosts,

    renderComments,

    loadPostComments,

    createPost,

    createPostComment,

    toggleLike,

    setupSocialEvents

};