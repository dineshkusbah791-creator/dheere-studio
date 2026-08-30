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
   - Post editing
   - Post deletion
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

    getUserId,

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
   STATE
   ========================================================= */

const likeLoadingState =
    new Set();


const postEditingState =
    new Set();


const postDeletingState =
    new Set();



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

    } catch (
        error
    ) {

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
   CURRENT USER ID
   ========================================================= */

function getCurrentUserId() {

    return String(

        getUserId() ||

        ""

    ).trim();

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
   POST AUTHOR ID
   ========================================================= */

function getPostAuthorId(
    post
) {

    return String(

        post?.authorId ||

        post?.userId ||

        ""

    ).trim();

}



/* =========================================================
   POST OWNERSHIP
   ========================================================= */

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
   POST LIKES
   ========================================================= */

function getPostLikes(
    post
) {

    const value =
        Number(
            post?.likes ??
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

        post?.liked ===
        true

        ||

        post?.isLiked ===
        true

    );

}



/* =========================================================
   POST CHARACTER COUNT
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
   LIKE ANIMATION
   ========================================================= */

function triggerLikeAnimation(
    button
) {

    if (!button) {

        return;

    }


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

            <div
                class="post-comments-empty"
            >

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
                        comment?.username ||
                        "Dheere User";


                    const content =
                        comment?.content ||
                        "";


                    const date =
                        formatPostDate(
                            comment?.createdAt
                        );


                    return `

                        <div
                            class="post-comment"
                        >

                            <div
                                class="post-comment-header"
                            >

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


                            <div
                                class="post-comment-content"
                            >

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

        <div
            class="post-comments-loading"
        >

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


    } catch (
        error
    ) {

        console.error(

            "Load comments error:",

            error

        );


        commentsContainer.innerHTML = `

            <div
                class="post-comments-error"
            >

                Unable to load comments right now.

            </div>

        `;

    }

}



/* =========================================================
   CREATE POST COMMENT
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

                <div
                    class="post-comment-header"
                >

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


                <div
                    class="post-comment-content"
                >

                    ${escapeHTML(

                        comment.content ||

                        content

                    )}

                </div>

            `;


            commentsContainer.appendChild(
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


    } catch (
        error
    ) {

        console.error(

            "Create comment error:",

            error

        );


        alert(

            error?.message ||

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


    if (
        !postId ||
        !button
    ) {

        return;

    }


    if (
        likeLoadingState.has(
            postId
        )
    ) {

        return;

    }


    likeLoadingState.add(
        postId
    );


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


        triggerLikeAnimation(
            button
        );


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


    } finally {

        likeLoadingState.delete(
            postId
        );


        button.disabled =
            false;

    }

}



/* =========================================================
   POST OWNER MENU
   ========================================================= */

function renderPostOwnerActions(
    post
) {

    /*
     * IMPORTANT:
     * No menu is rendered for another user's post.
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
        >

            <button
                type="button"
                class="post-menu-button"
                data-profile-post-action="menu"
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
                    data-profile-post-action="edit"
                >

                    Edit

                </button>


                <button
                    type="button"
                    class="danger"
                    data-profile-post-action="delete"
                >

                    Delete

                </button>

            </div>

        </div>

    `;

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

        !Array.isArray(
            posts
        )

        ||

        posts.length ===
        0

    ) {

        postsFeed.innerHTML = `

            <div
                class="empty-state"
            >

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


                    const authorId =
                        getPostAuthorId(
                            post
                        );


                    const username =
                        post?.username ||

                        getUsername() ||

                        "user";


                    const content =
                        post?.content ||
                        "";


                    const date =
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

                                    <div
                                        class="post-author"
                                    >

                                        @${escapeHTML(
                                            username
                                        )}

                                    </div>

                                </div>


                                <div
                                    class="post-header-right"
                                >

                                    <span
                                        class="post-date"
                                    >

                                        ${escapeHTML(
                                            date
                                        )}

                                    </span>


                                    ${ownerActions}

                                </div>

                            </div>


                            <div
                                class="post-content"
                                data-profile-post-content
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
                                    data-profile-post-action="like"
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
                                    data-profile-post-action="comment"
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
                                hidden
                            >

                                <div
                                    class="post-comments-list"
                                >

                                    <div
                                        class="post-comments-empty"
                                    >

                                        No comments loaded yet.

                                    </div>

                                </div>


                                <div
                                    class="post-comment-form"
                                >

                                    <input
                                        type="text"
                                        class="post-comment-input"
                                        maxlength="${MAX_COMMENT_LENGTH}"
                                        placeholder="Write a comment..."
                                        autocomplete="off"
                                    >


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
   BEGIN POST EDIT
   ========================================================= */

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
            "[data-profile-post-content]"
        );


    if (!contentElement) {

        return false;

    }


    const originalContent =
        contentElement.textContent ||
        "";


    postElement.dataset.originalContent =
        originalContent;


    postElement.dataset.editing =
        "true";


    closePostMenus(
        postElement
    );


    contentElement.innerHTML = `

        <div
            class="post-edit-editor"
        >

            <textarea
                class="post-edit-input"
                maxlength="${MAX_POST_LENGTH}"
                aria-label="Edit post"
            ></textarea>


            <div
                class="post-edit-character-row"
            >

                <span
                    class="post-edit-character-count"
                >

                    0 / ${MAX_POST_LENGTH}

                </span>

            </div>


            <div
                class="post-edit-actions"
            >

                <button
                    type="button"
                    data-profile-post-action="cancel-edit"
                >

                    Cancel

                </button>


                <button
                    type="button"
                    data-profile-post-action="save-edit"
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


    if (
        input
    ) {

        input.value =
            originalContent;


        updateProfileEditCounter(
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



/* =========================================================
   PROFILE EDIT COUNTER
   ========================================================= */

function updateProfileEditCounter(
    input,
    counter
) {

    if (
        !input ||
        !counter
    ) {

        return;

    }


    counter.textContent =
        `${input.value.length} / ${MAX_POST_LENGTH}`;

}



/* =========================================================
   CANCEL POST EDIT
   ========================================================= */

function cancelPostEdit(
    postElement
) {

    if (!postElement) {

        return;

    }


    const contentElement =
        postElement.querySelector(
            "[data-profile-post-content]"
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



/* =========================================================
   UPDATE POST
   ========================================================= */

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


    if (
        postEditingState.has(
            cleanPostId
        )
    ) {

        return null;

    }


    postEditingState.add(
        cleanPostId
    );


    try {

        const response =
            await fetch(

                `${API_BASE}/posts/${encodeURIComponent(
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


            return null;

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


        return (
            result?.post ||
            null
        );


    } finally {

        postEditingState.delete(
            cleanPostId
        );

    }

}



/* =========================================================
   SAVE POST EDIT
   ========================================================= */

async function savePostEdit(
    postElement
) {

    if (!postElement) {

        return;

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

        return;

    }


    const contentElement =
        postElement.querySelector(
            "[data-profile-post-content]"
        );


    const input =
        contentElement?.querySelector(
            ".post-edit-input"
        );


    if (!contentElement || !input) {

        return;

    }


    const saveButton =
        postElement.querySelector(
            '[data-profile-post-action="save-edit"]'
        );


    const cancelButton =
        postElement.querySelector(
            '[data-profile-post-action="cancel-edit"]'
        );


    const content =
        input.value.trim();


    if (!content) {

        alert(
            "Post cannot be empty."
        );


        input.focus();


        return;

    }


    if (
        content.length >
        MAX_POST_LENGTH
    ) {

        alert(

            `Post cannot exceed ${MAX_POST_LENGTH} characters.`

        );


        input.focus();


        return;

    }


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

        const updatedPost =
            await updatePost(

                postId,

                content

            );


        if (!updatedPost) {

            return;

        }


        const updatedContent =
            updatedPost?.content ||
            content;


        contentElement.innerHTML =
            escapeHTML(
                updatedContent
            );


        postElement.dataset.editing =
            "false";


        delete postElement.dataset.originalContent;


        /*
         * Rebuild the header date label so the edited
         * state is visible without disturbing owner menu.
         */

        const headerRight =
            postElement.querySelector(
                ".post-header-right"
            );


        if (
            headerRight
        ) {

            const oldEdited =
                headerRight.querySelector(
                    ".post-edited-label"
                );


            if (
                !oldEdited
            ) {

                const editedLabel =
                    document.createElement(
                        "span"
                    );


                editedLabel.className =
                    "post-edited-label";


                editedLabel.textContent =
                    "edited";


                headerRight.insertBefore(

                    editedLabel,

                    headerRight.querySelector(
                        ".post-owner-actions"
                    )

                );

            }

        }


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



/* =========================================================
   CLOSE POST MENUS
   ========================================================= */

function closePostMenus(
    root = postsFeed
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



/* =========================================================
   TOGGLE POST MENU
   ========================================================= */

function togglePostMenu(
    postElement,
    button
) {

    if (
        !postElement ||
        !button
    ) {

        return;

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

        return;

    }


    const menu =
        postElement.querySelector(
            "[data-post-menu]"
        );


    if (!menu) {

        return;

    }


    const shouldOpen =
        menu.hidden;


    closePostMenus(
        postsFeed
    );


    menu.hidden =
        !shouldOpen;


    button.setAttribute(

        "aria-expanded",

        shouldOpen
            ? "true"
            : "false"

    );

}



/* =========================================================
   DELETE POST
   ========================================================= */

async function deletePost(
    postElement
) {

    if (!postElement) {

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


    if (
        !hasValidLoginSession()
    ) {

        alert(
            "Please login first."
        );


        return false;

    }


    if (
        postDeletingState.has(
            postId
        )
    ) {

        return false;

    }


    const confirmed =
        window.confirm(
            "Delete this post?"
        );


    if (!confirmed) {

        return false;

    }


    postDeletingState.add(
        postId
    );


    const deleteButton =
        postElement.querySelector(
            '[data-profile-post-action="delete"]'
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

                `${API_BASE}/posts/${encodeURIComponent(
                    postId
                )}`,

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


            return false;

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


                if (
                    profilePostCount
                ) {

                    const currentCount =
                        Number(
                            profilePostCount.textContent
                        );


                    if (
                        Number.isFinite(
                            currentCount
                        )
                    ) {

                        profilePostCount.textContent =
                            String(
                                Math.max(
                                    0,
                                    currentCount - 1
                                )
                            );

                    }

                }


                if (
                    postsFeed &&

                    !postsFeed.querySelector(
                        ".post-card"
                    )

                ) {

                    postsFeed.innerHTML = `

                        <div
                            class="empty-state"
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
            postId
        );

    }

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

            getUserId() ||

            ""

        ).trim();


    if (!username) {

        postsFeed.innerHTML = `

            <div
                class="empty-state error-state"
            >

                Username is missing from your profile.

            </div>

        `;


        return;

    }


    postsFeed.innerHTML = `

        <div
            class="empty-state"
        >

            Loading your posts...

        </div>

    `;


    try {

        const query =
            userId

                ? `?userId=${encodeURIComponent(
                    userId
                )}`

                : "";


        const response =
            await fetch(

                `${API_BASE}/posts/user/${encodeURIComponent(
                    username
                )}${query}`,

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


    } catch (
        error
    ) {

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

            <div
                class="empty-state error-state"
            >

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


        await loadUserPosts();


        return true;


    } catch (
        error
    ) {

        console.error(

            "Create post error:",

            error

        );


        alert(

            error?.message ||

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
   POST CLICK HANDLER
   ========================================================= */

async function handlePostClick(
    event
) {

    if (!postsFeed) {

        return;

    }


    // ========================================================
    // POST MENU
    // ========================================================

    const menuButton =
        event.target.closest(
            '[data-profile-post-action="menu"]'
        );


    if (
        menuButton
    ) {

        event.preventDefault();

        event.stopPropagation();


        const postElement =
            menuButton.closest(
                ".post-card"
            );


        if (!postElement) {

            return;

        }


        togglePostMenu(

            postElement,

            menuButton

        );


        return;

    }


    // ========================================================
    // EDIT
    // ========================================================

    const editButton =
        event.target.closest(
            '[data-profile-post-action="edit"]'
        );


    if (
        editButton
    ) {

        event.preventDefault();

        event.stopPropagation();


        const postElement =
            editButton.closest(
                ".post-card"
            );


        if (postElement) {

            beginPostEdit(
                postElement
            );

        }


        return;

    }


    // ========================================================
    // DELETE
    // ========================================================

    const deleteButton =
        event.target.closest(
            '[data-profile-post-action="delete"]'
        );


    if (
        deleteButton
    ) {

        event.preventDefault();

        event.stopPropagation();


        const postElement =
            deleteButton.closest(
                ".post-card"
            );


        if (postElement) {

            closePostMenus(
                postElement
            );


            await deletePost(
                postElement
            );

        }


        return;

    }


    // ========================================================
    // CANCEL EDIT
    // ========================================================

    const cancelEditButton =
        event.target.closest(
            '[data-profile-post-action="cancel-edit"]'
        );


    if (
        cancelEditButton
    ) {

        event.preventDefault();


        const postElement =
            cancelEditButton.closest(
                ".post-card"
            );


        if (postElement) {

            cancelPostEdit(
                postElement
            );

        }


        return;

    }


    // ========================================================
    // SAVE EDIT
    // ========================================================

    const saveEditButton =
        event.target.closest(
            '[data-profile-post-action="save-edit"]'
        );


    if (
        saveEditButton
    ) {

        event.preventDefault();


        const postElement =
            saveEditButton.closest(
                ".post-card"
            );


        if (postElement) {

            await savePostEdit(
                postElement
            );

        }


        return;

    }


    // ========================================================
    // LIKE
    // ========================================================

    const likeButton =
        event.target.closest(
            '[data-profile-post-action="like"]'
        );


    if (
        likeButton
    ) {

        event.preventDefault();


        const postElement =
            likeButton.closest(
                ".post-card"
            );


        const postId =
            postElement?.dataset.postId ||
            "";


        const countElement =
            likeButton.querySelector(
                ".post-like-count"
            );


        await toggleLike(

            postId,

            likeButton,

            countElement

        );


        return;

    }


    // ========================================================
    // COMMENT TOGGLE
    // ========================================================

    const commentButton =
        event.target.closest(
            '[data-profile-post-action="comment"]'
        );


    if (
        commentButton
    ) {

        event.preventDefault();


        const postElement =
            commentButton.closest(
                ".post-card"
            );


        if (!postElement) {

            return;

        }


        const postId =
            postElement.dataset.postId ||
            "";


        const commentsBox =
            postElement.querySelector(
                ".post-comments-panel"
            );


        const commentsList =
            postElement.querySelector(
                ".post-comments-list"
            );


        const commentCount =
            postElement.querySelector(
                ".post-comment-count"
            );


        if (!commentsBox) {

            return;

        }


        const opening =
            commentsBox.hidden;


        commentsBox.hidden =
            !opening;


        commentButton.setAttribute(

            "aria-expanded",

            opening
                ? "true"
                : "false"

        );


        if (
            opening &&

            postId &&

            commentsList

        ) {

            await loadPostComments(

                postId,

                commentsList,

                commentCount

            );

        }


        return;

    }


    // ========================================================
    // COMMENT SUBMIT
    // ========================================================

    const submitButton =
        event.target.closest(
            ".post-submit-comment"
        );


    if (
        submitButton
    ) {

        event.preventDefault();


        const postElement =
            submitButton.closest(
                ".post-card"
            );


        if (!postElement) {

            return;

        }


        const postId =
            postElement.dataset.postId ||
            "";


        const input =
            postElement.querySelector(
                ".post-comment-input"
            );


        const commentsContainer =
            postElement.querySelector(
                ".post-comments-list"
            );


        const commentCountElement =
            postElement.querySelector(
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

                commentCountElement

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

    // ========================================================
    // COMMENT ENTER
    // ========================================================

    if (
        event.key ===
        "Enter"

        &&

        !event.shiftKey

        &&

        event.target.closest(
            ".post-comment-input"
        )

    ) {

        event.preventDefault();


        const postElement =
            event.target.closest(
                ".post-card"
            );


        const submitButton =
            postElement?.querySelector(
                ".post-submit-comment"
            );


        if (
            submitButton
        ) {

            submitButton.click();

        }


        return;

    }


    // ========================================================
    // EDIT CMD/CTRL + ENTER
    // ========================================================

    if (
        event.key ===
        "Enter"

        &&

        (
            event.metaKey ||
            event.ctrlKey
        )

        &&

        event.target.closest(
            ".post-edit-input"
        )

    ) {

        event.preventDefault();


        const postElement =
            event.target.closest(
                ".post-card"
            );


        if (
            postElement
        ) {

            savePostEdit(
                postElement
            );

        }


        return;

    }


    // ========================================================
    // EDIT ESCAPE
    // ========================================================

    if (
        event.key ===
        "Escape"

        &&

        event.target.closest(
            ".post-edit-input"
        )

    ) {

        event.preventDefault();


        const postElement =
            event.target.closest(
                ".post-card"
            );


        if (
            postElement
        ) {

            cancelPostEdit(
                postElement
            );

        }

    }

}



/* =========================================================
   POST EDIT INPUT HANDLER
   ========================================================= */

function handlePostInput(
    event
) {

    const editInput =
        event.target.closest(
            ".post-edit-input"
        );


    if (!editInput) {

        return;

    }


    const postElement =
        editInput.closest(
            ".post-card"
        );


    const counter =
        postElement?.querySelector(
            ".post-edit-character-count"
        );


    updateProfileEditCounter(

        editInput,

        counter

    );

}



/* =========================================================
   SETUP SOCIAL EVENTS
   ========================================================= */

function setupSocialEvents() {

    if (
        postsFeed
    ) {

        postsFeed.addEventListener(

            "click",

            handlePostClick

        );


        postsFeed.addEventListener(

            "keydown",

            handlePostKeydown

        );


        postsFeed.addEventListener(

            "input",

            handlePostInput

        );

    }


    if (
        postContent
    ) {

        postContent.addEventListener(

            "input",

            updatePostCharacterCount

        );

    }


    if (
        createPostBtn
    ) {

        createPostBtn.addEventListener(

            "click",

            async event => {

                event.preventDefault();


                await createPost();

            }

        );

    }


    /*
     * Close owner menus when clicking anywhere
     * outside the current menu.
     */

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


            closePostMenus();

        }

    );

}



/* =========================================================
   PROFILE UPDATE REACTION
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

    isOwnPost,

    beginPostEdit,

    cancelPostEdit,

    updatePost,

    savePostEdit,

    deletePost,

    renderPostOwnerActions,

    setupSocialEvents

};