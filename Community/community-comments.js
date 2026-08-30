// ============================================================
// COMMUNITY COMMENTS
// Comment loading, creation, editing and deletion
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



// ============================================================
// CONFIG
// ============================================================

const API_BASE_URL =
    "https://dheere-studio.onrender.com";


const MAX_COMMENT_LENGTH =
    1000;



// ============================================================
// INTERNAL STATE
// ============================================================

const commentsLoadingState =
    new Set();


const commentsEditingState =
    new Set();


const commentsDeletingState =
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
// NORMALIZE COMMENT ID
// ============================================================

function getCommentId(
    comment
) {

    return String(

        comment?.id ||

        comment?._id ||

        ""

    ).trim();

}



// ============================================================
// NORMALIZE COMMENT USER ID
// ============================================================

function getCommentUserId(
    comment
) {

    return String(

        comment?.userId ||

        comment?.authorId ||

        ""

    ).trim();

}



// ============================================================
// CHECK COMMENT OWNERSHIP
// ============================================================

function isOwnComment(
    comment,
    currentUserId = getUserId()
) {

    const commentUserId =
        getCommentUserId(
            comment
        );


    if (
        !commentUserId ||
        !currentUserId
    ) {

        return false;

    }


    return (

        commentUserId ===

        String(
            currentUserId
        ).trim()

    );

}



// ============================================================
// COMMENTS COUNT
// ============================================================

function updateCommentCount(
    countElement,
    value
) {

    if (!countElement) {

        return;

    }


    const count =
        Number(
            value
        );


    countElement.textContent =

        String(

            Number.isFinite(
                count
            )

                ? Math.max(
                    0,
                    count
                )

                : 0

        );

}



// ============================================================
// API JSON
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
// AUTH ERROR
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
// RENDER COMMENT
// ============================================================

function renderComment(
    comment,
    currentUserId = getUserId()
) {

    const commentId =
        getCommentId(
            comment
        );


    if (!commentId) {

        return "";

    }


    const username =
        comment?.username ||

        "Dheere User";


    const content =
        comment?.content ||

        "";


    const createdAt =
        formatCommentDate(
            comment?.createdAt
        );


    const updatedAt =
        comment?.updatedAt
            ? formatCommentDate(
                comment.updatedAt
            )
            : "";


    const ownComment =
        isOwnComment(

            comment,

            currentUserId

        );


    return `

        <article
            class="post-comment"
            data-comment-id="${escapeHTML(
                commentId
            )}"
            data-comment-user-id="${escapeHTML(
                getCommentUserId(
                    comment
                )
            )}"
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
                    createdAt

                        ? `

                            <span
                                class="post-comment-time"
                            >

                                ${escapeHTML(
                                    createdAt
                                )}

                            </span>

                        `

                        : ""
                }


                ${
                    updatedAt

                        ? `

                            <span
                                class="post-comment-edited"
                            >

                                edited

                            </span>

                        `

                        : ""
                }


                ${
                    ownComment

                        ? `

                            <div
                                class="post-comment-owner-actions"
                            >

                                <button
                                    type="button"
                                    class="post-comment-menu-button"
                                    data-comment-action="menu"
                                    aria-label="Comment options"
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
                                    class="post-comment-menu"
                                    hidden
                                >

                                    <button
                                        type="button"
                                        data-comment-action="edit"
                                    >

                                        Edit

                                    </button>


                                    <button
                                        type="button"
                                        data-comment-action="delete"
                                        class="danger"
                                    >

                                        Delete

                                    </button>

                                </div>

                            </div>

                        `

                        : ""

                }

            </div>


            <div
                class="post-comment-body"
            >

                <div
                    class="post-comment-content"
                    data-comment-content
                >

                    ${escapeHTML(
                        content
                    )}

                </div>

            </div>

        </article>

    `;

}



// ============================================================
// RENDER COMMENT LIST
// ============================================================

function renderComments(
    container,
    comments,
    currentUserId = getUserId()
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

                comment =>

                    renderComment(

                        comment,

                        currentUserId

                    )

            )

            .join("");


    initializeCommentEvents(
        container
    );


    bindCommentInputs(
        container
    );

}



// ============================================================
// LOAD COMMENTS
// ============================================================

async function loadComments(
    postId,
    commentsContainer,
    countElement
) {

    const cleanPostId =
        String(
            postId ||
            ""
        ).trim();


    if (
        !cleanPostId ||
        !commentsContainer
    ) {

        return [];

    }


    if (
        commentsLoadingState.has(
            cleanPostId
        )
    ) {

        return [];

    }


    commentsLoadingState.add(
        cleanPostId
    );


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

                `${API_BASE_URL}/posts/${encodeURIComponent(
                    cleanPostId
                )}/comments`,

                {

                    method:
                        "GET",

                    headers: {

                        Accept:
                            "application/json"

                    },

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

            comments,

            getUserId()

        );


        updateCommentCount(

            countElement,

            comments.length

        );


        return comments;


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

                ${
                    error?.code ===
                    "AUTH_REQUIRED"

                        ? "Please login again."

                        : "Unable to load comments right now."

                }

            </div>

        `;


        return [];


    } finally {

        commentsLoadingState.delete(
            cleanPostId
        );

    }

}



// ============================================================
// CREATE COMMENT
// ============================================================

async function createComment(
    postId,
    content,
    options = {}
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
            "Comment cannot be empty."
        );

    }


    if (
        cleanContent.length >
        MAX_COMMENT_LENGTH
    ) {

        throw new Error(

            `Comment cannot exceed ${MAX_COMMENT_LENGTH} characters.`

        );

    }


    const response =
        await fetch(

            `${API_BASE_URL}/posts/${encodeURIComponent(
                cleanPostId
            )}/comments`,

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

            "Could not add comment."

        );

    }


    const comment =
        result?.comment ||

        null;


    if (
        options.inputElement
    ) {

        options.inputElement.value =
            "";

    }


    if (
        options.commentsContainer
    ) {

        const emptyState =
            options.commentsContainer.querySelector(
                ".post-comments-empty"
            );


        if (emptyState) {

            options.commentsContainer.innerHTML =
                "";

        }


        if (comment) {

            options.commentsContainer.insertAdjacentHTML(

                "beforeend",

                renderComment(

                    comment,

                    getUserId()

                )

            );


            initializeCommentEvents(

                options.commentsContainer

            );


            bindCommentInputs(

                options.commentsContainer

            );

        } else {

            await loadComments(

                cleanPostId,

                options.commentsContainer,

                options.countElement

            );

        }

    }


    if (
        options.countElement
    ) {

        if (comment) {

            const currentCount =
                Number(
                    options.countElement.textContent
                ) || 0;


            updateCommentCount(

                options.countElement,

                currentCount + 1

            );

        }

    }


    return comment;

}



// ============================================================
// UPDATE COMMENT
// ============================================================

async function updateComment(
    postId,
    commentId,
    content
) {

    const cleanPostId =
        String(
            postId ||
            ""
        ).trim();


    const cleanCommentId =
        String(
            commentId ||
            ""
        ).trim();


    const cleanContent =
        typeof content ===
        "string"

            ? content.trim()

            : "";


    if (
        !cleanPostId ||
        !cleanCommentId
    ) {

        throw new Error(
            "Invalid comment information."
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
            "Comment cannot be empty."
        );

    }


    if (
        cleanContent.length >
        MAX_COMMENT_LENGTH
    ) {

        throw new Error(

            `Comment cannot exceed ${MAX_COMMENT_LENGTH} characters.`

        );

    }


    const stateKey =
        `${cleanPostId}:${cleanCommentId}`;


    if (
        commentsEditingState.has(
            stateKey
        )
    ) {

        throw new Error(
            "Comment is already being edited."
        );

    }


    commentsEditingState.add(
        stateKey
    );


    try {

        const response =
            await fetch(

                `${API_BASE_URL}/posts/${encodeURIComponent(
                    cleanPostId
                )}/comments/${encodeURIComponent(
                    cleanCommentId
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

                "You can only edit your own comments."

            );

        }


        if (
            response.status ===
            404
        ) {

            throw new Error(

                result?.error ||

                "Comment not found."

            );

        }


        if (
            !response.ok
        ) {

            throw new Error(

                result?.error ||

                "Could not update comment."

            );

        }


        return (
            result?.comment ||
            null
        );


    } finally {

        commentsEditingState.delete(
            stateKey
        );

    }

}



// ============================================================
// DELETE COMMENT
// ============================================================

async function deleteComment(
    postId,
    commentId
) {

    const cleanPostId =
        String(
            postId ||
            ""
        ).trim();


    const cleanCommentId =
        String(
            commentId ||
            ""
        ).trim();


    if (
        !cleanPostId ||
        !cleanCommentId
    ) {

        throw new Error(
            "Invalid comment information."
        );

    }


    if (
        !hasValidLoginSession()
    ) {

        throw new Error(
            "Please login first."
        );

    }


    const stateKey =
        `${cleanPostId}:${cleanCommentId}`;


    if (
        commentsDeletingState.has(
            stateKey
        )
    ) {

        throw new Error(
            "Comment is already being deleted."
        );

    }


    commentsDeletingState.add(
        stateKey
    );


    try {

        const response =
            await fetch(

                `${API_BASE_URL}/posts/${encodeURIComponent(
                    cleanPostId
                )}/comments/${encodeURIComponent(
                    cleanCommentId
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

                "You can only delete your own comments."

            );

        }


        if (
            response.status ===
            404
        ) {

            throw new Error(

                result?.error ||

                "Comment not found."

            );

        }


        if (
            !response.ok
        ) {

            throw new Error(

                result?.error ||

                "Could not delete comment."

            );

        }


        return true;


    } finally {

        commentsDeletingState.delete(
            stateKey
        );

    }

}



// ============================================================
// START INLINE EDIT
// ============================================================

function beginCommentEdit(
    commentElement
) {

    if (!commentElement) {

        return false;

    }


    if (
        commentElement.dataset.editing ===
        "true"
    ) {

        return false;

    }


    const commentId =
        String(

            commentElement.dataset.commentId ||

            ""

        ).trim();


    const postCard =
        commentElement.closest(
            ".post-card"
        );


    const postId =
        String(

            postCard?.dataset.postId ||

            ""

        ).trim();


    const contentElement =
        commentElement.querySelector(
            "[data-comment-content]"
        );


    if (
        !commentId ||
        !postId ||
        !contentElement
    ) {

        return false;

    }


    const currentUserId =
        getUserId();


    const commentUserId =
        String(

            commentElement.dataset.commentUserId ||

            ""

        ).trim();


    if (
        String(
            currentUserId
        ).trim() !==
        commentUserId
    ) {

        return false;

    }


    const currentText =
        contentElement.textContent ||
        "";


    commentElement.dataset.originalContent =
        currentText;


    commentElement.dataset.editing =
        "true";


    /*
     * Close the tiny owner menu before entering
     * inline edit mode.
     */

    closeAllCommentMenus(
        commentElement
    );


    /*
     * Replace only the text content area.
     *
     * No large secondary editor card.
     */

    contentElement.innerHTML = `

        <textarea
            class="post-comment-edit-input"
            maxlength="${MAX_COMMENT_LENGTH}"
            aria-label="Edit comment"
        ></textarea>


        <div
            class="post-comment-edit-actions"
        >

            <button
                type="button"
                data-comment-action="cancel-edit"
            >

                Cancel

            </button>


            <button
                type="button"
                data-comment-action="save-edit"
            >

                Save

            </button>

        </div>

    `;


    const input =
        contentElement.querySelector(
            ".post-comment-edit-input"
        );


    if (input) {

        input.value =
            currentText;


        input.focus();


        input.setSelectionRange(

            input.value.length,

            input.value.length

        );

    }


    return true;

}



// ============================================================
// CANCEL INLINE EDIT
// ============================================================

function cancelCommentEdit(
    commentElement
) {

    if (!commentElement) {

        return;

    }


    const contentElement =
        commentElement.querySelector(
            "[data-comment-content]"
        );


    if (!contentElement) {

        return;

    }


    const originalContent =
        commentElement.dataset.originalContent;


    contentElement.innerHTML =

        escapeHTML(

            typeof originalContent ===
            "string"

                ? originalContent

                : ""

        );


    commentElement.dataset.editing =
        "false";


    delete commentElement.dataset.originalContent;

}



// ============================================================
// SAVE INLINE EDIT
// ============================================================

async function saveCommentEdit(
    commentElement
) {

    if (!commentElement) {

        return null;

    }


    const postCard =
        commentElement.closest(
            ".post-card"
        );


    const postId =
        String(

            postCard?.dataset.postId ||

            ""

        ).trim();


    const commentId =
        String(

            commentElement.dataset.commentId ||

            ""

        ).trim();


    const currentUserId =
        String(
            getUserId() ||
            ""
        ).trim();


    const commentUserId =
        String(

            commentElement.dataset.commentUserId ||

            ""

        ).trim();


    if (
        !postId ||
        !commentId ||
        !currentUserId ||
        currentUserId !==
        commentUserId
    ) {

        return null;

    }


    const contentElement =
        commentElement.querySelector(
            "[data-comment-content]"
        );


    const input =
        contentElement?.querySelector(
            ".post-comment-edit-input"
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
            "Comment cannot be empty."
        );


        input.focus();


        return null;

    }


    if (
        content.length >
        MAX_COMMENT_LENGTH
    ) {

        alert(

            `Comment cannot exceed ${MAX_COMMENT_LENGTH} characters.`

        );


        input.focus();


        return null;

    }


    const saveButton =
        commentElement.querySelector(
            '[data-comment-action="save-edit"]'
        );


    const cancelButton =
        commentElement.querySelector(
            '[data-comment-action="cancel-edit"]'
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

        const updatedComment =
            await updateComment(

                postId,

                commentId,

                content

            );


        contentElement.innerHTML =

            escapeHTML(

                updatedComment?.content ||

                content

            );


        commentElement.dataset.editing =
            "false";


        delete commentElement.dataset.originalContent;


        /*
         * Mark as edited without making the
         * comment layout larger.
         */

        const header =
            commentElement.querySelector(
                ".post-comment-header"
            );


        if (
            header &&

            !header.querySelector(
                ".post-comment-edited"
            )

        ) {

            const editedLabel =
                document.createElement(
                    "span"
                );


            editedLabel.className =
                "post-comment-edited";


            editedLabel.textContent =
                "edited";


            header.appendChild(
                editedLabel
            );

        }


        return updatedComment;


    } catch (
        error
    ) {

        console.error(

            "Save comment edit error:",

            error

        );


        alert(

            error?.message ||

            "Unable to update comment."

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
// REMOVE COMMENT FROM DOM
// ============================================================

function removeCommentElement(
    commentElement,
    countElement
) {

    if (!commentElement) {

        return;

    }


    commentElement.classList.add(
        "comment-deleting"
    );


    window.setTimeout(

        () => {

            if (
                commentElement.isConnected
            ) {

                commentElement.remove();

            }


            if (
                countElement
            ) {

                const currentCount =
                    Number(

                        countElement.textContent

                    ) || 0;


                updateCommentCount(

                    countElement,

                    Math.max(

                        0,

                        currentCount - 1

                    )

                );


                const postCard =
                    countElement.closest(
                        ".post-card"
                    );


                const commentsList =
                    postCard?.querySelector(
                        ".post-comments-list"
                    );


                if (

                    commentsList &&

                    !commentsList.querySelector(
                        ".post-comment"
                    )

                ) {

                    commentsList.innerHTML = `

                        <div
                            class="post-comments-empty"
                        >

                            No comments yet.

                        </div>

                    `;

                }

            }

        },

        220

    );

}



// ============================================================
// TOGGLE COMMENT MENU
// ============================================================

function toggleCommentMenu(
    commentElement,
    button
) {

    if (
        !commentElement ||
        !button
    ) {

        return;

    }


    const currentUserId =
        String(
            getUserId() ||
            ""
        ).trim();


    const commentUserId =
        String(

            commentElement.dataset.commentUserId ||

            ""

        ).trim();


    /*
     * Never open the menu for another user's
     * comment.
     */

    if (
        !currentUserId ||
        currentUserId !==
        commentUserId
    ) {

        return;

    }


    const menu =
        commentElement.querySelector(
            ".post-comment-menu"
        );


    if (!menu) {

        return;

    }


    const willOpen =
        menu.hidden;


    const list =
        commentElement.closest(
            ".post-comments-list"
        );


    if (list) {

        list
            .querySelectorAll(
                ".post-comment-menu"
            )
            .forEach(

                otherMenu => {

                    if (
                        otherMenu ===
                        menu
                    ) {

                        return;

                    }


                    otherMenu.hidden =
                        true;


                    const otherButton =
                        otherMenu
                            .closest(
                                ".post-comment-owner-actions"
                            )
                            ?.querySelector(
                                ".post-comment-menu-button"
                            );


                    if (
                        otherButton
                    ) {

                        otherButton.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }

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
// CLOSE ALL COMMENT MENUS
// ============================================================

function closeAllCommentMenus(
    root
) {

    if (!root) {

        return;

    }


    const scope =
        root.querySelectorAll
            ? root

            : root.parentElement;


    if (!scope) {

        return;

    }


    scope
        .querySelectorAll(
            ".post-comment-menu"
        )
        .forEach(

            menu => {

                menu.hidden =
                    true;

            }

        );


    scope
        .querySelectorAll(
            ".post-comment-menu-button"
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
// COMMENT ACTION HANDLER
// ============================================================

async function handleCommentAction(
    event
) {

    const actionElement =
        event.target.closest(
            "[data-comment-action]"
        );


    if (!actionElement) {

        return;

    }


    const action =
        actionElement.dataset.commentAction;


    const commentElement =
        actionElement.closest(
            ".post-comment"
        );


    if (!commentElement) {

        return;

    }


    const currentUserId =
        String(
            getUserId() ||
            ""
        ).trim();


    const commentUserId =
        String(

            commentElement.dataset.commentUserId ||

            ""

        ).trim();


    /*
     * Every owner action has a second ownership
     * check here. Rendering alone is not enough.
     */

    if (

        (
            action ===
            "edit"

            ||

            action ===
            "delete"

        )

        &&

        (
            !currentUserId

            ||

            currentUserId !==
            commentUserId
        )

    ) {

        return;

    }


    // ========================================================
    // MENU
    // ========================================================

    if (
        action ===
        "menu"
    ) {

        event.preventDefault();

        event.stopPropagation();


        toggleCommentMenu(

            commentElement,

            actionElement

        );


        return;

    }


    // ========================================================
    // EDIT
    // ========================================================

    if (
        action ===
        "edit"
    ) {

        event.preventDefault();

        event.stopPropagation();


        closeAllCommentMenus(
            commentElement
        );


        beginCommentEdit(
            commentElement
        );


        return;

    }


    // ========================================================
    // CANCEL EDIT
    // ========================================================

    if (
        action ===
        "cancel-edit"
    ) {

        event.preventDefault();

        event.stopPropagation();


        cancelCommentEdit(
            commentElement
        );


        return;

    }


    // ========================================================
    // SAVE EDIT
    // ========================================================

    if (
        action ===
        "save-edit"
    ) {

        event.preventDefault();

        event.stopPropagation();


        await saveCommentEdit(
            commentElement
        );


        return;

    }


    // ========================================================
    // DELETE
    // ========================================================

    if (
        action ===
        "delete"
    ) {

        event.preventDefault();

        event.stopPropagation();


        const postCard =
            commentElement.closest(
                ".post-card"
            );


        const postId =
            String(

                postCard?.dataset.postId ||

                ""

            ).trim();


        const commentId =
            String(

                commentElement.dataset.commentId ||

                ""

            ).trim();


        const countElement =
            postCard?.querySelector(
                ".post-comment-count"
            );


        if (
            !postId ||
            !commentId
        ) {

            return;

        }


        closeAllCommentMenus(
            commentElement
        );


        /*
         * Browser confirmation.
         *
         * The wording makes the permanent nature explicit.
         */

        const confirmed =
            window.confirm(

                "Delete this comment?\n\n" +

                "This will permanently delete your comment."

            );


        if (!confirmed) {

            return;

        }


        actionElement.disabled =
            true;


        actionElement.textContent =
            "Deleting...";


        try {

            await deleteComment(

                postId,

                commentId

            );


            removeCommentElement(

                commentElement,

                countElement

            );


        } catch (
            error
        ) {

            console.error(

                "Delete comment error:",

                error

            );


            alert(

                error?.message ||

                "Unable to delete comment."

            );

        } finally {

            actionElement.disabled =
                false;


            actionElement.textContent =
                "Delete";

        }

    }

}



// ============================================================
// INITIALIZE COMMENT EVENTS
// ============================================================

function initializeCommentEvents(
    commentsRoot
) {

    if (!commentsRoot) {

        return;

    }


    if (
        commentsRoot.dataset.commentEventsReady ===
        "true"
    ) {

        return;

    }


    commentsRoot.dataset.commentEventsReady =
        "true";


    commentsRoot.addEventListener(

        "click",

        event => {

            handleCommentAction(
                event
            );

        }

    );


    commentsRoot.addEventListener(

        "keydown",

        event => {

            const input =
                event.target.closest(
                    ".post-comment-edit-input"
                );


            if (!input) {

                return;

            }


            const commentElement =
                input.closest(
                    ".post-comment"
                );


            if (!commentElement) {

                return;

            }


            if (
                event.key ===
                "Escape"
            ) {

                event.preventDefault();


                cancelCommentEdit(
                    commentElement
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


                saveCommentEdit(
                    commentElement
                );

            }

        }

    );


    /*
     * Close comment menus when clicking outside
     * the owner action area.
     */

    if (
        !commentsRoot.dataset.commentMenuDocumentReady
    ) {

        commentsRoot.dataset.commentMenuDocumentReady =
            "true";


        document.addEventListener(

            "click",

            event => {

                if (
                    event.target.closest(
                        ".post-comment-owner-actions"
                    )
                ) {

                    return;

                }


                closeAllCommentMenus(
                    commentsRoot
                );

            }

        );

    }

}



// ============================================================
// COMMENT INPUT
// ============================================================

function bindCommentInput(
    input,
    submitButton
) {

    if (
        !input ||
        !submitButton
    ) {

        return;

    }


    if (
        input.dataset.commentInputReady ===
        "true"
    ) {

        return;

    }


    input.dataset.commentInputReady =
        "true";


    input.addEventListener(

        "keydown",

        event => {

            if (
                event.key !==
                "Enter" ||

                event.shiftKey
            ) {

                return;

            }


            event.preventDefault();


            submitButton.click();

        }

    );

}



// ============================================================
// BIND COMMENT INPUTS
// ============================================================

function bindCommentInputs(
    commentsRoot
) {

    if (!commentsRoot) {

        return;

    }


    commentsRoot
        .querySelectorAll(
            ".post-comment-input"
        )
        .forEach(

            input => {

                const postCard =
                    input.closest(
                        ".post-card"
                    );


                const submitButton =
                    postCard?.querySelector(
                        ".post-submit-comment"
                    );


                bindCommentInput(

                    input,

                    submitButton

                );

            }

        );

}



// ============================================================
// SUBMIT COMMENT FROM FORM
// ============================================================

async function submitCommentFromForm(
    {
        postCard,
        input,
        submitButton
    }
) {

    if (
        !postCard ||
        !input ||
        !submitButton
    ) {

        return null;

    }


    const postId =
        String(

            postCard.dataset.postId ||

            ""

        ).trim();


    const commentsContainer =
        postCard.querySelector(
            ".post-comments-list"
        );


    const countElement =
        postCard.querySelector(
            ".post-comment-count"
        );


    if (
        !postId ||
        !commentsContainer
    ) {

        return null;

    }


    const content =
        input.value.trim();


    if (!content) {

        input.focus();


        return null;

    }


    submitButton.disabled =
        true;


    submitButton.textContent =
        "Posting...";


    try {

        return await createComment(

            postId,

            content,

            {

                inputElement:
                    input,

                commentsContainer:
                    commentsContainer,

                countElement:
                    countElement

            }

        );


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


        return null;


    } finally {

        submitButton.disabled =
            false;


        submitButton.textContent =
            "Comment";

    }

}



// ============================================================
// INITIALIZE
// ============================================================

function initializeComments(
    commentsRoot
) {

    if (!commentsRoot) {

        return;

    }


    initializeCommentEvents(
        commentsRoot
    );


    bindCommentInputs(
        commentsRoot
    );

}



// ============================================================
// PUBLIC API
// ============================================================

export {

    MAX_COMMENT_LENGTH,

    escapeHTML,

    formatCommentDate,

    getCommentId,

    getCommentUserId,

    isOwnComment,

    renderComment,

    renderComments,

    loadComments,

    createComment,

    updateComment,

    deleteComment,

    beginCommentEdit,

    cancelCommentEdit,

    saveCommentEdit,

    removeCommentElement,

    submitCommentFromForm,

    bindCommentInput,

    bindCommentInputs,

    initializeCommentEvents,

    initializeComments

};