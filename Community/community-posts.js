// ============================================================
// COMMUNITY POSTS
// Post loading, rendering, publishing and likes
// ============================================================

"use strict";


// ============================================================
// IMPORTS
// ============================================================

import {

    getCurrentUser,

    getUserId,

    getAuthHeaders,

    hasValidLoginSession,

    clearAuthStorage

} from "./community-auth.js";


import {

    initializeComments,

    loadComments,

    submitCommentFromForm

} from "./community-comments.js";



// ============================================================
// CONFIG
// ============================================================

const API_BASE_URL =
    "https://dheere-studio.onrender.com";


const MAX_POST_LENGTH =
    2000;



// ============================================================
// INTERNAL STATE
// ============================================================

const likeLoadingState =
    new Set();


const postLoadingState =
    new Set();



// ============================================================
// HTML ESCAPE
// ============================================================

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



// ============================================================
// DATE FORMAT
// ============================================================

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


    return date.toLocaleString(
        "en-IN",
        {

            day:
                "numeric",

            month:
                "short",

            year:
                "numeric",

            hour:
                "numeric",

            minute:
                "2-digit"

        }
    );

}



// ============================================================
// POST ID
// ============================================================

function getPostId(
    post
) {

    return String(

        post?.id ||

        post?._id ||

        ""

    ).trim();

}



// ============================================================
// POST LIKES
// ============================================================

function getPostLikes(
    post
) {

    const likes =
        Number(
            post?.likes ||
            0
        );


    return Number.isFinite(
        likes
    )
        ? Math.max(
            0,
            likes
        )
        : 0;

}



// ============================================================
// POST COMMENTS COUNT
// ============================================================

function getPostCommentsCount(
    post
) {

    const comments =
        Number(
            post?.comments ||
            post?.commentCount ||
            0
        );


    return Number.isFinite(
        comments
    )
        ? Math.max(
            0,
            comments
        )
        : 0;

}



// ============================================================
// POST LIKED
// ============================================================

function isPostLiked(
    post
) {

    return (
        post?.liked === true ||
        post?.isLiked === true
    );

}



// ============================================================
// SAFE JSON RESPONSE
// ============================================================

async function parseJSON(
    response
) {

    try {

        return await response.json();

    } catch (
        error
    ) {

        return {};

    }

}



// ============================================================
// AUTH FAILURE
// ============================================================

function processAuthFailure(
    result
) {

    clearAuthStorage();


    const error =
        new Error(

            result?.error ||

            "Your login session has expired. Please login again."

        );


    error.code =
        "AUTH_REQUIRED";


    return error;

}



// ============================================================
// UPDATE CHARACTER COUNT
// ============================================================

function updatePostCharacterCount(
    textarea,
    counter
) {

    if (
        !textarea ||
        !counter
    ) {

        return;

    }


    const length =
        textarea.value.length;


    counter.textContent =
        `${length} / ${MAX_POST_LENGTH}`;

}



// ============================================================
// TRIGGER LIKE ANIMATION
// ============================================================

function triggerLikeAnimation(
    button
) {

    if (!button) {

        return;

    }


    button.classList.remove(
        "like-just-toggled"
    );


    /*
     * Force a reflow so the animation can restart
     * every time the user likes/unlikes.
     */

    void button.offsetWidth;


    button.classList.add(
        "like-just-toggled"
    );


    window.setTimeout(

        () => {

            button.classList.remove(
                "like-just-toggled"
            );

        },

        500

    );

}



// ============================================================
// RENDER SINGLE POST
// ============================================================

function renderPost(
    post
) {

    const postId =
        getPostId(
            post
        );


    if (!postId) {

        return "";

    }


    const username =
        post?.username ||
        "user";


    const content =
        post?.content ||
        "";


    const createdAt =
        formatPostDate(
            post?.createdAt
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

            <div
                class="post-header"
            >

                <a
                    class="post-author"
                    href="../profile/profile.html"
                >

                    @${escapeHTML(
                        username
                    )}

                </a>


                <span
                    class="post-date"
                >

                    ${escapeHTML(
                        createdAt
                    )}

                </span>

            </div>


            <div
                class="post-content"
            >

                ${escapeHTML(
                    content
                )}

            </div>


            <div
                class="post-footer"
            >

                <!-- =========================================
                     LIKE
                     ========================================= -->

                <button
                    type="button"
                    class="post-action-button post-like-button ${
                        liked
                            ? "liked"
                            : ""
                    }"
                    data-post-id="${escapeHTML(
                        postId
                    )}"
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

                    <span
                        class="post-action-icon"
                        aria-hidden="true"
                    >

                        ${
                            liked
                                ? "♥"
                                : "♡"
                        }

                    </span>


                    <span
                        class="post-action-text"
                    >

                        ${
                            liked
                                ? "Liked"
                                : "Like"
                        }

                    </span>


                    <span
                        class="post-action-count post-like-count"
                    >

                        ${likes}

                    </span>

                </button>


                <!-- =========================================
                     COMMENTS
                     ========================================= -->

                <button
                    type="button"
                    class="post-action-button post-comment-button"
                    data-post-id="${escapeHTML(
                        postId
                    )}"
                    aria-expanded="false"
                >

                    <span
                        class="post-action-text"
                    >
                        Comment
                    </span>


                    <span
                        class="post-action-count post-comment-count"
                    >

                        ${comments}

                    </span>

                </button>

            </div>


            <!-- =============================================
                 COMMENTS PANEL
                 ============================================= -->

            <div
                class="post-comments-panel"
            >

                <div
                    class="post-comments-list"
                ></div>


                <div
                    class="post-comment-form"
                >

                    <input
                        type="text"
                        class="post-comment-input"
                        maxlength="1000"
                        placeholder="Write a comment..."
                        autocomplete="off"
                        aria-label="Write a comment"
                    >


                    <button
                        type="button"
                        class="post-submit-comment"
                        data-post-id="${escapeHTML(
                            postId
                        )}"
                    >

                        Comment

                    </button>

                </div>

            </div>

        </article>

    `;

}



// ============================================================
// RENDER POSTS
// ============================================================

function renderPosts(
    posts,
    postsFeed
) {

    if (!postsFeed) {

        return;

    }


    if (
        !Array.isArray(
            posts
        ) ||
        posts.length === 0
    ) {

        postsFeed.innerHTML = `

            <div class="empty-feed">

                No posts yet.

                <br>

                Be the first person
                to share something.

            </div>

        `;


        return;

    }


    postsFeed.innerHTML =
        posts
            .map(
                renderPost
            )
            .join("");


    /*
     * The comments module owns comment-specific
     * actions such as edit/delete.
     */

    initializeComments(
        postsFeed
    );


    /*
     * The post module owns like, comment-panel,
     * and comment-submit interactions.
     */

    bindPostActions(
        postsFeed
    );

}



// ============================================================
// LOAD POSTS
// ============================================================

async function loadPosts(
    postsFeed
) {

    if (!postsFeed) {

        return [];

    }


    if (
        postLoadingState.has(
            "all"
        )
    ) {

        return [];

    }


    postLoadingState.add(
        "all"
    );


    postsFeed.innerHTML = `

        <div class="empty-feed">

            Loading community...

        </div>

    `;


    try {

        const user =
            getCurrentUser();


        const userId =
            getUserId(
                user
            );


        const query =
            userId

                ? `?userId=${encodeURIComponent(
                    userId
                )}`

                : "";


        const response =
            await fetch(

                `${API_BASE_URL}/posts${query}`,

                {

                    cache:
                        "no-store"

                }

            );


        const result =
            await parseJSON(
                response
            );


        if (
            response.status ===
            401
        ) {

            throw processAuthFailure(
                result
            );

        }


        if (

            !response.ok ||

            result?.success !==
            true

        ) {

            throw new Error(

                result?.error ||

                "Could not load posts."

            );

        }


        const posts =
            Array.isArray(
                result?.posts
            )

                ? result.posts

                : [];


        renderPosts(

            posts,

            postsFeed

        );


        return posts;


    } catch (
        error
    ) {

        console.error(
            "Community feed error:",
            error
        );


        postsFeed.innerHTML = `

            <div class="empty-feed">

                ${
                    error?.code ===
                    "AUTH_REQUIRED"

                        ? "Please login again."

                        : "Unable to load community right now."

                }

            </div>

        `;


        return [];


    } finally {

        postLoadingState.delete(
            "all"
        );

    }

}



// ============================================================
// TOGGLE LIKE
// ============================================================

async function toggleLike(
    postId,
    button,
    countElement
) {

    const cleanPostId =
        String(
            postId ||
            ""
        ).trim();


    if (
        !cleanPostId ||
        !button
    ) {

        return null;

    }


    if (
        !hasValidLoginSession()
    ) {

        alert(
            "Please login first."
        );


        return null;

    }


    if (
        likeLoadingState.has(
            cleanPostId
        )
    ) {

        return null;

    }


    likeLoadingState.add(
        cleanPostId
    );


    button.disabled =
        true;


    try {

        const response =
            await fetch(

                `${API_BASE_URL}/posts/${encodeURIComponent(
                    cleanPostId
                )}/like`,

                {

                    method:
                        "POST",

                    headers:
                        getAuthHeaders()

                }

            );


        const result =
            await parseJSON(
                response
            );


        if (
            response.status ===
            401
        ) {

            throw processAuthFailure(
                result
            );

        }


        if (
            response.status ===
            404
        ) {

            throw new Error(

                result?.error ||

                "Post not found."

            );

        }


        if (
            !response.ok
        ) {

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


        if (
            countElement
        ) {

            countElement.textContent =
                String(
                    likes
                );

        }


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


        /*
         * Trigger the small interaction animation
         * after the server confirms the action.
         */

        triggerLikeAnimation(
            button
        );


        return result;


    } catch (
        error
    ) {

        console.error(
            "Like error:",
            error
        );


        alert(

            error?.message ||

            "Unable to update like."

        );


        return null;


    } finally {

        likeLoadingState.delete(
            cleanPostId
        );


        button.disabled =
            false;

    }

}



// ============================================================
// TOGGLE COMMENTS PANEL
// ============================================================

async function toggleCommentsPanel(
    postCard
) {

    if (!postCard) {

        return;

    }


    const panel =
        postCard.querySelector(
            ".post-comments-panel"
        );


    const commentsContainer =
        postCard.querySelector(
            ".post-comments-list"
        );


    const countElement =
        postCard.querySelector(
            ".post-comment-count"
        );


    const commentButton =
        postCard.querySelector(
            ".post-comment-button"
        );


    const postId =
        postCard.dataset.postId ||
        "";


    if (
        !panel ||
        !commentsContainer ||
        !postId
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


        if (commentButton) {

            commentButton.setAttribute(
                "aria-expanded",
                "false"
            );

        }


        return;

    }


    panel.classList.add(
        "open"
    );


    if (commentButton) {

        commentButton.setAttribute(
            "aria-expanded",
            "true"
        );

    }


    await loadComments(

        postId,

        commentsContainer,

        countElement

    );


    const input =
        postCard.querySelector(
            ".post-comment-input"
        );


    if (input) {

        input.focus();

    }

}



// ============================================================
// BIND POST ACTIONS
// ============================================================

function bindPostActions(
    postsFeed
) {

    if (!postsFeed) {

        return;

    }


    /*
     * Avoid attaching the same delegated listener
     * multiple times.
     */

    if (
        postsFeed.dataset.postActionsReady ===
        "true"
    ) {

        return;

    }


    postsFeed.dataset.postActionsReady =
        "true";


    postsFeed.addEventListener(

        "click",

        async event => {

            // ================================================
            // LIKE
            // ================================================

            const likeButton =
                event.target.closest(
                    ".post-like-button"
                );


            if (likeButton) {

                event.preventDefault();


                const postCard =
                    likeButton.closest(
                        ".post-card"
                    );


                const postId =
                    likeButton.dataset.postId;


                const countElement =
                    postCard?.querySelector(
                        ".post-like-count"
                    );


                await toggleLike(

                    postId,

                    likeButton,

                    countElement

                );


                return;

            }


            // ================================================
            // COMMENT PANEL
            // ================================================

            const commentButton =
                event.target.closest(
                    ".post-comment-button"
                );


            if (commentButton) {

                event.preventDefault();


                const postCard =
                    commentButton.closest(
                        ".post-card"
                    );


                await toggleCommentsPanel(
                    postCard
                );


                return;

            }


            // ================================================
            // SUBMIT COMMENT
            // ================================================

            const submitButton =
                event.target.closest(
                    ".post-submit-comment"
                );


            if (submitButton) {

                event.preventDefault();


                const postCard =
                    submitButton.closest(
                        ".post-card"
                    );


                if (!postCard) {

                    return;

                }


                const input =
                    postCard.querySelector(
                        ".post-comment-input"
                    );


                if (!input) {

                    return;

                }


                await submitCommentFromForm({

                    postCard,

                    input,

                    submitButton

                });


                return;

            }

        }

    );


    // ========================================================
    // ENTER TO SUBMIT COMMENT
    // ========================================================

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



// ============================================================
// PUBLISH POST
// ============================================================

async function publishPost(
    content,
    options = {}
) {

    if (
        !hasValidLoginSession()
    ) {

        throw new Error(
            "Please login first."
        );

    }


    const cleanContent =
        typeof content ===
        "string"

            ? content.trim()

            : "";


    if (!cleanContent) {

        throw new Error(
            "Write something before publishing."
        );

    }


    if (
        cleanContent.length >
        MAX_POST_LENGTH
    ) {

        throw new Error(

            `Post cannot exceed ${MAX_POST_LENGTH} characters.`

        );

    }


    const response =
        await fetch(

            `${API_BASE_URL}/posts`,

            {

                method:
                    "POST",

                headers:
                    getAuthHeaders(),

                body:
                    JSON.stringify({

                        content:
                            cleanContent

                    })

            }

        );


    const result =
        await parseJSON(
            response
        );


    if (
        response.status ===
        401
    ) {

        throw processAuthFailure(
            result
        );

    }


    if (
        !response.ok
    ) {

        throw new Error(

            result?.error ||

            "Could not publish post."

        );

    }


    if (
        options.textarea
    ) {

        options.textarea.value =
            "";

    }


    if (
        options.counter
    ) {

        options.counter.textContent =
            `0 / ${MAX_POST_LENGTH}`;

    }


    if (
        typeof options.afterPublish ===
        "function"
    ) {

        await options.afterPublish(
            result?.post ||
            null
        );

    }


    return result?.post ||
        null;

}



// ============================================================
// BIND POST COMPOSER
// ============================================================

function initializePostComposer(
    {
        textarea,
        counter,
        publishButton,
        postsFeed
    } = {}
) {

    if (
        textarea
    ) {

        if (
            textarea.dataset.postComposerReady !==
            "true"
        ) {

            textarea.dataset.postComposerReady =
                "true";


            textarea.addEventListener(

                "input",

                () => {

                    updatePostCharacterCount(

                        textarea,

                        counter

                    );

                }

            );

        }


        updatePostCharacterCount(

            textarea,

            counter

        );

    }


    if (
        publishButton &&

        publishButton.dataset.postPublishReady !==
        "true"

    ) {

        publishButton.dataset.postPublishReady =
            "true";


        publishButton.addEventListener(

            "click",

            async () => {

                const content =
                    textarea
                        ? textarea.value.trim()
                        : "";


                if (!content) {

                    alert(
                        "Write something before publishing."
                    );


                    if (textarea) {

                        textarea.focus();

                    }


                    return;

                }


                publishButton.disabled =
                    true;


                publishButton.textContent =
                    "Publishing...";


                try {

                    await publishPost(

                        content,

                        {

                            textarea,

                            counter,

                            async afterPublish() {

                                if (
                                    postsFeed
                                ) {

                                    await loadPosts(
                                        postsFeed
                                    );

                                }

                            }

                        }

                    );


                } catch (
                    error
                ) {

                    console.error(
                        "Publish post error:",
                        error
                    );


                    alert(

                        error?.message ||

                        "Backend server se connect nahi ho paya."

                    );


                } finally {

                    publishButton.disabled =
                        false;


                    publishButton.textContent =
                        "Publish Post";

                }

            }

        );

    }

}



// ============================================================
// INITIALIZE POSTS
// ============================================================

function initializePosts(
    {
        postsFeed,

        textarea,

        counter,

        publishButton,

        refreshButton

    } = {}
) {

    /*
     * Post action events are initialized here.
     */

    bindPostActions(
        postsFeed
    );


    /*
     * Comment action events belong to
     * community-comments.js.
     */

    initializeComments(
        postsFeed
    );


    initializePostComposer({

        textarea,

        counter,

        publishButton,

        postsFeed

    });


    if (
        refreshButton &&

        refreshButton.dataset.refreshReady !==
        "true"

    ) {

        refreshButton.dataset.refreshReady =
            "true";


        refreshButton.addEventListener(

            "click",

            async () => {

                refreshButton.disabled =
                    true;


                const originalText =
                    refreshButton.textContent;


                refreshButton.textContent =
                    "Refreshing...";


                try {

                    await loadPosts(
                        postsFeed
                    );


                } finally {

                    refreshButton.disabled =
                        false;


                    refreshButton.textContent =
                        originalText ||
                        "Refresh";

                }

            }

        );

    }

}



// ============================================================
// PUBLIC API
// ============================================================

export {

    API_BASE_URL,

    MAX_POST_LENGTH,

    escapeHTML,

    formatPostDate,

    getPostId,

    getPostLikes,

    getPostCommentsCount,

    isPostLiked,

    renderPost,

    renderPosts,

    loadPosts,

    toggleLike,

    toggleCommentsPanel,

    publishPost,

    initializePostComposer,

    initializePosts

};