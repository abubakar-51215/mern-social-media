// Clean, consolidated console filter to suppress third-party noise
(function () {
    'use strict';

    const original = {
        log: console.log.bind(console),
        info: console.info.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
        debug: (console.debug || console.log).bind(console),
    };

    const FILTER_TERMS = [
        // Network/ad-block messages
        'err_blocked_by_client',
        'net::err_blocked_by_client',
        'failed to load resource',
        'net::err_',

        // DoubleClick/Ads
        'googleads.g.doubleclick.net',
        'doubleclick.net',
        'static.doubleclick.net',
        'pagead/id',
        'instream/ad_status.js',
        'pagead/id',
        'ad_status.js',
        '/ads/',
        'adservice',

        // YouTube embed player
        'www-embed-player',
        'youtube.com/embed',
        'ytimg.com',
        'googlevideo.com',

        // Extensions / content scripts
        'content-script.js',
        'content-script',
        'document already loaded',
        'attempting to initialize',
        'initialized successfully',

        // Dev server noise
        '[hmr]',
        'webpack',
        '[webpack]',

        // Dev prompts / misc noise
        'download the react devtools',
        'observer attached to post',
        'document already loaded',
        'attempting to initialize adunit',
        'adunit initialized successfully',
    ];

    function normalizeArgs(args) {
        return args
            .map((a) => {
                if (typeof a === 'string') return a;
                try { return JSON.stringify(a); } catch { return String(a); }
            })
            .join(' ')
            .toLowerCase();
    }

    function shouldFilter(args) {
        const text = normalizeArgs(args);
        return FILTER_TERMS.some((t) => text.includes(t));
    }

    console.log = function (...args) {
        if (shouldFilter(args)) return;
        original.log(...args);
    };

    console.info = function (...args) {
        if (shouldFilter(args)) return;
        original.info(...args);
    };

    console.warn = function (...args) {
        if (shouldFilter(args)) return;
        original.warn(...args);
    };

    console.error = function (...args) {
        if (shouldFilter(args)) return;
        original.error(...args);
    };

    console.debug = function (...args) {
        if (shouldFilter(args)) return;
        original.debug(...args);
    };

    // Suppress resource loading errors for blocked ad domains
    const BLOCKED_DOMAINS = ['doubleclick.net', 'googleads.g.doubleclick.net', 'static.doubleclick.net'];
    const BLOCKED_PATTERNS = [
        'pagead/id',
        'instream/ad_status.js',
        'www-embed-player',
    ];
    window.addEventListener(
        'error',
        (event) => {
            try {
                const target = event.target || event.srcElement;
                // Resource load errors
                if (target && (target.tagName === 'SCRIPT' || target.tagName === 'IMG' || target.tagName === 'IFRAME')) {
                    const src = (target.src || target.dataset?.src || '').toLowerCase();
                    if (BLOCKED_DOMAINS.some((d) => src.includes(d)) || BLOCKED_PATTERNS.some((p) => src.includes(p))) {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        return;
                    }
                }
                // Generic window errors with message/filename only
                const msg = (event.message || '').toLowerCase();
                const file = (event.filename || '').toLowerCase();
                if (shouldFilter([msg, file]) || BLOCKED_PATTERNS.some((p) => file.includes(p))) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                }
            } catch {}
        },
        true
    );

    window.addEventListener(
        'unhandledrejection',
        (event) => {
            const reason = event.reason ? (event.reason.message || String(event.reason)) : '';
            if (shouldFilter([reason])) {
                event.preventDefault();
            }
        },
        true
    );

    if (typeof window !== 'undefined' && !window.__consoleFilterLoaded) {
        window.__consoleFilterLoaded = true;
        setTimeout(() => {
            original.log('%c🧹 Console Filter Active', 'color: #10b981; font-weight: bold; font-size: 14px;');
            original.info('%cBlocking: Ads/Embeds/HMR noise', 'color: #6b7280; font-size: 12px;');
        }, 50);
    }
})();