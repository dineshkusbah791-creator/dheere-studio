// ======================================================
// NOTIFICATION MODULE
// ======================================================


// ======================================================
// NOTIFICATION ELEMENTS
// ======================================================

let notificationBell =
    document.getElementById('notificationBell');

let notificationPanel =
    document.getElementById('notificationPanel');

let notificationList =
    document.getElementById('notificationList');

let notificationBadge =
    document.getElementById('notificationBadge');

let notificationMarkAllReadBtn =
    document.getElementById(
        'notificationMarkAllReadBtn'
    );


// ======================================================
// NOTIFICATION STATE
// ======================================================

let notificationRefreshTimer =
    null;

let notificationsLoading =
    false;

let notificationRequestId =
    0;

let notificationInitialized =
    false;


// ======================================================
// GET NOTIFICATION ELEMENTS
// ======================================================

function getNotificationElements() {

    notificationBell =
        document.getElementById(
            'notificationBell'
        );

    notificationPanel =
        document.getElementById(
            'notificationPanel'
        );

    notificationList =
        document.getElementById(
            'notificationList'
        );

    notificationBadge =
        document.getElementById(
            'notificationBadge'
        );

    notificationMarkAllReadBtn =
        document.getElementById(
            'notificationMarkAllReadBtn'
        );

}


// ======================================================
// INITIALIZE NOTIFICATION UI
// ======================================================

function initializeNotificationUI() {

    getNotificationElements();


    if (!notificationBell) {
        return;
    }


    if (notificationInitialized) {
        return;
    }


    notificationInitialized =
        true;


    notificationBell.addEventListener(
        'click',
        async (event) => {

            event.stopPropagation();

            toggleNotificationPanel();


            if (
                notificationPanel &&
                !notificationPanel.classList.contains(
                    'hidden'
                )
            ) {

                await loadNotifications();

            }

        }
    );


    if (notificationMarkAllReadBtn) {

        notificationMarkAllReadBtn.addEventListener(
            'click',
            async (event) => {

                event.preventDefault();

                event.stopPropagation();

                await markAllNotificationsRead();

            }
        );

    }


    document.addEventListener(
        'click',
        handleNotificationOutsideClick
    );


    document.addEventListener(
        'keydown',
        handleNotificationEscape
    );

}


// ======================================================
// TOGGLE NOTIFICATION PANEL
// ======================================================

function toggleNotificationPanel() {

    if (!notificationPanel) {
        return;
    }


    const isHidden =
        notificationPanel.classList.contains(
            'hidden'
        );


    if (isHidden) {

        notificationPanel.classList.remove(
            'hidden'
        );

        notificationPanel.classList.add(
            'active'
        );

        notificationBell?.setAttribute(
            'aria-expanded',
            'true'
        );

    } else {

        closeNotificationPanel();

    }

}


// ======================================================
// CLOSE NOTIFICATION PANEL
// ======================================================

function closeNotificationPanel() {

    if (!notificationPanel) {
        return;
    }


    notificationPanel.classList.add(
        'hidden'
    );

    notificationPanel.classList.remove(
        'active'
    );


    notificationBell?.setAttribute(
        'aria-expanded',
        'false'
    );

}


// ======================================================
// OUTSIDE CLICK
// ======================================================

function handleNotificationOutsideClick(event) {

    if (
        !notificationPanel ||
        !notificationBell
    ) {
        return;
    }


    if (
        notificationPanel.contains(
            event.target
        ) ||
        notificationBell.contains(
            event.target
        )
    ) {

        return;

    }


    closeNotificationPanel();

}


// ======================================================
// ESCAPE
// ======================================================

function handleNotificationEscape(event) {

    if (
        event.key ===
        'Escape'
    ) {

        closeNotificationPanel();

    }

}


// ======================================================
// RESET NOTIFICATION UI
// ======================================================

function resetNotificationsUI() {

    getNotificationElements();


    if (notificationList) {

        notificationList.innerHTML = `

            <div class="notification-empty">

                No notifications yet.

            </div>

        `;

    }


    updateNotificationBadge(
        0
    );

    closeNotificationPanel();

}


// ======================================================
// UPDATE NOTIFICATION BADGE
// ======================================================

function updateNotificationBadge(
    unreadCount
) {

    getNotificationElements();


    if (!notificationBadge) {
        return;
    }


    const count =
        Number(unreadCount || 0);


    if (count <= 0) {

        notificationBadge.textContent =
            '';

        notificationBadge.style.display =
            'none';

        notificationBell?.classList.remove(
            'has-notifications'
        );

        return;

    }


    notificationBadge.textContent =
        count > 99
            ? '99+'
            : String(count);


    notificationBadge.style.display =
        'flex';


    notificationBell?.classList.add(
        'has-notifications'
    );

}


// ======================================================
// NOTIFICATION MESSAGE
// ======================================================

function getNotificationMessage(
    notification
) {

    const actor =
        notification.actorName ||
        notification.username ||
        notification.actorUsername ||
        'Someone';


    const type =
        String(
            notification.type ||
            ''
        ).toLowerCase();


    if (
        type === 'like' ||
        type === 'post_like' ||
        type === 'liked'
    ) {

        return `${actor} liked your post.`;

    }


    if (
        type === 'comment' ||
        type === 'post_comment' ||
        type === 'commented'
    ) {

        return `${actor} commented on your post.`;

    }


    if (
        type === 'reply' ||
        type === 'comment_reply'
    ) {

        return `${actor} replied to your comment.`;

    }


    return (
        notification.message ||
        `${actor} interacted with your content.`
    );

}


// ======================================================
// NOTIFICATION DATE
// ======================================================

function formatNotificationDate(
    dateValue
) {

    if (!dateValue) {
        return '';
    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return '';

    }


    const now =
        Date.now();


    const diff =
        now -
        date.getTime();


    const minute =
        60 * 1000;

    const hour =
        60 * minute;

    const day =
        24 * hour;


    if (diff < minute) {

        return 'Just now';

    }


    if (diff < hour) {

        return `${Math.floor(
            diff / minute
        )}m ago`;

    }


    if (diff < day) {

        return `${Math.floor(
            diff / hour
        )}h ago`;

    }


    if (diff < 7 * day) {

        return `${Math.floor(
            diff / day
        )}d ago`;

    }


    return date.toLocaleDateString(
        'en-IN',
        {
            day:
                'numeric',

            month:
                'short',

            year:
                'numeric'
        }
    );

}


// ======================================================
// NOTIFICATION ID
// ======================================================

function getNotificationId(
    notification
) {

    return (
        notification.id ||
        notification._id ||
        notification.notificationId ||
        ''
    );

}


// ======================================================
// READ STATE
// ======================================================

function isNotificationRead(
    notification
) {

    return (
        notification.read === true ||
        notification.isRead === true
    );

}


// ======================================================
// CREATE NOTIFICATION ELEMENT
// ======================================================

function createNotificationElement(
    notification
) {

    const id =
        getNotificationId(
            notification
        );


    const read =
        isNotificationRead(
            notification
        );


    const item =
        document.createElement(
            'button'
        );


    item.type =
        'button';


    item.className =
        'notification-item';


    if (!read) {

        item.classList.add(
            'unread'
        );

    }


    if (id) {

        item.dataset.notificationId =
            id;

    }


    const icon =
        document.createElement(
            'span'
        );


    icon.className =
        'notification-icon';


    const type =
        String(
            notification.type ||
            ''
        ).toLowerCase();


    if (
        type.includes('like')
    ) {

        icon.textContent =
            '♥';

    } else if (
        type.includes('comment') ||
        type.includes('reply')
    ) {

        icon.textContent =
            '◌';

    } else {

        icon.textContent =
            '•';

    }


    const content =
        document.createElement(
            'span'
        );


    content.className =
        'notification-content';


    const message =
        document.createElement(
            'span'
        );


    message.className =
        'notification-message';


    message.textContent =
        getNotificationMessage(
            notification
        );


    const date =
        document.createElement(
            'span'
        );


    date.className =
        'notification-date';


    date.textContent =
        formatNotificationDate(
            notification.createdAt ||
            notification.timestamp ||
            notification.date
        );


    content.appendChild(
        message
    );

    content.appendChild(
        date
    );


    const unreadDot =
        document.createElement(
            'span'
        );


    unreadDot.className =
        'notification-unread-dot';


    if (read) {

        unreadDot.style.display =
            'none';

    }


    item.appendChild(
        icon
    );

    item.appendChild(
        content
    );

    item.appendChild(
        unreadDot
    );


    item.addEventListener(
        'click',
        async (event) => {

            event.preventDefault();

            event.stopPropagation();


            /*
             * Only unread notifications are sent
             * to the mark-read endpoint.
             */

            if (
                id &&
                !read
            ) {

                await markNotificationRead(
                    id
                );

            }


            const targetUrl =
                notification.url ||
                notification.link ||
                '';


            if (targetUrl) {

                window.location.href =
                    targetUrl;

            }

        }
    );


    return item;

}


// ======================================================
// RENDER NOTIFICATIONS
// ======================================================

function renderNotifications(
    notifications
) {

    getNotificationElements();


    if (!notificationList) {
        return;
    }


    notificationList.replaceChildren();


    if (
        !Array.isArray(
            notifications
        ) ||
        notifications.length === 0
    ) {

        notificationList.innerHTML = `

            <div class="notification-empty">

                No notifications yet.

            </div>

        `;

        updateNotificationBadge(
            0
        );

        return;

    }


    /*
     * IMPORTANT FIX
     *
     * Read notifications are NOT rendered.
     *
     * The backend can still keep them in MongoDB.
     * We simply don't show them again in the
     * notification dropdown.
     */

    const unreadNotifications =
        notifications.filter(
            (notification) =>
                !isNotificationRead(
                    notification
                )
        );


    if (
        unreadNotifications.length === 0
    ) {

        notificationList.innerHTML = `

            <div class="notification-empty">

                No notifications yet.

            </div>

        `;

        updateNotificationBadge(
            0
        );

        return;

    }


    unreadNotifications.forEach(
        (notification) => {

            const element =
                createNotificationElement(
                    notification
                );


            if (element) {

                notificationList.appendChild(
                    element
                );

            }

        }
    );


    updateNotificationBadge(
        unreadNotifications.length
    );

}


// ======================================================
// LOAD NOTIFICATIONS
// ======================================================

async function loadNotifications() {

    if (
        typeof currentUser ===
        'undefined' ||
        !currentUser ||
        notificationsLoading
    ) {

        return;

    }


    const userId =
        getUserId(
            currentUser
        );


    if (!userId) {
        return;
    }


    getNotificationElements();


    if (!notificationList) {
        return;
    }


    const requestId =
        ++notificationRequestId;


    notificationsLoading =
        true;


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/notifications?userId=${encodeURIComponent(userId)}`
            );


        const result =
            await response.json();


        if (
            requestId !==
            notificationRequestId
        ) {

            return;

        }


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.error ||
                'Could not load notifications'
            );

        }


        const notifications =
            Array.isArray(
                result.notifications
            )
                ? result.notifications
                : [];


        renderNotifications(
            notifications
        );


    } catch (error) {

        /*
         * Notification API errors should not
         * break the rest of the website.
         */

        console.warn(
            'Notifications unavailable:',
            error.message
        );


    } finally {

        notificationsLoading =
            false;

    }

}


// ======================================================
// MARK ONE NOTIFICATION AS READ
// ======================================================

async function markNotificationRead(
    notificationId
) {

    if (
        typeof currentUser ===
        'undefined' ||
        !currentUser ||
        !notificationId
    ) {

        return;

    }


    const userId =
        getUserId(
            currentUser
        );


    if (!userId) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/notifications/${encodeURIComponent(notificationId)}/read`,
                {

                    method:
                        'PATCH',

                    headers: {

                        'Content-Type':
                            'application/json'

                    },

                    body:
                        JSON.stringify({

                            userId:
                                userId

                        })

                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.error ||
                'Could not mark notification as read'
            );

        }


        /*
         * Reload from the backend.
         *
         * Because renderNotifications()
         * filters read:true notifications,
         * the notification disappears.
         *
         * On refresh it stays gone from the UI.
         */

        await loadNotifications();


    } catch (error) {

        console.warn(
            'Mark notification read error:',
            error
        );

    }

}


// ======================================================
// MARK ALL NOTIFICATIONS READ
// ======================================================

async function markAllNotificationsRead() {

    if (
        typeof currentUser ===
        'undefined' ||
        !currentUser
    ) {

        return;

    }


    const userId =
        getUserId(
            currentUser
        );


    if (!userId) {
        return;
    }


    if (
        notificationMarkAllReadBtn
    ) {

        notificationMarkAllReadBtn.disabled =
            true;

    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/notifications/read-all`,
                {

                    method:
                        'PATCH',

                    headers: {

                        'Content-Type':
                            'application/json'

                    },

                    body:
                        JSON.stringify({

                            userId:
                                userId

                        })

                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.error ||
                'Could not mark notifications as read'
            );

        }


        await loadNotifications();


    } catch (error) {

        console.warn(
            'Mark all notifications read error:',
            error
        );

    } finally {

        if (
            notificationMarkAllReadBtn
        ) {

            notificationMarkAllReadBtn.disabled =
                false;

        }

    }

}


// ======================================================
// START NOTIFICATION REFRESH
// ======================================================

function startNotificationRefresh() {

    stopNotificationRefresh();


    if (
        typeof currentUser ===
        'undefined' ||
        !currentUser
    ) {

        return;

    }


    /*
     * Initial request.
     */

    loadNotifications();


    /*
     * Refresh every 30 seconds.
     */

    notificationRefreshTimer =
        window.setInterval(
            () => {

                if (
                    typeof currentUser !==
                    'undefined' &&
                    currentUser
                ) {

                    loadNotifications();

                }

            },
            30000
        );

}


// ======================================================
// STOP NOTIFICATION REFRESH
// ======================================================

function stopNotificationRefresh() {

    if (
        notificationRefreshTimer
    ) {

        window.clearInterval(
            notificationRefreshTimer
        );

        notificationRefreshTimer =
            null;

    }

}


// ======================================================
// NOTIFICATION MODULE INITIALIZATION
// ======================================================

initializeNotificationUI();


if (
    typeof currentUser !==
    'undefined' &&
    currentUser
) {

    startNotificationRefresh();

}