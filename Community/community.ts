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
    postsFeed: document.getElementById("postsFeed"),
    refreshPostsButton: document.getElementById("refreshPostsBtn") as HTMLButtonElement | null,
    createPostCard: document.getElementById("createPostCard"),
    loginNotice: document.getElementById("loginNotice"),
    postTextarea: document.getElementById("communityPostContent") as HTMLTextAreaElement | null,
    characterCount: document.getElementById("communityCharacterCount"),
    publishButton: document.getElementById("communityPublishBtn") as HTMLButtonElement | null,
    exploreVisionButton: document.getElementById("exploreVisionBtn") as HTMLButtonElement | null,
    visionSection: document.getElementById("visionSection"),
    englishButton: document.getElementById("btnEnglish") as HTMLButtonElement | null,
    hinglishButton: document.getElementById("btnHinglish") as HTMLButtonElement | null,
    englishCommunity: document.getElementById("englishCommunity"),
    hinglishCommunity: document.getElementById("hinglishCommunity")
};

// ============================================================
// UI HELPERS
// ============================================================

function showLoginNotice(): void {
    if (elements.loginNotice) {
        elements.loginNotice.style.display = "block";
    }
    if (elements.createPostCard) {
        elements.createPostCard.style.display = "none";
    }
}

function showAuthenticatedUI(): void {
    if (elements.loginNotice) {
        elements.loginNotice.style.display = "none";
    }
    if (elements.createPostCard) {
        elements.createPostCard.style.display = "block";
    }
}

// ============================================================
// AUTH UI
// ============================================================

function initializeAuthUI(): void {
    if (hasValidLoginSession()) {
        showAuthenticatedUI();
    } else {
        showLoginNotice();
    }
}

// ============================================================
// AUTH STATE EVENT
// ============================================================

function initializeAuthStateListener(): void {
    window.addEventListener("storage", event => {
        if (event.key === "dheereStudioToken" || event.key === "dheereStudioUser") {
            initializeAuthUI();
            loadPosts(elements.postsFeed);
        }
    });
}

// ============================================================
// COMMENT MODULE
// ============================================================

function initializeCommentSystem(): void {
    if (elements.postsFeed) {
        initializeComments(elements.postsFeed);
    }
}

// ============================================================
// POST MODULE
// ============================================================

function initializePostSystem(): void {
    initializePosts({
        postsFeed: elements.postsFeed,
        textarea: elements.postTextarea,
        counter: elements.characterCount,
        publishButton: elements.publishButton,
        refreshButton: elements.refreshPostsButton
    });
}

// ============================================================
// VISION MODULE
// ============================================================

function initializeVisionSystem(): void {
    initializeVision({
        visionSection: elements.visionSection,
        exploreVisionButton: elements.exploreVisionButton,
        englishButton: elements.englishButton,
        hinglishButton: elements.hinglishButton,
        englishCommunity: elements.englishCommunity,
        hinglishCommunity: elements.hinglishCommunity
    });
}

// ============================================================
// INITIAL LOAD
// ============================================================

async function initializeCommunity(): Promise<void> {
    try {
        initializeAuthUI();
        initializeAuthStateListener();
        initializeCommentSystem();
        initializeVisionSystem();
        initializePostSystem();
        await loadPosts(elements.postsFeed);
    } catch (error) {
        console.error("Community initialization error:", error);
        if (elements.postsFeed) {
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

window.addEventListener("beforeunload", () => {
    // Intentionally empty. Authentication must not be cleared here.
});

// ============================================================
// START
// ============================================================

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeCommunity, { once: true });
} else {
    initializeCommunity();
}

// ============================================================
// WINDOW TYPE
// ============================================================

declare global {
    interface Window {
        dheereCommunity: {
            initialize: () => Promise<void>;
            refresh: () => Promise<any[]>;
            getElements: () => typeof elements;
        };
    }
}

// ============================================================
// PUBLIC DEBUG HOOK
// ============================================================

window.dheereCommunity = {
    initialize: initializeCommunity,
    refresh: () => loadPosts(elements.postsFeed),
    getElements: () => elements
};
