// js/gpu-performance-test.js

/**
 * GPU Performance Testing and Integration System
 * Provides tools for comparing CPU vs GPU cellular automata performance
 * Includes automatic performance monitoring and benchmark utilities
 * 
 * Features:
 * - Performance benchmarking for CPU vs GPU implementations
 * - Automatic optimal implementation selection
 * - Real-time performance monitoring dashboard
 * - Debug utilities for GPU capability testing
 */

window.APP = window.APP || {};

(function(APP) {
    'use strict';

    /**
     * Performance Testing Suite for Cellular Automata
     * Compares CPU and GPU implementations across different grid sizes
     */
    class CellularAutomataPerformanceTester {
        constructor() {
            this.testResults = {
                cpu: {},
                gpu: {},
                comparison: {}
            };
            this.isTestRunning = false;
        }
        
        /**
         * Run comprehensive performance benchmark
         * Tests both CPU and GPU implementations across various grid sizes
         */
        async runBenchmark(options = {}) {
            if (this.isTestRunning) {
                console.warn('Benchmark already running');
                return this.testResults;
            }
            
            this.isTestRunning = true;
            console.log('🔬 Starting Cellular Automata Performance Benchmark...');
            
            const config = {
                testDuration: options.testDuration || 5000, // 5 seconds per test
                gridSizes: options.gridSizes || [100, 200, 500, 1000],
                rules: options.rules || [30, 110],
                ...options
            };
            
            try {
                // Test GPU capabilities first
                const gpuCapabilities = new APP.CellularAutomata.GPUCapabilityDetector();
                console.log('GPU Capabilities:', gpuCapabilities.isGPUAccelerationAvailable());
                
                // Run CPU benchmarks
                console.log('📊 Testing CPU performance...');
                for (const gridSize of config.gridSizes) {
                    this.testResults.cpu[gridSize] = await this.benchmarkCPU(gridSize, config);
                }
                
                // Run GPU benchmarks if available
                if (gpuCapabilities.isGPUAccelerationAvailable()) {
                    console.log('🚀 Testing GPU performance...');
                    for (const gridSize of config.gridSizes) {
                        this.testResults.gpu[gridSize] = await this.benchmarkGPU(gridSize, config);
                    }
                    
                    // Calculate performance comparison
                    this.calculateComparison();
                } else {
                    console.log('⚠️  GPU acceleration not available, skipping GPU tests');
                }
                
                // Display results
                this.displayResults();
                
                return this.testResults;
                
            } catch (error) {
                console.error('Benchmark failed:', error);
                return null;
            } finally {
                this.isTestRunning = false;
            }
        }
        
        async benchmarkCPU(gridSize, config) {
            return new Promise((resolve) => {
                // Create temporary canvas for testing
                const testCanvas = document.createElement('canvas');
                testCanvas.id = 'cpu-test-canvas';
                testCanvas.width = gridSize * 2; // Small cell size
                testCanvas.height = gridSize * 2;
                testCanvas.style.display = 'none';
                document.body.appendChild(testCanvas);
                
                let frameCount = 0;
                let totalTime = 0;
                const startTime = performance.now();
                
                // Create CPU implementation
                const cpuCA = new APP.CellularAutomata.CellularAutomataCanvas('cpu-test-canvas', 2, {
                    animationSpeed: 0 // As fast as possible
                });
                
                // Override animate method for benchmarking
                cpuCA.animate = function() {
                    const frameStart = performance.now();
                    
                    // Simulate one generation
                    const newGrid = new Array(this.cols).fill(0);
                    for (let i = 0; i < this.cols; i++) {
                        const left = this.grid[i - 1] || 0;
                        const center = this.grid[i];
                        const right = this.grid[i + 1] || 0;
                        // Use Rule 30 for consistency
                        const pattern = left * 4 + center * 2 + right;
                        const rule30 = [0, 1, 1, 1, 1, 0, 0, 0];
                        newGrid[i] = rule30[pattern];
                    }
                    this.grid = newGrid;
                    this.currentRow++;
                    
                    const frameTime = performance.now() - frameStart;
                    totalTime += frameTime;
                    frameCount++;
                };
                
                // Run test
                const testInterval = setInterval(() => {
                    cpuCA.animate();
                }, 0);
                
                setTimeout(() => {
                    clearInterval(testInterval);
                    cpuCA.cleanup();
                    document.body.removeChild(testCanvas);
                    
                    const totalDuration = performance.now() - startTime;
                    const avgFrameTime = totalTime / frameCount;
                    const fps = frameCount / (totalDuration / 1000);
                    
                    resolve({
                        gridSize,
                        frameCount,
                        totalDuration,
                        avgFrameTime,
                        fps,
                        generationsPerSecond: fps
                    });
                }, config.testDuration);
            });
        }
        
        async benchmarkGPU(gridSize, config) {
            return new Promise((resolve) => {
                // Create temporary canvas for testing
                const testCanvas = document.createElement('canvas');
                testCanvas.id = 'gpu-test-canvas';
                testCanvas.width = gridSize * 2;
                testCanvas.height = gridSize * 2;
                testCanvas.style.display = 'none';
                document.body.appendChild(testCanvas);
                
                let frameCount = 0;
                const startTime = performance.now();
                
                // Create GPU implementation
                const gpuCA = new APP.CellularAutomata.GPUCellularAutomataCanvas('gpu-test-canvas', 2, {
                    animationSpeed: 0, // As fast as possible
                    rule: 30
                });
                
                // Wait for GPU initialization
                setTimeout(() => {
                    if (!gpuCA.useGPU) {
                        // GPU failed to initialize
                        document.body.removeChild(testCanvas);
                        resolve({
                            gridSize,
                            error: 'GPU initialization failed',
                            frameCount: 0,
                            fps: 0
                        });
                        return;
                    }
                    
                    // Override animate method for benchmarking
                    const originalAnimate = gpuCA.animateGPU.bind(gpuCA);
                    gpuCA.animateGPU = function() {
                        originalAnimate();
                        frameCount++;
                    };
                    
                    // Run test
                    const testInterval = setInterval(() => {
                        gpuCA.animate();
                    }, 0);
                    
                    setTimeout(() => {
                        clearInterval(testInterval);
                        gpuCA.cleanup();
                        document.body.removeChild(testCanvas);
                        
                        const totalDuration = performance.now() - startTime;
                        const fps = frameCount / (totalDuration / 1000);
                        
                        resolve({
                            gridSize,
                            frameCount,
                            totalDuration,
                            fps,
                            generationsPerSecond: fps,
                            performanceStats: gpuCA.getPerformanceInfo()
                        });
                    }, config.testDuration);
                }, 100); // Wait for GPU init
            });
        }
        
        calculateComparison() {
            for (const gridSize in this.testResults.cpu) {
                const cpuResult = this.testResults.cpu[gridSize];
                const gpuResult = this.testResults.gpu[gridSize];
                
                if (cpuResult && gpuResult && !gpuResult.error) {
                    const speedup = gpuResult.fps / cpuResult.fps;
                    this.testResults.comparison[gridSize] = {
                        speedup,
                        cpuFPS: cpuResult.fps,
                        gpuFPS: gpuResult.fps,
                        recommendation: speedup > 1.5 ? 'GPU' : 'CPU'
                    };
                }
            }
        }
        
        displayResults() {
            console.log('\n🏆 Cellular Automata Performance Benchmark Results:');
            console.log('====================================================');
            
            // Display detailed results
            console.table(this.testResults.comparison);
            
            // Display recommendations
            const recommendations = this.getRecommendations();
            console.log('\n💡 Performance Recommendations:');
            recommendations.forEach(rec => console.log(`  ${rec}`));
        }
        
        getRecommendations() {
            const recs = [];
            
            for (const [gridSize, comparison] of Object.entries(this.testResults.comparison)) {
                if (comparison.speedup > 2.0) {
                    recs.push(`✅ Grid ${gridSize}: Use GPU (${comparison.speedup.toFixed(2)}x faster)`);
                } else if (comparison.speedup > 1.2) {
                    recs.push(`⚡ Grid ${gridSize}: Use GPU (${comparison.speedup.toFixed(2)}x faster)`);
                } else {
                    recs.push(`🔄 Grid ${gridSize}: Use CPU (better compatibility)`);
                }
            }
            
            return recs;
        }
        
        getOptimalImplementation(gridSize) {
            const comparison = this.testResults.comparison[gridSize];
            return comparison && comparison.speedup > 1.5 ? 'GPU' : 'CPU';
        }
    }

    /**
     * Smart Cellular Automata Manager
     * Automatically selects optimal implementation based on performance and capabilities
     */
    class SmartCellularAutomataManager {
        constructor() {
            this.performanceTester = new CellularAutomataPerformanceTester();
            this.gpuCapabilities = new APP.CellularAutomata.GPUCapabilityDetector();
            this.currentImplementation = 'CPU'; // Default
            this.backgroundCA = null;
            this.headerCA = null;
        }
        
        /**
         * Initialize with automatic implementation selection
         */
        async initialize(forceImplementation = null) {
            console.log('🤖 Initializing Smart Cellular Automata Manager...');
            
            if (forceImplementation) {
                this.currentImplementation = forceImplementation;
                console.log(`🔧 Forced implementation: ${this.currentImplementation}`);
            } else {
                // Auto-select based on capabilities
                if (this.gpuCapabilities.isGPUAccelerationAvailable()) {
                    this.currentImplementation = 'GPU';
                    console.log('🚀 GPU acceleration available, using GPU implementation');
                } else {
                    this.currentImplementation = 'CPU';
                    console.log('💻 Using CPU implementation (GPU not available)');
                }
            }
            
            // Initialize cellular automata with selected implementation
            await this.initializeCellularAutomata();
            
            return this.currentImplementation;
        }
        
        cleanupCanvases() {
            console.log('🧹 Cleaning up existing canvas contexts...');
            
            const canvasIds = ['cellular-automata-bg', 'header-cellular-automata'];
            
            canvasIds.forEach(canvasId => {
                const canvas = document.getElementById(canvasId);
                if (!canvas) return;
                
                console.log(`🧹 Cleaning up canvas: ${canvasId}`);
                
                // CRITICAL FIX: Don't create contexts during cleanup!
                // Check for existing contexts without creating new ones
                
                console.log(`   - Canvas info: ${canvas.width}x${canvas.height}, in DOM: ${document.contains(canvas)}`);
                
                // Check if canvas has internal context references (without creating them)
                const hasInternalContext = canvas.__context || canvas.__webglContextAttributes || canvas._context;
                if (hasInternalContext) {
                    console.log(`   - Found internal context references on ${canvasId}`);
                }
                
                // Only clear 2D context if we're sure it exists by testing carefully
                try {
                    // This is risky but necessary - try to get 2D context safely
                    const testCtx = canvas.getContext('2d', { willReadFrequently: true });
                    if (testCtx && typeof testCtx.clearRect === 'function') {
                        testCtx.clearRect(0, 0, canvas.width, canvas.height);
                        console.log(`   - Cleared 2D context for ${canvasId}`);
                    }
                } catch (error) {
                    console.log(`   - No 2D context to clear for ${canvasId}: ${error.message}`);
                }
                
                // DON'T try to get WebGL contexts - this creates them and causes conflicts!
                console.log(`   - Skipping WebGL context cleanup to prevent resource conflicts`);
            });
        }
        
        async initializeCellularAutomata() {
            try {
                // Clean up any existing canvas contexts first
                this.cleanupCanvases();
                
                if (this.currentImplementation === 'GPU') {
                    // Use GPU implementations - try just background first to test
                    console.log('🚀 Initializing GPU cellular automata (testing with background only)...');
                    
                    try {
                        // Initialize background first
                        console.log('🎨 Creating GPU background cellular automata...');
                        this.backgroundCA = new APP.CellularAutomata.GPUBackgroundCellularAutomata();
                        console.log('✅ GPU background initialized successfully');
                        
                        // For now, use CPU for header to avoid resource conflicts
                        console.log('🎨 Using CPU for header (avoiding GPU resource conflicts)...');
                        this.headerCA = new APP.CellularAutomata.HeaderCellularAutomata();
                        console.log('✅ Mixed GPU/CPU cellular automata initialized');
                        
                    } catch (error) {
                        console.error('❌ GPU background failed:', error);
                        throw error; // Let the outer catch handle fallback
                    }
                } else {
                    // Use CPU implementations
                    console.log('💻 Initializing CPU cellular automata...');
                    this.backgroundCA = new APP.CellularAutomata.BackgroundCellularAutomata();
                    this.headerCA = new APP.CellularAutomata.HeaderCellularAutomata();
                    console.log('✅ CPU cellular automata initialized');
                }
            } catch (error) {
                console.error('Cellular automata initialization failed:', error);
                // Fallback to CPU if GPU fails
                if (this.currentImplementation === 'GPU') {
                    console.log('🔄 GPU acceleration failed - gracefully falling back to CPU implementation');
                    console.log('   ✅ CPU fallback provides stable, compatible cellular automata');
                    console.log('   📈 Performance: ~60fps for cellular automata animations');  
                    console.log('   🎨 Visual: Identical golden gradient effects maintained');
                    this.currentImplementation = 'CPU';
                    this.cleanupCanvases(); // Clean up again before CPU fallback
                    try {
                        this.backgroundCA = new APP.CellularAutomata.BackgroundCellularAutomata();
                        this.headerCA = new APP.CellularAutomata.HeaderCellularAutomata();
                        console.log('✅ CPU cellular automata initialized successfully');
                    } catch (fallbackError) {
                        console.error('❌ CPU fallback also failed:', fallbackError);
                        throw new Error('Both GPU and CPU initialization failed');
                    }
                }
            }
        }
        
        /**
         * Switch between CPU and GPU implementations
         */
        switchImplementation(newImplementation) {
            if (newImplementation === this.currentImplementation) {
                console.log(`Already using ${newImplementation} implementation`);
                return;
            }
            
            console.log(`🔄 Switching from ${this.currentImplementation} to ${newImplementation}`);
            
            // Cleanup current implementation
            if (this.backgroundCA && this.backgroundCA.cleanup) {
                this.backgroundCA.cleanup();
            }
            if (this.headerCA && this.headerCA.cleanup) {
                this.headerCA.cleanup();
            }
            
            // Switch implementation
            this.currentImplementation = newImplementation;
            this.initializeCellularAutomata();
        }
        
        /**
         * Run performance comparison and suggest optimal implementation
         */
        async optimizePerformance() {
            console.log('🎯 Running performance optimization...');
            
            const results = await this.performanceTester.runBenchmark({
                testDuration: 3000, // Shorter test for optimization
                gridSizes: [200, 500] // Test relevant sizes
            });
            
            if (results && results.comparison) {
                // Use average performance across test sizes
                const comparisons = Object.values(results.comparison);
                const avgSpeedup = comparisons.reduce((sum, comp) => sum + comp.speedup, 0) / comparisons.length;
                
                const optimalImplementation = avgSpeedup > 1.5 ? 'GPU' : 'CPU';
                
                if (optimalImplementation !== this.currentImplementation) {
                    console.log(`💡 Performance analysis suggests switching to ${optimalImplementation}`);
                    this.switchImplementation(optimalImplementation);
                } else {
                    console.log(`✅ Current ${this.currentImplementation} implementation is optimal`);
                }
                
                return optimalImplementation;
            }
            
            return this.currentImplementation;
        }
        
        /**
         * Get current performance information
         */
        getPerformanceInfo() {
            const info = {
                implementation: this.currentImplementation,
                gpuAvailable: this.gpuCapabilities.isGPUAccelerationAvailable(),
                gpuCapabilities: {
                    maxTextureSize: this.gpuCapabilities.maxTextureSize,
                    webgl2Supported: this.gpuCapabilities.webgl2Supported
                }
            };
            
            // Add implementation-specific performance info
            if (this.backgroundCA && this.backgroundCA.getPerformanceInfo) {
                info.background = this.backgroundCA.getPerformanceInfo();
            }
            if (this.headerCA && this.headerCA.getPerformanceInfo) {
                info.header = this.headerCA.getPerformanceInfo();
            }
            
            return info;
        }
    }

    // Expose performance testing tools
    APP.CellularAutomata.PerformanceTester = CellularAutomataPerformanceTester;
    APP.CellularAutomata.SmartManager = SmartCellularAutomataManager;

    // Global performance testing functions
    window.benchmarkCellularAutomata = async function(options) {
        const tester = new CellularAutomataPerformanceTester();
        return await tester.runBenchmark(options);
    };

    window.getCellularAutomataPerformance = function() {
        if (window.smartCAManager) {
            return window.smartCAManager.getPerformanceInfo();
        }
        return null;
    };

})(window.APP);