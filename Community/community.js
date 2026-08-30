// ============================================================
// COMMUNITY MAIN CONTROLLER
// Coordinates all Community frontend modules
// ============================================================

"use strict";


// ============================================================
// IMPORTS
// ============================================================

import {

    hasValidLoginSession,

    clearAuthStorage

} from "./community-auth.js";


import {

    loadPosts,

    initializePosts

} from "./community-posts.js";


import {

    initializeComments

} from "./community-comments.js";


import {

    initializeVision

} from "./community-vision.js";



// ============================================================
// DOM ELEMENTS
// ============================================================

const elements = {

    postsFeed:
        document.getElementById(
            "postsFeed"
        ),


    refreshPostsButton:
        document.getElementById(
            "refreshPostsBtn"
        ),


    createPostCard:
        document.getElementById(
            "createPostCard"
        ),


    loginNotice:
        document.getElementById(
            "loginNotice"
        ),


    postTextarea:
        document.getElementById(
            "communityPostContent"
        ),


    characterCount:
        document.getElementById(
            "communityCharacterCount"
        ),


    publishButton:
        document.getElementById(
            "communityPublishBtn"
        ),


    exploreVisionButton:
        document.getElementById(
            "exploreVisionBtn"
        ),


    visionSection:
        document.getElementById(
            "visionSection"
        ),


    englishButton:
        document.getElementById(
            "btnEnglish"
        ),


    hinglishButton:
        document.getElementById(
            "btnHinglish"
        ),


    englishCommunity:
        document.getElementById(
            "englishCommunity"
        ),


    hinglishCommunity:
        document.getElementById(
            "hinglishCommunity"
        )

};



// ============================================================
// UI HELPERS
// ============================================================

function showLoginNotice() {

    if (
        elements.loginNotice
    ) {

        elements.loginNotice.style.display =
            "block";

    }


    if (
        elements.createPostCard
    ) {

        elements.createPostCard.style.display =
            "none";

    }

}



function showAuthenticatedUI() {

    if (
        elements.loginNotice
    ) {

        elements.loginNotice.style.display =
            "none";

    }


    if (
        elements.createPostCard
    ) {

        elements.createPostCard.style.display =
            "block";

    }

}



// ============================================================
// AUTH UI
// ============================================================

function initializeAuthUI() {

    if (
        hasValidLoginSession()
    ) {

        showAuthenticatedUI();

    } else {

        showLoginNotice();

    }

}



// ============================================================
// AUTH STATE EVENT
// ============================================================

function initializeAuthStateListener() {

    /*
     * The storage event fires when localStorage changes
     * in another browser tab/window.
     */

    window.addEventListener(

        "storage",

        event => {

            if (

                event.key ===
                "dheereStudioToken"

                ||

                event.key ===
                "dheereStudioUser"

            ) {

                initializeAuthUI();


                /*
                 * Refresh the feed so the like state and
                 * other user-specific values stay current.
                 */

                loadPosts(
                    elements.postsFeed
                );

            }

        }

    );

}



// ============================================================
// COMMENT MODULE
// ============================================================

function initializeCommentSystem() {

    if (
        elements.postsFeed
    ) {

        initializeComments(
            elements.postsFeed
        );

    }

}



// ============================================================
// POST MODULE
// ============================================================

function initializePostSystem() {

    initializePosts({

        postsFeed:
            elements.postsFeed,

        textarea:
            elements.postTextarea,

        counter:
            elements.characterCount,

        publishButton:
            elements.publishButton,

        refreshButton:
            elements.refreshPostsButton

    });

}



// ============================================================
// VISION MODULE
// ============================================================

function initializeVisionSystem() {

    initializeVision({

        visionSection:
            elements.visionSection,

        exploreVisionButton:
            elements.exploreVisionButton,

        englishButton:
            elements.englishButton,

        hinglishButton:
            elements.hinglishButton,

        englishCommunity:
            elements.englishCommunity,

        hinglishCommunity:
            elements.hinglishCommunity

    });

}



// ============================================================
// INITIAL LOAD
// ============================================================

async function initializeCommunity() {

    try {

        initializeAuthUI();

        initializeAuthStateListener();

        initializeCommentSystem();

        initializeVisionSystem();

        initializePostSystem();


        await loadPosts(
            elements.postsFeed
        );


    } catch (
        error
    ) {

        console.error(
            "Community initialization error:",
            error
        );


        /*
         * Never leave the user with a completely blank
         * community page after a module initialization failure.
         */

        if (
            elements.postsFeed
        ) {

            elements.postsFeed.innerHTML = `

                <div class="empty-feed">

                    Community could not be initialized.

                    <br>

                    Please refresh the page and try again.

                </div>

            `;

        }

    }

}



// ============================================================
// GLOBAL AUTH STORAGE CLEANUP
// ============================================================

window.addEventListener(

    "beforeunload",

    () => {

        /*
         * Do not clear authentication here.
         *
         * This listener intentionally exists only as a safe
         * lifecycle hook placeholder for future Community
         * cleanup and must not affect the login session.
         */

    }

);



// ============================================================
// START
// ============================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(

        "DOMContentLoaded",

        initializeCommunity,

        {

            once:
                true

        }

    );

} else {

    initializeCommunity();

}



// ============================================================
// PUBLIC DEBUG HOOK
// ============================================================

window.dheereCommunity = {

    initialize:
        initializeCommunity,

    refresh:
        () =>
            loadPosts(
                elements.postsFeed
            ),

    getElements:
        () =>
            elements

};