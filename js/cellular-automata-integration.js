/**
 * Unified Cellular Automata Integration Script
 * 
 * This script provides a seamless migration path from the original cellular automata
 * system to the new unified system while maintaining backward compatibility.
 * 
 * Features:
 * - Automatic detection and replacement of original CA instances
 * - Preserves all existing functionality and APIs
 * - GPU capability detection with automatic fallback
 * - Maintains canvas IDs and initialization patterns
 * - Compatible with existing rule indicators and VFX systems
 */

(function(window) {
    'use strict';

    console.log('🔄 Cellular Automata Integration System loading...');

    /**
     * Enhanced initialization that replaces the original system
     */
    async function initUnifiedCellularAutomataSystem() {
        console.log('🚀 Initializing Unified Cellular Automata System...');

        try {
            // Check for required dependencies
            if (!window.UnifiedCellularAutomata || !window.ComputeEngineFactory) {
                throw new Error('Unified cellular automata system not loaded');
            }

            // Initialize background cellular automata
            await initUnifiedBackground();
            
            // Initialize header cellular automata  
            await initUnifiedHeader();

            // Set up rule indicator updates
            setupRuleIndicatorIntegration();

            // Set up GPU status updates
            updateGPUStatusIndicator();

            console.log('✅ Unified Cellular Automata System initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Unified system initialization failed:', error);
            
            // Fallback to original system if available
            return await fallbackToOriginalSystem();
        }
    }

    /**
     * Initialize background cellular automata with unified system
     */
    async function initUnifiedBackground() {
        const canvas = document.getElementById('cellular-automata-bg');
        if (!canvas) {
            throw new Error('Background canvas not found');
        }

        console.log('🖼️ Initializing background cellular automata (unified)...');

        try {
            // Create best available engine (WebGPU → WebGL → CPU)
            const engine = await window.ComputeEngineFactory.createBestEngine(canvas, {
                priority: 'performance',
                name: 'background'
            });

            // Create unified automata instance
            window.backgroundCA = new window.UnifiedCellularAutomata(
                'cellular-automata-bg',
                'background',
                engine
            );

            // Initialize and start
            const initialized = await window.backgroundCA.initialize();
            if (!initialized) {
                throw new Error('Background initialization failed');
            }

            window.backgroundCA.start();
            
            console.log(`✅ Background CA initialized with ${engine.constructor.name}`);
            
            // Trigger custom event for other systems
            window.dispatchEvent(new CustomEvent('backgroundCAInitialized', {
                detail: { 
                    engine: engine.constructor.name,
                    capabilities: engine.getCapabilities()
                }
            }));

        } catch (error) {
            console.error('Background CA initialization failed:', error);
            throw error;
        }
    }

    /**
     * Initialize header cellular automata with unified system
     */
    async function initUnifiedHeader() {
        const canvas = document.getElementById('header-cellular-automata');
        if (!canvas) {
            throw new Error('Header canvas not found');
        }

        console.log('📋 Initializing header cellular automata (unified)...');

        try {
            // Create best available engine (WebGPU → WebGL → CPU)  
            const engine = await window.ComputeEngineFactory.createBestEngine(canvas, {
                priority: 'quality',
                name: 'header'
            });

            // Create unified automata instance
            window.headerCA = new window.UnifiedCellularAutomata(
                'header-cellular-automata', 
                'header',
                engine
            );

            // Initialize and start
            const initialized = await window.headerCA.initialize();
            if (!initialized) {
                throw new Error('Header initialization failed');
            }

            window.headerCA.start();
            
            console.log(`✅ Header CA initialized with ${engine.constructor.name}`);
            
            // Trigger custom event for other systems
            window.dispatchEvent(new CustomEvent('headerCAInitialized', {
                detail: { 
                    engine: engine.constructor.name,
                    capabilities: engine.getCapabilities()
                }
            }));

        } catch (error) {
            console.error('Header CA initialization failed:', error);
            throw error;
        }
    }

    /**
     * Set up rule indicator integration with unified system
     */
    function setupRuleIndicatorIntegration() {
        console.log('🎯 Setting up rule indicator integration...');

        const updateRuleIndicators = () => {
            if (window.backgroundCA && window.headerCA) {
                const bgRule = window.backgroundCA.getCurrentRule();
                const headerRule = window.headerCA.getCurrentRule();
                
                // Update rule indicator elements
                const bgRuleElement = document.getElementById('bg-rule-text');
                const headerRuleElement = document.getElementById('header-rule-text');
                
                if (bgRuleElement) {
                    bgRuleElement.textContent = `BG: Rule ${bgRule}`;
                }
                if (headerRuleElement) {
                    headerRuleElement.textContent = `Header: Rule ${headerRule}`;
                }

                // Trigger VFX updates if available
                if (window.updateRuleIndicatorVFX) {
                    window.updateRuleIndicatorVFX(bgRule, headerRule);
                }

                // Trigger custom events for other integrations
                window.dispatchEvent(new CustomEvent('cellularAutomataRulesUpdated', {
                    detail: { background: bgRule, header: headerRule }
                }));
            }
        };

        // Update every second
        const ruleUpdateInterval = setInterval(updateRuleIndicators, 1000);
        
        // Store interval for cleanup
        window.unifiedCACleanup = window.unifiedCACleanup || [];
        window.unifiedCACleanup.push(() => clearInterval(ruleUpdateInterval));
        
        // Initial update
        setTimeout(updateRuleIndicators, 500);
    }

    /**
     * Update GPU status indicator
     */
    function updateGPUStatusIndicator() {
        const gpuStatusElement = document.getElementById('gpu-status-text');
        if (!gpuStatusElement) return;

        try {
            // Determine the engines being used
            const bgEngine = window.backgroundCA?.computeEngine?.constructor?.name || 'Unknown';
            const headerEngine = window.headerCA?.computeEngine?.constructor?.name || 'Unknown';
            
            let statusText = 'Unknown';
            let statusColor = '#999';

            if (bgEngine.includes('WebGPU') || headerEngine.includes('WebGPU')) {
                statusText = 'WebGPU';
                statusColor = '#00ff00'; // Green for best performance
            } else if (bgEngine.includes('WebGL') || headerEngine.includes('WebGL')) {
                statusText = 'WebGL';
                statusColor = '#ffaa00'; // Orange for good performance
            } else if (bgEngine.includes('CPU')) {
                statusText = 'CPU';
                statusColor = '#ffdd00'; // Yellow for basic performance
            }

            gpuStatusElement.textContent = statusText;
            gpuStatusElement.style.color = statusColor;

            console.log(`🔧 GPU Status: ${statusText} (BG: ${bgEngine}, Header: ${headerEngine})`);

        } catch (error) {
            console.warn('Failed to update GPU status:', error);
        }
    }

    /**
     * Fallback to original system if unified system fails
     */
    async function fallbackToOriginalSystem() {
        console.log('🔄 Attempting fallback to original cellular automata system...');
        
        try {
            // Check if original functions exist
            if (typeof window.initCellularAutomataBackground === 'function' &&
                typeof window.initHeaderCellularAutomata === 'function') {
                
                console.log('📦 Original system found, initializing fallback...');
                
                await window.initCellularAutomataBackground();
                await window.initHeaderCellularAutomata();
                
                console.log('✅ Fallback to original system successful');
                
                // Update status indicator
                const gpuStatusElement = document.getElementById('gpu-status-text');
                if (gpuStatusElement) {
                    gpuStatusElement.textContent = 'Legacy';
                    gpuStatusElement.style.color = '#888';
                }
                
                return true;
            } else {
                console.warn('⚠️ Original cellular automata functions not available');
                return false;
            }
        } catch (error) {
            console.error('❌ Fallback to original system failed:', error);
            return false;
        }
    }

    /**
     * Backward compatibility functions - Override original functions
     */
    function createBackwardCompatibilityLayer() {
        console.log('🔧 Creating backward compatibility layer...');

        // Override original initialization functions
        window.initCellularAutomataBackground = async function() {
            console.log('🔄 initCellularAutomataBackground called - routing to unified system');
            return initUnifiedBackground();
        };

        window.initHeaderCellularAutomata = async function() {
            console.log('🔄 initHeaderCellularAutomata called - routing to unified system');
            return initUnifiedHeader();
        };

        // Provide compatibility functions
        window.getCellularAutomataStats = function() {
            const stats = {};
            
            if (window.backgroundCA && typeof window.backgroundCA.getPerformanceStats === 'function') {
                stats.background = window.backgroundCA.getPerformanceStats();
            }
            
            if (window.headerCA && typeof window.headerCA.getPerformanceStats === 'function') {
                stats.header = window.headerCA.getPerformanceStats();
            }
            
            return stats;
        };

        window.stopAllCellularAutomata = function() {
            if (window.backgroundCA && typeof window.backgroundCA.stop === 'function') {
                window.backgroundCA.stop();
            }
            if (window.headerCA && typeof window.headerCA.stop === 'function') {
                window.headerCA.stop();
            }
        };

        window.startAllCellularAutomata = function() {
            if (window.backgroundCA && typeof window.backgroundCA.start === 'function') {
                window.backgroundCA.start();
            }
            if (window.headerCA && typeof window.headerCA.start === 'function') {
                window.headerCA.start();
            }
        };

        // Override original initialization (for script.js compatibility)
        const originalInitCA = window.initializeCellularAutomata;
        window.initializeCellularAutomata = async function() {
            console.log('🔄 initializeCellularAutomata called - routing to unified system');
            try {
                return await initUnifiedCellularAutomataSystem();
            } catch (error) {
                console.warn('Unified system failed, trying original:', error);
                if (typeof originalInitCA === 'function') {
                    return originalInitCA.apply(this, arguments);
                }
                throw error;
            }
        };
    }

    /**
     * Cleanup function for page unload
     */
    function setupCleanup() {
        window.addEventListener('beforeunload', () => {
            console.log('🧹 Cleaning up unified cellular automata system...');
            
            if (window.backgroundCA && typeof window.backgroundCA.cleanup === 'function') {
                window.backgroundCA.cleanup();
            }
            if (window.headerCA && typeof window.headerCA.cleanup === 'function') {
                window.headerCA.cleanup();
            }
            
            // Run additional cleanup functions
            if (window.unifiedCACleanup) {
                window.unifiedCACleanup.forEach(cleanupFn => {
                    try {
                        cleanupFn();
                    } catch (error) {
                        console.warn('Cleanup function failed:', error);
                    }
                });
            }
        });
    }

    /**
     * Initialize the integration system
     */
    function initializeIntegration() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeIntegration);
            return;
        }

        console.log('🎬 Initializing cellular automata integration...');

        // Create compatibility layer first
        createBackwardCompatibilityLayer();
        
        // Set up cleanup
        setupCleanup();

        // Auto-initialize unless disabled
        if (window.AUTO_INIT_UNIFIED_CA !== false) {
            // Wait a bit for other scripts to load
            setTimeout(() => {
                console.log('🚀 Auto-initializing unified cellular automata system...');
                initUnifiedCellularAutomataSystem();
            }, 1000);
        }
    }

    // Export main functions
    window.initUnifiedCellularAutomataSystem = initUnifiedCellularAutomataSystem;
    window.initUnifiedBackground = initUnifiedBackground;
    window.initUnifiedHeader = initUnifiedHeader;

    // Initialize when loaded
    initializeIntegration();

    console.log('📦 Cellular Automata Integration System loaded and ready');

})(window);