/*
 * Dheere Studio — Dedicated Search
 * ------------------------------------------------------------
 * Existing user-search functionality moved to its own page.
 * Backend route and public profile navigation are preserved.
 */

// ======================================================
// CONFIG
// ======================================================

const API_BASE_URL =
    '/api';


// ======================================================
// DOM
// ======================================================

const userSearchInput =
    document.getElementById(
        'userSearchInput'
    ) as HTMLInputElement | null;

const userSearchButton =
    document.getElementById(
        'userSearchButton'
    ) as HTMLButtonElement | null;

const searchResults =
    document.getElementById(
        'searchResults'
    ) as HTMLElement | null;


// ======================================================
// STATE
// ======================================================

let searchTimer:
    ReturnType<typeof setTimeout> | null =
    null;

let searchRequestId =
    0;


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHTML(
    value: unknown
): string {

    const div =
        document.createElement('div');

    div.textContent =
        String(value ?? '');

    return div.innerHTML;
}


// ======================================================
// USER HELPERS
// ======================================================

function getUserInitials(
    user: any
): string {

    const name =
        String(
            user?.name ||
            user?.username ||
            'User'
        ).trim();

    if (!name) {
        return 'U';
    }

    const parts =
        name.split(/\s+/);

    if (parts.length === 1) {

        return parts[0]
            .charAt(0)
            .toUpperCase();

    }

    return (
        parts[0].charAt(0) +
        parts[parts.length - 1].charAt(0)
    ).toUpperCase();
}


function getSearchResultUsername(
    user: any
): string {

    return (
        user?.username ||
        user?.user?.username ||
        ''
    );
}


function getSearchResultName(
    user: any
): string {

    return (
        user?.name ||
        user?.user?.name ||
        getSearchResultUsername(user) ||
        'User'
    );
}


function getSearchResultAvatar(
    user: any
): string {

    return (
        user?.avatarUrl ||
        user?.avatar ||
        user?.profilePhoto ||
        user?.profileImage ||
        ''
    );
}


// ======================================================
// CLEAR RESULTS
// ======================================================

function clearSearchResults(): void {

    if (!searchResults) {
        return;
    }

    searchResults.replaceChildren();

    searchResults.classList.remove(
        'active'
    );
}


// ======================================================
// SEARCH MESSAGE
// ======================================================

function showSearchMessage(
    message: string
): void {

    if (!searchResults) {
        return;
    }

    searchResults.innerHTML = `
        <div class="search-message">
            ${escapeHTML(message)}
        </div>
    `;

    searchResults.classList.add(
        'active'
    );
}


// ======================================================
// PUBLIC PROFILE
// ======================================================

function openPublicProfile(
    username: string
): void {

    if (!username) {
        return;
    }

    const cleanUsername =
        String(username)
            .trim()
            .replace(/^@/, '');

    if (!cleanUsername) {
        return;
    }

    if (userSearchInput) {
        userSearchInput.value = '';
    }

    clearSearchResults();

    window.location.href =
        `../live-profile.html?username=${encodeURIComponent(cleanUsername)}`;
}


// ======================================================
// CREATE SEARCH RESULT
// ======================================================

function createSearchResultItem(
    user: any
): HTMLButtonElement | null {

    const username =
        getSearchResultUsername(user);

    const name =
        getSearchResultName(user);

    const avatarUrl =
        getSearchResultAvatar(user);

    if (!username) {
        return null;
    }

    const button =
        document.createElement('button');

    button.type =
        'button';

    button.className =
        'search-result-item';

    button.setAttribute(
        'role',
        'option'
    );


    // --------------------------------------------------
    // AVATAR
    // --------------------------------------------------

    const avatar =
        document.createElement('span');

    avatar.className =
        'search-result-avatar';

    if (avatarUrl) {

        const img =
            document.createElement('img');

        img.src =
            avatarUrl;

        img.alt =
            `${name} profile photo`;

        img.loading =
            'lazy';

        img.decoding =
            'async';

        img.addEventListener(
            'error',
            () => {

                avatar.replaceChildren();

                avatar.textContent =
                    getUserInitials({
                        name,
                        username
                    });

            },
            {
                once: true
            }
        );

        avatar.appendChild(
            img
        );

    } else {

        avatar.textContent =
            getUserInitials({
                name,
                username
            });

    }


    // --------------------------------------------------
    // USER INFO
    // --------------------------------------------------

    const info =
        document.createElement('span');

    info.className =
        'search-result-info';

    const nameElement =
        document.createElement('span');

    nameElement.className =
        'search-result-name';

    nameElement.textContent =
        name;

    const usernameElement =
        document.createElement('span');

    usernameElement.className =
        'search-result-username';

    usernameElement.textContent =
        `@${username}`;

    info.appendChild(
        nameElement
    );

    info.appendChild(
        usernameElement
    );

    button.appendChild(
        avatar
    );

    button.appendChild(
        info
    );


    // --------------------------------------------------
    // OPEN PROFILE
    // --------------------------------------------------

    button.addEventListener(
        'click',
        () => {

            openPublicProfile(
                username
            );

        }
    );

    return button;
}


// ======================================================
// RENDER RESULTS
// ======================================================

function renderSearchResults(
    users: any[]
): void {

    if (!searchResults) {
        return;
    }

    searchResults.replaceChildren();

    if (
        !Array.isArray(users) ||
        users.length === 0
    ) {

        showSearchMessage(
            'No users found.'
        );

        return;
    }

    users.forEach(
        (user) => {

            const item =
                createSearchResultItem(
                    user
                );

            if (item) {
                searchResults.appendChild(
                    item
                );
            }

        }
    );

    if (
        !searchResults.children.length
    ) {

        showSearchMessage(
            'No users found.'
        );

        return;
    }

    searchResults.classList.add(
        'active'
    );
}


// ======================================================
// SEARCH USERS
// ======================================================

async function searchUsers(
    query: string
): Promise<void> {

    const requestId =
        ++searchRequestId;

    if (!searchResults) {
        return;
    }

    const cleanQuery =
        String(query || '')
            .trim();

    if (!cleanQuery) {

        clearSearchResults();

        return;
    }

    if (cleanQuery.length < 2) {

        showSearchMessage(
            'Type at least 2 characters.'
        );

        return;
    }

    showSearchMessage(
        'Searching...'
    );

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/search-users?q=${encodeURIComponent(cleanQuery)}`
            );

        const text =
            await response.text();

        let result: any;

        try {

            result =
                text
                    ? JSON.parse(text)
                    : {};

        } catch (error) {

            console.error(
                'Invalid JSON response:',
                error
            );

            throw new Error(
                'The server returned an invalid response.'
            );

        }

        if (
            requestId !==
            searchRequestId
        ) {
            return;
        }

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.error ||
                'Search failed'
            );

        }

        const users =
            Array.isArray(result.users)
                ? result.users
                : Array.isArray(result.results)
                    ? result.results
                    : [];

        renderSearchResults(
            users
        );

    } catch (error) {

        if (
            requestId !==
            searchRequestId
        ) {
            return;
        }

        console.error(
            'User search error:',
            error
        );

        showSearchMessage(
            'Unable to search right now.'
        );
    }
}


// ======================================================
// SEARCH BUTTON
// ======================================================

function handleUserSearchButtonClick(): void {

    if (!userSearchInput) {
        return;
    }

    const query =
        userSearchInput.value.trim();

    if (!query) {

        userSearchInput.focus();

        return;
    }

    void searchUsers(
        query
    );
}


if (userSearchButton) {

    userSearchButton.addEventListener(
        'click',
        handleUserSearchButtonClick
    );

}


// ======================================================
// SEARCH INPUT
// ======================================================

if (userSearchInput) {

    userSearchInput.addEventListener(
        'input',
        () => {

            if (searchTimer) {

                clearTimeout(
                    searchTimer
                );

            }

            const query =
                userSearchInput.value.trim();

            if (!query) {

                clearSearchResults();

                return;
            }

            searchTimer =
                setTimeout(
                    () => {

                        void searchUsers(
                            query
                        );

                    },
                    300
                );

        }
    );


    userSearchInput.addEventListener(
        'keydown',
        (event: KeyboardEvent) => {

            if (
                event.key ===
                'Escape'
            ) {

                userSearchInput.value =
                    '';

                clearSearchResults();

                userSearchInput.blur();

                return;
            }

            if (
                event.key ===
                'Enter'
            ) {

                const firstResult =
                    searchResults
                        ?.querySelector<HTMLButtonElement>(
                            '.search-result-item'
                        );

                if (firstResult) {

                    event.preventDefault();

                    firstResult.click();

                } else {

                    void searchUsers(
                        userSearchInput.value
                    );

                }

            }

        }
    );

}


// ======================================================
// CLOSE RESULTS WHEN CLICKING OUTSIDE
// ======================================================

document.addEventListener(
    'click',
    (event: MouseEvent) => {

        if (
            !searchResults ||
            !userSearchInput
        ) {
            return;
        }

        const searchContainer =
            document.getElementById(
                'userSearch'
            );

        if (
            searchContainer &&
            !searchContainer.contains(
                event.target as Node
            )
        ) {

            clearSearchResults();

        }

    }
);
