/* ============================================================
   LIVE PROFILE
   Public profile page
   ============================================================ */


/* ============================================================
   API CONFIG
   ============================================================ */

const API_BASE =
    "https://dheere-studio.onrender.com";


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
   HELPERS
   ============================================================ */

function getUsernameFromUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const username =
        params.get("username");


    if (
        typeof username !== "string"
    ) {

        return "";

    }


    return username
        .trim()
        .replace(/^@/, "")
        .toLowerCase();

}


/* ============================================================
   ESCAPE HTML
   Prevent user-generated content from becoming HTML.
   ============================================================ */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* ============================================================
   INITIAL
   ============================================================ */

function getInitial(name, username) {

    const source =
        String(name || username || "U")
            .trim();


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

function formatJoinedDate(dateValue) {

    if (!dateValue) {

        return "—";

    }


    const date =
        new Date(dateValue);


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
            month: "short",
            year: "numeric"
        }
    );

}


/* ============================================================
   POST DATE FORMAT
   ============================================================ */

function formatPostDate(dateValue) {

    if (!dateValue) {

        return "";

    }


    const date =
        new Date(dateValue);


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
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

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
        typeof user?.avatarUrl === "string"
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
            `${user.name || user.username || "User"} profile photo`;


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
        typeof user.name === "string"
            ? user.name.trim()
            : "";


    const username =
        typeof user.username === "string"
            ? user.username.trim()
            : "";


    const bio =
        typeof user.bio === "string"
            ? user.bio.trim()
            : "";


    publicProfileName.textContent =
        name || "User";


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


    const url =
        `${API_BASE}/public-profile/${encodeURIComponent(currentUsername)}`;


    const response =
        await fetch(
            url,
            {
                method: "GET",

                headers: {
                    "Accept":
                        "application/json"
                },

                cache: "no-store"
            }
        );


    let result = null;


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
        (post) => {

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
        typeof post?.username === "string"
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


    const content =
        document.createElement(
            "div"
        );


    content.className =
        "public-post-content";


    content.textContent =
        typeof post?.content === "string"
            ? post.content
            : "";


    const footer =
        document.createElement(
            "div"
        );


    footer.className =
        "public-post-footer";


    const likes =
        document.createElement(
            "span"
        );


    likes.className =
        "public-post-stat";


    const likesValue =
        Number.isFinite(
            Number(post?.likes)
        )
            ? Number(post.likes)
            : 0;


    likes.textContent =
        `♥ ${likesValue}`;


    footer.appendChild(
        likes
    );


    article.appendChild(
        header
    );


    article.appendChild(
        content
    );


    article.appendChild(
        footer
    );


    return article;

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
            once: true
        }
    );

} else {

    initializeLiveProfile();

}