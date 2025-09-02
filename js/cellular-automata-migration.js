/**
 * Migration Script for Unified Cellular Automata
 * Provides compatibility layer and migration path from old system to new unified system
 */

(function(window) {
    'use strict';

    /**
     * Auto-migration function that replaces old cellular automata instances
     * with new unified ones while maintaining backward compatibility
     */
    async function migrateCellularAutomata() {
        console.log('Starting cellular automata migration to unified system...');

        try {
            // Check if we have the required dependencies
            if (!window.CellularAutomataRules || !window.UnifiedCellularAutomata) {
                console.error('Missing required dependencies for migration');
                return false;
            }

            // Find existing cellular automata canvases
            const backgroundCanvas = document.getElementById('background-canvas');
            const headerCanvas = document.getElementById('header-canvas');

            if (!backgroundCanvas || !headerCanvas) {
                console.warn('Cellular automata canvases not found, skipping migration');
                return true;
            }

            // Stop any existing animations
            if (window.backgroundCA && typeof window.backgroundCA.stop === 'function') {
                window.backgroundCA.stop();
            }
            if (window.headerCA && typeof window.headerCA.stop === 'function') {
                window.headerCA.stop();
            }

            // Create unified background cellular automata
            const backgroundEngine = await window.ComputeEngineFactory.createBestEngine(backgroundCanvas, {
                priority: 'performance' // Background prioritizes performance
            });
            
            window.backgroundCA = new window.UnifiedCellularAutomata(
                'background-canvas',
                'background',
                backgroundEngine
            );

            // Create unified header cellular automata
            const headerEngine = await window.ComputeEngineFactory.createBestEngine(headerCanvas, {
                priority: 'quality' // Header can use more resources for visual quality
            });
            
            window.headerCA = new window.UnifiedCellularAutomata(
                'header-canvas',
                'header',
                headerEngine
            );

            // Initialize and start
            const backgroundInit = await window.backgroundCA.initialize();
            const headerInit = await window.headerCA.initialize();

            if (!backgroundInit || !headerInit) {
                throw new Error('Failed to initialize unified cellular automata');
            }

            // Start animations
            window.backgroundCA.start();
            window.headerCA.start();

            // Set up rule indicator updates for backward compatibility
            setupRuleIndicatorCompatibility();

            console.log('✅ Successfully migrated to unified cellular automata system');
            console.log('Background engine:', backgroundEngine.constructor.name);
            console.log('Header engine:', headerEngine.constructor.name);

            return true;

        } catch (error) {
            console.error('❌ Migration failed:', error);
            
            // Fall back to original system if available
            await fallbackToOriginalSystem();
            return false;
        }
    }

    /**
     * Set up rule indicator compatibility with the old system
     */
    function setupRuleIndicatorCompatibility() {
        // Update rule indicators periodically to match the new system
        const updateRuleIndicators = () => {
            if (window.backgroundCA && window.headerCA) {
                const bgRule = window.backgroundCA.getCurrentRule();
                const headerRule = window.headerCA.getCurrentRule();
                
                // Update rule indicator elements if they exist
                const bgRuleElement = document.querySelector('.rule-indicator .bg-rule');
                const headerRuleElement = document.querySelector('.rule-indicator .header-rule');
                
                if (bgRuleElement) {
                    bgRuleElement.textContent = `Rule ${bgRule}`;
                }
                if (headerRuleElement) {
                    headerRuleElement.textContent = `Rule ${headerRule}`;
                }

                // Trigger custom events for other parts of the system
                window.dispatchEvent(new CustomEvent('cellularAutomataRuleChanged', {
                    detail: { background: bgRule, header: headerRule }
                }));
            }
        };

        // Update every second
        setInterval(updateRuleIndicators, 1000);
        
        // Initial update
        updateRuleIndicators();
    }

    /**
     * Fallback to original system if migration fails
     */
    async function fallbackToOriginalSystem() {
        console.log('Attempting fallback to original cellular automata system...');
        
        try {
            // Check if original classes are available
            if (window.BackgroundCellularAutomata && window.HeaderCellularAutomata) {
                console.log('Original classes found, initializing fallback...');
                
                // Initialize original system
                if (typeof window.initializeCellularAutomata === 'function') {
                    await window.initializeCellularAutomata();
                    console.log('✅ Fallback to original system successful');
                } else {
                    console.warn('Original initialization function not found');
                }
            } else {
                console.warn('Original cellular automata classes not available');
            }
        } catch (error) {
            console.error('❌ Fallback failed:', error);
        }
    }

    /**
     * Compatibility layer for old API
     */
    function createCompatibilityLayer() {
        // Provide backward-compatible global functions
        window.initializeUnifiedCellularAutomata = migrateCellularAutomata;
        
        // Create compatibility shims for commonly used functions
        window.getCellularAutomataStats = function() {
            const stats = {};
            
            if (window.backgroundCA && window.backgroundCA.getPerformanceStats) {
                stats.background = window.backgroundCA.getPerformanceStats();
            }
            
            if (window.headerCA && window.headerCA.getPerformanceStats) {
                stats.header = window.headerCA.getPerformanceStats();
            }
            
            return stats;
        };

        window.stopAllCellularAutomata = function() {
            if (window.backgroundCA && window.backgroundCA.stop) {
                window.backgroundCA.stop();
            }
            if (window.headerCA && window.headerCA.stop) {
                window.headerCA.stop();
            }
        };

        window.startAllCellularAutomata = function() {
            if (window.backgroundCA && window.backgroundCA.start) {
                window.backgroundCA.start();
            }
            if (window.headerCA && window.headerCA.start) {
                window.headerCA.start();
            }
        };
    }

    /**
     * Performance comparison tool
     */
    function createPerformanceComparison() {
        window.benchmarkCellularAutomata = async function(duration = 10000) {
            console.log(`Starting ${duration}ms performance benchmark...`);
            
            const results = {};
            const engines = ['cpu', 'webgl', 'webgpu'];
            
            for (const engineType of engines) {
                try {
                    console.log(`Benchmarking ${engineType.toUpperCase()}...`);
                    
                    const canvas = document.createElement('canvas');
                    canvas.width = 800;
                    canvas.height = 100;
                    
                    const engine = await window.ComputeEngineFactory.createSpecificEngine(engineType, canvas);
                    const automata = new window.UnifiedCellularAutomata('test-canvas', 'background', engine);
                    automata.canvas = canvas; // Override canvas for test
                    
                    await automata.initialize();
                    
                    const startTime = performance.now();
                    let frames = 0;
                    
                    const testLoop = () => {
                        if (performance.now() - startTime < duration) {
                            automata._animate();
                            frames++;
                            setTimeout(testLoop, 16); // ~60fps target
                        } else {
                            const elapsed = performance.now() - startTime;
                            const fps = (frames * 1000) / elapsed;
                            
                            results[engineType] = {
                                frames,
                                duration: elapsed,
                                fps: fps.toFixed(2),
                                stats: automata.getPerformanceStats()
                            };
                            
                            automata.cleanup();
                            console.log(`${engineType.toUpperCase()}: ${fps.toFixed(2)} FPS (${frames} frames)`);
                        }
                    };
                    
                    testLoop();
                    
                } catch (error) {
                    console.warn(`${engineType.toUpperCase()} benchmark failed:`, error);
                    results[engineType] = { error: error.message };
                }
            }
            
            // Wait for all benchmarks to complete
            await new Promise(resolve => setTimeout(resolve, duration + 1000));
            
            console.log('Benchmark Results:', results);
            return results;
        };
    }

    /**
     * Auto-detection and migration on load
     */
    function autoMigrate() {
        // Wait for DOM and dependencies to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', autoMigrate);
            return;
        }

        // Check if we should auto-migrate
        const shouldAutoMigrate = window.ENABLE_UNIFIED_CA !== false; // Default to true
        
        if (shouldAutoMigrate) {
            // Wait a bit for other scripts to load
            setTimeout(migrateCellularAutomata, 1000);
        }
    }

    // Initialize compatibility layer
    createCompatibilityLayer();
    createPerformanceComparison();
    
    // Export migration functions
    window.migrateCellularAutomata = migrateCellularAutomata;
    window.createPerformanceComparison = createPerformanceComparison;
    
    // Auto-migrate if not disabled
    autoMigrate();
    
    console.log('📦 Cellular Automata Migration System loaded');

})(window);