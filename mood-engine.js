/* ============================================================
   DHEERE STUDIO — MOOD ENGINE
   REAL ENVIRONMENT SYSTEM
   ============================================================ */

(function () {

    "use strict";


    const STORAGE_KEY = "dheereMood";


    const VALID_MOODS = [
        "original",
        "forest",
        "ocean",
        "ember",
        "midnight"
    ];


    let environmentRoot = null;


    /* ========================================================
       STORAGE
       ======================================================== */

    function getSavedMood() {

        const saved =
            localStorage.getItem(STORAGE_KEY);

        if (
            saved &&
            VALID_MOODS.includes(saved)
        ) {

            return saved;

        }

        return "original";

    }


    /* ========================================================
       HELPERS
       ======================================================== */

    function createElement(
        className,
        parent
    ) {

        const element =
            document.createElement("div");

        element.className =
            className;

        parent.appendChild(element);

        return element;

    }


    function random(min, max) {

        return Math.random() *
            (max - min) +
            min;

    }


    function setStyle(
        element,
        property,
        value
    ) {

        element.style.setProperty(
            property,
            value
        );

    }


    /* ========================================================
       ENVIRONMENT ROOT
       ======================================================== */

    function ensureEnvironmentRoot() {

        environmentRoot =
            document.getElementById(
                "dheereEnvironment"
            );


        if (!environmentRoot) {

            environmentRoot =
                document.createElement("div");

            environmentRoot.id =
                "dheereEnvironment";

            environmentRoot.setAttribute(
                "aria-hidden",
                "true"
            );

            document.body.prepend(
                environmentRoot
            );

        }

    }


    /* ========================================================
       CLEAR
       ======================================================== */

    function clearEnvironment() {

        if (!environmentRoot) {
            return;
        }

        environmentRoot.innerHTML = "";

    }


    /* ========================================================
       FOREST
       ======================================================== */

    function buildForest() {

        const layer =
            createElement(
                "mood-environment-layer",
                environmentRoot
            );


        layer.classList.add("active");


        const forest =
            createElement(
                "forest-environment",
                layer
            );


        /* Canopies */

        createElement(
            "forest-canopy left",
            forest
        );

        createElement(
            "forest-canopy right",
            forest
        );


        /* Branches */

        const branches = [
            {
                left: "-30px",
                top: "110px",
                rotate: "-18deg"
            },
            {
                right: "-40px",
                top: "180px",
                rotate: "16deg"
            },
            {
                left: "-70px",
                top: "330px",
                rotate: "-12deg"
            },
            {
                right: "-60px",
                top: "430px",
                rotate: "14deg"
            }
        ];


        branches.forEach(
            branch => {

                const element =
                    createElement(
                        "forest-branch",
                        forest
                    );


                if (branch.left) {
                    element.style.left =
                        branch.left;
                }

                if (branch.right) {
                    element.style.right =
                        branch.right;
                }

                element.style.top =
                    branch.top;

                element.style.transform =
                    `rotate(${branch.rotate})`;

            }
        );


        /* Leaves */

        const leafCount =
            window.innerWidth < 640
                ? 24
                : 42;


        for (
            let i = 0;
            i < leafCount;
            i++
        ) {

            const leaf =
                createElement(
                    "forest-leaf",
                    forest
                );


            const side =
                i % 2 === 0
                    ? "left"
                    : "right";


            if (side === "left") {

                leaf.style.left =
                    random(
                        1,
                        22
                    ) + "%";

            } else {

                leaf.style.left =
                    random(
                        78,
                        98
                    ) + "%";

            }


            leaf.style.top =
                random(
                    -2,
                    85
                ) + "%";


            setStyle(
                leaf,
                "--leaf-x",
                random(-18, 22) + "px"
            );


            setStyle(
                leaf,
                "--leaf-y",
                random(5, 20) + "px"
            );


            setStyle(
                leaf,
                "--leaf-speed",
                random(7, 13) + "s"
            );


            leaf.style.opacity =
                random(
                    0.35,
                    0.82
                );


            leaf.style.transform =
                `rotate(${random(
                    10,
                    80
                )}deg)`;

        }


        /* Mist */

        createElement(
            "forest-mist",
            forest
        );

    }


    /* ========================================================
       OCEAN
       ======================================================== */

    function buildOcean() {

        const layer =
            createElement(
                "mood-environment-layer",
                environmentRoot
            );


        layer.classList.add("active");


        const ocean =
            createElement(
                "ocean-environment",
                layer
            );


        /* Waves */

        for (
            let i = 0;
            i < 7;
            i++
        ) {

            const wave =
                createElement(
                    "ocean-wave",
                    ocean
                );


            wave.style.top =
                (20 + i * 12) + "%";


            setStyle(
                wave,
                "--wave-speed",
                random(7, 13) + "s"
            );


            wave.style.opacity =
                random(
                    0.18,
                    0.48
                );

        }


        /* Light rays */

        for (
            let i = 0;
            i < 4;
            i++
        ) {

            const ray =
                createElement(
                    "ocean-ray",
                    ocean
                );


            ray.style.left =
                (10 + i * 25) + "%";


            ray.style.opacity =
                random(
                    0.12,
                    0.30
                );

        }


        /* Floating particles */

        const count =
            window.innerWidth < 640
                ? 18
                : 32;


        for (
            let i = 0;
            i < count;
            i++
        ) {

            const particle =
                createElement(
                    "ocean-particle",
                    ocean
                );


            particle.style.left =
                random(
                    5,
                    95
                ) + "%";


            particle.style.top =
                random(
                    55,
                    100
                ) + "%";


            setStyle(
                particle,
                "--particle-speed",
                random(6, 13) + "s"
            );


            setStyle(
                particle,
                "--particle-x",
                random(-30, 30) + "px"
            );

        }

    }


    /* ========================================================
       EMBER
       ======================================================== */

    function buildEmber() {

        const layer =
            createElement(
                "mood-environment-layer",
                environmentRoot
            );


        layer.classList.add("active");


        const ember =
            createElement(
                "ember-environment",
                layer
            );


        createElement(
            "ember-glow",
            ember
        );


        const count =
            window.innerWidth < 640
                ? 24
                : 45;


        for (
            let i = 0;
            i < count;
            i++
        ) {

            const spark =
                createElement(
                    "ember-spark",
                    ember
                );


            spark.style.left =
                random(
                    8,
                    92
                ) + "%";


            spark.style.bottom =
                random(
                    -10,
                    10
                ) + "%";


            setStyle(
                spark,
                "--spark-size",
                random(1.5, 4) + "px"
            );


            setStyle(
                spark,
                "--spark-speed",
                random(4, 9) + "s"
            );


            setStyle(
                spark,
                "--spark-x",
                random(-45, 45) + "px"
            );


            spark.style.animationDelay =
                "-" +
                random(
                    0,
                    8
                ) +
                "s";

        }

    }


    /* ========================================================
       MIDNIGHT
       ======================================================== */

    function buildMidnight() {

        const layer =
            createElement(
                "mood-environment-layer",
                environmentRoot
            );


        layer.classList.add("active");


        const midnight =
            createElement(
                "midnight-environment",
                layer
            );


        /* Moon */

        createElement(
            "midnight-moon",
            midnight
        );


        /* Stars */

        const starCount =
            window.innerWidth < 640
                ? 65
                : 120;


        for (
            let i = 0;
            i < starCount;
            i++
        ) {

            const star =
                createElement(
                    "midnight-star",
                    midnight
                );


            star.style.left =
                random(
                    1,
                    99
                ) + "%";


            star.style.top =
                random(
                    1,
                    95
                ) + "%";


            setStyle(
                star,
                "--star-size",
                random(
                    1,
                    3
                ) + "px"
            );


            setStyle(
                star,
                "--star-opacity",
                random(
                    0.35,
                    0.9
                )
            );


            setStyle(
                star,
                "--star-min",
                random(
                    0.12,
                    0.30
                )
            );


            setStyle(
                star,
                "--star-speed",
                random(
                    2,
                    6
                ) + "s"
            );


            star.style.animationDelay =
                "-" +
                random(
                    0,
                    6
                ) +
                "s";

        }


        /* Atmospheric particles */

        for (
            let i = 0;
            i < 20;
            i++
        ) {

            const particle =
                createElement(
                    "midnight-particle",
                    midnight
                );


            particle.style.left =
                random(
                    5,
                    95
                ) + "%";


            particle.style.top =
                random(
                    20,
                    90
                ) + "%";


            setStyle(
                particle,
                "--float-x",
                random(
                    -35,
                    35
                ) + "px"
            );


            setStyle(
                particle,
                "--float-y",
                random(
                    -30,
                    30
                ) + "px"
            );


            setStyle(
                particle,
                "--particle-speed",
                random(
                    8,
                    16
                ) + "s"
            );

        }

    }


    /* ========================================================
       BUILD ENVIRONMENT
       ======================================================== */

    function buildEnvironment(mood) {

        ensureEnvironmentRoot();

        clearEnvironment();


        switch (mood) {

            case "forest":

                buildForest();

                break;


            case "ocean":

                buildOcean();

                break;


            case "ember":

                buildEmber();

                break;


            case "midnight":

                buildMidnight();

                break;


            case "original":

            default:

                break;

        }

    }


    /* ========================================================
       APPLY MOOD
       ======================================================== */

    function applyMood(mood) {

        if (
            !VALID_MOODS.includes(mood)
        ) {

            mood = "original";

        }


        document.documentElement.dataset.dheereMood =
            mood;


        localStorage.setItem(
            STORAGE_KEY,
            mood
        );


        /*
         * Environment is rebuilt after
         * the visual mood changes.
         */

        buildEnvironment(mood);

    }


    /* ========================================================
       INITIALIZE
       ======================================================== */

    function initializeMood() {

        ensureEnvironmentRoot();


        const savedMood =
            getSavedMood();


        document.documentElement.dataset.dheereMood =
            savedMood;


        buildEnvironment(
            savedMood
        );

    }


    /* ========================================================
       BOOT
       ======================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeMood,
            {
                once: true
            }
        );

    } else {

        initializeMood();

    }


    /* ========================================================
       PUBLIC API
       ======================================================== */

    window.DheereMood = {

        get:
            getSavedMood,

        set:
            applyMood,

        available:
            [
                ...VALID_MOODS
            ]

    };


})();