/* ============================================================
   DHEERE STUDIO — MOOD ENGINE V4
   ------------------------------------------------------------
   Premium / Cinematic / Atmospheric / Ten-Mood System

   01  Original
   02  Forest
   03  Ocean
   04  Ember
   05  Midnight
   06  Prism
   07  Desert
   08  Monsoon
   09  Winter

   Pure CSS + DOM
   No external images
   No canvas
   No external dependencies

   Storage:
   dheereMood

   Public API:
   window.DheereMood.get()
   window.DheereMood.set("winter")
   window.DheereMood.available
   ============================================================ */


(function () {

    "use strict";


    /* ============================================================
       CONFIGURATION
       ============================================================ */

    const STORAGE_KEY =
        "dheereMood";


    const VALID_MOODS = [

        "original",
        "forest",
        "ocean",
        "ember",
        "midnight",
        "prism",
        "desert",
        "monsoon",
        "winter"

    ];


    const TRANSITION_TIME =
        1300;


    const EXIT_BUFFER =
        120;


    const BOOT_DELAY =
        60;


    const MAX_LAYERS =
        3;


    let environmentRoot =
        null;


    let currentMood =
        null;


    let transitionToken =
        0;


    let cleanupTimer =
        null;


    let resizeTimer =
        null;


    let prismStyleInjected =
        false;



    /* ============================================================
       REDUCED MOTION
       ============================================================ */

    const motionQuery =
        window.matchMedia
            ? window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            )
            : null;


    function prefersReducedMotion() {

        return Boolean(
            motionQuery &&
            motionQuery.matches
        );

    }


    /* ============================================================
       STORAGE
       ============================================================ */

    function getSavedMood() {

        try {

            const saved =
                localStorage.getItem(
                    STORAGE_KEY
                );


            if (
                VALID_MOODS.includes(
                    saved
                )
            ) {

                return saved;

            }

        } catch (
            error
        ) {

            /*
             * Storage can be unavailable.
             * The visual system still works.
             */

        }


        return "original";

    }


    function saveMood(
        mood
    ) {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                mood
            );

        } catch (
            error
        ) {

            /*
             * Persistence is optional.
             */

        }

    }


    /* ============================================================
       GENERIC HELPERS
       ============================================================ */

    function random(
        min,
        max
    ) {

        return (
            Math.random() *
            (
                max -
                min
            )
        ) + min;

    }


    function clamp(
        value,
        min,
        max
    ) {

        return Math.min(
            max,
            Math.max(
                min,
                value
            )
        );

    }


    function createElement(
        className,
        parent
    ) {

        const element =
            document.createElement(
                "div"
            );


        element.className =
            className;


        if (
            parent
        ) {

            parent.appendChild(
                element
            );

        }


        return element;

    }


    function setVar(
        element,
        property,
        value
    ) {

        if (
            element
        ) {

            element.style.setProperty(
                property,
                value
            );

        }

    }


    function isMobile() {

        return (
            window.innerWidth <=
            640
        );

    }


    function isSmallMobile() {

        return (
            window.innerWidth <=
            430
        );

    }


    function motionScale() {

        if (
            prefersReducedMotion()
        ) {

            return 0;

        }


        if (
            isSmallMobile()
        ) {

            return .46;

        }


        if (
            isMobile()
        ) {

            return .66;

        }


        if (
            window.innerWidth <
            1000
        ) {

            return .83;

        }


        return 1;

    }


    function applyRandomDelay(
        element,
        min,
        max
    ) {

        if (
            prefersReducedMotion()
        ) {

            return;

        }


        element.style.animationDelay =
            "-" +
            random(
                min,
                max
            ) +
            "s";

    }


    /* ============================================================
       ENVIRONMENT ROOT
       ============================================================ */

    function ensureEnvironmentRoot() {

        environmentRoot =
            document.getElementById(
                "dheereEnvironment"
            );


        if (
            environmentRoot
        ) {

            return environmentRoot;

        }


        environmentRoot =
            document.createElement(
                "div"
            );


        environmentRoot.id =
            "dheereEnvironment";


        environmentRoot.setAttribute(
            "aria-hidden",
            "true"
        );


        Object.assign(
            environmentRoot.style,
            {

                position:
                    "fixed",

                inset:
                    "0",

                zIndex:
                    "0",

                pointerEvents:
                    "none",

                overflow:
                    "hidden",

                isolation:
                    "isolate",

                userSelect:
                    "none"

            }
        );


        document.body.prepend(
            environmentRoot
        );


        return environmentRoot;

    }


    /* ============================================================
       LAYER MANAGEMENT
       ============================================================ */

    function createLayer(
        mood
    ) {

        const root =
            ensureEnvironmentRoot();


        const layer =
            document.createElement(
                "div"
            );


        layer.className =
            "mood-environment-layer";


        layer.dataset.mood =
            mood;


        Object.assign(
            layer.style,
            {

                position:
                    "absolute",

                inset:
                    "0",

                overflow:
                    "hidden",

                pointerEvents:
                    "none",

                opacity:
                    "0",

                contain:
                    "paint",

                transition:
                    prefersReducedMotion()
                        ? "none"
                        : `opacity ${TRANSITION_TIME}ms cubic-bezier(.22,1,.36,1)`

            }
        );


        root.appendChild(
            layer
        );


        layer.getBoundingClientRect();


        requestAnimationFrame(
            function () {

                requestAnimationFrame(
                    function () {

                        layer.style.opacity =
                            "1";

                    }
                );

            }
        );


        return layer;

    }


    function fadeOutLayer(
        layer
    ) {

        if (
            !layer
        ) {

            return;

        }


        layer.style.opacity =
            "0";


        if (
            prefersReducedMotion()
        ) {

            layer.remove();

            return;

        }


        window.setTimeout(
            function () {

                if (
                    layer &&
                    layer.parentNode
                ) {

                    layer.remove();

                }

            },
            TRANSITION_TIME + 100
        );

    }


    function cleanupInactiveLayers(
        activeLayer
    ) {

        if (
            !environmentRoot
        ) {

            return;

        }


        Array.from(
            environmentRoot.children
        ).forEach(
            function (
                layer
            ) {

                if (
                    layer !==
                    activeLayer
                ) {

                    fadeOutLayer(
                        layer
                    );

                }

            }
        );

    }


    function trimLayerStack() {

        if (
            !environmentRoot
        ) {

            return;

        }


        const layers =
            Array.from(
                environmentRoot.children
            );


        if (
            layers.length <=
            MAX_LAYERS
        ) {

            return;

        }


        const excess =
            layers.length -
            MAX_LAYERS;


        layers
            .slice(
                0,
                excess
            )
            .forEach(
                layer =>
                    layer.remove()
            );

    }


    function clearEnvironment() {

        if (
            environmentRoot
        ) {

            environmentRoot.innerHTML =
                "";

        }

    }


    /* ============================================================
       ORIGINAL
       ============================================================ */

    function buildOriginal(
        layer
    ) {

        layer.dataset.environment =
            "original";

    }


    /* ============================================================
       FOREST
       ============================================================ */

    function buildForest(
        layer
    ) {

        const forest =
            createElement(
                "forest-environment",
                layer
            );


        createElement(
            "forest-canopy left",
            forest
        );


        createElement(
            "forest-canopy right",
            forest
        );


        const branches = [

            {
                side:
                    "left",

                top:
                    "8%",

                width:
                    "245px",

                angle:
                    "-17deg"

            },

            {
                side:
                    "right",

                top:
                    "25%",

                width:
                    "270px",

                angle:
                    "15deg"

            },

            {
                side:
                    "left",

                top:
                    "49%",

                width:
                    "205px",

                angle:
                    "-11deg"

            },

            {
                side:
                    "right",

                top:
                    "70%",

                width:
                    "230px",

                angle:
                    "12deg"

            }

        ];


        branches.forEach(
            function (
                data
            ) {

                const branch =
                    createElement(
                        "forest-branch",
                        forest
                    );


                if (
                    data.side ===
                    "left"
                ) {

                    branch.style.left =
                        "-48px";

                } else {

                    branch.style.right =
                        "-58px";

                }


                branch.style.top =
                    data.top;


                branch.style.width =
                    data.width;


                branch.style.transform =
                    `rotate(${data.angle})`;

            }
        );


        const scale =
            motionScale();


        if (
            scale === 0
        ) {

            createElement(
                "forest-mist",
                forest
            );

            return;

        }


        const leafCount =
            Math.max(
                10,
                Math.round(
                    30 * scale
                )
            );


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


            const leftSide =
                i %
                2 ===
                0;


            leaf.style.left =
                leftSide
                    ? random(
                        -2,
                        26
                    ) + "%"
                    : random(
                        74,
                        102
                    ) + "%";


            leaf.style.top =
                random(
                    0,
                    88
                ) + "%";


            setVar(
                leaf,
                "--leaf-x",
                random(
                    -4,
                    20
                ) + "px"
            );


            setVar(
                leaf,
                "--leaf-y",
                random(
                    6,
                    18
                ) + "px"
            );


            setVar(
                leaf,
                "--leaf-speed",
                random(
                    8,
                    16
                ) + "s"
            );


            leaf.style.opacity =
                random(
                    .24,
                    .64
                );


            applyRandomDelay(
                leaf,
                0,
                14
            );

        }


        createElement(
            "forest-mist",
            forest
        );

    }


    /* ============================================================
       OCEAN
       ============================================================ */

    function buildOcean(
        layer
    ) {

        const ocean =
            createElement(
                "ocean-environment",
                layer
            );


        const waveCount =
            isSmallMobile()
                ? 5
                : isMobile()
                    ? 6
                    : 8;


        for (
            let i = 0;
            i < waveCount;
            i++
        ) {

            const wave =
                createElement(
                    "ocean-wave",
                    ocean
                );


            wave.style.top =
                (
                    15 +
                    i * 11
                ) + "%";


            const depth =
                i /
                Math.max(
                    waveCount -
                    1,
                    1
                );


            wave.style.opacity =
                clamp(
                    .38 -
                    depth * .22 +
                    random(
                        -.03,
                        .03
                    ),
                    .10,
                    .38
                );


            setVar(
                wave,
                "--wave-speed",
                random(
                    10,
                    18
                ) + "s"
            );


            applyRandomDelay(
                wave,
                0,
                12
            );

        }


        const rayCount =
            isMobile()
                ? 2
                : 4;


        for (
            let i = 0;
            i < rayCount;
            i++
        ) {

            const ray =
                createElement(
                    "ocean-ray",
                    ocean
                );


            ray.style.left =
                (
                    5 +
                    i *
                    (
                        90 /
                        Math.max(
                            rayCount -
                            1,
                            1
                        )
                    )
                ) + "%";


            setVar(
                ray,
                "--ray-speed",
                random(
                    11,
                    18
                ) + "s"
            );


            ray.style.opacity =
                random(
                    .08,
                    .18
                );


            applyRandomDelay(
                ray,
                0,
                14
            );

        }


        const scale =
            motionScale();


        if (
            scale === 0
        ) {

            return;

        }


        const particleCount =
            Math.max(
                8,
                Math.round(
                    28 * scale
                )
            );


        for (
            let i = 0;
            i < particleCount;
            i++
        ) {

            const particle =
                createElement(
                    "ocean-particle",
                    ocean
                );


            particle.style.left =
                random(
                    2,
                    98
                ) + "%";


            particle.style.top =
                random(
                    42,
                    100
                ) + "%";


            setVar(
                particle,
                "--particle-speed",
                random(
                    9,
                    19
                ) + "s"
            );


            setVar(
                particle,
                "--particle-x",
                random(
                    -30,
                    30
                ) + "px"
            );


            particle.style.opacity =
                random(
                    .15,
                    .50
                );


            applyRandomDelay(
                particle,
                0,
                15
            );

        }

    }


    /* ============================================================
       EMBER
       ============================================================ */

    function buildEmber(
        layer
    ) {

        const ember =
            createElement(
                "ember-environment",
                layer
            );


        const glow =
            createElement(
                "ember-glow",
                ember
            );


        setVar(
            glow,
            "--ember-intensity",
            "1"
        );


        const secondGlow =
            createElement(
                "ember-glow",
                ember
            );


        secondGlow.style.left =
            "30%";


        secondGlow.style.bottom =
            "-240px";


        secondGlow.style.width =
            "480px";


        secondGlow.style.height =
            "360px";


        secondGlow.style.opacity =
            ".42";


        const scale =
            motionScale();


        if (
            scale === 0
        ) {

            return;

        }


        const sparkCount =
            Math.max(
                8,
                Math.round(
                    36 * scale
                )
            );


        for (
            let i = 0;
            i < sparkCount;
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
                    -8,
                    12
                ) + "%";


            setVar(
                spark,
                "--spark-size",
                random(
                    1.2,
                    3.8
                ) + "px"
            );


            setVar(
                spark,
                "--spark-speed",
                random(
                    5,
                    10
                ) + "s"
            );


            setVar(
                spark,
                "--spark-x",
                random(
                    -38,
                    38
                ) + "px"
            );


            spark.style.opacity =
                random(
                    .28,
                    .78
                );


            applyRandomDelay(
                spark,
                0,
                12
            );

        }

    }


    /* ============================================================
       MIDNIGHT
       ============================================================ */

    function buildMidnight(
        layer
    ) {

        const midnight =
            createElement(
                "midnight-environment",
                layer
            );


        createElement(
            "midnight-moon",
            midnight
        );


        const scale =
            motionScale();


        if (
            scale === 0
        ) {

            return;

        }


        const starCount =
            Math.max(
                32,
                Math.round(
                    108 * scale
                )
            );


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
                    98
                ) + "%";


            setVar(
                star,
                "--star-size",
                random(
                    .7,
                    2.5
                ) + "px"
            );


            setVar(
                star,
                "--star-opacity",
                random(
                    .18,
                    .74
                )
            );


            setVar(
                star,
                "--star-min",
                random(
                    .04,
                    .17
                )
            );


            setVar(
                star,
                "--star-speed",
                random(
                    3.8,
                    8
                ) + "s"
            );


            applyRandomDelay(
                star,
                0,
                10
            );

        }


        const particleCount =
            Math.max(
                6,
                Math.round(
                    18 * scale
                )
            );


        for (
            let i = 0;
            i < particleCount;
            i++
        ) {

            const particle =
                createElement(
                    "midnight-particle",
                    midnight
                );


            particle.style.left =
                random(
                    4,
                    96
                ) + "%";


            particle.style.top =
                random(
                    16,
                    96
                ) + "%";


            setVar(
                particle,
                "--float-x",
                random(
                    -32,
                    32
                ) + "px"
            );


            setVar(
                particle,
                "--float-y",
                random(
                    -30,
                    26
                ) + "px"
            );


            setVar(
                particle,
                "--particle-speed",
                random(
                    12,
                    22
                ) + "s"
            );


            particle.style.opacity =
                random(
                    .08,
                    .30
                );


            applyRandomDelay(
                particle,
                0,
                15
            );

        }

    }


    /* ============================================================
       PRISM CSS
       ============================================================ */

    function injectPrismEnvironmentCSS() {

        if (
            prismStyleInjected
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "dheere-prism-environment-v4";


        style.textContent = `

        .prism-environment-v2 {
            position:absolute;
            inset:0;
            overflow:hidden;
            isolation:isolate;
        }

        .prism-environment-v2::before {
            content:"";
            position:absolute;
            inset:-15%;
            background:
                radial-gradient(
                    ellipse at 15% 15%,
                    rgba(54,218,255,.075),
                    transparent 27%
                ),
                radial-gradient(
                    ellipse at 78% 18%,
                    rgba(177,94,255,.08),
                    transparent 28%
                ),
                radial-gradient(
                    ellipse at 84% 82%,
                    rgba(255,105,158,.065),
                    transparent 27%
                ),
                radial-gradient(
                    ellipse at 18% 84%,
                    rgba(102,223,156,.055),
                    transparent 27%
                );
            filter:blur(22px);
            animation:
                dheerePrismWorld
                22s
                ease-in-out
                infinite
                alternate;
        }

        .prism-spectrum-field {
            position:absolute;
            inset:-25%;
            background:
                conic-gradient(
                    from 170deg at 44% 50%,
                    rgba(50,218,255,0),
                    rgba(50,218,255,.08),
                    rgba(113,107,255,.10),
                    rgba(194,100,255,.10),
                    rgba(255,105,157,.075),
                    rgba(255,187,93,.065),
                    rgba(105,221,156,.055),
                    rgba(50,218,255,0)
                );
            filter:
                blur(54px)
                saturate(115%);
            opacity:.72;
            animation:
                dheerePrismSpectrum
                25s
                ease-in-out
                infinite
                alternate;
        }

        .prism-light-band {
            position:absolute;
            height:18vh;
            min-height:110px;
            border-radius:999px;
            filter:blur(30px);
            opacity:.18;
            transform-origin:center;
            mix-blend-mode:screen;
            animation:
                dheerePrismBand
                var(--prism-speed,18s)
                ease-in-out
                infinite
                alternate;
        }

        .prism-light-band.one {
            width:78vw;
            left:-18vw;
            top:23vh;
            transform:rotate(-12deg);
            background:
                linear-gradient(
                    90deg,
                    transparent,
                    rgba(62,220,255,.30),
                    rgba(137,105,255,.30),
                    transparent
                );
        }

        .prism-light-band.two {
            width:72vw;
            right:-22vw;
            top:48vh;
            transform:rotate(9deg);
            opacity:.13;
            background:
                linear-gradient(
                    90deg,
                    transparent,
                    rgba(241,105,191,.28),
                    rgba(255,191,91,.25),
                    transparent
                );
            --prism-speed:21s;
        }

        .prism-light-band.three {
            width:60vw;
            left:14vw;
            bottom:-2vh;
            transform:rotate(-5deg);
            opacity:.10;
            background:
                linear-gradient(
                    90deg,
                    transparent,
                    rgba(105,221,156,.25),
                    rgba(69,208,255,.20),
                    transparent
                );
            --prism-speed:24s;
        }

        .prism-refraction {
            position:absolute;
            width:18px;
            height:45vh;
            top:24vh;
            border-radius:999px;
            filter:blur(16px);
            opacity:.13;
            transform:rotate(
                var(--prism-angle,18deg)
            );
            background:
                linear-gradient(
                    180deg,
                    rgba(61,218,255,0),
                    rgba(61,218,255,.26),
                    rgba(170,105,255,.22),
                    rgba(255,106,160,.20),
                    rgba(255,193,95,.14),
                    rgba(103,221,157,0)
                );
            animation:
                dheerePrismRefraction
                var(--prism-speed,19s)
                ease-in-out
                infinite
                alternate;
        }

        .prism-refraction.one {
            left:22%;
            --prism-angle:17deg;
            --prism-speed:18s;
        }

        .prism-refraction.two {
            left:47%;
            opacity:.09;
            --prism-angle:21deg;
            --prism-speed:23s;
        }

        .prism-refraction.three {
            left:74%;
            opacity:.075;
            --prism-angle:15deg;
            --prism-speed:27s;
        }

        .prism-atmosphere-particle {
            position:absolute;
            width:var(--size,3px);
            height:var(--size,3px);
            border-radius:50%;
            background:
                var(
                    --particle-color,
                    rgba(205,193,255,.55)
                );
            box-shadow:
                0 0 13px
                var(
                    --particle-color,
                    rgba(205,193,255,.25)
                );
            opacity:
                var(--opacity,.35);
            animation:
                dheerePrismParticle
                var(--speed,12s)
                ease-in-out
                infinite
                alternate;
        }

        @keyframes dheerePrismWorld {
            0% {
                transform:
                    translate3d(-12px,8px,0)
                    scale(.98);
            }

            100% {
                transform:
                    translate3d(22px,-16px,0)
                    scale(1.06);
            }
        }

        @keyframes dheerePrismSpectrum {
            0% {
                transform:
                    translate3d(-3%,-2%,0)
                    rotate(-3deg)
                    scale(.98);
            }

            100% {
                transform:
                    translate3d(4%,3%,0)
                    rotate(5deg)
                    scale(1.05);
            }
        }

        @keyframes dheerePrismBand {
            0% {
                margin-left:-18px;
                opacity:.52;
            }

            100% {
                margin-left:28px;
                opacity:.95;
            }
        }

        @keyframes dheerePrismRefraction {
            0% {
                margin-left:-14px;
                opacity:.30;
            }

            100% {
                margin-left:20px;
                opacity:.85;
            }
        }

        @keyframes dheerePrismParticle {
            0% {
                transform:
                    translate3d(0,0,0)
                    scale(.75);
                opacity:.10;
            }

            100% {
                transform:
                    translate3d(
                        var(--drift-x,18px),
                        var(--drift-y,-28px),
                        0
                    )
                    scale(1.15);
                opacity:
                    var(--opacity,.45);
            }
        }

        `;


        document.head.appendChild(
            style
        );


        prismStyleInjected =
            true;

    }


    /* ============================================================
       PRISM
       ============================================================ */

    function buildPrism(
        layer
    ) {

        injectPrismEnvironmentCSS();


        const prism =
            createElement(
                "prism-environment-v2",
                layer
            );


        createElement(
            "prism-spectrum-field",
            prism
        );


        createElement(
            "prism-light-band one",
            prism
        );


        createElement(
            "prism-light-band two",
            prism
        );


        createElement(
            "prism-light-band three",
            prism
        );


        createElement(
            "prism-refraction one",
            prism
        );


        createElement(
            "prism-refraction two",
            prism
        );


        createElement(
            "prism-refraction three",
            prism
        );


        const scale =
            motionScale();


        if (
            scale === 0
        ) {

            return;

        }


        const particleCount =
            Math.max(
                12,
                Math.round(
                    34 * scale
                )
            );


        const particleColors = [

            "rgba(72,218,255,.52)",

            "rgba(143,111,255,.48)",

            "rgba(205,111,255,.46)",

            "rgba(255,110,161,.42)",

            "rgba(255,194,96,.40)",

            "rgba(105,221,157,.40)"

        ];


        for (
            let i = 0;
            i < particleCount;
            i++
        ) {

            const particle =
                createElement(
                    "prism-atmosphere-particle",
                    prism
                );


            particle.style.left =
                random(
                    4,
                    96
                ) + "%";


            particle.style.top =
                random(
                    8,
                    92
                ) + "%";


            setVar(
                particle,
                "--size",
                random(
                    1,
                    3.5
                ) + "px"
            );


            setVar(
                particle,
                "--opacity",
                random(
                    .16,
                    .48
                )
            );


            setVar(
                particle,
                "--drift-x",
                random(
                    -28,
                    28
                ) + "px"
            );


            setVar(
                particle,
                "--drift-y",
                random(
                    -24,
                    24
                ) + "px"
            );


            setVar(
                particle,
                "--speed",
                random(
                    11,
                    20
                ) + "s"
            );


            setVar(
                particle,
                "--particle-color",
                particleColors[
                    i %
                    particleColors.length
                ]
            );


            applyRandomDelay(
                particle,
                0,
                15
            );

        }

    }


    /* ============================================================
       DESERT
       ============================================================ */

    function buildDesert(
    layer
) {

    const desert =
        createElement(
            "desert-environment",
            layer
        );


    const sky =
        createElement(
            "desert-sky",
            desert
        );


    const sun =
        createElement(
            "desert-sun",
            desert
        );


    const horizon =
        createElement(
            "desert-horizon",
            desert
        );


    const dunesFar =
        createElement(
            "desert-dunes-far",
            desert
        );


    const dunesMid =
        createElement(
            "desert-dunes-mid",
            desert
        );


    const haze =
        createElement(
            "desert-haze",
            desert
        );


    const wind =
        createElement(
            "desert-wind",
            desert
        );


    const gusts =
        createElement(
            "desert-gusts",
            desert
        );


    setStyles(
        sky,
        {

            position:
                "absolute",

            inset:
                "0",

            background:
                "linear-gradient(180deg, rgba(255,255,246,.98) 0%, rgba(255,249,219,.90) 12%, rgba(255,231,175,.50) 30%, rgba(239,212,164,.16) 48%, transparent 74%, rgba(89,68,46,.045) 100%)",

            pointerEvents:
                "none"

        }
    );


    setStyles(
        sun,
        {

            position:
                "absolute",

            right:
                "14%",

            top:
                "7%",

            width:
                "74px",

            height:
                "74px",

            borderRadius:
                "50%",

            background:
                "radial-gradient(circle at 35% 32%, #ffffff 0%, #fffdf0 23%, #fff4bf 46%, #ffe08a 68%, rgba(246,197,103,0) 100%)",

            boxShadow:
                "0 0 34px rgba(255,248,208,.62), 0 0 92px rgba(255,218,139,.30)",

            opacity:
                ".98",

            pointerEvents:
                "none"

        }
    );


    setStyles(
        horizon,
        {

            position:
                "absolute",

            left:
                "-12%",

            right:
                "-12%",

            bottom:
                "34%",

            height:
                "2px",

            background:
                "linear-gradient(90deg, transparent, rgba(222,193,152,.14), rgba(177,148,109,.18), transparent)",

            filter:
                "blur(.7px)",

            opacity:
                ".82"

        }
    );


    setStyles(
        dunesFar,
        {

            position:
                "absolute",

            left:
                "-10%",

            right:
                "-10%",

            bottom:
                "19%",

            height:
                "36%",

            background:
                "radial-gradient(ellipse at 18% 82%, rgba(173,145,106,.16), transparent 34%), radial-gradient(ellipse at 61% 76%, rgba(157,128,91,.12), transparent 36%), radial-gradient(ellipse at 88% 88%, rgba(132,105,76,.11), transparent 29%)",

            filter:
                "blur(4px)"

        }
    );


    setStyles(
        dunesMid,
        {

            position:
                "absolute",

            left:
                "-16%",

            right:
                "-16%",

            bottom:
                "5%",

            height:
                "34%",

            background:
                "radial-gradient(ellipse at 12% 92%, rgba(119,95,66,.15), transparent 37%), radial-gradient(ellipse at 54% 84%, rgba(136,105,72,.17), transparent 39%), radial-gradient(ellipse at 89% 95%, rgba(103,80,55,.14), transparent 33%)",

            filter:
                "blur(1.5px)"

        }
    );


    setStyles(
        haze,
        {

            position:
                "absolute",

            left:
                "-10%",

            right:
                "-10%",

            bottom:
                "16%",

            height:
                "31%",

            background:
                "radial-gradient(ellipse at center, rgba(222,199,167,.045), transparent 68%)",

            filter:
                "blur(24px)",

            opacity:
                ".72"

        }
    );



    setStyles(
        gusts,
        {

            position:
                "absolute",

            inset:
                "-20%",

            background:
                "linear-gradient(180deg, transparent 0 44%, rgba(224,203,174,.045) 47%, transparent 51% 100%)",

            filter:
                "blur(11px)",

            opacity:
                prefersReducedMotion()
                    ? ".08"
                    : ".24",

            animation:
                prefersReducedMotion()
                    ? "none"
                    : "mood-desert-gust 4.8s ease-in-out infinite alternate"

        }
    );


    const scale =
        motionScale();


    if (
        scale === 0
    ) {

        return;

    }


    const dustCount =
        Math.max(
            24,
            Math.round(
                86 * scale
            )
        );


    for (
        let i = 0;
        i < dustCount;
        i++
    ) {

        const dust =
            createElement(
                "desert-dust-particle",
                desert
            );


        dust.style.left =
            random(
                -8,
                100
            ) + "%";


        dust.style.top =
            random(
                48,
                94
            ) + "%";


        setVar(
            dust,
            "--dust-speed",
            random(
                2.9,
                6.8
            ) + "s"
        );


        setVar(
            dust,
            "--dust-drift",
            random(
                60,
                150
            ) + "px"
        );


        setVar(
            dust,
            "--dust-rise",
            random(
                -4,
                -24
            ) + "px"
        );


        setVar(
            dust,
            "--dust-size",
            random(
                .65,
                2.2
            ) + "px"
        );


        dust.style.opacity =
            random(
                .10,
                .34
            );


        applyRandomDelay(
            dust,
            0,
            7
        );

    }


    const fineCount =
        Math.max(
            10,
            Math.round(
                28 * scale
            )
        );


    for (
        let i = 0;
        i < fineCount;
        i++
    ) {

        const fine =
            createElement(
                "desert-dust-fine",
                desert
            );


        fine.style.left =
            random(
                -4,
                102
            ) + "%";


        fine.style.top =
            random(
                35,
                86
            ) + "%";


        setVar(
            fine,
            "--fine-speed",
            random(
                5,
                10
            ) + "s"
        );


        setVar(
            fine,
            "--fine-drift",
            random(
                80,
                190
            ) + "px"
        );


        setVar(
            fine,
            "--fine-size",
            random(
                .5,
                1.35
            ) + "px"
        );


        fine.style.opacity =
            random(
                .08,
                .22
            );


        applyRandomDelay(
            fine,
            0,
            10
        );

    }

}
    /* ============================================================
       MONSOON
       ============================================================ */

    function buildMonsoon(
    layer
) {

    const monsoon =
        createElement(
            "monsoon-environment",
            layer
        );


    const clouds =
        createElement(
            "monsoon-clouds",
            monsoon
        );




    const drops =
        createElement(
            "monsoon-drops",
            monsoon
        );



    const ground =
        createElement(
            "monsoon-ground",
            monsoon
        );


    const lightning =
        createElement(
            "monsoon-lightning",
            monsoon
        );


    setStyles(
        clouds,
        {

            position:
                "absolute",

            inset:
                "0",

            background:
                "radial-gradient(ellipse at 22% 16%, rgba(78,94,103,.19), transparent 32%), radial-gradient(ellipse at 72% 18%, rgba(66,84,93,.18), transparent 36%), radial-gradient(ellipse at 50% 42%, rgba(43,57,63,.10), transparent 50%), linear-gradient(180deg, rgba(48,61,68,.08), transparent 70%)",

            filter:
                "blur(28px)",

            animation:
                prefersReducedMotion()
                    ? "none"
                    : "mood-monsoon-clouds 18s ease-in-out infinite alternate"

        }
    );





    setStyles(
        ground,
        {

            position:
                "absolute",

            left:
                "0",

            right:
                "0",

            bottom:
                "0",

            height:
                "31%",

            background:
                "linear-gradient(180deg, transparent, rgba(28,63,67,.30) 58%, rgba(11,30,33,.44))",

            overflow:
                "hidden"

        }
    );


    setStyles(
        lightning,
        {

            position:
                "absolute",

            inset:
                "0",

            background:
                "rgba(225,242,250,.13)",

            opacity:
                "0",

            animation:
                prefersReducedMotion()
                    ? "none"
                    : "mood-monsoon-lightning 8.5s ease-in-out infinite"

        }
    );


    const scale =
        motionScale();


    if (
        scale === 0
    ) {

        return;

    }


    const dropCount =
        Math.max(
            36,
            Math.round(
                132 * scale
            )
        );


    for (
        let i = 0;
        i < dropCount;
        i++
    ) {

        const drop =
            createElement(
                "monsoon-drop",
                drops
            );


        drop.style.left =
            random(
                -3,
                103
            ) + "%";


        drop.style.top =
            random(
                -18,
                94
            ) + "%";


        setVar(
            drop,
            "--drop-length",
            random(
                18,
                42
            ) + "px"
        );


        setVar(
            drop,
            "--drop-width",
            random(
                1.8,
                3.2
            ) + "px"
        );


        setVar(
            drop,
            "--drop-speed",
            random(
                .55,
                1.25
            ) + "s"
        );


        setVar(
            drop,
            "--drop-drift",
            random(
                18,
                52
            ) + "px"
        );


        drop.style.opacity =
            random(
                .20,
                .68
            );


        applyRandomDelay(
            drop,
            0,
            4
        );

    }


    const foregroundCount =
        Math.max(
            8,
            Math.round(
                28 * scale
            )
        );


    for (
        let i = 0;
        i < foregroundCount;
        i++
    ) {

        const drop =
            createElement(
                "monsoon-drop-foreground",
                drops
            );


        drop.style.left =
            random(
                0,
                100
            ) + "%";


        drop.style.top =
            random(
                -10,
                85
            ) + "%";


        setVar(
            drop,
            "--drop-fg-speed",
            random(
                .9,
                1.8
            ) + "s"
        );


        setVar(
            drop,
            "--drop-fg-drift",
            random(
                18,
                42
            ) + "px"
        );


        setVar(
            drop,
            "--drop-fg-height",
            random(
                28,
                58
            ) + "px"
        );


        setVar(
            drop,
            "--drop-fg-width",
            random(
                2.4,
                4.2
            ) + "px"
        );


        drop.style.opacity =
            random(
                .28,
                .72
            );


        applyRandomDelay(
            drop,
            0,
            5
        );

    }


    const microDropCount =
        Math.max(
            90,
            Math.round(
                260 * scale
            )
        );


    for (
        let i = 0;
        i < microDropCount;
        i++
    ) {

        const drop =
            createElement(
                "monsoon-drop-micro",
                drops
            );


        drop.style.left =
            random(
                -4,
                104
            ) + "%";


        drop.style.top =
            random(
                -14,
                100
            ) + "%";


        setVar(
            drop,
            "--micro-drop-size",
            random(
                .9,
                1.7
            ) + "px"
        );


        setVar(
            drop,
            "--micro-drop-length",
            random(
                10,
                22
            ) + "px"
        );


        setVar(
            drop,
            "--micro-drop-speed",
            random(
                .24,
                .62
            ) + "s"
        );


        setVar(
            drop,
            "--micro-drop-drift",
            random(
                8,
                26
            ) + "px"
        );


        drop.style.opacity =
            random(
                .14,
                .42
            );


        applyRandomDelay(
            drop,
            0,
            2.5
        );

    }


    const rippleCount =
        Math.max(
            12,
            Math.round(
                30 * scale
            )
        );


    for (
        let i = 0;
        i < rippleCount;
        i++
    ) {

        const ripple =
            createElement(
                "monsoon-ripple",
                ground
            );


        ripple.style.left =
            random(
                4,
                96
            ) + "%";


        ripple.style.bottom =
            random(
                2,
                20
            ) + "%";


        setVar(
            ripple,
            "--ripple-delay",
            random(
                0,
                5
            ) + "s"
        );


        setVar(
            ripple,
            "--ripple-size",
            random(
                12,
                42
            ) + "px"
        );

    }

}
    /* ============================================================
       WINTER
       ============================================================ */

    function buildWinter(
    layer
) {

    const winter =
        createElement(
            "winter-environment",
            layer
        );


    const frost =
        createElement(
            "winter-frost",
            winter
        );


    const ground =
        createElement(
            "winter-ground",
            winter
        );


    const snow =
        createElement(
            "winter-snow",
            winter
        );


    const iceDust =
        createElement(
            "winter-ice-dust",
            winter
        );


    const wind =
        createElement(
            "winter-wind",
            winter
        );


    const iceCrystals =
        createElement(
            "winter-ice-crystals",
            winter
        );


    setStyles(
        frost,
        {

            position:
                "absolute",

            inset:
                "0",

            background:
                "radial-gradient(ellipse at 50% 0%, rgba(194,226,241,.18), transparent 54%), radial-gradient(ellipse at 20% 70%, rgba(173,214,232,.05), transparent 42%)",

            filter:
                "blur(2px)",

            opacity:
                ".88"

        }
    );


    setStyles(
        ground,
        {

            position:
                "absolute",

            left:
                "0",

            right:
                "0",

            bottom:
                "0",

            height:
                "28%",

            background:
                "linear-gradient(180deg, transparent, rgba(217,239,249,.09) 50%, rgba(204,229,241,.16))",

            filter:
                "blur(2px)"

        }
    );


    setStyles(
        snow,
        {

            position:
                "absolute",

            inset:
                "-20%",

            opacity:
                prefersReducedMotion()
                    ? ".18"
                    : ".46",

        }
    );


    setStyles(
        iceDust,
        {

            position:
                "absolute",

            inset:
                "-20%",

            opacity:
                prefersReducedMotion()
                    ? ".11"
                    : ".24",

            background:
                "radial-gradient(ellipse at center, rgba(210,237,247,.05), transparent 70%)",

            transform:
                "rotate(-6deg)",

            animation:
                prefersReducedMotion()
                    ? "none"
                    : "mood-winter-ice-dust 4.6s linear infinite"

        }
    );


    setStyles(
        wind,
        {

            position:
                "absolute",

            inset:
                "-20%",

            opacity:
                prefersReducedMotion()
                    ? ".08"
                    : ".19",

            background:
                "radial-gradient(ellipse at center, rgba(222,244,251,.05), transparent 72%)",

            transform:
                "rotate(-6deg)",

            animation:
                prefersReducedMotion()
                    ? "none"
                    : "mood-winter-wind 3.4s linear infinite"

        }
    );


    setStyles(
        iceCrystals,
        {

            position:
                "absolute",

            inset:
                "-15%",

            background:
                "radial-gradient(ellipse at center, rgba(215,242,251,.045), transparent 72%)",

            opacity:
                prefersReducedMotion()
                    ? ".08"
                    : ".18",

            animation:
                prefersReducedMotion()
                    ? "none"
                    : "mood-winter-crystals 6.5s linear infinite"

        }
    );


    const scale =
        motionScale();


    if (
        scale === 0
    ) {

        return;

    }


    /* --------------------------------------------------------
       ICE CRYSTALS ONLY
       --------------------------------------------------------
       Winter intentionally has no falling snowflake particles.
       All visible falling particles are ice crystals.
       -------------------------------------------------------- */


    const iceCount =
        Math.max(
            55,
            Math.round(
                185 * scale
            )
        );


    for (
        let i = 0;
        i < iceCount;
        i++
    ) {

        const crystal =
            createElement(
                "winter-ice-particle",
                winter
            );


        crystal.style.left =
            random(
                -5,
                105
            ) + "%";


        crystal.style.top =
            random(
                -10,
                96
            ) + "%";


        setVar(
            crystal,
            "--ice-speed",
            random(
                3.0,
                7.6
            ) + "s"
        );


        setVar(
            crystal,
            "--ice-drift",
            random(
                -55,
                55
            ) + "px"
        );


        const crystalRoll =
            Math.random();


        setVar(
            crystal,
            "--ice-size",
            crystalRoll < .62
                ? random(
                    3.5,
                    7.5
                ) + "px"
                : crystalRoll < .90
                    ? random(
                        7.5,
                        12.5
                    ) + "px"
                    : random(
                        12,
                        19
                    ) + "px"
        );


        setVar(
            crystal,
            "--ice-width",
            crystalRoll < .62
                ? random(
                    1.5,
                    3.6
                ) + "px"
                : crystalRoll < .90
                    ? random(
                        2.8,
                        5.6
                    ) + "px"
                    : random(
                        4.8,
                        8.4
                    ) + "px"
        );


        setVar(
            crystal,
            "--ice-fall",
            random(
                88,
                135
            ) + "vh"
        );


        setVar(
            crystal,
            "--ice-rotation",
            random(
                -40,
                40
            ) + "deg"
        );


        crystal.style.opacity =
            crystalRoll < .62
                ? random(
                    .26,
                    .58
                )
                : crystalRoll < .90
                    ? random(
                        .38,
                        .72
                    )
                    : random(
                        .50,
                        .86
                    );


        applyRandomDelay(
            crystal,
            0,
            10
        );

    }

}
    /* ============================================================
       STATIC STYLE HELPER
       ============================================================ */

    function setStyles(
        element,
        styles
    ) {

        if (
            !element ||
            !styles
        ) {

            return;

        }


        Object.assign(
            element.style,
            styles
        );

    }


    /* ============================================================
       ANIMATION STYLES FOR SEASONAL ENVIRONMENTS
       ============================================================ */

    function injectSeasonalAnimationCSS() {

        if (
            document.getElementById(
                "dheere-seasonal-engine-v1"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "dheere-seasonal-engine-v1";


        style.textContent = `

        /* =====================================================
           DESERT WIND
           ===================================================== */

        .desert-environment,
        .monsoon-environment,
        .winter-environment {
            position:absolute;
            inset:0;
            overflow:hidden;
            pointer-events:none;
            isolation:isolate;
        }

        .desert-dust-particle {
            position:absolute;
            width:var(--dust-size,2px);
            height:var(--dust-size,2px);
            border-radius:50%;
            background:rgba(225,186,128,.68);
            box-shadow:0 0 5px rgba(231,190,129,.15);
            animation:
                mood-desert-dust
                var(--dust-speed,5s)
                linear
                infinite;
        }

        @keyframes mood-desert-wind {

            0% {
                transform:translateX(-8%);
            }

            100% {
                transform:translateX(14%);
            }

        }

        @keyframes mood-desert-dust {

            0% {
                transform:
                    translate3d(
                        calc(
                            var(--dust-drift,80px) * -1
                        ),
                        8px,
                        0
                    );
                opacity:.04;
            }

            18% {
                opacity:.72;
            }

            100% {
                transform:
                    translate3d(
                        var(--dust-drift,80px),
                        var(--dust-rise,-12px),
                        0
                    );
                opacity:0;
            }

        }


        /* =====================================================
           MONSOON
           ===================================================== */

        .monsoon-drop {
            position:absolute;
            width:var(--drop-width,2.4px);
            height:var(--drop-length,24px);
            border-radius:999px;
            background:
                linear-gradient(
                    180deg,
                    rgba(239,249,252,.14),
                    rgba(209,237,244,.82) 46%,
                    rgba(188,223,231,.28)
                );
            box-shadow:
                0 0 7px rgba(190,226,235,.20);
            transform:rotate(4deg);
            animation:
                mood-monsoon-drop
                var(--drop-speed,1.2s)
                linear
                infinite;
        }

        .monsoon-drop-foreground {
            position:absolute;
            width:var(--drop-fg-width,3px);
            height:var(--drop-fg-height,36px);
            border-radius:999px;
            background:
                linear-gradient(
                    180deg,
                    rgba(245,252,255,.18),
                    rgba(221,244,249,.92) 48%,
                    rgba(192,225,233,.30)
                );
            box-shadow:
                0 0 11px rgba(200,234,242,.26);
            animation:
                mood-monsoon-drop
                var(--drop-fg-speed,1.35s)
                linear
                infinite;
        }


        .monsoon-drop-micro {
            position:absolute;
            width:var(--micro-drop-size,1.2px);
            height:var(--micro-drop-length,16px);
            border-radius:999px;
            background:
                linear-gradient(
                    180deg,
                    rgba(246,253,255,.08),
                    rgba(225,246,250,.70) 48%,
                    rgba(196,229,236,.18)
                );
            box-shadow:
                0 0 5px rgba(207,238,244,.16);
            transform:rotate(4deg);
            animation:
                mood-monsoon-drop
                var(--micro-drop-speed,.45s)
                linear
                infinite;
        }

        .monsoon-ripple {
            position:absolute;
            width:var(--ripple-size,22px);
            height:var(--ripple-size,22px);
            border:1px solid rgba(190,228,232,.30);
            border-radius:50%;
            transform:scale(.2);
            opacity:0;
            animation:
                mood-monsoon-ripple
                2.8s
                ease-out
                infinite;
            animation-delay:
                var(--ripple-delay,0s);
        }

        @keyframes mood-monsoon-drop {

            0% {
                transform:
                    translate3d(
                        calc(
                            var(--drop-drift,20px) * -1
                        ),
                        -15vh,
                        0
                    )
                    rotate(4deg);
                opacity:0;
            }

            10% {
                opacity:.7;
            }

            90% {
                opacity:.52;
            }

            100% {
                transform:
                    translate3d(
                        var(--drop-drift,20px),
                        120vh,
                        0
                    )
                    rotate(4deg);
                opacity:0;
            }

        }

        @keyframes mood-monsoon-ripple {

            0% {
                transform:
                    scale(.18);
                opacity:0;
            }

            20% {
                opacity:.45;
            }

            100% {
                transform:
                    scale(1.18);
                opacity:0;
            }

        }

        @keyframes mood-monsoon-lightning {

            0%,
            88%,
            100% {
                opacity:0;
            }

            89% {
                opacity:.12;
            }

            90% {
                opacity:0;
            }

            92% {
                opacity:.18;
            }

            93% {
                opacity:0;
            }

        }


        /* =====================================================
           WINTER
           ===================================================== */

        .winter-snowflake {
            display:none;
            position:absolute;
            width:var(--snow-size,2px);
            height:var(--snow-size,2px);
            border-radius:50%;
            background:
                radial-gradient(
                    circle at 35% 30%,
                    rgba(255,255,255,.98),
                    rgba(232,247,253,.86) 52%,
                    rgba(205,232,244,.30) 78%,
                    transparent 100%
                );
            box-shadow:
                0 0 7px rgba(215,242,251,.24);
            opacity:var(--snow-opacity,.50);
            animation:
                mood-winter-snowflake
                var(--snow-duration,10s)
                linear
                infinite;
        }

        .winter-ice-particle {
            position:absolute;
            width:var(--ice-width,2.5px);
            height:var(--ice-size,7px);
            border-radius:36% 64% 46% 54%;
            background:
                linear-gradient(
                    145deg,
                    rgba(255,255,255,1) 0%,
                    rgba(239,250,255,.98) 24%,
                    rgba(202,235,247,.90) 56%,
                    rgba(145,205,227,.34) 100%
                );
            clip-path:
                polygon(
                    50% 0%,
                    62% 28%,
                    88% 14%,
                    74% 43%,
                    100% 58%,
                    68% 62%,
                    82% 94%,
                    50% 72%,
                    24% 100%,
                    30% 66%,
                    0% 70%,
                    24% 46%,
                    8% 18%,
                    40% 28%
                );
            box-shadow:
                0 0 9px rgba(225,246,255,.48),
                0 0 20px rgba(177,222,240,.20);
            transform:
                rotate(var(--ice-rotation,0deg));
            animation:
                mood-winter-ice-particle
                var(--ice-speed,6s)
                linear
                infinite;
        }

        .winter-tree-branch {
            transform-origin:left center;
        }

        .winter-tree-ice {
            box-shadow:
                0 0 7px rgba(207,239,250,.20);
        }

        @keyframes mood-winter-snowflake {

            0% {
                transform:
                    translate3d(
                        calc(var(--snow-zigzag,0px) * -.35),
                        -14vh,
                        0
                    )
                    rotate(var(--snow-rotation,0deg));
                opacity:0;
            }

            14% {
                opacity:var(--snow-opacity,.50);
            }

            42% {
                transform:
                    translate3d(
                        var(--snow-zigzag,0px),
                        38vh,
                        0
                    )
                    rotate(calc(var(--snow-rotation,0deg) * -.55));
            }

            72% {
                transform:
                    translate3d(
                        calc(var(--snow-zigzag,0px) * -.55),
                        80vh,
                        0
                    )
                    rotate(var(--snow-rotation,0deg));
            }

            100% {
                transform:
                    translate3d(
                        calc(var(--snow-zigzag,0px) * .45),
                        118vh,
                        0
                    )
                    rotate(calc(var(--snow-rotation,0deg) * -1));
                opacity:0;
            }

        }

        @keyframes mood-winter-snow {

            from {
                transform:
                    translate3d(0,-4%,0);
            }

            to {
                transform:
                    translate3d(3%,8%,0);
            }

        }

        @keyframes mood-winter-ice-dust {

            from {
                transform:
                    translateX(-6%);
            }

            to {
                transform:
                    translateX(12%);
            }

        }

        @keyframes mood-winter-wind {

            from {
                transform:
                    translateX(-8%);
            }

            to {
                transform:
                    translateX(10%);
            }

        }

        @keyframes mood-winter-ice-particle {

            0% {
                transform:
                    translate3d(
                        calc(
                            var(--ice-drift,60px) * -1
                        ),
                        8px,
                        0
                    )
                    rotate(
                        var(
                            --ice-rotation,
                            0deg
                        )
                    );
                opacity:0;
            }

            14% {
                opacity:.65;
            }

            100% {
                transform:
                    translate3d(
                        var(--ice-drift,60px),
                        var(--ice-fall,100vh),
                        0
                    )
                    rotate(
                        calc(
                            var(
                                --ice-rotation,
                                0deg
                            ) * 2
                        )
                    );
                opacity:0;
            }

        }

        @media (
            prefers-reduced-motion: reduce
        ) {

            .desert-environment *,
            .monsoon-environment *,
            .winter-environment * {

                animation:none !important;

            }

        }

        `;


        document.head.appendChild(
            style
        );

    }


    /* ============================================================
       BUILD DISPATCHER
       ============================================================ */

    function populateLayer(
        mood,
        layer
    ) {

        switch (
            mood
        ) {

            case "forest":

                buildForest(
                    layer
                );

                break;


            case "ocean":

                buildOcean(
                    layer
                );

                break;


            case "ember":

                buildEmber(
                    layer
                );

                break;


            case "midnight":

                buildMidnight(
                    layer
                );

                break;


            case "prism":

                buildPrism(
                    layer
                );

                break;



            case "desert":

                buildDesert(
                    layer
                );

                break;


            case "monsoon":

                buildMonsoon(
                    layer
                );

                break;


            case "winter":

                buildWinter(
                    layer
                );

                break;


            case "original":

            default:

                buildOriginal(
                    layer
                );

                break;

        }

    }


    /* ============================================================
       APPLY MOOD
       ============================================================ */

    function applyMood(
        mood,
        options = {}
    ) {

        if (
            !VALID_MOODS.includes(
                mood
            )
        ) {

            mood =
                "original";

        }


        const force =
            options.force === true;


        if (
            mood === currentMood &&
            !force
        ) {

            saveMood(
                mood
            );


            document.documentElement.dataset.dheereMood =
                mood;


            return;

        }


        transitionToken +=
            1;


        const localToken =
            transitionToken;


        currentMood =
            mood;


        saveMood(
            mood
        );


        document.documentElement.dataset.dheereMood =
            mood;


        ensureEnvironmentRoot();


        if (
            cleanupTimer
        ) {

            window.clearTimeout(
                cleanupTimer
            );


            cleanupTimer =
                null;

        }


        if (
            mood ===
            "original"
        ) {

            const oldLayers =
                Array.from(
                    environmentRoot.children
                );


            if (
                prefersReducedMotion()
            ) {

                clearEnvironment();

                return;

            }


            oldLayers.forEach(
                function (
                    layer
                ) {

                    layer.style.opacity =
                        "0";

                }
            );


            cleanupTimer =
                window.setTimeout(
                    function () {

                        if (
                            localToken !==
                            transitionToken
                        ) {

                            return;

                        }


                        clearEnvironment();


                        cleanupTimer =
                            null;

                    },
                    TRANSITION_TIME
                );


            return;

        }


        const newLayer =
            createLayer(
                mood
            );


        populateLayer(
            mood,
            newLayer
        );


        trimLayerStack();


        if (
            prefersReducedMotion()
        ) {

            cleanupInactiveLayers(
                newLayer
            );


            return;

        }


        cleanupTimer =
            window.setTimeout(
                function () {

                    if (
                        localToken !==
                        transitionToken
                    ) {

                        return;

                    }


                    cleanupInactiveLayers(
                        newLayer
                    );


                    trimLayerStack();


                    cleanupTimer =
                        null;

                },
                EXIT_BUFFER
            );

    }


    /* ============================================================
       UI SYNC
       ============================================================ */

    function syncMoodUI(
        mood
    ) {

        const cards =
            document.querySelectorAll(
                "[data-mood]"
            );


        cards.forEach(
            function (
                card
            ) {

                const cardMood =
                    card.dataset.mood;


                const active =
                    cardMood ===
                    mood;


                card.classList.toggle(
                    "active",
                    active
                );


                card.setAttribute(
                    "aria-pressed",
                    active
                        ? "true"
                        : "false"
                );

            }
        );

    }


    /* ============================================================
       EVENTS
       ============================================================ */

    function bindMoodCards() {

        const cards =
            document.querySelectorAll(
                "[data-mood]"
            );


        cards.forEach(
            function (
                card
            ) {

                if (
                    card.dataset.dheereMoodBound ===
                    "true"
                ) {

                    return;

                }


                card.dataset.dheereMoodBound =
                    "true";


                card.addEventListener(
                    "click",
                    function () {

                        const mood =
                            card.dataset.mood;


                        if (
                            VALID_MOODS.includes(
                                mood
                            )
                        ) {

                            applyMood(
                                mood
                            );

                        }

                    }
                );

            }
        );

    }


    /* ============================================================
       INITIALIZATION
       ============================================================ */

    function initializeMood() {

        injectSeasonalAnimationCSS();


        ensureEnvironmentRoot();


        clearEnvironment();


        const savedMood =
            getSavedMood();


        currentMood =
            null;


        window.setTimeout(
            function () {

                applyMood(
                    savedMood,
                    {
                        force:
                            true
                    }
                );


                syncMoodUI(
                    savedMood
                );


                bindMoodCards();

            },
            BOOT_DELAY
        );

    }


    /* ============================================================
       SYNCHRONIZATION
       ============================================================ */

    function syncSavedMood() {

        const savedMood =
            getSavedMood();


        if (
            savedMood !==
            currentMood
        ) {

            applyMood(
                savedMood
            );

        }


        syncMoodUI(
            savedMood
        );


        bindMoodCards();

    }


    document.addEventListener(
        "visibilitychange",
        function () {

            if (
                document.visibilityState ===
                "visible"
            ) {

                syncSavedMood();

            }

        }
    );


    window.addEventListener(
        "pageshow",
        syncSavedMood
    );


    /* ============================================================
       RESIZE
       ============================================================ */

    window.addEventListener(
        "resize",
        function () {

            if (
                resizeTimer
            ) {

                window.clearTimeout(
                    resizeTimer
                );

            }


            resizeTimer =
                window.setTimeout(
                    function () {

                        const mood =
                            currentMood ||
                            getSavedMood();


                        if (
                            mood ===
                            "original"
                        ) {

                            return;

                        }


                        applyMood(
                            mood,
                            {
                                force:
                                    true
                            }
                        );


                        syncMoodUI(
                            mood
                        );

                    },
                    350
                );

        }
    );


    /* ============================================================
       REDUCED MOTION CHANGE
       ============================================================ */

    if (
        motionQuery &&
        typeof motionQuery.addEventListener ===
            "function"
    ) {

        motionQuery.addEventListener(
            "change",
            function () {

                const mood =
                    currentMood ||
                    getSavedMood();


                applyMood(
                    mood,
                    {
                        force:
                            true
                    }
                );

            }
        );

    }


    /* ============================================================
       PUBLIC API
       ============================================================ */

    window.DheereMood = {

        get:
            getSavedMood,


        set:
            function (
                mood
            ) {

                applyMood(
                    mood
                );

                syncMoodUI(
                    mood
                );

            },


        available:
            [
                ...VALID_MOODS
            ]

    };


    /* ============================================================
       BOOT
       ============================================================ */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeMood,
            {
                once:
                    true
            }
        );

    } else {

        initializeMood();

    }


})();