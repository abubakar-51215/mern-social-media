// Comprehensive console filter to suppress unwanted messages
(function() {
    // Store original console methods
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;
    
    // Filter patterns for errors to suppress
    const errorFilters = [
        'ERR_BLOCKED_BY_CLIENT',
        'Content Security Policy',
        'googleads.g.doubleclick.net',
        'doubleclick.net',
        'ad_status.js',
        'youtube.com/embed',
        'Failed to load resource',
        'www-embed-player.js',
        'GET http://localhost:5000/api/friends/requests 404',
        'Loading the script',
        'violates the following Content Security Policy'
    ];
    
    // Filter patterns for warnings to suppress
    const warnFilters = [
        '[HMR]',
        'Waiting for update signal',
        'AdUnit',
        'content-script.js',
        'Document already loaded'
    ];
    
    // Override console.error
    console.error = function(...args) {
        const message = args.join(' ');
        if (errorFilters.some(filter => message.includes(filter))) {
            return; // Suppress this error
        }
        originalError.apply(console, args);
    };
    
    // Override console.warn
    console.warn = function(...args) {
        const message = args.join(' ');
        if (warnFilters.some(filter => message.includes(filter))) {
            return; // Suppress this warning
        }
        originalWarn.apply(console, args);
    };
    
    // Override console.log for HMR messages
    console.log = function(...args) {
        const message = args.join(' ');
        if (message.includes('[HMR]') || message.includes('AdUnit')) {
            return; // Suppress this log
        }
        originalLog.apply(console, args);
    };
})();