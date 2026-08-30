// ============================================================
// COMMUNITY VISION
// Vision section + English / Hinglish switch
// ============================================================

"use strict";


// ============================================================
// INTERNAL STATE
// ============================================================

const visionState = {
    language: "english",
    visible: false
};



// ============================================================
// SET VISION VISIBILITY
// ============================================================

function setVisionVisibility(
    visionSection,
    exploreVisionButton,
    visible
) {

    if (!visionSection) {

        return;

    }


    visionState.visible =
        Boolean(
            visible
        );


    visionSection.style.display =
        visionState.visible
            ? "block"
            : "none";


    if (
        exploreVisionButton
    ) {

        exploreVisionButton.textContent =
            visionState.visible
                ? "Hide Vision"
                : "Explore Vision";


        exploreVisionButton.setAttribute(
            "aria-expanded",
            visionState.visible
                ? "true"
                : "false"
        );

    }

}



// ============================================================
// TOGGLE VISION VISIBILITY
// ============================================================

function toggleVision(
    visionSection,
    exploreVisionButton
) {

    setVisionVisibility(

        visionSection,

        exploreVisionButton,

        !visionState.visible

    );


    if (
        visionState.visible &&
        visionSection
    ) {

        visionSection.scrollIntoView({

            behavior:
                "smooth",

            block:
                "start"

        });

    }

}



// ============================================================
// SET LANGUAGE
// ============================================================

function setVisionLanguage(
    language,
    {
        englishCommunity,
        hinglishCommunity,
        englishButton,
        hinglishButton
    } = {}
) {

    const normalizedLanguage =
        language ===
        "hinglish"
            ? "hinglish"
            : "english";


    visionState.language =
        normalizedLanguage;


    const isEnglish =
        normalizedLanguage ===
        "english";


    if (
        englishCommunity
    ) {

        englishCommunity.classList.toggle(
            "hidden-vision",
            !isEnglish
        );

    }


    if (
        hinglishCommunity
    ) {

        hinglishCommunity.classList.toggle(
            "hidden-vision",
            isEnglish
        );

    }


    if (
        englishButton
    ) {

        englishButton.classList.toggle(
            "active",
            isEnglish
        );


        englishButton.setAttribute(
            "aria-pressed",
            isEnglish
                ? "true"
                : "false"
        );

    }


    if (
        hinglishButton
    ) {

        hinglishButton.classList.toggle(
            "active",
            !isEnglish
        );


        hinglishButton.setAttribute(
            "aria-pressed",
            !isEnglish
                ? "true"
                : "false"
        );

    }

}



// ============================================================
// GET CURRENT LANGUAGE
// ============================================================

function getVisionLanguage() {

    return visionState.language;

}



// ============================================================
// IS VISION VISIBLE
// ============================================================

function isVisionVisible() {

    return visionState.visible;

}



// ============================================================
// INITIALIZE VISION
// ============================================================

function initializeVision(
    {
        visionSection,
        exploreVisionButton,
        englishButton,
        hinglishButton,
        englishCommunity,
        hinglishCommunity

    } = {}
) {

    if (
        !visionSection
    ) {

        return;

    }


    // ========================================================
    // INITIAL STATE
    // ========================================================

    setVisionLanguage(

        "english",

        {

            englishCommunity,

            hinglishCommunity,

            englishButton,

            hinglishButton

        }

    );


    setVisionVisibility(

        visionSection,

        exploreVisionButton,

        false

    );


    // ========================================================
    // EXPLORE VISION
    // ========================================================

    if (
        exploreVisionButton &&
        exploreVisionButton.dataset.visionReady !==
        "true"
    ) {

        exploreVisionButton.dataset.visionReady =
            "true";


        exploreVisionButton.addEventListener(

            "click",

            () => {

                toggleVision(

                    visionSection,

                    exploreVisionButton

                );

            }

        );

    }


    // ========================================================
    // ENGLISH
    // ========================================================

    if (
        englishButton &&
        englishButton.dataset.visionLanguageReady !==
        "true"
    ) {

        englishButton.dataset.visionLanguageReady =
            "true";


        englishButton.addEventListener(

            "click",

            () => {

                setVisionLanguage(

                    "english",

                    {

                        englishCommunity,

                        hinglishCommunity,

                        englishButton,

                        hinglishButton

                    }

                );

            }

        );

    }


    // ========================================================
    // HINGLISH
    // ========================================================

    if (
        hinglishButton &&
        hinglishButton.dataset.visionLanguageReady !==
        "true"
    ) {

        hinglishButton.dataset.visionLanguageReady =
            "true";


        hinglishButton.addEventListener(

            "click",

            () => {

                setVisionLanguage(

                    "hinglish",

                    {

                        englishCommunity,

                        hinglishCommunity,

                        englishButton,

                        hinglishButton

                    }

                );

            }

        );

    }

}



// ============================================================
// PUBLIC API
// ============================================================

export {

    initializeVision,

    setVisionVisibility,

    toggleVision,

    setVisionLanguage,

    getVisionLanguage,

    isVisionVisible

};