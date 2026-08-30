"use strict";

/* =========================================================
   DHEERE AI
   Homepage Floating Assistant
   =========================================================

   Responsibilities:
   - Create floating Dheere AI bulb
   - Create AI panel dynamically
   - Open / close panel
   - Send messages
   - Connect to backend /ai-chat
   - Loading / typing state
   - Error handling
   - Enter to send
   - Shift + Enter for newline
   - Escape to close
   - Preserve chat during current page session

   Backend endpoint:
   POST https://dheere-studio.onrender.com/ai-chat
   ========================================================= */


/* =========================================================
   CONFIG
   ========================================================= */

const API_BASE =
    "https://dheere-studio.onrender.com";

const AI_ENDPOINT =
    `${API_BASE}/ai-chat`;

const MAX_MESSAGE_LENGTH =
    1000;

const MAX_VISIBLE_MESSAGES =
    100;


/* =========================================================
   STATE
   ========================================================= */

let aiOpen =
    false;

let aiBusy =
    false;

let aiMessageCount =
    0;


/* =========================================================
   DOM REFERENCES
   ========================================================= */

let aiTrigger =
    null;

let aiPanel =
    null;

let aiCloseButton =
    null;

let aiMessages =
    null;

let aiInput =
    null;

let aiSendButton =
    null;

let aiTyping =
    null;

let aiStatus =
    null;

let aiStatusText =
    null;


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
   RESPONSE PARSER
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
   STATUS
   ========================================================= */

function setAIStatus(
    text,
    online = false
) {

    if (aiStatusText) {

        aiStatusText.textContent =
            text;

    }

    if (aiStatus) {

        aiStatus.classList.toggle(
            "online",
            online
        );

    }

}


/* =========================================================
   TYPING INDICATOR
   ========================================================= */

function setTyping(
    visible
) {

    if (!aiTyping) {

        return;

    }

    aiTyping.classList.toggle(
        "visible",
        visible
    );

}


/* =========================================================
   BUTTON STATE
   ========================================================= */

function setSendButtonState(
    disabled
) {

    if (!aiSendButton) {

        return;

    }

    aiSendButton.disabled =
        disabled;

}


/* =========================================================
   CREATE AI MARKUP
   ========================================================= */

function createAIInterface() {

    /*
     * Do not create duplicates if the page already contains
     * a Dheere AI widget.
     */

    if (
        document.getElementById(
            "dheereAiRoot"
        )
    ) {

        aiTrigger =
            document.getElementById(
                "dheereAiTrigger"
            );

        aiPanel =
            document.getElementById(
                "dheereAiPanel"
            );

        aiCloseButton =
            document.getElementById(
                "dheereAiClose"
            );

        aiMessages =
            document.getElementById(
                "dheereAiMessages"
            );

        aiInput =
            document.getElementById(
                "dheereAiInput"
            );

        aiSendButton =
            document.getElementById(
                "dheereAiSend"
            );

        aiTyping =
            document.getElementById(
                "dheereAiTyping"
            );

        aiStatus =
            document.getElementById(
                "dheereAiStatus"
            );

        aiStatusText =
            document.getElementById(
                "dheereAiStatusText"
            );

        return;

    }


    /*
     * Root container.
     */

    const root =
        document.createElement(
            "div"
        );

    root.id =
        "dheereAiRoot";

    root.className =
        "dheere-ai-root";


    /* =====================================================
       BULB BUTTON
       ===================================================== */

    root.innerHTML = `

        <button
            id="dheereAiTrigger"
            class="dheere-ai-trigger"
            type="button"
            aria-label="Open Dheere AI"
            aria-expanded="false"
            aria-controls="dheereAiPanel"
        >

            <span
                class="dheere-ai-trigger-icon"
                aria-hidden="true"
            >
                💡
            </span>

            <span class="dheere-ai-trigger-label">
                Dheere AI
            </span>

        </button>


        <!-- =================================================
             AI PANEL
             ================================================= -->

        <section
            id="dheereAiPanel"
            class="dheere-ai-panel"
            aria-hidden="true"
            aria-label="Dheere AI assistant"
        >

            <div class="dheere-ai-panel-header">

                <div class="dheere-ai-title-wrap">

                    <div
                        class="dheere-ai-symbol"
                        aria-hidden="true"
                    >
                        ✦
                    </div>

                    <div class="dheere-ai-title-text">

                        <strong>
                            Dheere AI
                        </strong>

                        <span>
                            Studio Assistant
                        </span>

                    </div>

                </div>


                <div class="dheere-ai-header-actions">

                    <div
                        id="dheereAiStatus"
                        class="dheere-ai-status"
                    >

                        <span
                            class="dheere-ai-status-dot"
                            aria-hidden="true"
                        ></span>

                        <span id="dheereAiStatusText">
                            Ready
                        </span>

                    </div>


                    <button
                        id="dheereAiClose"
                        class="dheere-ai-close"
                        type="button"
                        aria-label="Close Dheere AI"
                    >
                        ×
                    </button>

                </div>

            </div>


            <!-- =================================================
                 MESSAGES
                 ================================================= -->

            <div
                id="dheereAiMessages"
                class="dheere-ai-messages"
                aria-live="polite"
                aria-label="Dheere AI conversation"
            >

                <div class="dheere-ai-welcome">

                    <div class="dheere-ai-welcome-icon">
                        ✦
                    </div>

                    <div class="dheere-ai-welcome-content">

                        <strong>
                            Welcome to Dheere AI.
                        </strong>

                        <p>
                            Ask a question, explore an idea,
                            or learn more about Dheere Studio.
                        </p>

                    </div>

                </div>


                <div
                    id="dheereAiTyping"
                    class="dheere-ai-typing"
                    aria-hidden="true"
                >

                    <span class="dheere-ai-typing-dot"></span>
                    <span class="dheere-ai-typing-dot"></span>
                    <span class="dheere-ai-typing-dot"></span>

                </div>

            </div>


            <!-- =================================================
                 INPUT
                 ================================================= -->

            <div class="dheere-ai-input-area">

                <form
                    id="dheereAiForm"
                    class="dheere-ai-form"
                >

                    <textarea
                        id="dheereAiInput"
                        class="dheere-ai-input"
                        rows="1"
                        maxlength="${MAX_MESSAGE_LENGTH}"
                        placeholder="Ask Dheere AI..."
                        autocomplete="off"
                        spellcheck="true"
                        aria-label="Ask Dheere AI"
                    ></textarea>


                    <button
                        id="dheereAiSend"
                        class="dheere-ai-send"
                        type="submit"
                        aria-label="Send message"
                    >
                        ↑
                    </button>

                </form>


                <div class="dheere-ai-input-hint">

                    Enter to send
                    <span>·</span>
                    Shift + Enter for a new line

                </div>

            </div>

        </section>

    `;


    document.body.appendChild(
        root
    );


    /*
     * Cache elements.
     */

    aiTrigger =
        document.getElementById(
            "dheereAiTrigger"
        );

    aiPanel =
        document.getElementById(
            "dheereAiPanel"
        );

    aiCloseButton =
        document.getElementById(
            "dheereAiClose"
        );

    aiMessages =
        document.getElementById(
            "dheereAiMessages"
        );

    aiInput =
        document.getElementById(
            "dheereAiInput"
        );

    aiSendButton =
        document.getElementById(
            "dheereAiSend"
        );

    aiTyping =
        document.getElementById(
            "dheereAiTyping"
        );

    aiStatus =
        document.getElementById(
            "dheereAiStatus"
        );

    aiStatusText =
        document.getElementById(
            "dheereAiStatusText"
        );

}


/* =========================================================
   OPEN PANEL
   ========================================================= */

function openAI() {

    if (
        !aiPanel ||
        !aiTrigger
    ) {

        return;

    }


    aiOpen =
        true;


    aiPanel.classList.add(
        "open"
    );


    aiPanel.setAttribute(
        "aria-hidden",
        "false"
    );


    aiTrigger.classList.add(
        "active"
    );


    aiTrigger.setAttribute(
        "aria-expanded",
        "true"
    );


    aiTrigger.setAttribute(
        "aria-label",
        "Close Dheere AI"
    );


    setTimeout(
        () => {

            aiInput?.focus();

        },
        120
    );

}


/* =========================================================
   CLOSE PANEL
   ========================================================= */

function closeAI() {

    if (
        !aiPanel ||
        !aiTrigger
    ) {

        return;

    }


    aiOpen =
        false;


    aiPanel.classList.remove(
        "open"
    );


    aiPanel.setAttribute(
        "aria-hidden",
        "true"
    );


    aiTrigger.classList.remove(
        "active"
    );


    aiTrigger.setAttribute(
        "aria-expanded",
        "false"
    );


    aiTrigger.setAttribute(
        "aria-label",
        "Open Dheere AI"
    );

}


/* =========================================================
   TOGGLE PANEL
   ========================================================= */

function toggleAI() {

    if (aiOpen) {

        closeAI();

    } else {

        openAI();

    }

}


/* =========================================================
   ADD MESSAGE
   ========================================================= */

function addMessage(
    text,
    type
) {

    if (!aiMessages) {

        return null;

    }


    const message =
        document.createElement(
            "div"
        );


    message.className =
        `dheere-ai-message ${type}`;


    if (
        type ===
        "user"
    ) {

        message.innerHTML = `

            <div class="dheere-ai-message-bubble">

                ${escapeHTML(
                    text
                )}

            </div>

        `;

    } else {

        message.innerHTML = `

            <div class="dheere-ai-message-avatar">
                ✦
            </div>

            <div class="dheere-ai-message-content">

                ${escapeHTML(
                    text
                )}

            </div>

        `;

    }


    if (aiTyping) {

        aiMessages.insertBefore(
            message,
            aiTyping
        );

    } else {

        aiMessages.appendChild(
            message
        );

    }


    aiMessageCount++;


    /*
     * Prevent unlimited DOM growth during a very long session.
     */

    while (
        aiMessageCount >
            MAX_VISIBLE_MESSAGES
    ) {

        const candidates =
            aiMessages.querySelectorAll(
                ".dheere-ai-message"
            );


        const first =
            candidates[0];


        if (!first) {

            break;

        }


        first.remove();


        aiMessageCount--;

    }


    scrollMessages();


    return message;

}


/* =========================================================
   SCROLL MESSAGES
   ========================================================= */

function scrollMessages() {

    if (!aiMessages) {

        return;

    }


    requestAnimationFrame(
        () => {

            aiMessages.scrollTop =
                aiMessages.scrollHeight;

        }
    );

}


/* =========================================================
   AUTO RESIZE INPUT
   ========================================================= */

function resizeInput() {

    if (!aiInput) {

        return;

    }


    aiInput.style.height =
        "auto";


    aiInput.style.height =

        Math.min(

            aiInput.scrollHeight,

            140

        ) + "px";

}


/* =========================================================
   CLEAR INPUT
   ========================================================= */

function clearInput() {

    if (!aiInput) {

        return;

    }


    aiInput.value =
        "";


    resizeInput();

}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage() {

    if (
        aiBusy ||
        !aiInput
    ) {

        return;

    }


    const message =
        aiInput.value
            .trim();


    /*
     * Empty.
     */

    if (!message) {

        aiInput.focus();

        return;

    }


    /*
     * Length.
     */

    if (
        message.length >
        MAX_MESSAGE_LENGTH
    ) {

        alert(

            `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`

        );


        return;

    }


    /*
     * User message.
     */

    addMessage(
        message,
        "user"
    );


    clearInput();


    /*
     * Busy state.
     */

    aiBusy =
        true;


    setSendButtonState(
        true
    );


    setTyping(
        true
    );


    setAIStatus(
        "Thinking..."
    );


    try {

        const response =
            await fetch(

                AI_ENDPOINT,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            message

                        })

                }

            );


        const result =
            await parseResponse(
                response
            );


        /*
         * Rate limited.
         */

        if (
            response.status ===
            429
        ) {

            throw new Error(

                result?.error ||

                "Dheere AI is receiving too many requests right now. Please try again shortly."

            );

        }


        /*
         * Other errors.
         */

        if (
            !response.ok
        ) {

            throw new Error(

                result?.error ||

                `Dheere AI request failed (${response.status}).`

            );

        }


        /*
         * Validate application response.
         */

        if (
            result?.success !==
            true
        ) {

            throw new Error(

                result?.error ||

                "Dheere AI returned an invalid response."

            );

        }


        if (
            typeof result?.answer !==
                "string" ||

            !result.answer.trim()
        ) {

            throw new Error(

                "Dheere AI returned an empty response."

            );

        }


        /*
         * AI response.
         */

        addMessage(

            result.answer.trim(),

            "ai"

        );


        setAIStatus(
            "Ready",
            true
        );


    } catch (error) {

        console.error(

            "Dheere AI error:",

            error

        );


        addMessage(

            error?.message ||

            "Unable to connect to Dheere AI.",

            "error"

        );


        setAIStatus(
            "Unavailable"
        );


    } finally {

        aiBusy =
            false;


        setSendButtonState(
            false
        );


        setTyping(
            false
        );


        /*
         * Keep focus available for the next prompt.
         */

        if (
            aiOpen &&
            aiInput
        ) {

            aiInput.focus();

        }


        scrollMessages();

    }

}


/* =========================================================
   EVENT SETUP
   ========================================================= */

function setupEvents() {

    if (aiTrigger) {

        aiTrigger.addEventListener(

            "click",

            event => {

                event.preventDefault();

                toggleAI();

            }

        );

    }


    if (aiCloseButton) {

        aiCloseButton.addEventListener(

            "click",

            event => {

                event.preventDefault();

                closeAI();

            }

        );

    }


    /*
     * Form submit.
     */

    const form =
        document.getElementById(
            "dheereAiForm"
        );


    if (form) {

        form.addEventListener(

            "submit",

            event => {

                event.preventDefault();

                sendMessage();

            }

        );

    }


    /*
     * Input resize.
     */

    if (aiInput) {

        aiInput.addEventListener(

            "input",

            resizeInput

        );


        /*
         * Enter = send
         * Shift + Enter = newline
         */

        aiInput.addEventListener(

            "keydown",

            event => {

                if (
                    event.key ===
                        "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    sendMessage();

                }

            }

        );

    }


    /*
     * Click outside panel.
     */

    document.addEventListener(

        "click",

        event => {

            if (!aiOpen) {

                return;

            }


            if (!aiPanel) {

                return;

            }


            const clickedInsidePanel =
                aiPanel.contains(
                    event.target
                );


            const clickedTrigger =
                aiTrigger?.contains(
                    event.target
                );


            if (
                !clickedInsidePanel &&
                !clickedTrigger
            ) {

                closeAI();

            }

        }

    );


    /*
     * Escape closes panel.
     */

    document.addEventListener(

        "keydown",

        event => {

            if (
                event.key ===
                "Escape" &&
                aiOpen
            ) {

                closeAI();

            }

        }

    );


    /*
     * Prevent accidental page movement when the panel
     * is open and the user uses keyboard focus inside it.
     */

    if (aiPanel) {

        aiPanel.addEventListener(

            "click",

            event => {

                event.stopPropagation();

            }

        );

    }


    /*
     * React to viewport resize.
     */

    window.addEventListener(

        "resize",

        () => {

            if (aiOpen) {

                scrollMessages();

            }

        }

    );

}


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeDheereAI() {

    createAIInterface();

    setupEvents();

    setAIStatus(
        "Ready",
        true
    );

}


/* =========================================================
   PUBLIC API
   ========================================================= */

function openDheereAI() {

    openAI();

}


function closeDheereAI() {

    closeAI();

}


function toggleDheereAI() {

    toggleAI();

}


function sendDheereAIMessage() {

    return sendMessage();

}


/* =========================================================
   START AFTER DOM
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(

        "DOMContentLoaded",

        initializeDheereAI,

        {
            once:
                true
        }

    );

} else {

    initializeDheereAI();

}


/* =========================================================
   EXPORTS
   ========================================================= */

export {

    initializeDheereAI,

    openDheereAI,

    closeDheereAI,

    toggleDheereAI,

    sendDheereAIMessage

};