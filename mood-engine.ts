// @ts-nocheck
/* ============================================================
   DHEERE STUDIO — MOOD ENGINE V9
   TypeScript migration of the supplied runtime source.
   Runtime behavior preserved.
   ============================================================ */

/* ============================================================
   DHEERE STUDIO — MOOD ENGINE V9
   ------------------------------------------------------------
   Premium / Cinematic / Atmospheric / Nine-Mood System

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
        1150;


    const EXIT_BUFFER =
        120;


    const BOOT_DELAY =
        60;


    const MAX_LAYERS =
        2;


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


        /*
         * Keep high-end desktop visuals intact.
         * Reduce particle density on constrained/mobile devices,
         * especially when the browser advertises reduced data or
         * has limited CPU / memory.
         */

        const connection =
            navigator.connection ||
            navigator.mozConnection ||
            navigator.webkitConnection;


        const saveData =
            Boolean(
                connection &&
                connection.saveData
            );


        const cores =
            Number(
                navigator.hardwareConcurrency ||
                0
            );


        const memory =
            Number(
                navigator.deviceMemory ||
                0
            );


        const constrainedDevice =
            saveData ||
            (
                cores > 0 &&
                cores <= 4
            ) ||
            (
                memory > 0 &&
                memory <= 4
            );


        if (
            isSmallMobile()
        ) {

            return constrainedDevice
                ? .30
                : .40;

        }


        if (
            isMobile()
        ) {

            return constrainedDevice
                ? .43
                : .56;

        }


        if (
            window.innerWidth <
            1000
        ) {

            return constrainedDevice
                ? .66
                : .76;

        }


        return constrainedDevice
            ? .88
            : 1;

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
        layer.dataset.atmosphereVersion =
            "6";


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
       CINEMATIC ATMOSPHERE V6
       Secondary depth layers only. Core mood animations remain intact.
       ============================================================ */
    function injectCinematicAtmosphereCSS() {
        if (document.getElementById("dheere-cinematic-atmosphere-v6")) return;
        const style = document.createElement("style");
        style.id = "dheere-cinematic-atmosphere-v6";
        style.textContent = `
        .original-environment,.forest-depth,.forest-light-shaft,.ocean-depth,.ocean-horizon,.ocean-caustic,.ember-heat,.ember-core,.midnight-nebula,.midnight-halo,.prism-air,.desert-sun-halo,.desert-shimmer,.monsoon-depth,.monsoon-wet-glow,.winter-depth,.winter-glow-line{pointer-events:none}
        .original-environment{position:absolute;inset:0;overflow:hidden}.original-ambient{position:absolute;width:68vw;height:68vw;max-width:900px;max-height:900px;left:50%;top:4%;transform:translateX(-50%);border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.055),rgba(255,255,255,.014) 34%,transparent 68%);filter:blur(18px);opacity:.72;animation:dheereOriginalAmbient 24s ease-in-out infinite alternate}.original-light{position:absolute;width:52vw;height:22vw;left:50%;top:-8%;transform:translateX(-50%) rotate(-8deg);background:linear-gradient(180deg,rgba(255,255,255,.038),transparent 72%);filter:blur(22px);opacity:.52;animation:dheereOriginalLight 18s ease-in-out infinite alternate}.original-grain{position:absolute;inset:-25%;background:radial-gradient(circle at 50% 40%,transparent 0 48%,rgba(0,0,0,.18) 100%);opacity:.72}
        @keyframes dheereOriginalAmbient{from{transform:translate3d(-50%,-1%,0) scale(.96);opacity:.48}to{transform:translate3d(-48%,3%,0) scale(1.06);opacity:.82}}@keyframes dheereOriginalLight{from{transform:translate3d(-54%,-2%,0) rotate(-9deg) scale(.96);opacity:.3}to{transform:translate3d(-44%,4%,0) rotate(-5deg) scale(1.04);opacity:.62}}
        .forest-light-shaft{position:absolute;top:-18%;width:150px;height:78%;background:linear-gradient(180deg,rgba(166,231,181,.12),rgba(114,199,134,.025) 70%,transparent);filter:blur(16px);transform:rotate(var(--shaft-angle,16deg));opacity:var(--shaft-opacity,.32);animation:dheereForestShaft var(--shaft-speed,18s) ease-in-out infinite alternate}.forest-depth{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 72%,rgba(105,172,119,.065),transparent 38%);filter:blur(18px);animation:dheereForestDepth 21s ease-in-out infinite alternate}@keyframes dheereForestShaft{from{transform:translate3d(-18px,0,0) rotate(var(--shaft-angle,16deg));opacity:.18}to{transform:translate3d(26px,5px,0) rotate(calc(var(--shaft-angle,16deg) + 3deg));opacity:.46}}@keyframes dheereForestDepth{from{transform:scale(.98);opacity:.35}to{transform:scale(1.04);opacity:.78}}
        .ocean-depth{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 72%,rgba(78,157,214,.10),transparent 45%),linear-gradient(180deg,transparent 42%,rgba(3,24,42,.18) 76%,rgba(1,11,20,.46));animation:dheereOceanDepth 19s ease-in-out infinite alternate}.ocean-horizon{position:absolute;left:-12%;right:-12%;top:43%;height:2px;background:linear-gradient(90deg,transparent,rgba(183,224,255,.18),rgba(110,177,226,.28),transparent);filter:blur(1.2px);opacity:.58}.ocean-caustic{position:absolute;left:-20%;right:-20%;bottom:8%;height:34%;background:repeating-linear-gradient(168deg,transparent 0 38px,rgba(121,194,246,.045) 39px 41px,transparent 42px 72px);filter:blur(7px);opacity:.48;animation:dheereOceanCaustic 14s ease-in-out infinite alternate}@keyframes dheereOceanDepth{from{transform:translate3d(-1%,0,0) scale(1);opacity:.42}to{transform:translate3d(2%,1%,0) scale(1.035);opacity:.82}}@keyframes dheereOceanCaustic{from{transform:translateX(-3%);opacity:.22}to{transform:translateX(5%);opacity:.58}}
        .ember-heat{position:absolute;inset:28% 8% 0;background:radial-gradient(ellipse at 50% 100%,rgba(241,83,48,.13),transparent 52%);filter:blur(22px);opacity:.62;animation:dheereEmberHeat 7s ease-in-out infinite alternate}.ember-core{position:absolute;left:50%;bottom:0;width:280px;height:130px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(ellipse,rgba(255,151,97,.18),rgba(216,66,35,.05) 42%,transparent 74%);filter:blur(14px);animation:dheereEmberCore 5.5s ease-in-out infinite alternate}@keyframes dheereEmberHeat{from{transform:translate3d(-1%,2px,0) scale(.98);opacity:.36}to{transform:translate3d(2%,-6px,0) scale(1.05);opacity:.76}}@keyframes dheereEmberCore{from{transform:translateX(-50%) scale(.92);opacity:.34}to{transform:translateX(-50%) scale(1.08);opacity:.84}}
        .midnight-nebula{position:absolute;inset:-10%;background:radial-gradient(ellipse at 72% 24%,rgba(163,151,240,.10),transparent 25%),radial-gradient(ellipse at 28% 70%,rgba(74,63,143,.075),transparent 32%);filter:blur(28px);animation:dheereMidnightNebula 28s ease-in-out infinite alternate}.midnight-halo{position:absolute;right:7%;top:6%;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(210,202,255,.08),rgba(149,134,238,.035) 38%,transparent 70%);filter:blur(16px);animation:dheereMidnightHalo 13s ease-in-out infinite alternate}@keyframes dheereMidnightNebula{from{transform:translate3d(-1.5%,1%,0) scale(.98);opacity:.34}to{transform:translate3d(2%,-1.5%,0) scale(1.05);opacity:.86}}@keyframes dheereMidnightHalo{from{transform:scale(.94);opacity:.28}to{transform:scale(1.07);opacity:.72}}
        .prism-air{position:absolute;inset:-12%;background:radial-gradient(ellipse at 50% 45%,rgba(255,255,255,.035),transparent 54%);filter:blur(34px);opacity:.72;animation:dheerePrismAir 20s ease-in-out infinite alternate}@keyframes dheerePrismAir{from{transform:translate3d(-2%,1%,0) scale(.98);opacity:.38}to{transform:translate3d(3%,-2%,0) scale(1.06);opacity:.82}}
        .desert-sun-halo{position:absolute;width:290px;height:290px;right:4%;top:-2%;border-radius:50%;background:radial-gradient(circle,rgba(255,239,183,.13),rgba(255,210,123,.045) 42%,transparent 72%);filter:blur(24px);animation:dheereDesertSun 10s ease-in-out infinite alternate}.desert-shimmer{position:absolute;left:-15%;right:-15%;bottom:19%;height:21%;background:repeating-linear-gradient(180deg,transparent 0 17px,rgba(231,213,182,.035) 18px 19px,transparent 20px 33px);filter:blur(7px);opacity:.45;animation:dheereDesertShimmer 6.5s ease-in-out infinite alternate}@keyframes dheereDesertSun{from{transform:scale(.94);opacity:.28}to{transform:scale(1.07);opacity:.72}}@keyframes dheereDesertShimmer{from{transform:translate3d(-2%,0,0) skewX(-2deg);opacity:.24}to{transform:translate3d(3%,-3px,0) skewX(2deg);opacity:.56}}
        .monsoon-depth{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 75%,rgba(78,120,126,.08),transparent 36%),linear-gradient(180deg,rgba(5,13,16,.16),transparent 50%,rgba(1,10,12,.25));animation:dheereMonsoonDepth 15s ease-in-out infinite alternate}.monsoon-wet-glow{position:absolute;left:-10%;right:-10%;bottom:-2%;height:30%;background:radial-gradient(ellipse at center,rgba(167,219,224,.07),transparent 66%);filter:blur(15px);opacity:.62;animation:dheereMonsoonWet 8s ease-in-out infinite alternate}@keyframes dheereMonsoonDepth{from{transform:translateY(1%);opacity:.38}to{transform:translateY(-1.5%);opacity:.8}}@keyframes dheereMonsoonWet{from{transform:translateX(-2%) scale(.98);opacity:.28}to{transform:translateX(3%) scale(1.04);opacity:.72}}
        .winter-depth{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 16%,rgba(221,244,252,.09),transparent 30%),linear-gradient(180deg,rgba(226,246,252,.04),transparent 48%,rgba(145,197,218,.045));animation:dheereWinterDepth 18s ease-in-out infinite alternate}.winter-glow-line{position:absolute;left:-12%;right:-12%;bottom:14%;height:2px;background:linear-gradient(90deg,transparent,rgba(244,253,255,.16),rgba(215,243,252,.34),transparent);filter:blur(1.4px);opacity:.5;animation:dheereWinterGlow 9s ease-in-out infinite alternate}@keyframes dheereWinterDepth{from{transform:translate3d(-1%,0,0) scale(.99);opacity:.38}to{transform:translate3d(2%,-1%,0) scale(1.04);opacity:.82}}@keyframes dheereWinterGlow{from{transform:translateX(-8%);opacity:.22}to{transform:translateX(8%);opacity:.7}}
        @media(max-width:700px){.forest-light-shaft{width:96px}.midnight-halo{width:130px;height:130px}.desert-sun-halo{width:220px;height:220px}.ocean-caustic{opacity:.32}.monsoon-wet-glow{opacity:.48}}
        @media(prefers-reduced-motion:reduce){.original-ambient,.original-light,.forest-light-shaft,.forest-depth,.ocean-depth,.ocean-caustic,.ember-heat,.ember-core,.midnight-nebula,.midnight-halo,.prism-air,.desert-sun-halo,.desert-shimmer,.monsoon-depth,.monsoon-wet-glow,.winter-depth,.winter-glow-line{animation:none!important}}
        `;
        document.head.appendChild(style);
    }



    /* ============================================================
       WORLD DIRECTOR V6
       Spatial depth + material air. Adds only a few broad layers;
       existing mood-specific animations remain the primary motion.
       ============================================================ */
    function injectWorldDirectorCSS() {
        if (document.getElementById("dheere-world-director-v6")) return;
        const style = document.createElement("style");
        style.id = "dheere-world-director-v6";
        style.textContent = `
        .dheere-world-far,.dheere-world-mid,.dheere-world-near,.dheere-world-light{position:absolute;inset:0;pointer-events:none;transform:translateZ(0)}
        .dheere-world-far{opacity:.52;filter:blur(24px);animation:dw6Far 28s ease-in-out infinite alternate}
        .dheere-world-mid{opacity:.34;filter:blur(10px);animation:dw6Mid 19s ease-in-out infinite alternate}
        .dheere-world-near{opacity:.18;filter:blur(2px);animation:dw6Near 11s ease-in-out infinite alternate}
        .dheere-world-light{mix-blend-mode:screen;opacity:.22;filter:blur(18px);animation:dw6Light 17s ease-in-out infinite alternate}
        html[data-dheere-mood="original"] .dheere-world-far{background:radial-gradient(ellipse at 52% 10%,rgba(255,255,255,.09),transparent 31%),radial-gradient(ellipse at 15% 85%,rgba(255,255,255,.024),transparent 34%)}
        html[data-dheere-mood="original"] .dheere-world-mid{background:linear-gradient(180deg,transparent 12%,rgba(255,255,255,.018) 52%,rgba(0,0,0,.10) 100%)}
        html[data-dheere-mood="original"] .dheere-world-near{background:radial-gradient(ellipse at 50% 100%,rgba(255,255,255,.022),transparent 54%)}
        html[data-dheere-mood="original"] .dheere-world-light{background:linear-gradient(112deg,transparent 24%,rgba(255,255,255,.038) 50%,transparent 76%)}

        html[data-dheere-mood="forest"] .dheere-world-far{background:radial-gradient(ellipse at 50% 62%,rgba(84,148,98,.10),transparent 37%),linear-gradient(180deg,rgba(3,10,5,.05),rgba(2,18,8,.24) 78%,rgba(1,7,4,.35))}
        html[data-dheere-mood="forest"] .dheere-world-mid{background:radial-gradient(ellipse at 25% 52%,rgba(76,143,91,.09),transparent 26%),radial-gradient(ellipse at 77% 56%,rgba(62,126,79,.07),transparent 28%)}
        html[data-dheere-mood="forest"] .dheere-world-near{background:linear-gradient(90deg,rgba(1,7,3,.30),transparent 20%,transparent 80%,rgba(1,7,3,.26))}
        html[data-dheere-mood="forest"] .dheere-world-light{background:linear-gradient(105deg,transparent 30%,rgba(177,230,183,.065) 47%,transparent 64%)}

        html[data-dheere-mood="ocean"] .dheere-world-far{background:linear-gradient(180deg,rgba(38,91,130,.06),transparent 40%,rgba(0,12,23,.22)),radial-gradient(ellipse at 52% 46%,rgba(83,161,219,.10),transparent 34%)}
        html[data-dheere-mood="ocean"] .dheere-world-mid{background:linear-gradient(180deg,transparent 32%,rgba(50,119,169,.07) 52%,rgba(1,16,29,.18) 100%)}
        html[data-dheere-mood="ocean"] .dheere-world-near{background:linear-gradient(180deg,transparent 55%,rgba(0,7,15,.25) 100%)}
        html[data-dheere-mood="ocean"] .dheere-world-light{background:linear-gradient(106deg,transparent 24%,rgba(154,211,247,.06) 50%,transparent 74%)}

        html[data-dheere-mood="ember"] .dheere-world-far{background:linear-gradient(180deg,rgba(20,8,5,.12),rgba(60,14,8,.12) 54%,rgba(8,2,1,.34)),radial-gradient(ellipse at 50% 86%,rgba(222,68,37,.12),transparent 36%)}
        html[data-dheere-mood="ember"] .dheere-world-mid{background:radial-gradient(ellipse at 50% 74%,rgba(247,100,53,.08),transparent 32%)}
        html[data-dheere-mood="ember"] .dheere-world-near{background:linear-gradient(180deg,transparent 42%,rgba(32,4,2,.18) 100%)}
        html[data-dheere-mood="ember"] .dheere-world-light{background:radial-gradient(ellipse at 50% 84%,rgba(255,154,90,.11),transparent 42%)}

        html[data-dheere-mood="midnight"] .dheere-world-far{background:radial-gradient(ellipse at 72% 22%,rgba(120,108,213,.075),transparent 24%),radial-gradient(ellipse at 25% 62%,rgba(69,59,136,.06),transparent 34%),linear-gradient(180deg,rgba(6,5,16,.04),rgba(4,2,12,.18))}
        html[data-dheere-mood="midnight"] .dheere-world-mid{background:radial-gradient(ellipse at 50% 48%,rgba(103,91,184,.045),transparent 42%)}
        html[data-dheere-mood="midnight"] .dheere-world-near{background:linear-gradient(180deg,transparent 56%,rgba(1,0,6,.18) 100%)}
        html[data-dheere-mood="midnight"] .dheere-world-light{background:radial-gradient(circle at 81% 20%,rgba(220,214,255,.085),transparent 20%)}

        html[data-dheere-mood="prism"] .dheere-world-far{background:radial-gradient(ellipse at 18% 20%,rgba(72,213,255,.05),transparent 25%),radial-gradient(ellipse at 80% 24%,rgba(178,105,255,.055),transparent 28%),radial-gradient(ellipse at 72% 78%,rgba(255,116,164,.045),transparent 26%)}
        html[data-dheere-mood="prism"] .dheere-world-mid{background:radial-gradient(ellipse at 48% 48%,rgba(255,255,255,.035),transparent 42%)}
        html[data-dheere-mood="prism"] .dheere-world-near{background:linear-gradient(120deg,transparent 36%,rgba(255,255,255,.022) 50%,transparent 64%)}
        html[data-dheere-mood="prism"] .dheere-world-light{background:linear-gradient(106deg,transparent 24%,rgba(155,220,255,.05) 48%,rgba(214,152,255,.045) 58%,transparent 75%)}

        html[data-dheere-mood="desert"] .dheere-world-far{background:linear-gradient(180deg,rgba(248,234,202,.05),transparent 44%,rgba(73,56,39,.16) 100%),radial-gradient(ellipse at 62% 27%,rgba(255,219,145,.08),transparent 28%)}
        html[data-dheere-mood="desert"] .dheere-world-mid{background:linear-gradient(180deg,transparent 47%,rgba(190,152,103,.05) 60%,rgba(72,49,32,.10) 100%)}
        html[data-dheere-mood="desert"] .dheere-world-near{background:linear-gradient(180deg,transparent 56%,rgba(56,37,24,.18) 100%)}
        html[data-dheere-mood="desert"] .dheere-world-light{background:radial-gradient(circle at 84% 18%,rgba(255,223,150,.10),transparent 25%)}

        html[data-dheere-mood="monsoon"] .dheere-world-far{background:linear-gradient(180deg,rgba(38,53,59,.10),rgba(14,28,32,.05) 45%,rgba(3,13,16,.24) 100%),radial-gradient(ellipse at 48% 18%,rgba(120,146,152,.06),transparent 33%)}
        html[data-dheere-mood="monsoon"] .dheere-world-mid{background:radial-gradient(ellipse at 50% 66%,rgba(75,121,128,.06),transparent 38%)}
        html[data-dheere-mood="monsoon"] .dheere-world-near{background:linear-gradient(180deg,transparent 55%,rgba(3,15,18,.19) 100%)}
        html[data-dheere-mood="monsoon"] .dheere-world-light{background:linear-gradient(106deg,transparent 28%,rgba(191,225,231,.04) 50%,transparent 72%)}

        html[data-dheere-mood="winter"] .dheere-world-far{background:radial-gradient(ellipse at 52% 8%,rgba(224,246,253,.09),transparent 30%),linear-gradient(180deg,rgba(178,214,229,.04),transparent 52%,rgba(74,117,138,.08) 100%)}
        html[data-dheere-mood="winter"] .dheere-world-mid{background:radial-gradient(ellipse at 50% 65%,rgba(204,235,245,.045),transparent 42%)}
        html[data-dheere-mood="winter"] .dheere-world-near{background:linear-gradient(180deg,transparent 58%,rgba(47,88,108,.10) 100%)}
        html[data-dheere-mood="winter"] .dheere-world-light{background:linear-gradient(180deg,rgba(241,251,255,.04),transparent 40%,transparent 80%)}

        @keyframes dw6Far{from{transform:translate3d(-1.5%,.5%,0) scale(.99)}to{transform:translate3d(1.8%,-1%,0) scale(1.035)}}
        @keyframes dw6Mid{from{transform:translate3d(1%,0,0) scale(.995)}to{transform:translate3d(-1.5%,-.8%,0) scale(1.025)}}
        @keyframes dw6Near{from{transform:translate3d(-.8%,0,0)}to{transform:translate3d(1%,.4%,0)}}
        @keyframes dw6Light{from{transform:translate3d(-2%,0,0) rotate(-1deg);opacity:.10}to{transform:translate3d(2%,1%,0) rotate(1deg);opacity:.34}}
        @media(max-width:700px){.dheere-world-far{filter:blur(18px)}.dheere-world-mid{filter:blur(8px)}.dheere-world-light{filter:blur(13px)}}
        @media(prefers-reduced-motion:reduce){.dheere-world-far,.dheere-world-mid,.dheere-world-near,.dheere-world-light{animation:none!important}}
        `;
        document.head.appendChild(style);
    }

    function addWorldDirector(layer, mood) {
        const far = createElement("dheere-world-far", layer);
        const mid = createElement("dheere-world-mid", layer);
        const near = createElement("dheere-world-near", layer);
        const light = createElement("dheere-world-light", layer);

        layer.dataset.worldDepth = "far-mid-near";
        layer.style.setProperty("--world-mood", mood);

        const phase = random(-8, 8);
        [far, mid, near, light].forEach((node, index) => {
            node.style.animationDelay = prefersReducedMotion() ? "0s" : `${phase - index * 1.7}s`;
        });
    }

    /* ============================================================
       ORIGINAL
       ============================================================ */

    function buildOriginal(
        layer
    ) {

        layer.dataset.environment =
            "original";

        const original =
            createElement(
                "original-environment",
                layer
            );

        createElement("original-ambient", original);
        createElement("original-light", original);
        createElement("original-grain", original);

    }


    function buildForest(
        layer
    ) {

        const forest =
            createElement(
                "forest-environment",
                layer
            );


        
        createElement("forest-depth", forest);
        [["10%",15,".34","18s"],["34%",11,".22","22s"],["58%",18,".18","20s"]].forEach(function(data){ const shaft=createElement("forest-light-shaft",forest); shaft.style.left=data[0]; setVar(shaft,"--shaft-angle",data[1]+"deg"); setVar(shaft,"--shaft-opacity",data[2]); setVar(shaft,"--shaft-speed",data[3]); });

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
                6,
                Math.round(
                    24 * scale
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


        
        createElement("ocean-depth", ocean);
        createElement("ocean-horizon", ocean);
        createElement("ocean-caustic", ocean);

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
                5,
                Math.round(
                    20 * scale
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


        
        createElement("ember-heat", ember);
        createElement("ember-core", ember);

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
                5,
                Math.round(
                    24 * scale
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


        
        createElement("midnight-nebula", midnight);
        createElement("midnight-halo", midnight);

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
                24,
                Math.round(
                    72 * scale
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
                4,
                Math.round(
                    12 * scale
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


        
        createElement("prism-air", prism);

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
                8,
                Math.round(
                    24 * scale
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


    
    createElement("desert-sun-halo", desert);
    createElement("desert-shimmer", desert);

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
            12,
            Math.round(
                52 * scale
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
            6,
            Math.round(
                16 * scale
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


    
    createElement("monsoon-depth", monsoon);
    createElement("monsoon-wet-glow", monsoon);

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
            18,
            Math.round(
                72 * scale
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
            5,
            Math.round(
                16 * scale
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
            28,
            Math.round(
                96 * scale
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
            6,
            Math.round(
                18 * scale
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


    
        createElement("winter-depth", winter);
        createElement("winter-glow-line", winter);

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
            24,
            Math.round(
                90 * scale
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

        buildWorldDepth(layer, mood);
        addWorldCinematicDetails(layer, mood);

    }


    /* ============================================================
       DHEERE WORLD V8 — LIVING WORLD BUILDER
       ------------------------------------------------------------
       sky -> far field -> horizon -> ground -> air -> light
       A lightweight spatial composition layer shared by every mood.
       ============================================================ */

    function buildWorldDepth(
        layer,
        mood
    ) {

        const depth =
            createElement(
                "world-depth",
                layer
            );

        createElement("world-sky", depth);
        createElement("world-far", depth);
        createElement("world-horizon", depth);
        createElement("world-ground", depth);
        createElement("world-air", depth);
        createElement("world-light", depth);

        const focus =
            createElement(
                "world-focus",
                depth
            );

        focus.dataset.mood = mood;
        setVar(
            focus,
            "--world-seed",
            random(0, 1).toFixed(3)
        );

        if (mood === "forest") {
            setVar(focus, "--world-height", random(88, 108) + "%");
        } else if (mood === "ocean") {
            setVar(focus, "--world-horizon", random(42, 55) + "%");
        } else if (mood === "desert") {
            setVar(focus, "--world-horizon", random(31, 39) + "%");
        } else if (mood === "monsoon") {
            setVar(focus, "--world-horizon", random(24, 34) + "%");
        } else if (mood === "winter") {
            setVar(focus, "--world-cold", random(.82, 1).toFixed(2));
        }
    }


    /* ============================================================
       DHEERE WORLD V8 — LIVING DETAILS
       ------------------------------------------------------------
       Adds rare environmental events: birds, fish, bubbles,
       leaves, vines, air, spray, crystals and refracted life.
       ============================================================ */
    function addWorldLivingDetails(layer, mood) {

        const scale = motionScale();
        if (scale === 0) return;

        const root = createElement("world-life", layer);
        const count = (base, minimum = 2) => Math.max(minimum, Math.round(base * Math.max(.45, scale)));
        const setPos = (el, left, top) => {
            el.style.left = left + "%";
            el.style.top = top + "%";
        };
        const delay = (el, max) => applyRandomDelay(el, 0, max);

        if (mood === "forest") {
            const vineCount = count(7, 4);
            for (let i = 0; i < vineCount; i++) {
                const vine = createElement("forest-vine", root);
                setPos(vine, i % 2 ? random(78, 102) : random(-2, 24), random(-8, 48));
                vine.style.height = random(90, 250) + "px";
                setVar(vine, "--vine-speed", random(7, 12) + "s");
                delay(vine, 7);
            }

            const rootCount = count(6, 3);
            for (let i = 0; i < rootCount; i++) {
                const r = createElement("forest-root", root);
                setPos(r, random(-8, 88), random(74, 98));
                r.style.width = random(110, 290) + "px";
                r.style.transform = `rotate(${random(-24, 24)}deg)`;
                setVar(r, "--root-speed", random(15, 24) + "s");
                delay(r, 11);
            }

            const falling = count(26, 10);
            for (let i = 0; i < falling; i++) {
                const leaf = createElement("forest-leaf-fall", root);
                setPos(leaf, random(-3, 96), random(-10, 12));
                setVar(leaf, "--fall-speed", random(4.0, 6.8) + "s");
                setVar(leaf, "--leaf-drift", random(18, 54) + "px");
                setVar(leaf, "--leaf-drift-end", random(42, 92) + "px");
                delay(leaf, 5);
            }

            /* Forest V13: remove round/firefly-like points; use soft elongated pollen instead. */
            const pollen = count(14, 6);
            for (let i = 0; i < pollen; i++) {
                const p = createElement("forest-v9-pollen", root);
                setPos(p, random(8, 92), random(28, 92));
                setVar(p, "--pollen-speed", random(8, 15) + "s");
                setVar(p, "--pollen-x", random(-22, 28) + "px");
                setVar(p, "--pollen-y", random(-20, 18) + "px");
                delay(p, 10);
            }

            const birds = Math.max(2, Math.round(scale * 3));
            for (let i = 0; i < birds; i++) {
                const bird = createElement("forest-bird", root);
                setVar(bird, "--bird-speed", random(18, 30) + "s");
                setVar(bird, "--bird-y", random(14, 48) + "vh");
                delay(bird, 12);
            }
        }

        if (mood === "ocean") {
            const fish = Math.max(3, Math.round(5 * scale));
            for (let i = 0; i < fish; i++) {
                const f = createElement("ocean-fish", root);
                setVar(f, "--fish-speed", random(14, 23) + "s");
                setVar(f, "--fish-y", random(42, 84) + "vh");
                setVar(f, "--fish-rise", random(-2, 2) + "vh");
                delay(f, 10);
            }
            const bubbles = count(30, 10);
            for (let i = 0; i < bubbles; i++) {
                const b = createElement("ocean-bubble", root);
                setPos(b, random(5, 96), random(54, 104));
                setVar(b, "--bubble-size", random(2.5, 8) + "px");
                setVar(b, "--bubble-speed", random(4.5, 8.5) + "s");
                setVar(b, "--bubble-drift", random(-18, 24) + "px");
                delay(b, 7);
            }
            const plank = count(36, 14);
            for (let i = 0; i < plank; i++) {
                const p = createElement("ocean-plankton", root);
                setPos(p, random(4, 97), random(34, 96));
                setVar(p, "--plankton-speed", random(7, 15) + "s");
                setVar(p, "--plankton-x", random(-18, 26) + "px");
                setVar(p, "--plankton-y", random(-22, 22) + "px");
                delay(p, 12);
            }
        }

        if (mood === "ember") {
            const bubbles = count(12, 5);
            for (let i = 0; i < bubbles; i++) {
                const b = createElement("ember-bubble", root);
                setPos(b, random(22, 80), random(70, 102));
                b.style.width = random(5, 15) + "px";
                b.style.height = b.style.width;
                setVar(b, "--bubble-speed", random(4.5, 8) + "s");
                setVar(b, "--bubble-drift", random(-26, 26) + "px");
                delay(b, 8);
            }
            const ash = count(24, 9);
            for (let i = 0; i < ash; i++) {
                const a = createElement("ember-ash", root);
                setPos(a, random(12, 90), random(52, 96));
                setVar(a, "--ash-speed", random(6, 12) + "s");
                setVar(a, "--ash-x", random(-24, 28) + "px");
                setVar(a, "--ash-y", random(-52, -16) + "px");
                delay(a, 12);
            }
            for (let i = 0; i < 2; i++) {
                const h = createElement("ember-heatline", root);
                h.style.bottom = random(25, 62) + "%";
                h.style.transform = `rotate(${random(-2, 2)}deg)`;
                delay(h, 5);
            }
        }

        if (mood === "midnight") {
            const birds = Math.max(2, Math.round(3 * scale));
            for (let i = 0; i < birds; i++) {
                const bird = createElement("midnight-bird", root);
                setVar(bird, "--bird-speed", random(19, 29) + "s");
                setVar(bird, "--bird-y", random(16, 52) + "vh");
                delay(bird, 14);
            }
            createElement("midnight-cloud", root);
            const dust = count(15, 6);
            for (let i = 0; i < dust; i++) {
                const d = createElement("midnight-lunar-dust", root);
                setPos(d, random(5, 96), random(12, 86));
                setVar(d, "--dust-speed", random(10, 17) + "s");
                setVar(d, "--dust-x", random(-16, 22) + "px");
                setVar(d, "--dust-y", random(-18, 20) + "px");
                delay(d, 12);
            }
        }

        if (mood === "prism") {
            const shards = count(7, 4);
            for (let i = 0; i < shards; i++) {
                const s = createElement("prism-shard", root);
                setPos(s, random(10, 90), random(8, 82));
                setVar(s, "--shard-speed", random(10, 18) + "s");
                s.style.height = random(48, 120) + "px";
                delay(s, 13);
            }
            const glints = count(14, 6);
            for (let i = 0; i < glints; i++) {
                const g = createElement("prism-glint", root);
                setPos(g, random(3, 97), random(6, 94));
                setVar(g, "--glint-speed", random(3.8, 7) + "s");
                delay(g, 10);
            }
            const dust = count(20, 8);
            for (let i = 0; i < dust; i++) {
                const d = createElement("prism-dust", root);
                setPos(d, random(2, 98), random(4, 96));
                setVar(d, "--dust-speed", random(9, 16) + "s");
                setVar(d, "--dust-x", random(-20, 26) + "px");
                setVar(d, "--dust-y", random(-24, 24) + "px");
                delay(d, 12);
            }
        }

        if (mood === "desert") {
            const birds = Math.max(1, Math.round(1.5 * scale));
            for (let i = 0; i < birds; i++) {
                const b = createElement("desert-bird", root);
                setVar(b, "--bird-speed", random(20, 30) + "s");
                setVar(b, "--bird-y", random(22, 48) + "vh");
                delay(b, 15);
            }
            for (let i = 0; i < 3; i++) {
                const r = createElement("desert-sand-ribbon", root);
                r.style.bottom = random(16, 52) + "%";
                setVar(r, "--ribbon-speed", random(11, 19) + "s");
                delay(r, 12);
            }
            createElement("desert-heat-shimmer", root);
        }

        if (mood === "monsoon") {
            const leaves = count(18, 7);
            for (let i = 0; i < leaves; i++) {
                const l = createElement("monsoon-leaf", root);
                setPos(l, random(-8, 94), random(8, 72));
                setVar(l, "--leaf-speed", random(2.5, 4.8) + "s");
                delay(l, 5);
            }
            const spray = count(24, 8);
            for (let i = 0; i < spray; i++) {
                const s = createElement("monsoon-spray", root);
                setPos(s, random(3, 97), random(66, 94));
                setVar(s, "--spray-speed", random(1.6, 2.8) + "s");
                setVar(s, "--spray-x", random(-28, 28) + "px");
                delay(s, 4);
            }
            const haze = createElement("monsoon-haze-ribbon", root);
            haze.style.top = random(18, 58) + "%";
        }

        if (mood === "winter") {
            const birds = Math.max(1, Math.round(1.4 * scale));
            for (let i = 0; i < birds; i++) {
                const b = createElement("winter-bird", root);
                setVar(b, "--bird-speed", random(22, 32) + "s");
                setVar(b, "--bird-y", random(16, 44) + "vh");
                delay(b, 17);
            }
            const breath = createElement("winter-breath", root);
            breath.style.left = random(16, 62) + "%";
            breath.style.top = random(42, 70) + "%";
            delay(breath, 8);
            const fine = count(18, 7);
            for (let i = 0; i < fine; i++) {
                const c = createElement("winter-fine-crystal", root);
                setPos(c, random(2, 98), random(10, 96));
                setVar(c, "--crystal-speed", random(5, 11) + "s");
                setVar(c, "--crystal-x", random(-18, 22) + "px");
                setVar(c, "--crystal-y", random(-24, 18) + "px");
                delay(c, 10);
            }
        }

        if (mood === "original") {
            const sweep = createElement("original-light-sweep", root);
            sweep.style.left = random(-8, 52) + "%";
            sweep.style.top = random(3, 48) + "%";
            const air = count(16, 6);
            for (let i = 0; i < air; i++) {
                const a = createElement("original-air", root);
                setPos(a, random(3, 97), random(8, 94));
                setVar(a, "--air-speed", random(10, 20) + "s");
                setVar(a, "--air-x", random(-18, 26) + "px");
                setVar(a, "--air-y", random(-22, 22) + "px");
                delay(a, 14);
            }
        }
    }


    /* ============================================================
       DHEERE WORLD V9 — HIGH FIDELITY ENVIRONMENTAL DETAIL
       ------------------------------------------------------------
       Adds deeper event choreography without replacing V8 systems.
       ============================================================ */
    function addWorldCinematicDetails(layer, mood) {

        const scale = motionScale();
        if (scale === 0) return;

        const root = createElement("world-v9-life", layer);
        const count = (base, min = 2) => Math.max(min, Math.round(base * Math.max(.50, scale)));
        const pos = (el, x, y) => { el.style.left = x + "%"; el.style.top = y + "%"; };
        const delay = (el, max) => applyRandomDelay(el, 0, max);

        if (mood === "forest") {
            const vines = count(10, 5);
            for (let i = 0; i < vines; i++) {
                const v = createElement("forest-v9-vine", root);
                pos(v, i % 2 ? random(73, 103) : random(-4, 27), random(-18, 42));
                v.style.height = random(120, 310) + "px";
                setVar(v, "--v9-vine-speed", random(8, 15) + "s");
                setVar(v, "--v9-vine-x", random(-9, 9) + "px");
                delay(v, 10);
            }
            const branch = count(6, 3);
            for (let i = 0; i < branch; i++) {
                const b = createElement("forest-v9-branch-tip", root);
                pos(b, i % 2 ? random(70, 104) : random(-8, 22), random(8, 66));
                b.style.width = random(150, 330) + "px";
                b.style.transform = `rotate(${random(-20, 20)}deg)`;
                setVar(b, "--branch-drift", random(-16, 18) + "px");
                delay(b, 12);
            }
            const leaves = count(34, 14);
            for (let i = 0; i < leaves; i++) {
                const l = createElement("forest-v9-leaf", root);
                pos(l, random(-4, 101), random(-12, 24));
                setVar(l, "--v9-leaf-speed", random(6.2, 10.5) + "s");
                setVar(l, "--v9-leaf-x", random(28, 96) + "px");
                setVar(l, "--v9-leaf-spin", random(190, 420) + "deg");
                delay(l, 5);
            }
            const birds = Math.max(2, Math.round(scale * 3));
            for (let i = 0; i < birds; i++) {
                const b = createElement("forest-v9-bird", root);
                setVar(b, "--v9-bird-y", random(12, 48) + "vh");
                setVar(b, "--v9-bird-speed", random(18, 30) + "s");
                setVar(b, "--v9-bird-scale", random(.55, .95));
                delay(b, 12);
            }
        }

        if (mood === "ocean") {
            const school = Math.max(4, Math.round(6 * scale));
            for (let i = 0; i < school; i++) {
                const f = createElement("ocean-v9-fish", root);
                setVar(f, "--v9-fish-y", random(45, 82) + "vh");
                setVar(f, "--v9-fish-speed", random(10, 18) + "s");
                setVar(f, "--v9-fish-size", random(.55, 1.05));
                setVar(f, "--v9-fish-lane", random(-5, 7) + "vh");
                delay(f, 12);
            }
            const bubbles = count(42, 18);
            for (let i = 0; i < bubbles; i++) {
                const b = createElement("ocean-v9-bubble", root);
                pos(b, random(4, 98), random(52, 104));
                setVar(b, "--v9-bubble-size", random(2, 10) + "px");
                setVar(b, "--v9-bubble-speed", random(3.8, 7.8) + "s");
                setVar(b, "--v9-bubble-x", random(-24, 26) + "px");
                delay(b, 7);
            }
            const caustic = count(14, 6);
            for (let i = 0; i < caustic; i++) {
                const c = createElement("ocean-v9-caustic", root);
                pos(c, random(4, 94), random(35, 88));
                setVar(c, "--caustic-speed", random(7, 15) + "s");
                delay(c, 12);
            }
        }

        if (mood === "ember") {
            const ash = count(28, 12);
            for (let i = 0; i < ash; i++) {
                const a = createElement("ember-v9-ash", root);
                pos(a, random(8, 92), random(54, 99));
                setVar(a, "--v9-ash-speed", random(4.5, 9) + "s");
                setVar(a, "--v9-ash-x", random(-34, 38) + "px");
                setVar(a, "--v9-ash-y", random(-80, -28) + "px");
                delay(a, 12);
            }
            const heat = 5;
            for (let i = 0; i < heat; i++) {
                const h = createElement("ember-v9-heat", root);
                h.style.left = random(14, 82) + "%";
                h.style.bottom = random(28, 64) + "%";
                setVar(h, "--v9-heat-speed", random(5.8, 9.5) + "s");
                delay(h, 10);
            }
            const embers = count(12, 5);
            for (let i = 0; i < embers; i++) {
                const e = createElement("ember-v9-coal", root);
                pos(e, random(18, 82), random(80, 98));
                setVar(e, "--v9-coal-speed", random(3.2, 6) + "s");
                delay(e, 7);
            }
        }

        if (mood === "midnight") {
            const birds = Math.max(2, Math.round(scale * 3));
            for (let i = 0; i < birds; i++) {
                const b = createElement("midnight-v9-bird", root);
                setVar(b, "--v9-night-y", random(13, 50) + "vh");
                setVar(b, "--v9-night-speed", random(16, 28) + "s");
                delay(b, 14);
            }
            const clouds = 4;
            for (let i = 0; i < clouds; i++) {
                const c = createElement("midnight-v9-cloud", root);
                c.style.left = random(-20, 70) + "%";
                c.style.top = random(4, 45) + "%";
                c.style.width = random(160, 420) + "px";
                setVar(c, "--v9-cloud-speed", random(18, 34) + "s");
                delay(c, 16);
            }
            const stars = count(18, 8);
            for (let i = 0; i < stars; i++) {
                const s = createElement("midnight-v9-star", root);
                pos(s, random(2, 98), random(5, 72));
                setVar(s, "--v9-star-speed", random(4, 10) + "s");
                delay(s, 10);
            }
        }

        if (mood === "prism") {
            const shards = count(11, 6);
            for (let i = 0; i < shards; i++) {
                const s = createElement("prism-v9-shard", root);
                pos(s, random(6, 94), random(6, 88));
                setVar(s, "--v9-shard-speed", random(8, 16) + "s");
                setVar(s, "--v9-shard-tilt", random(-24, 24) + "deg");
                delay(s, 14);
            }
            const glints = count(24, 10);
            for (let i = 0; i < glints; i++) {
                const g = createElement("prism-v9-glint", root);
                pos(g, random(4, 96), random(4, 96));
                setVar(g, "--v9-glint-speed", random(3.2, 7.2) + "s");
                delay(g, 12);
            }
        }

        if (mood === "desert") {
            const birds = Math.max(2, Math.round(scale * 2));
            for (let i = 0; i < birds; i++) {
                const b = createElement("desert-v9-bird", root);
                setVar(b, "--v9-desert-y", random(18, 46) + "vh");
                setVar(b, "--v9-desert-speed", random(17, 27) + "s");
                delay(b, 16);
            }
            const sand = count(16, 7);
            for (let i = 0; i < sand; i++) {
                const s = createElement("desert-v9-sand-sheet", root);
                s.style.bottom = random(8, 58) + "%";
                setVar(s, "--v9-sand-speed", random(8, 15) + "s");
                delay(s, 11);
            }
            const mirage = createElement("desert-v9-mirage", root);
            mirage.style.bottom = random(23, 37) + "%";
        }

        if (mood === "monsoon") {
            const leaves = count(30, 12);
            for (let i = 0; i < leaves; i++) {
                const l = createElement("monsoon-v9-leaf", root);
                pos(l, random(-8, 94), random(-4, 72));
                setVar(l, "--v9-rain-leaf-speed", random(1.9, 3.8) + "s");
                setVar(l, "--v9-rain-leaf-x", random(42, 98) + "px");
                delay(l, 4);
            }
            const sprays = count(32, 12);
            for (let i = 0; i < sprays; i++) {
                const s = createElement("monsoon-v9-spray", root);
                pos(s, random(2, 98), random(68, 96));
                setVar(s, "--v9-spray-speed", random(.9, 2.1) + "s");
                setVar(s, "--v9-spray-x", random(-40, 40) + "px");
                delay(s, 3);
            }
        }

        if (mood === "winter") {
            const birds = Math.max(2, Math.round(scale * 2));
            for (let i = 0; i < birds; i++) {
                const b = createElement("winter-v9-bird", root);
                setVar(b, "--v9-winter-y", random(14, 44) + "vh");
                setVar(b, "--v9-winter-speed", random(18, 30) + "s");
                delay(b, 16);
            }
            const crystals = count(30, 12);
            for (let i = 0; i < crystals; i++) {
                const c = createElement("winter-v9-crystal", root);
                pos(c, random(1, 99), random(-10, 100));
                setVar(c, "--v9-crystal-speed", random(4.2, 8.5) + "s");
                setVar(c, "--v9-crystal-x", random(-30, 34) + "px");
                delay(c, 10);
            }
            const mist = createElement("winter-v9-ground-mist", root);
            mist.style.bottom = random(18, 28) + "%";
        }

        if (mood === "original") {
            const fields = count(14, 6);
            for (let i = 0; i < fields; i++) {
                const f = createElement("original-v9-dust", root);
                pos(f, random(6, 96), random(8, 96));
                setVar(f, "--v9-dust-speed", random(12, 24) + "s");
                setVar(f, "--v9-dust-x", random(-20, 26) + "px");
                setVar(f, "--v9-dust-y", random(-18, 18) + "px");
                delay(f, 16);
            }
            for (let i = 0; i < 2; i++) {
                const beam = createElement("original-v9-beam", root);
                beam.style.left = random(28, 68) + "%";
                setVar(beam, "--v9-beam-speed", random(13, 21) + "s");
                delay(beam, 12);
            }
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

                const originalLayer =
                    createLayer(
                        "original"
                    );

                originalLayer.style.opacity = "1";

                populateLayer(
                    "original",
                    originalLayer
                );

                buildWorldDepth(
                    originalLayer,
                    "original"
                );

                addWorldLivingDetails(
                    originalLayer,
                    "original"
                );

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


        buildWorldDepth(
            newLayer,
            mood
        );

        addWorldLivingDetails(
            newLayer,
            mood
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
        injectCinematicAtmosphereCSS();
        injectWorldDirectorCSS();


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
       VISIBILITY PERFORMANCE
       ============================================================ */

    function syncEnvironmentPlayback() {

        if (
            !environmentRoot
        ) {

            return;

        }


        environmentRoot.classList.toggle(
            "mood-animations-paused",
            document.visibilityState !==
            "visible"
        );

    }


    document.addEventListener(
        "visibilitychange",
        syncEnvironmentPlayback
    );


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