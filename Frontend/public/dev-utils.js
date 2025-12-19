/**
 * Development Utilities
 * Enhanced debugging and development tools
 */

(function() {
    'use strict';
    
    // Only run in development
    if (process.env.NODE_ENV !== 'development') {
        return;
    }
    
    // Create dev namespace
    window.__DEV__ = {
        version: '1.0.0',
        enabled: true,
    };
    
    /**
     * Performance Monitoring
     */
    class PerformanceMonitor {
        constructor() {
            this.marks = new Map();
            this.measures = [];
        }
        
        start(label) {
            this.marks.set(label, performance.now());
            console.log(`⏱️  Started: ${label}`);
        }
        
        end(label) {
            const startTime = this.marks.get(label);
            if (!startTime) {
                console.warn(`No start mark found for: ${label}`);
                return;
            }
            
            const duration = performance.now() - startTime;
            this.measures.push({ label, duration });
            console.log(`✅ Completed: ${label} (${duration.toFixed(2)}ms)`);
            this.marks.delete(label);
        }
        
        report() {
            console.group('📊 Performance Report');
            this.measures.forEach(({ label, duration }) => {
                const color = duration < 100 ? '#10b981' : duration < 500 ? '#f59e0b' : '#ef4444';
                console.log(`%c${label}: ${duration.toFixed(2)}ms`, `color: ${color}`);
            });
            console.groupEnd();
        }
        
        clear() {
            this.marks.clear();
            this.measures = [];
            console.log('🧹 Performance data cleared');
        }
    }
    
    /**
     * Console Helper
     */
    class ConsoleHelper {
        static success(message, ...args) {
            console.log(`%c✅ ${message}`, 'color: #10b981; font-weight: bold;', ...args);
        }
        
        static info(message, ...args) {
            console.log(`%cℹ️  ${message}`, 'color: #3b82f6; font-weight: bold;', ...args);
        }
        
        static warning(message, ...args) {
            console.log(`%c⚠️  ${message}`, 'color: #f59e0b; font-weight: bold;', ...args);
        }
        
        static error(message, ...args) {
            console.log(`%c❌ ${message}`, 'color: #ef4444; font-weight: bold;', ...args);
        }
        
        static divider(label = '') {
            console.log(`%c${'━'.repeat(50)}`, 'color: #6b7280;');
            if (label) {
                console.log(`%c${label}`, 'color: #6366f1; font-weight: bold; font-size: 14px;');
                console.log(`%c${'━'.repeat(50)}`, 'color: #6b7280;');
            }
        }
        
        static table(data, label = '') {
            if (label) {
                console.log(`%c📋 ${label}`, 'color: #8b5cf6; font-weight: bold;');
            }
            console.table(data);
        }
    }
    
    /**
     * Network Monitor
     */
    class NetworkMonitor {
        constructor() {
            this.requests = [];
            this.enabled = false;
        }
        
        enable() {
            if (this.enabled) return;
            
            this.enabled = true;
            const originalFetch = window.fetch;
            const self = this;
            
            window.fetch = function(...args) {
                const startTime = performance.now();
                const url = typeof args[0] === 'string' ? args[0] : args[0].url;
                
                return originalFetch.apply(this, args).then(response => {
                    const duration = performance.now() - startTime;
                    self.requests.push({
                        url,
                        status: response.status,
                        duration: duration.toFixed(2),
                        timestamp: new Date().toISOString()
                    });
                    
                    const statusColor = response.ok ? '#10b981' : '#ef4444';
                    console.log(
                        `%c🌐 ${response.status}`,
                        `color: ${statusColor}; font-weight: bold;`,
                        url,
                        `(${duration.toFixed(2)}ms)`
                    );
                    
                    return response;
                }).catch(error => {
                    const duration = performance.now() - startTime;
                    self.requests.push({
                        url,
                        status: 'ERROR',
                        duration: duration.toFixed(2),
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                    throw error;
                });
            };
            
            ConsoleHelper.success('Network monitoring enabled');
        }
        
        disable() {
            this.enabled = false;
            // Note: Can't easily restore original fetch without reference
            ConsoleHelper.warning('Network monitoring disabled (reload to fully restore)');
        }
        
        report() {
            ConsoleHelper.table(this.requests, 'Network Requests');
            
            const avgDuration = this.requests.reduce((sum, req) => 
                sum + parseFloat(req.duration), 0) / this.requests.length;
            
            console.log(`%c📊 Average request time: ${avgDuration.toFixed(2)}ms`, 
                'color: #6366f1; font-weight: bold;');
        }
        
        clear() {
            this.requests = [];
            ConsoleHelper.success('Network history cleared');
        }
    }
    
    /**
     * State Inspector
     */
    class StateInspector {
        static inspect(obj, label = 'Object') {
            console.group(`%c🔍 ${label}`, 'color: #8b5cf6; font-weight: bold;');
            
            if (typeof obj === 'object' && obj !== null) {
                Object.entries(obj).forEach(([key, value]) => {
                    const type = typeof value;
                    const color = type === 'function' ? '#f59e0b' : 
                                 type === 'object' ? '#3b82f6' : '#10b981';
                    console.log(`%c${key}:`, `color: ${color}; font-weight: bold;`, value);
                });
            } else {
                console.log(obj);
            }
            
            console.groupEnd();
        }
        
        static diff(obj1, obj2, label1 = 'Before', label2 = 'After') {
            console.group(`%c🔄 Comparing ${label1} vs ${label2}`, 'color: #ec4899; font-weight: bold;');
            
            const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
            
            keys.forEach(key => {
                const val1 = obj1[key];
                const val2 = obj2[key];
                
                if (JSON.stringify(val1) !== JSON.stringify(val2)) {
                    console.log(`%c${key}:`, 'color: #f59e0b; font-weight: bold;');
                    console.log('  Before:', val1);
                    console.log('  After:', val2);
                }
            });
            
            console.groupEnd();
        }
    }
    
    // Initialize and expose utilities
    window.__DEV__.perf = new PerformanceMonitor();
    window.__DEV__.console = ConsoleHelper;
    window.__DEV__.network = new NetworkMonitor();
    window.__DEV__.inspect = StateInspector.inspect;
    window.__DEV__.diff = StateInspector.diff;
    
    // Quick aliases
    window.perf = window.__DEV__.perf;
    window.dev = window.__DEV__.console;
    
    // Display available commands
    setTimeout(() => {
        console.log('');
        console.log('%c🛠️  Development Utilities Loaded', 'color: #6366f1; font-size: 16px; font-weight: bold;');
        console.log('');
        console.log('%cAvailable Commands:', 'color: #8b5cf6; font-size: 14px; font-weight: bold;');
        console.log('%c  perf.start("task")     %c- Start performance timer', 'color: #10b981; font-weight: bold;', 'color: #6b7280;');
        console.log('%c  perf.end("task")       %c- End performance timer', 'color: #10b981; font-weight: bold;', 'color: #6b7280;');
        console.log('%c  perf.report()          %c- Show performance report', 'color: #10b981; font-weight: bold;', 'color: #6b7280;');
        console.log('');
        console.log('%c  dev.success("msg")     %c- Success message', 'color: #3b82f6; font-weight: bold;', 'color: #6b7280;');
        console.log('%c  dev.info("msg")        %c- Info message', 'color: #3b82f6; font-weight: bold;', 'color: #6b7280;');
        console.log('%c  dev.warning("msg")     %c- Warning message', 'color: #3b82f6; font-weight: bold;', 'color: #6b7280;');
        console.log('%c  dev.error("msg")       %c- Error message', 'color: #3b82f6; font-weight: bold;', 'color: #6b7280;');
        console.log('');
        console.log('%c  __DEV__.network.enable()  %c- Monitor network requests', 'color: #f59e0b; font-weight: bold;', 'color: #6b7280;');
        console.log('%c  __DEV__.network.report()  %c- Show network report', 'color: #f59e0b; font-weight: bold;', 'color: #6b7280;');
        console.log('');
        console.log('%c  __DEV__.inspect(obj)   %c- Inspect object', 'color: #ec4899; font-weight: bold;', 'color: #6b7280;');
        console.log('');
    }, 200);
    
})();
