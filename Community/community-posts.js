// ============================================================
// COMMUNITY POSTS
// Post loading, rendering, publishing, likes,
// post editing and post deletion
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
// STATE
// ============================================================

const likeLoadingState =
    new Set();


const postLoadingState =
    new Set();


const postDeletingState =
    new Set();


const postEditingState =
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
// POST AUTHOR ID
// ============================================================

function getPostAuthorId(
    post
) {

    return String(

        post?.authorId ||

        post?.userId ||

        ""

    ).trim();

}



// ============================================================
// CURRENT USER ID
// ============================================================

function getCurrentUserId() {

    return String(

        getUserId() ||

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
            post?.likes ??
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
// COMMENT COUNT
// ============================================================

function getPostCommentsCount(
    post
) {

    const count =
        Number(

            post?.comments ??

            post?.commentCount ??

            0

        );


    return Number.isFinite(
        count
    )

        ? Math.max(
            0,
            count
        )

        : 0;

}



// ============================================================
// LIKED STATE
// ============================================================

function isPostLiked(
    post
) {

    return (

        post?.liked ===
        true

        ||

        post?.isLiked ===
        true

    );

}



// ============================================================
// OWN POST
// ============================================================

function isOwnPost(
    post
) {

    const currentUserId =
        getCurrentUserId();


    const authorId =
        getPostAuthorId(
            post
        );


    if (
        !currentUserId ||
        !authorId
    ) {

        return false;

    }


    return (
        currentUserId ===
        authorId
    );

}



// ============================================================
// PARSE JSON
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
// CHARACTER COUNT
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


    counter.textContent =
        `${textarea.value.length} / ${MAX_POST_LENGTH}`;

}



// ============================================================
// LIKE ANIMATION
// ============================================================

function triggerLikeAnimation(
    button
) {

    if (!button) {

        return;

    }


    /*
     * IMPORTANT:
     *
     * `.liked`
     * = persistent visual state
     *
     * `.like-just-toggled`
     * = temporary animation state
     *
     * This function is ONLY called after an actual
     * successful user click.
     */

    button.classList.remove(
        "like-just-toggled"
    );


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
// OWNER ACTIONS
// ============================================================

function renderPostOwnerActions(
    post
) {

    /*
     * Never render this menu for another user's post.
     */

    if (
        !isOwnPost(
            post
        )
    ) {

        return "";

    }


    return `

        <div
            class="post-owner-actions"
            data-post-owner-actions
        >

            <button
                type="button"
                class="post-menu-button"
                data-post-action="menu"
                aria-label="Post options"
                aria-haspopup="true"
                aria-expanded="false"
            >

                <span
                    aria-hidden="true"
                >

                    ⋯

                </span>

            </button>


            <div
                class="post-menu"
                data-post-menu
                hidden
            >

                <button
                    type="button"
                    data-post-action="edit"
                >

                    Edit

                </button>


                <button
                    type="button"
                    class="danger"
                    data-post-action="delete"
                >

                    Delete

                </button>

            </div>

        </div>

    `;

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


    const authorId =
        getPostAuthorId(
            post
        );


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


    /*
     * IMPORTANT:
     *
     * This is backend-derived persistent state.
     * No animation is triggered here.
     */

    const liked =
        isPostLiked(
            post
        );


    const ownerActions =
        renderPostOwnerActions(
            post
        );


    return `

        <article
            class="post-card"
            data-post-id="${escapeHTML(
                postId
            )}"
            data-post-owner-id="${escapeHTML(
                authorId
            )}"
        >

            <div
                class="post-header"
            >

                <div
                    class="post-author-wrapper"
                >

                    <a
                        class="post-author"
                        href="../profile/profile.html"
                    >

                        @${escapeHTML(
                            username
                        )}

                    </a>

                </div>


                <div
                    class="post-header-right"
                >

                    <span
                        class="post-date"
                    >

                        ${escapeHTML(
                            createdAt
                        )}

                    </span>


                    ${ownerActions}

                </div>

            </div>


            <div
                class="post-content"
                data-post-content
            >

                ${escapeHTML(
                    content
                )}

            </div>


            <div
                class="post-footer"
            >

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


                <button
                    type="button"
                    class="post-action-button post-comment-button"
                    data-post-id="${escapeHTML(
                        postId
                    )}"
                    aria-expanded="false"
                >

                    <span
                        class="post-action-icon"
                        aria-hidden="true"
                    >

                        💬

                    </span>


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
        )

        ||

        posts.length ===
        0

    ) {

        postsFeed.innerHTML = `

            <div
                class="empty-feed"
            >

                No posts yet.

                <br>

                Be the first person
                to share something.

            </div>

        `;


        return;

    }


    /*
     * IMPORTANT:
     *
     * This render path intentionally does not trigger
     * like animation.
     *
     * Therefore a refresh keeps:
     *
     * ♥ Liked
     *
     * without replaying animation.
     */

    postsFeed.innerHTML =

        posts

            .map(
                renderPost
            )

            .join("");


    initializeComments(
        postsFeed
    );


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

        <div
            class="empty-feed"
        >

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


        /*
         * IMPORTANT BUG FIX:
         *
         * The GET request now sends the auth headers.
         *
         * This allows the backend to determine the
         * authenticated user and correctly return:
         *
         * liked: true / false
         *
         * for every post.
         */

        const response =
            await fetch(

                `${API_BASE_URL}/posts${query}`,

                {

                    method:
                        "GET",

                    headers:
                        getAuthHeaders(),

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
            !response.ok
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

            <div
                class="empty-feed"
            >

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


        /*
         * Persistent visual state.
         */

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


        const label =
            button.querySelector(
                ".post-action-text"
            );


        if (icon) {

            icon.textContent =
                liked
                    ? "♥"
                    : "♡";

        }


        if (label) {

            label.textContent =
                liked
                    ? "Liked"
                    : "Like";

        }


        /*
         * Animation ONLY because the user just clicked.
         *
         * It is NOT called from renderPost() or loadPosts().
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
// TOGGLE POST MENU
// ============================================================

function togglePostMenu(
    postCard,
    button
) {

    if (
        !postCard ||
        !button
    ) {

        return;

    }


    const ownerId =
        String(

            postCard.dataset.postOwnerId ||

            ""

        ).trim();


    const currentUserId =
        getCurrentUserId();


    /*
     * Second ownership check.
     *
     * Even if a malicious DOM change adds a menu,
     * another user's menu still cannot be opened.
     */

    if (
        !ownerId ||
        ownerId !==
        currentUserId
    ) {

        return;

    }


    const menu =
        postCard.querySelector(
            "[data-post-menu]"
        );


    if (!menu) {

        return;

    }


    const willOpen =
        menu.hidden;


    const feed =
        postCard.closest(
            ".posts-feed"
        );


    if (feed) {

        feed
            .querySelectorAll(
                "[data-post-menu]"
            )
            .forEach(
                otherMenu => {

                    otherMenu.hidden =
                        true;

                }
            );


        feed
            .querySelectorAll(
                ".post-menu-button"
            )
            .forEach(
                otherButton => {

                    otherButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }
            );

    }


    menu.hidden =
        !willOpen;


    button.setAttribute(

        "aria-expanded",

        willOpen
            ? "true"
            : "false"

    );

}



// ============================================================
// CLOSE ALL POST MENUS
// ============================================================

function closeAllPostMenus(
    root
) {

    if (!root) {

        return;

    }


    root
        .querySelectorAll(
            "[data-post-menu]"
        )
        .forEach(

            menu => {

                menu.hidden =
                    true;

            }

        );


    root
        .querySelectorAll(
            ".post-menu-button"
        )
        .forEach(

            button => {

                button.setAttribute(

                    "aria-expanded",

                    "false"

                );

            }

        );

}



// ============================================================
// BEGIN POST EDIT
// ============================================================

function beginPostEdit(
    postElement
) {

    if (!postElement) {

        return false;

    }


    if (
        postElement.dataset.editing ===
        "true"
    ) {

        return false;

    }


    const postId =
        String(

            postElement.dataset.postId ||

            ""

        ).trim();


    const ownerId =
        String(

            postElement.dataset.postOwnerId ||

            ""

        ).trim();


    const currentUserId =
        getCurrentUserId();


    if (
        !postId ||
        !ownerId ||
        ownerId !==
        currentUserId
    ) {

        return false;

    }


    const contentElement =
        postElement.querySelector(
            "[data-post-content]"
        );


    if (!contentElement) {

        return false;

    }


    const currentContent =
        contentElement.textContent ||
        "";


    postElement.dataset.originalContent =
        currentContent;


    postElement.dataset.editing =
        "true";


    closeAllPostMenus(
        postElement
    );


    /*
     * Small inline editor.
     *
     * It replaces only the post content.
     */

    contentElement.innerHTML = `

        <textarea
            class="post-edit-input"
            maxlength="${MAX_POST_LENGTH}"
            aria-label="Edit post"
        ></textarea>


        <div
            class="post-edit-inline-footer"
        >

            <span
                class="post-edit-character-count"
            >

                0 / ${MAX_POST_LENGTH}

            </span>


            <div
                class="post-edit-actions"
            >

                <button
                    type="button"
                    data-post-action="cancel-edit"
                >

                    Cancel

                </button>


                <button
                    type="button"
                    data-post-action="save-edit"
                >

                    Save

                </button>

            </div>

        </div>

    `;


    const input =
        contentElement.querySelector(
            ".post-edit-input"
        );


    const counter =
        contentElement.querySelector(
            ".post-edit-character-count"
        );


    if (input) {

        input.value =
            currentContent;


        updatePostCharacterCount(

            input,

            counter

        );


        input.focus();


        input.setSelectionRange(

            input.value.length,

            input.value.length

        );

    }


    return true;

}



// ============================================================
// CANCEL POST EDIT
// ============================================================

function cancelPostEdit(
    postElement
) {

    if (!postElement) {

        return;

    }


    const contentElement =
        postElement.querySelector(
            "[data-post-content]"
        );


    if (!contentElement) {

        return;

    }


    const originalContent =
        postElement.dataset.originalContent ||
        "";


    contentElement.innerHTML =
        escapeHTML(
            originalContent
        );


    postElement.dataset.editing =
        "false";


    delete postElement.dataset.originalContent;

}



// ============================================================
// UPDATE POST
// ============================================================

async function updatePost(
    postId,
    content
) {

    const cleanPostId =
        String(
            postId ||
            ""
        ).trim();


    const cleanContent =
        typeof content ===
        "string"

            ? content.trim()

            : "";


    if (!cleanPostId) {

        throw new Error(
            "Invalid post ID."
        );

    }


    if (
        !hasValidLoginSession()
    ) {

        throw new Error(
            "Please login first."
        );

    }


    if (!cleanContent) {

        throw new Error(
            "Post cannot be empty."
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


    const currentUserId =
        getCurrentUserId();


    if (!currentUserId) {

        throw new Error(
            "Authentication required."
        );

    }


    if (
        postEditingState.has(
            cleanPostId
        )
    ) {

        throw new Error(
            "Post is already being edited."
        );

    }


    postEditingState.add(
        cleanPostId
    );


    try {

        const response =
            await fetch(

                `${API_BASE_URL}/posts/${encodeURIComponent(
                    cleanPostId
                )}`,

                {

                    method:
                        "PATCH",

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
            response.status ===
            403
        ) {

            throw new Error(

                result?.error ||

                "You can only edit your own posts."

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

                "Could not update post."

            );

        }


        return {

            post:
                result?.post ||
                null,

            updatedAt:
                result?.updatedAt ||
                null

        };


    } finally {

        postEditingState.delete(
            cleanPostId
        );

    }

}



// ============================================================
// SAVE POST EDIT
// ============================================================

async function savePostEdit(
    postElement
) {

    if (!postElement) {

        return null;

    }


    const postId =
        String(

            postElement.dataset.postId ||

            ""

        ).trim();


    const ownerId =
        String(

            postElement.dataset.postOwnerId ||

            ""

        ).trim();


    const currentUserId =
        getCurrentUserId();


    if (
        !postId ||
        !ownerId ||
        ownerId !==
        currentUserId
    ) {

        return null;

    }


    const contentElement =
        postElement.querySelector(
            "[data-post-content]"
        );


    const input =
        contentElement?.querySelector(
            ".post-edit-input"
        );


    if (
        !contentElement ||
        !input
    ) {

        return null;

    }


    const content =
        input.value.trim();


    if (!content) {

        alert(
            "Post cannot be empty."
        );


        input.focus();


        return null;

    }


    if (
        content.length >
        MAX_POST_LENGTH
    ) {

        alert(

            `Post cannot exceed ${MAX_POST_LENGTH} characters.`

        );


        input.focus();


        return null;

    }


    const saveButton =
        postElement.querySelector(
            '[data-post-action="save-edit"]'
        );


    const cancelButton =
        postElement.querySelector(
            '[data-post-action="cancel-edit"]'
        );


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "Saving...";

    }


    if (cancelButton) {

        cancelButton.disabled =
            true;

    }


    try {

        const result =
            await updatePost(

                postId,

                content

            );


        const updatedContent =
            result?.post?.content ||

            content;


        contentElement.innerHTML =
            escapeHTML(
                updatedContent
            );


        postElement.dataset.editing =
            "false";


        delete postElement.dataset.originalContent;


        /*
         * Subtle edited indicator.
         */

        const headerRight =
            postElement.querySelector(
                ".post-header-right"
            );


        if (
            headerRight &&

            !headerRight.querySelector(
                ".post-edited-label"
            )

        ) {

            const editedLabel =
                document.createElement(
                    "span"
                );


            editedLabel.className =
                "post-edited-label";


            editedLabel.textContent =
                "edited";


            const ownerActions =
                headerRight.querySelector(
                    ".post-owner-actions"
                );


            if (
                ownerActions
            ) {

                headerRight.insertBefore(

                    editedLabel,

                    ownerActions

                );

            } else {

                headerRight.appendChild(
                    editedLabel
                );

            }

        }


        return result;


    } catch (
        error
    ) {

        console.error(

            "Save post edit error:",

            error

        );


        alert(

            error?.message ||

            "Unable to update post."

        );


        return null;


    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Save";

        }


        if (cancelButton) {

            cancelButton.disabled =
                false;

        }

    }

}



// ============================================================
// DELETE POST
// ============================================================

async function deletePost(
    postId,
    postElement
) {

    const cleanPostId =
        String(
            postId ||
            ""
        ).trim();


    if (
        !cleanPostId ||
        !postElement
    ) {

        return false;

    }


    if (
        !hasValidLoginSession()
    ) {

        alert(
            "Please login first."
        );


        return false;

    }


    const ownerId =
        String(

            postElement.dataset.postOwnerId ||

            ""

        ).trim();


    const currentUserId =
        getCurrentUserId();


    if (
        !ownerId ||
        ownerId !==
        currentUserId
    ) {

        return false;

    }


    if (
        postDeletingState.has(
            cleanPostId
        )
    ) {

        return false;

    }


    /*
     * Explicit permanent-delete confirmation.
     */

    const confirmed =
        window.confirm(

            "Delete this post?\n\n" +

            "This will permanently delete your post."

        );


    if (!confirmed) {

        return false;

    }


    postDeletingState.add(
        cleanPostId
    );


    const deleteButton =
        postElement.querySelector(
            '[data-post-action="delete"]'
        );


    if (deleteButton) {

        deleteButton.disabled =
            true;

        deleteButton.textContent =
            "Deleting...";

    }


    try {

        const response =
            await fetch(

                `${API_BASE_URL}/posts/${encodeURIComponent(
                    cleanPostId
                )}`,

                {

                    method:
                        "DELETE",

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
            403
        ) {

            throw new Error(

                result?.error ||

                "You can only delete your own posts."

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

                "Could not delete post."

            );

        }


        postElement.classList.add(
            "post-deleting"
        );


        window.setTimeout(

            () => {

                if (
                    postElement.isConnected
                ) {

                    postElement.remove();

                }


                const feed =
                    document.querySelector(
                        ".posts-feed"
                    );


                if (
                    feed &&

                    !feed.querySelector(
                        ".post-card"
                    )

                ) {

                    feed.innerHTML = `

                        <div
                            class="empty-feed"
                        >

                            No posts yet.

                        </div>

                    `;

                }

            },

            280

        );


        return true;


    } catch (
        error
    ) {

        console.error(

            "Delete post error:",

            error

        );


        postElement.classList.remove(
            "post-deleting"
        );


        alert(

            error?.message ||

            "Unable to delete post."

        );


        return false;


    } finally {

        postDeletingState.delete(
            cleanPostId
        );

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


    const currentlyOpen =
        panel.classList.contains(
            "open"
        );


    if (
        currentlyOpen
    ) {

        panel.classList.remove(
            "open"
        );


        if (
            commentButton
        ) {

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


    if (
        commentButton
    ) {

        commentButton.setAttribute(
            "aria-expanded",
            "true"
        );

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
            // MENU
            // ================================================

            const menuButton =
                event.target.closest(
                    '[data-post-action="menu"]'
                );


            if (
                menuButton
            ) {

                event.preventDefault();

                event.stopPropagation();


                const postCard =
                    menuButton.closest(
                        ".post-card"
                    );


                if (!postCard) {

                    return;

                }


                togglePostMenu(

                    postCard,

                    menuButton

                );


                return;

            }


            // ================================================
            // EDIT
            // ================================================

            const editButton =
                event.target.closest(
                    '[data-post-action="edit"]'
                );


            if (
                editButton
            ) {

                event.preventDefault();

                event.stopPropagation();


                const postCard =
                    editButton.closest(
                        ".post-card"
                    );


                if (!postCard) {

                    return;

                }


                const ownerId =
                    String(

                        postCard.dataset.postOwnerId ||

                        ""

                    ).trim();


                const currentUserId =
                    getCurrentUserId();


                if (
                    !ownerId ||
                    ownerId !==
                    currentUserId
                ) {

                    return;

                }


                beginPostEdit(
                    postCard
                );


                return;

            }


            // ================================================
            // CANCEL EDIT
            // ================================================

            const cancelEditButton =
                event.target.closest(
                    '[data-post-action="cancel-edit"]'
                );


            if (
                cancelEditButton
            ) {

                event.preventDefault();

                event.stopPropagation();


                const postCard =
                    cancelEditButton.closest(
                        ".post-card"
                    );


                if (postCard) {

                    cancelPostEdit(
                        postCard
                    );

                }


                return;

            }


            // ================================================
            // SAVE EDIT
            // ================================================

            const saveEditButton =
                event.target.closest(
                    '[data-post-action="save-edit"]'
                );


            if (
                saveEditButton
            ) {

                event.preventDefault();

                event.stopPropagation();


                const postCard =
                    saveEditButton.closest(
                        ".post-card"
                    );


                if (postCard) {

                    await savePostEdit(
                        postCard
                    );

                }


                return;

            }


            // ================================================
            // DELETE
            // ================================================

            const deleteButton =
                event.target.closest(
                    '[data-post-action="delete"]'
                );


            if (
                deleteButton
            ) {

                event.preventDefault();

                event.stopPropagation();


                const postCard =
                    deleteButton.closest(
                        ".post-card"
                    );


                if (!postCard) {

                    return;

                }


                const ownerId =
                    String(

                        postCard.dataset.postOwnerId ||

                        ""

                    ).trim();


                const currentUserId =
                    getCurrentUserId();


                if (
                    !ownerId ||
                    ownerId !==
                    currentUserId
                ) {

                    return;

                }


                closeAllPostMenus(
                    postCard
                );


                await deletePost(

                    postCard.dataset.postId,

                    postCard

                );


                return;

            }


            // ================================================
            // LIKE
            // ================================================

            const likeButton =
                event.target.closest(
                    ".post-like-button"
                );


            if (
                likeButton
            ) {

                event.preventDefault();


                const postCard =
                    likeButton.closest(
                        ".post-card"
                    );


                const countElement =
                    postCard?.querySelector(
                        ".post-like-count"
                    );


                await toggleLike(

                    likeButton.dataset.postId,

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


            if (
                commentButton
            ) {

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
            // COMMENT SUBMIT
            // ================================================

            const submitButton =
                event.target.closest(
                    ".post-submit-comment"
                );


            if (
                submitButton
            ) {

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
    // CLOSE POST MENUS OUTSIDE
    // ========================================================

    if (
        !postsFeed.dataset.postMenuDocumentReady
    ) {

        postsFeed.dataset.postMenuDocumentReady =
            "true";


        document.addEventListener(

            "click",

            event => {

                if (
                    event.target.closest(
                        ".post-owner-actions"
                    )
                ) {

                    return;

                }


                closeAllPostMenus(
                    postsFeed
                );

            }

        );

    }


    // ========================================================
    // EDIT KEYBOARD EVENTS
    // ========================================================

    postsFeed.addEventListener(

        "keydown",

        event => {

            const input =
                event.target.closest(
                    ".post-edit-input"
                );


            if (!input) {

                return;

            }


            const postCard =
                input.closest(
                    ".post-card"
                );


            if (!postCard) {

                return;

            }


            if (
                event.key ===
                "Escape"
            ) {

                event.preventDefault();


                cancelPostEdit(
                    postCard
                );


                return;

            }


            if (

                event.key ===
                "Enter"

                &&

                (
                    event.metaKey ||
                    event.ctrlKey
                )

            ) {

                event.preventDefault();


                savePostEdit(
                    postCard
                );

            }

        }

    );


    // ========================================================
    // EDIT CHARACTER COUNT
    // ========================================================

    postsFeed.addEventListener(

        "input",

        event => {

            const input =
                event.target.closest(
                    ".post-edit-input"
                );


            if (!input) {

                return;

            }


            const postCard =
                input.closest(
                    ".post-card"
                );


            const counter =
                postCard?.querySelector(
                    ".post-edit-character-count"
                );


            updatePostCharacterCount(

                input,

                counter

            );

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


    return (
        result?.post ||

        null
    );

}



// ============================================================
// POST COMPOSER
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

                        "Could not publish post."

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

    bindPostActions(
        postsFeed
    );


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

    getPostAuthorId,

    getPostLikes,

    getPostCommentsCount,

    isPostLiked,

    isOwnPost,

    renderPostOwnerActions,

    renderPost,

    renderPosts,

    loadPosts,

    toggleLike,

    togglePostMenu,

    closeAllPostMenus,

    beginPostEdit,

    cancelPostEdit,

    updatePost,

    savePostEdit,

    deletePost,

    toggleCommentsPanel,

    publishPost,

    initializePostComposer,

    initializePosts

};