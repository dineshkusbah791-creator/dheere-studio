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
   07  Universe
   08  Desert
   09  Monsoon
   10  Winter

   Universe:
   Pure CSS + DOM
   No external images
   No canvas
   No external dependencies

   Storage:
   dheereMood

   Public API:
   window.DheereMood.get()
   window.DheereMood.set("universe")
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
        "universe",
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


    let universeStyleInjected =
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
       UNIVERSE CSS — V4
       ============================================================ */

    function injectUniverseEnvironmentCSS() {

        if (
            universeStyleInjected
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "dheere-universe-environment-v4";


        style.textContent = `

        .universe-environment-v4 {
            position:absolute;
            inset:0;
            overflow:hidden;
            isolation:isolate;
            background:
                radial-gradient(
                    ellipse
                    at
                    18% 14%,
                    rgba(72,56,179,.11),
                    transparent 28%
                ),
                radial-gradient(
                    ellipse
                    at
                    82% 18%,
                    rgba(39,84,173,.085),
                    transparent 30%
                ),
                radial-gradient(
                    ellipse
                    at
                    76% 83%,
                    rgba(124,54,151,.07),
                    transparent 31%
                ),
                linear-gradient(
                    180deg,
                    #020309,
                    #040611 52%,
                    #02030a
                );
        }

        .universe-environment-v4::before {
            content:"";
            position:absolute;
            inset:-10%;
            background:
                radial-gradient(
                    ellipse
                    at
                    center,
                    transparent
                    26%,
                    rgba(0,0,0,.18)
                    63%,
                    rgba(0,0,0,.62)
                    100%
                );
            pointer-events:none;
            z-index:900;
        }

        .universe-cosmic-nebula-field {
            position:absolute;
            inset:-20%;
            background:
                radial-gradient(
                    ellipse
                    at
                    9% 24%,
                    rgba(73,62,180,.085),
                    transparent 26%
                ),
                radial-gradient(
                    ellipse
                    at
                    87% 37%,
                    rgba(42,91,185,.075),
                    transparent 28%
                ),
                radial-gradient(
                    ellipse
                    at
                    59% 87%,
                    rgba(152,70,174,.055),
                    transparent 26%
                ),
                radial-gradient(
                    ellipse
                    at
                    31% 72%,
                    rgba(52,75,154,.045),
                    transparent 27%
                );
            filter:
                blur(42px);
            transform:
                translate3d(
                    0,
                    0,
                    0
                );
            animation:
                dheereUniverseNebulaField
                42s
                ease-in-out
                infinite
                alternate;
            z-index:1;
        }

        .universe-space-band {
            position:absolute;
            border-radius:50%;
            filter:
                blur(
                    var(--blur,16px)
                );
            opacity:
                var(--opacity,.12);
            mix-blend-mode:
                screen;
            animation:
                dheereUniverseBand
                var(--speed,34s)
                ease-in-out
                infinite
                alternate;
        }

        .universe-space-band.one {
            width:85vw;
            height:8vw;
            left:-22vw;
            top:20vh;
            transform:rotate(-18deg);
            background:
                radial-gradient(
                    ellipse,
                    rgba(100,80,218,.24),
                    rgba(58,72,157,.06)
                    42%,
                    transparent 74%
                );
            --blur:18px;
            --opacity:.16;
            --speed:33s;
        }

        .universe-space-band.two {
            width:76vw;
            height:7vw;
            right:-19vw;
            top:58vh;
            transform:rotate(14deg);
            background:
                radial-gradient(
                    ellipse,
                    rgba(60,128,220,.19),
                    rgba(67,68,145,.05)
                    42%,
                    transparent 74%
                );
            --blur:18px;
            --opacity:.13;
            --speed:39s;
        }

        .universe-space-band.three {
            width:58vw;
            height:5vw;
            left:24vw;
            bottom:0;
            transform:rotate(-7deg);
            background:
                radial-gradient(
                    ellipse,
                    rgba(190,82,204,.13),
                    rgba(89,58,143,.04)
                    45%,
                    transparent 75%
                );
            --blur:17px;
            --opacity:.09;
            --speed:45s;
        }

        .universe-star-plane {
            position:absolute;
            inset:0;
            background-repeat:no-repeat;
            pointer-events:none;
        }

        .universe-star-plane.far {
            opacity:.40;
            background:
                radial-gradient(
                    circle at 7% 13%,
                    rgba(255,255,255,.55)
                    0 1px,
                    transparent 1.7px
                ),
                radial-gradient(
                    circle at 17% 57%,
                    rgba(255,255,255,.30)
                    0 1px,
                    transparent 1.7px
                ),
                radial-gradient(
                    circle at 28% 29%,
                    rgba(255,255,255,.41)
                    0 1px,
                    transparent 1.7px
                ),
                radial-gradient(
                    circle at 39% 83%,
                    rgba(255,255,255,.28)
                    0 1px,
                    transparent 1.6px
                ),
                radial-gradient(
                    circle at 51% 10%,
                    rgba(255,255,255,.34)
                    0 1px,
                    transparent 1.7px
                ),
                radial-gradient(
                    circle at 62% 69%,
                    rgba(255,255,255,.27)
                    0 1px,
                    transparent 1.6px
                ),
                radial-gradient(
                    circle at 76% 21%,
                    rgba(255,255,255,.35)
                    0 1px,
                    transparent 1.7px
                ),
                radial-gradient(
                    circle at 91% 78%,
                    rgba(255,255,255,.26)
                    0 1px,
                    transparent 1.6px
                );
            animation:
                universeFarStars
                55s
                ease-in-out
                infinite
                alternate;
        }

        .universe-star-plane.mid {
            opacity:.62;
            transform:scale(1.01);
            background:
                radial-gradient(
                    circle at 13% 38%,
                    rgba(255,255,255,.72)
                    0 1px,
                    transparent 2px
                ),
                radial-gradient(
                    circle at 33% 18%,
                    rgba(255,255,255,.46)
                    0 1px,
                    transparent 1.8px
                ),
                radial-gradient(
                    circle at 48% 61%,
                    rgba(255,255,255,.50)
                    0 1px,
                    transparent 1.9px
                ),
                radial-gradient(
                    circle at 68% 27%,
                    rgba(255,255,255,.56)
                    0 1px,
                    transparent 1.9px
                ),
                radial-gradient(
                    circle at 83% 57%,
                    rgba(255,255,255,.44)
                    0 1px,
                    transparent 1.8px
                ),
                radial-gradient(
                    circle at 94% 14%,
                    rgba(255,255,255,.48)
                    0 1px,
                    transparent 1.8px
                );
            animation:
                universeMidStars
                32s
                ease-in-out
                infinite
                alternate;
        }

        .universe-dust-field {
            position:absolute;
            inset:0;
            opacity:.40;
            background:
                radial-gradient(
                    ellipse at 20% 41%,
                    rgba(135,114,228,.045),
                    transparent 23%
                ),
                radial-gradient(
                    ellipse at 74% 67%,
                    rgba(71,121,215,.04),
                    transparent 25%
                );
            filter:blur(7px);
            animation:
                universeDustField
                36s
                ease-in-out
                infinite
                alternate;
        }

        .universe-distant-galaxy {
            position:absolute;
            width:
                var(--width,90px);
            height:
                var(--height,20px);
            border-radius:50%;
            opacity:
                var(--opacity,.24);
            filter:
                blur(
                    var(--blur,1.8px)
                );
            transform:
                rotate(
                    var(--angle,0deg)
                );
            background:
                radial-gradient(
                    ellipse
                    at
                    center,
                    var(--core,rgba(177,156,255,.25)),
                    var(--mid,rgba(94,78,171,.09))
                    45%,
                    transparent 74%
                );
            animation:
                universeDistantGalaxy
                var(--speed,38s)
                ease-in-out
                infinite
                alternate;
        }

        .universe-distant-galaxy.one {
            left:3%;
            top:31%;
            --width:82px;
            --height:18px;
            --angle:18deg;
            --opacity:.23;
            --speed:35s;
        }

        .universe-distant-galaxy.two {
            right:4%;
            top:15%;
            --width:104px;
            --height:24px;
            --angle:-13deg;
            --core:rgba(91,147,244,.22);
            --mid:rgba(70,77,155,.075);
            --opacity:.21;
            --speed:42s;
        }

        .universe-distant-galaxy.three {
            right:25%;
            bottom:7%;
            --width:71px;
            --height:18px;
            --angle:9deg;
            --core:rgba(213,113,220,.18);
            --opacity:.18;
            --speed:46s;
        }

        .universe-distant-galaxy.four {
            left:23%;
            bottom:17%;
            --width:63px;
            --height:15px;
            --angle:-9deg;
            --core:rgba(177,192,255,.16);
            --opacity:.15;
            --speed:51s;
        }

        .universe-main-galaxy {
            position:absolute;
            left:49%;
            top:49%;
            width:184px;
            height:61px;
            transform:
                translate(
                    -50%,
                    -50%
                )
                rotate(-13deg);
            border-radius:50%;
            background:
                radial-gradient(
                    ellipse
                    at
                    center,
                    rgba(255,249,255,.92)
                    0 3%,
                    rgba(217,197,255,.52)
                    7%,
                    rgba(160,129,240,.29)
                    20%,
                    rgba(99,74,182,.14)
                    42%,
                    rgba(65,55,139,.06)
                    58%,
                    transparent 78%
                );
            filter:blur(1.25px);
            box-shadow:
                0 0 28px
                rgba(140,110,242,.13),
                0 0 75px
                rgba(100,77,192,.065);
            z-index:60;
            animation:
                mainGalaxyRotation
                42s
                linear
                infinite;
        }

        .universe-main-galaxy::before {
            content:"";
            position:absolute;
            inset:6px 15px;
            border:1px solid rgba(204,184,255,.19);
            border-left-color:rgba(152,125,220,.07);
            border-right-color:rgba(152,125,220,.07);
            border-radius:50%;
            transform:rotate(8deg);
        }

        .universe-main-galaxy::after {
            content:"";
            position:absolute;
            inset:12px 33px;
            border:1px solid rgba(245,236,255,.14);
            border-radius:50%;
        }

        .universe-galaxy-core {
            position:absolute;
            left:49%;
            top:49%;
            width:20px;
            height:20px;
            transform:
                translate(
                    -50%,
                    -50%
                );
            border-radius:50%;
            background:
                radial-gradient(
                    circle,
                    #ffffff 0 12%,
                    #eee4ff 30%,
                    #c4a9ff 57%,
                    rgba(132,101,223,.06) 75%,
                    transparent 100%
                );
            box-shadow:
                0 0 15px
                rgba(249,243,255,.70),
                0 0 38px
                rgba(170,135,255,.24);
            z-index:75;
        }

        .universe-galaxy-dust {
            position:absolute;
            left:49%;
            top:49%;
            width:228px;
            height:5px;
            transform:
                translate(
                    -50%,
                    -50%
                )
                rotate(
                    var(--angle,-18deg)
                );
            border-radius:50%;
            background:
                linear-gradient(
                    90deg,
                    transparent,
                    rgba(83,65,172,.04),
                    rgba(196,169,255,.15),
                    rgba(106,82,193,.04),
                    transparent
                );
            filter:blur(2px);
            opacity:.72;
            z-index:64;
            animation:
                galaxyDustDrift
                var(--speed,24s)
                ease-in-out
                infinite
                alternate;
        }

        .universe-galaxy-dust.one {
            --angle:-19deg;
            --speed:24s;
        }

        .universe-galaxy-dust.two {
            --angle:8deg;
            opacity:.42;
            --speed:29s;
        }

        .universe-galaxy-dust.three {
            width:190px;
            --angle:31deg;
            opacity:.28;
            --speed:35s;
        }

        .universe-black-hole {
            position:absolute;
            right:13%;
            top:22%;
            width:54px;
            height:54px;
            border-radius:50%;
            background:#000106;
            z-index:80;
            box-shadow:
                0 0 0 3px
                rgba(196,167,255,.035),
                0 0 0 8px
                rgba(119,91,218,.06),
                0 0 32px
                rgba(86,65,179,.11);
            animation:
                blackHoleFloat
                21s
                ease-in-out
                infinite
                alternate;
        }

        .universe-black-hole::before {
            content:"";
            position:absolute;
            inset:-13px;
            border:2px solid rgba(198,172,255,.18);
            border-left-color:rgba(108,82,198,.07);
            border-right-color:rgba(241,214,255,.13);
            border-radius:50%;
            transform:rotate(-17deg) scaleX(1.82);
            filter:blur(.2px);
        }

        .universe-black-hole::after {
            content:"";
            position:absolute;
            left:-34px;
            right:-34px;
            top:50%;
            height:2px;
            background:
                linear-gradient(
                    90deg,
                    transparent,
                    rgba(204,182,255,.19),
                    transparent
                );
            filter:blur(1.5px);
        }

        .universe-planet {
            position:absolute;
            border-radius:50%;
            animation:
                universePlanetFloat
                var(--speed,18s)
                ease-in-out
                infinite
                alternate;
            z-index:72;
        }

        .universe-planet.one {
            left:12%;
            top:58%;
            width:39px;
            height:39px;
            background:
                radial-gradient(
                    circle at 29% 26%,
                    #aec8ff,
                    #5a6ea7 47%,
                    #222c48 72%,
                    #0c1020 100%
                );
            box-shadow:
                inset -10px -12px 17px
                rgba(0,0,0,.56),
                0 0 22px
                rgba(91,141,233,.08);
            --speed:24s;
        }

        .universe-planet.two {
            right:28%;
            bottom:14%;
            width:23px;
            height:23px;
            background:
                radial-gradient(
                    circle at 31% 26%,
                    #ecc5f3,
                    #7c5088 51%,
                    #2b1732 78%,
                    #110813 100%
                );
            box-shadow:
                inset -7px -7px 11px
                rgba(0,0,0,.53),
                0 0 16px
                rgba(201,112,226,.075);
            --speed:17s;
        }

        .universe-planet.three {
            left:31%;
            top:14%;
            width:13px;
            height:13px;
            background:
                radial-gradient(
                    circle at 30% 27%,
                    #ead99f,
                    #7f693f 57%,
                    #241c0e 100%
                );
            box-shadow:
                0 0 12px
                rgba(230,190,104,.055);
            --speed:19s;
        }

        .universe-ringed-world {
            position:absolute;
            right:38%;
            bottom:25%;
            width:27px;
            height:27px;
            border-radius:50%;
            background:
                radial-gradient(
                    circle at 31% 27%,
                    #e4dabf,
                    #84775a 54%,
                    #252218 100%
                );
            box-shadow:
                inset -7px -7px 11px
                rgba(0,0,0,.50);
            animation:
                ringWorld
                29s
                ease-in-out
                infinite
                alternate;
            z-index:74;
        }

        .universe-ringed-world::before {
            content:"";
            position:absolute;
            left:-23px;
            top:11px;
            width:72px;
            height:9px;
            border:1px solid rgba(219,207,168,.17);
            border-left-color:rgba(219,207,168,.05);
            border-right-color:rgba(219,207,168,.05);
            border-radius:50%;
            transform:rotate(-15deg);
        }

        .universe-star {
            position:absolute;
            width:var(--size,2px);
            height:var(--size,2px);
            border-radius:50%;
            background:#ffffff;
            opacity:var(--opacity,.45);
            box-shadow:
                0 0 7px
                rgba(233,227,255,.19);
            animation:
                universeStarTwinkle
                var(--speed,5s)
                ease-in-out
                infinite
                alternate;
            z-index:78;
        }

        .universe-star.a {
            left:12%;
            top:32%;
            --size:2px;
            --opacity:.65;
            --speed:4.1s;
        }

        .universe-star.b {
            left:25%;
            top:10%;
            --size:1px;
            --opacity:.42;
            --speed:5.7s;
        }

        .universe-star.c {
            left:61%;
            top:12%;
            --size:2px;
            --opacity:.54;
            --speed:4.4s;
        }

        .universe-star.d {
            right:22%;
            top:45%;
            --size:1px;
            --opacity:.57;
            --speed:5.2s;
        }

        .universe-star.e {
            right:7%;
            bottom:15%;
            --size:2px;
            --opacity:.38;
            --speed:4.8s;
        }

        .universe-star.f {
            left:43%;
            bottom:8%;
            --size:1px;
            --opacity:.49;
            --speed:6.1s;
        }

        .universe-star.g {
            left:5%;
            bottom:18%;
            --size:1px;
            --opacity:.40;
            --speed:5.1s;
        }

        .universe-star.h {
            right:11%;
            top:10%;
            --size:1px;
            --opacity:.52;
            --speed:5.6s;
        }

        .universe-cosmic-particle {
            position:absolute;
            width:var(--size,2px);
            height:var(--size,2px);
            border-radius:50%;
            background:
                var(
                    --particle-color,
                    rgba(213,205,255,.44)
                );
            box-shadow:
                0 0 8px
                var(
                    --particle-color,
                    rgba(213,205,255,.15)
                );
            opacity:var(--opacity,.25);
            animation:
                universeParticleDrift
                var(--speed,18s)
                ease-in-out
                infinite
                alternate;
            z-index:40;
        }

        .universe-micro-light {
            position:absolute;
            width:140px;
            height:80px;
            border-radius:50%;
            filter:blur(24px);
            opacity:.09;
            background:
                radial-gradient(
                    ellipse,
                    rgba(160,132,248,.25),
                    transparent 70%
                );
            animation:
                universeMicroLight
                var(--speed,25s)
                ease-in-out
                infinite
                alternate;
            z-index:10;
        }

        .universe-micro-light.one {
            left:18%;
            top:36%;
            --speed:25s;
        }

        .universe-micro-light.two {
            right:11%;
            bottom:25%;
            --speed:31s;
        }

        @keyframes dheereUniverseNebulaField {

            from {

                transform:
                    translate3d(
                        -18px,
                        7px,
                        0
                    )
                    scale(.985);

            }

            to {

                transform:
                    translate3d(
                        25px,
                        -14px,
                        0
                    )
                    scale(1.045);

            }

        }

        @keyframes dheereUniverseBand {

            from {

                margin-left:
                    -20px;

                opacity:
                    .36;

            }

            to {

                margin-left:
                    27px;

                opacity:
                    .90;

            }

        }

        @keyframes universeFarStars {

            from {

                transform:
                    translate3d(
                        -2px,
                        1px,
                        0
                    );

            }

            to {

                transform:
                    translate3d(
                        5px,
                        -3px,
                        0
                    );

            }

        }

        @keyframes universeMidStars {

            from {

                transform:
                    translate3d(
                        -3px,
                        2px,
                        0
                    )
                    scale(1);

                opacity:
                    .50;

            }

            to {

                transform:
                    translate3d(
                        5px,
                        -4px,
                        0
                    )
                    scale(1.012);

                opacity:
                    .82;

            }

        }

        @keyframes universeDustField {

            from {

                transform:
                    translate3d(
                        -12px,
                        3px,
                        0
                    );

                opacity:
                    .25;

            }

            to {

                transform:
                    translate3d(
                        16px,
                        -7px,
                        0
                    );

                opacity:
                    .60;

            }

        }

        @keyframes universeDistantGalaxy {

            from {

                margin-left:
                    -14px;

                opacity:
                    calc(
                        var(--opacity,.24)
                        * .72
                    );

            }

            to {

                margin-left:
                    18px;

                opacity:
                    var(--opacity,.24);

            }

        }

        @keyframes mainGalaxyRotation {

            from {

                transform:
                    translate(
                        -50%,
                        -50%
                    )
                    rotate(
                        -13deg
                    );

            }

            to {

                transform:
                    translate(
                        -50%,
                        -50%
                    )
                    rotate(
                        347deg
                    );

            }

        }

        @keyframes galaxyDustDrift {

            from {

                margin-left:
                    -15px;

                opacity:
                    .28;

            }

            to {

                margin-left:
                    22px;

                opacity:
                    .78;

            }

        }

        @keyframes blackHoleFloat {

            from {

                transform:
                    translate3d(
                        0,
                        0,
                        0
                    )
                    scale(.975);

            }

            to {

                transform:
                    translate3d(
                        -6px,
                        5px,
                        0
                    )
                    scale(1.04);

            }

        }

        @keyframes universePlanetFloat {

            from {

                transform:
                    translate3d(
                        0,
                        0,
                        0
                    );

            }

            to {

                transform:
                    translate3d(
                        8px,
                        -7px,
                        0
                    );

            }

        }

        @keyframes ringWorld {

            from {

                transform:
                    translate3d(
                        0,
                        0,
                        0
                    )
                    rotate(
                        -2deg
                    );

            }

            to {

                transform:
                    translate3d(
                        7px,
                        -5px,
                        0
                    )
                    rotate(
                        4deg
                    );

            }

        }

        @keyframes universeStarTwinkle {

            from {

                opacity:
                    .06;

                transform:
                    scale(.72);

            }

            to {

                opacity:
                    var(--opacity,.48);

                transform:
                    scale(1.18);

            }

        }

        @keyframes universeParticleDrift {

            from {

                transform:
                    translate3d(
                        0,
                        0,
                        0
                    )
                    scale(.72);

            }

            to {

                transform:
                    translate3d(
                        var(--drift-x,22px),
                        var(--drift-y,-22px),
                        0
                    )
                    scale(1.12);

            }

        }

        @keyframes universeMicroLight {

            from {

                transform:
                    translate3d(
                        -15px,
                        5px,
                        0
                    )
                    scale(.94);

                opacity:
                    .10;

            }

            to {

                transform:
                    translate3d(
                        20px,
                        -9px,
                        0
                    )
                    scale(1.08);

                opacity:
                    .75;

            }

        }

        @media (max-width:640px) {

            .universe-main-galaxy {

                width:
                    140px;

                height:
                    45px;

                transform:
                    translate(
                        -50%,
                        -50%
                    )
                    rotate(
                        -13deg
                    )
                    scale(.82);

            }


            .universe-galaxy-core {

                transform:
                    translate(
                        -50%,
                        -50%
                    )
                    scale(.86);

            }


            .universe-black-hole {

                width:
                    40px;

                height:
                    40px;

                right:
                    7%;

                top:
                    19%;

            }


            .universe-planet.one {

                width:
                    28px;

                height:
                    28px;

                left:
                    9%;

            }


            .universe-planet.two {

                width:
                    17px;

                height:
                    17px;

            }


            .universe-ringed-world {

                width:
                    21px;

                height:
                    21px;

                transform:
                    scale(.82);

            }


            .universe-ringed-world::before {

                left:
                    -17px;

                top:
                    9px;

                width:
                    56px;

            }

        }


        @media (
            prefers-reduced-motion: reduce
        ) {

            .universe-environment-v4 *,
            .universe-environment-v4::before {

                animation:
                    none !important;

            }

        }

        `;


        document.head.appendChild(
            style
        );


        universeStyleInjected =
            true;

    }


    /* ============================================================
       UNIVERSE
       ============================================================ */

    function buildUniverse(
        layer
    ) {

        injectUniverseEnvironmentCSS();


        const universe =
            createElement(
                "universe-environment-v4",
                layer
            );


        createElement(
            "universe-cosmic-nebula-field",
            universe
        );


        createElement(
            "universe-space-band one",
            universe
        );


        createElement(
            "universe-space-band two",
            universe
        );


        createElement(
            "universe-space-band three",
            universe
        );


        createElement(
            "universe-star-plane far",
            universe
        );


        createElement(
            "universe-star-plane mid",
            universe
        );


        createElement(
            "universe-dust-field",
            universe
        );


        createElement(
            "universe-distant-galaxy one",
            universe
        );


        createElement(
            "universe-distant-galaxy two",
            universe
        );


        createElement(
            "universe-distant-galaxy three",
            universe
        );


        createElement(
            "universe-distant-galaxy four",
            universe
        );


        createElement(
            "universe-main-galaxy",
            universe
        );


        createElement(
            "universe-galaxy-core",
            universe
        );


        createElement(
            "universe-galaxy-dust one",
            universe
        );


        createElement(
            "universe-galaxy-dust two",
            universe
        );


        createElement(
            "universe-galaxy-dust three",
            universe
        );


        createElement(
            "universe-black-hole",
            universe
        );


        createElement(
            "universe-planet one",
            universe
        );


        createElement(
            "universe-planet two",
            universe
        );


        createElement(
            "universe-planet three",
            universe
        );


        createElement(
            "universe-ringed-world",
            universe
        );


        const stars = [
            "a",
            "b",
            "c",
            "d",
            "e",
            "f",
            "g",
            "h"
        ];


        stars.forEach(
            function (
                name
            ) {

                createElement(
                    `universe-star ${name}`,
                    universe
                );

            }
        );


        createElement(
            "universe-micro-light one",
            universe
        );


        createElement(
            "universe-micro-light two",
            universe
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
                16,
                Math.round(
                    48 *
                    scale
                )
            );


        const particleColors = [

            "rgba(211,203,255,.43)",

            "rgba(151,184,255,.36)",

            "rgba(218,184,255,.34)",

            "rgba(183,213,255,.31)",

            "rgba(224,208,255,.29)"

        ];


        for (
            let i = 0;
            i < particleCount;
            i++
        ) {

            const particle =
                createElement(
                    "universe-cosmic-particle",
                    universe
                );


            particle.style.left =
                random(
                    2,
                    98
                ) + "%";


            particle.style.top =
                random(
                    3,
                    97
                ) + "%";


            setVar(
                particle,
                "--size",
                random(
                    .7,
                    2.4
                ) + "px"
            );


            setVar(
                particle,
                "--opacity",
                random(
                    .08,
                    .38
                )
            );


            setVar(
                particle,
                "--drift-x",
                random(
                    -34,
                    34
                ) + "px"
            );


            setVar(
                particle,
                "--drift-y",
                random(
                    -30,
                    30
                ) + "px"
            );


            setVar(
                particle,
                "--speed",
                random(
                    14,
                    26
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
                20
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
                "linear-gradient(180deg, rgba(223,191,151,.055), transparent 48%, rgba(89,68,46,.045))",

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
        wind,
        {

            position:
                "absolute",

            inset:
                "-35%",

            backgroundImage:
                "repeating-linear-gradient(12deg, transparent 0 42px, rgba(223,205,179,.075) 43px 44px, transparent 45px 76px)",

            opacity:
                prefersReducedMotion()
                    ? ".06"
                    : ".16",

            transform:
                "rotate(-4deg)",

            animation:
                prefersReducedMotion()
                    ? "none"
                    : "mood-desert-wind 2.5s linear infinite"

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


    const rainBack =
        createElement(
            "monsoon-rain-back",
            monsoon
        );


    const rain =
        createElement(
            "monsoon-rain",
            monsoon
        );


    const drops =
        createElement(
            "monsoon-drops",
            monsoon
        );


    const wind =
        createElement(
            "monsoon-wind",
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
        rainBack,
        {

            position:
                "absolute",

            inset:
                "-30%",

            opacity:
                prefersReducedMotion()
                    ? ".10"
                    : ".22",

            backgroundImage:
                "repeating-linear-gradient(101deg, transparent 0 28px, rgba(181,215,222,.20) 29px 30px, transparent 31px 57px)",

            animation:
                prefersReducedMotion()
                    ? "none"
                    : "mood-monsoon-rain-back 2.2s linear infinite"

        }
    );


    setStyles(
        rain,
        {

            position:
                "absolute",

            inset:
                "-35%",

            backgroundImage:
                "repeating-linear-gradient(103deg, transparent 0 14px, rgba(211,236,241,.34) 15px 17px, transparent 18px 32px)",

            opacity:
                prefersReducedMotion()
                    ? ".16"
                    : ".46",

            animation:
                prefersReducedMotion()
                    ? "none"
                    : "mood-monsoon-rain 0.85s linear infinite"

        }
    );


    setStyles(
        wind,
        {

            position:
                "absolute",

            inset:
                "-20%",

            background:
                "repeating-linear-gradient(12deg, transparent 0 42px, rgba(189,224,229,.10) 43px 45px, transparent 46px 82px)",

            opacity:
                prefersReducedMotion()
                    ? ".10"
                    : ".27",

            transform:
                "rotate(-7deg)",

            animation:
                prefersReducedMotion()
                    ? "none"
                    : "mood-monsoon-wind 1.9s linear infinite"

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
                105 * scale
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
                10,
                27
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
                20 * scale
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
                18,
                42
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

            backgroundImage:
                "radial-gradient(circle, rgba(240,250,255,.88) 0 1.4px, transparent 2px)",

            backgroundSize:
                "68px 68px",

            animation:
                prefersReducedMotion()
                    ? "none"
                    : "mood-winter-snow 13s linear infinite"

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

            backgroundImage:
                "repeating-linear-gradient(17deg, transparent 0 28px, rgba(210,237,247,.10) 29px 30px, transparent 31px 57px)",

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

            backgroundImage:
                "repeating-linear-gradient(11deg, transparent 0 36px, rgba(222,244,251,.10) 37px 39px, transparent 40px 74px)",

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

            backgroundImage:
                "radial-gradient(circle, rgba(215,242,251,.42) 0 1px, transparent 1.8px)",

            backgroundSize:
                "115px 115px",

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


    const snowCount =
        Math.max(
            26,
            Math.round(
                74 * scale
            )
        );


    for (
        let i = 0;
        i < snowCount;
        i++
    ) {

        const flake =
            createElement(
                "winter-snowflake",
                winter
            );


        flake.style.left =
            random(
                -4,
                104
            ) + "%";


        flake.style.top =
            random(
                -15,
                96
            ) + "%";


        setVar(
            flake,
            "--snow-speed",
            random(
                6,
                13
            ) + "s"
        );


        setVar(
            flake,
            "--snow-drift",
            random(
                -28,
                28
            ) + "px"
        );


        setVar(
            flake,
            "--snow-drop",
            random(
                75,
                130
            ) + "vh"
        );


        setVar(
            flake,
            "--snow-size",
            random(
                1,
                3.6
            ) + "px"
        );


        flake.style.opacity =
            random(
                .18,
                .64
            );


        applyRandomDelay(
            flake,
            0,
            12
        );

    }


    const iceCount =
        Math.max(
            22,
            Math.round(
                58 * scale
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
                4.5,
                9.5
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


        setVar(
            crystal,
            "--ice-fall",
            random(
                65,
                120
            ) + "vh"
        );


        setVar(
            crystal,
            "--ice-size",
            random(
                .8,
                2.8
            ) + "px"
        );


        crystal.style.opacity =
            random(
                .12,
                .42
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
            width:1.5px;
            height:var(--drop-length,16px);
            border-radius:999px;
            background:
                linear-gradient(
                    180deg,
                    rgba(220,243,248,.12),
                    rgba(210,237,243,.70)
                );
            box-shadow:
                0 0 5px rgba(185,223,230,.14);
            transform:rotate(4deg);
            animation:
                mood-monsoon-drop
                var(--drop-speed,1.2s)
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

        @keyframes mood-monsoon-rain {

            from {
                transform:
                    translate3d(
                        -3%,
                        -4%,
                        0
                    )
                    rotate(3deg);
            }

            to {
                transform:
                    translate3d(
                        5%,
                        8%,
                        0
                    )
                    rotate(3deg);
            }

        }

        @keyframes mood-monsoon-wind {

            from {
                transform:
                    translateX(-7%)
                    rotate(-5deg);
            }

            to {
                transform:
                    translateX(9%)
                    rotate(-5deg);
            }

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

        .winter-ice-particle {
            position:absolute;
            width:var(--ice-size,2px);
            height:var(--ice-size,2px);
            border-radius:50%;
            background:rgba(217,241,250,.75);
            box-shadow:
                0 0 6px rgba(204,238,250,.25);
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

        @keyframes mood-winter-snow {

            from {
                transform:
                    translate3d(
                        0,
                        -4%,
                        0
                    );
            }

            to {
                transform:
                    translate3d(
                        3%,
                        8%,
                        0
                    );
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
                    rotate(0deg);
                opacity:0;
            }

            14% {
                opacity:.65;
            }

            100% {
                transform:
                    translate3d(
                        var(--ice-drift,60px),
                        var(--ice-rise,-14px),
                        0
                    )
                    rotate(90deg);
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


            case "universe":

                buildUniverse(
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