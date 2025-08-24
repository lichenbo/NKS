// js/gpu-debug-console.js

/**
 * GPU Debug Console for Cellular Automata Development
 * Browser console utilities for testing, debugging, and monitoring GPU acceleration
 * 
 * Usage in Browser Console:
 * - GPU.info() - Show GPU capabilities and current status
 * - GPU.benchmark() - Run performance benchmark
 * - GPU.switchToGPU() / GPU.switchToCPU() - Force implementation switch
 * - GPU.optimize() - Run automatic performance optimization
 * - GPU.monitor() - Start real-time performance monitoring
 */

window.GPU = window.GPU || {};

(function() {
    'use strict';
    
    // GPU Debug Interface
    window.GPU = {
        
        /**
         * Quick WebGL detection test - run this first to diagnose issues
         */
        detectWebGL: function() {
            console.log('\n🔍 Quick WebGL Detection Test');
            console.log('=============================');
            console.log('ℹ️  Testing WebGL 2.0 first to avoid context conflicts');
            
            // IMPORTANT: Use separate canvases to avoid context conflicts
            // Test 1: Basic WebGL 2.0 (fresh canvas)
            console.log('\n1️⃣ Basic WebGL 2.0 Test:');
            const canvas2 = document.createElement('canvas');
            canvas2.width = 1;
            canvas2.height = 1;
            const webgl2 = canvas2.getContext('webgl2');
            console.log(`   Result: ${webgl2 ? '✅ SUCCESS' : '❌ FAILED'}`);
            if (webgl2) {
                console.log(`   Context type: ${webgl2.constructor.name}`);
                console.log(`   Is WebGL2RenderingContext: ${webgl2 instanceof WebGL2RenderingContext}`);
            }
            
            // Test 2: WebGL 2.0 with failIfMajorPerformanceCaveat: false (fresh canvas)
            console.log('\n2️⃣ WebGL 2.0 with Performance Caveat Override:');
            const canvas2_force = document.createElement('canvas');
            canvas2_force.width = 1;
            canvas2_force.height = 1;
            const webgl2_force = canvas2_force.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
            console.log(`   Result: ${webgl2_force ? '✅ SUCCESS' : '❌ FAILED'}`);
            
            // Test 3: WebGL 1.0 (fresh canvas)
            console.log('\n3️⃣ WebGL 1.0 Test:');
            const canvas1 = document.createElement('canvas');
            canvas1.width = 1;
            canvas1.height = 1;
            const webgl1 = canvas1.getContext('webgl') || canvas1.getContext('experimental-webgl');
            console.log(`   Result: ${webgl1 ? '✅ SUCCESS' : '❌ FAILED'}`);
            
            // Test 4: WebGL2RenderingContext availability
            console.log('\n4️⃣ WebGL2RenderingContext Interface Test:');
            const hasWebGL2Interface = typeof WebGL2RenderingContext !== 'undefined';
            console.log(`   WebGL2RenderingContext available: ${hasWebGL2Interface ? '✅ YES' : '❌ NO'}`);
            
            // Test 5: Browser version check
            console.log('\n5️⃣ Browser Support Check:');
            const ua = navigator.userAgent.toLowerCase();
            let expectedSupport = false;
            
            if (ua.includes('chrome')) {
                const chromeMatch = ua.match(/chrome\/(\d+)/);
                const chromeVersion = chromeMatch ? parseInt(chromeMatch[1]) : 0;
                expectedSupport = chromeVersion >= 56;
                console.log(`   Chrome version: ${chromeVersion} (WebGL 2.0 expected: ${expectedSupport ? '✅' : '❌'})`);
            } else if (ua.includes('firefox')) {
                const firefoxMatch = ua.match(/firefox\/(\d+)/);
                const firefoxVersion = firefoxMatch ? parseInt(firefoxMatch[1]) : 0;
                expectedSupport = firefoxVersion >= 51;
                console.log(`   Firefox version: ${firefoxVersion} (WebGL 2.0 expected: ${expectedSupport ? '✅' : '❌'})`);
            } else if (ua.includes('safari') && !ua.includes('chrome')) {
                const safariMatch = ua.match(/version\/(\d+)/);
                const safariVersion = safariMatch ? parseInt(safariMatch[1]) : 0;
                expectedSupport = safariVersion >= 15;
                console.log(`   Safari version: ${safariVersion} (WebGL 2.0 expected: ${expectedSupport ? '✅' : '❌'})`);
            } else if (ua.includes('edg')) {
                const edgeMatch = ua.match(/edg\/(\d+)/);
                const edgeVersion = edgeMatch ? parseInt(edgeMatch[1]) : 0;
                expectedSupport = edgeVersion >= 79;
                console.log(`   Edge version: ${edgeVersion} (WebGL 2.0 expected: ${expectedSupport ? '✅' : '❌'})`);
            } else {
                console.log(`   Unknown browser: ${ua.substring(0, 50)}...`);
            }
            
            // Summary
            console.log('\n📊 Summary:');
            console.log(`   WebGL 1.0: ${webgl1 ? '✅' : '❌'}`);
            console.log(`   WebGL 2.0: ${webgl2 || webgl2_force ? '✅' : '❌'}`);
            console.log(`   Browser should support WebGL 2.0: ${expectedSupport ? '✅' : '❌'}`);
            
            // Cleanup contexts
            const contexts = [
                { ctx: webgl1, name: 'WebGL 1.0' },
                { ctx: webgl2, name: 'WebGL 2.0' },
                { ctx: webgl2_force, name: 'WebGL 2.0 Force' }
            ];
            
            contexts.forEach(({ ctx, name }) => {
                if (ctx) {
                    const loseContext = ctx.getExtension('WEBGL_lose_context');
                    if (loseContext) {
                        loseContext.loseContext();
                        console.log(`   🧹 Cleaned up ${name} context`);
                    }
                }
            });
            
            return {
                webgl1: !!webgl1,
                webgl2: !!(webgl2 || webgl2_force),
                expectedSupport,
                browserInfo: ua.substring(0, 100)
            };
        },
        
        /**
         * Test shader compilation specifically
         */
        testShaders: function() {
            console.log('\n🔧 Shader Compilation Test');
            console.log('==========================');
            
            // Test WebGL 2.0 shaders
            console.log('\n🎯 Testing WebGL 2.0 Shaders:');
            const canvas2 = document.createElement('canvas');
            const gl2 = canvas2.getContext('webgl2');
            
            if (gl2) {
                this.testShaderCompilationForContext(gl2, 'WebGL 2.0', true);
            } else {
                console.log('   ❌ No WebGL 2.0 context available');
            }
            
            // Test WebGL 1.0 shaders
            console.log('\n🎯 Testing WebGL 1.0 Shaders:');
            const canvas1 = document.createElement('canvas');
            const gl1 = canvas1.getContext('webgl') || canvas1.getContext('experimental-webgl');
            
            if (gl1) {
                this.testShaderCompilationForContext(gl1, 'WebGL 1.0', false);
            } else {
                console.log('   ❌ No WebGL 1.0 context available');
            }
            
            // Cleanup
            if (gl1) {
                const lose1 = gl1.getExtension('WEBGL_lose_context');
                if (lose1) lose1.loseContext();
            }
            if (gl2) {
                const lose2 = gl2.getExtension('WEBGL_lose_context');
                if (lose2) lose2.loseContext();
            }
        },
        
        testShaderCompilationForContext: function(gl, contextName, isWebGL2) {
            try {
                // Vertex shader
                const vertexSource = isWebGL2 ? 
                    `#version 300 es
precision highp float;
in vec2 a_position;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
}` :
                    `precision highp float;
attribute vec2 a_position;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;
                
                console.log(`   📝 Compiling ${contextName} vertex shader...`);
                const vertexShader = gl.createShader(gl.VERTEX_SHADER);
                
                if (!vertexShader) {
                    console.log('   ❌ Failed to create vertex shader object');
                    return false;
                }
                
                gl.shaderSource(vertexShader, vertexSource);
                gl.compileShader(vertexShader);
                
                if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
                    const error = gl.getShaderInfoLog(vertexShader);
                    console.log('   ❌ Vertex shader compilation failed:');
                    console.log('      Error:', error);
                    console.log('      Source:', vertexSource);
                    gl.deleteShader(vertexShader);
                    return false;
                }
                console.log('   ✅ Vertex shader compiled successfully');
                
                // Fragment shader
                const fragmentSource = isWebGL2 ?
                    `#version 300 es
precision highp float;
out vec4 fragColor;
void main() {
    fragColor = vec4(1.0, 0.0, 0.0, 1.0);
}` :
                    `precision highp float;
void main() {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}`;
                
                console.log(`   📝 Compiling ${contextName} fragment shader...`);
                const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
                
                if (!fragmentShader) {
                    console.log('   ❌ Failed to create fragment shader object');
                    gl.deleteShader(vertexShader);
                    return false;
                }
                
                gl.shaderSource(fragmentShader, fragmentSource);
                gl.compileShader(fragmentShader);
                
                if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
                    const error = gl.getShaderInfoLog(fragmentShader);
                    console.log('   ❌ Fragment shader compilation failed:');
                    console.log('      Error:', error);
                    console.log('      Source:', fragmentSource);
                    gl.deleteShader(vertexShader);
                    gl.deleteShader(fragmentShader);
                    return false;
                }
                console.log('   ✅ Fragment shader compiled successfully');
                
                // Test program linking
                console.log(`   🔗 Testing ${contextName} program linking...`);
                const program = gl.createProgram();
                
                if (!program) {
                    console.log('   ❌ Failed to create shader program');
                    gl.deleteShader(vertexShader);
                    gl.deleteShader(fragmentShader);
                    return false;
                }
                
                gl.attachShader(program, vertexShader);
                gl.attachShader(program, fragmentShader);
                gl.linkProgram(program);
                
                if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                    const error = gl.getProgramInfoLog(program);
                    console.log('   ❌ Program linking failed:');
                    console.log('      Error:', error);
                    gl.deleteShader(vertexShader);
                    gl.deleteShader(fragmentShader);
                    gl.deleteProgram(program);
                    return false;
                }
                console.log('   ✅ Program linked successfully');
                
                // Cleanup
                gl.deleteShader(vertexShader);
                gl.deleteShader(fragmentShader);
                gl.deleteProgram(program);
                
                console.log(`   🎉 ${contextName} shader test completed successfully`);
                return true;
                
            } catch (error) {
                console.log(`   ❌ ${contextName} shader test threw error:`, error);
                return false;
            }
        },
        
        /**
         * Test GPU capabilities immediately and show detailed results
         */
        test: function() {
            console.log('\n🧪 Running Immediate GPU Capability Test');
            console.log('=====================================');
            
            try {
                // Create test detector
                const detector = new APP.CellularAutomata.GPUCapabilityDetector();
                
                // Show results
                console.log('\n📊 Test Results:');
                console.log(`  WebGL 1.0: ${detector.webglSupported ? '✅ Supported' : '❌ Not Supported'}`);
                console.log(`  WebGL 2.0: ${detector.webgl2Supported ? '✅ Supported' : '❌ Not Supported'}`);
                console.log(`  Max Texture Size: ${detector.maxTextureSize}`);
                console.log(`  GPU Acceleration Available: ${detector.isGPUAccelerationAvailable() ? '✅ Yes' : '❌ No'}`);
                
                // Test manual WebGL context creation
                console.log('\n🔧 Manual WebGL Context Test:');
                const testCanvas = document.createElement('canvas');
                
                const webgl2 = testCanvas.getContext('webgl2');
                console.log(`  WebGL 2.0 Context: ${webgl2 ? '✅ Created' : '❌ Failed'}`);
                
                const webgl1 = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
                console.log(`  WebGL 1.0 Context: ${webgl1 ? '✅ Created' : '❌ Failed'}`);
                
                // Test GPU canvas creation
                console.log('\n🎯 GPU Canvas Creation Test:');
                testCanvas.id = 'gpu-capability-test';
                testCanvas.style.display = 'none';
                document.body.appendChild(testCanvas);
                
                try {
                    const gpuCanvas = new APP.CellularAutomata.GPUCellularAutomataCanvas('gpu-capability-test', 2, { rule: 30 });
                    console.log(`  GPU Canvas Created: ${gpuCanvas ? '✅ Success' : '❌ Failed'}`);
                    console.log(`  GPU Enabled: ${gpuCanvas.useGPU ? '✅ Yes' : '❌ No'}`);
                    
                    if (gpuCanvas.cleanup) gpuCanvas.cleanup();
                } catch (error) {
                    console.log(`  GPU Canvas Creation: ❌ Failed (${error.message})`);
                }
                
                document.body.removeChild(testCanvas);
                
                // Show browser info
                console.log('\n🌐 Browser Information:');
                console.log(`  User Agent: ${navigator.userAgent}`);
                console.log(`  Platform: ${navigator.platform}`);
                console.log(`  Hardware Concurrency: ${navigator.hardwareConcurrency || 'Unknown'}`);
                
                return {
                    webgl1: detector.webglSupported,
                    webgl2: detector.webgl2Supported,
                    maxTextureSize: detector.maxTextureSize,
                    gpuAvailable: detector.isGPUAccelerationAvailable()
                };
                
            } catch (error) {
                console.error('GPU test failed:', error);
                return null;
            }
        },
        
        /**
         * Display comprehensive GPU capabilities and current status
         */
        info: function() {
            console.log('\n🔍 GPU Cellular Automata Debug Information');
            console.log('==========================================');
            
            // GPU Capabilities
            const detector = new APP.CellularAutomata.GPUCapabilityDetector();
            console.log('\n📊 GPU Capabilities:');
            console.log(`  WebGL Support: ${detector.webglSupported}`);
            console.log(`  WebGL 2.0 Support: ${detector.webgl2Supported}`);
            console.log(`  Max Texture Size: ${detector.maxTextureSize}`);
            console.log(`  Max Viewport: ${detector.maxViewportDims[0]} x ${detector.maxViewportDims[1]}`);
            console.log(`  GPU Acceleration Available: ${detector.isGPUAccelerationAvailable()}`);
            console.log(`  Extensions: ${detector.extensions.length} available`);
            
            // Current Implementation Status
            if (window.smartCAManager) {
                const perfInfo = window.smartCAManager.getPerformanceInfo();
                console.log('\n⚡ Current Implementation:');
                console.log(`  Active Implementation: ${perfInfo.implementation}`);
                console.log(`  GPU Available: ${perfInfo.gpuAvailable}`);
                
                if (perfInfo.background) {
                    console.log(`  Background CA: ${perfInfo.background.usingGPU ? 'GPU' : 'CPU'} (Rule ${perfInfo.background.rule})`);
                }
                if (perfInfo.header) {
                    console.log(`  Header CA: ${perfInfo.header.usingGPU ? 'GPU' : 'CPU'} (Rule ${perfInfo.header.rule})`);
                }
            } else {
                console.log('\n⚠️  Smart CA Manager not initialized');
            }
            
            // Browser Information
            console.log('\n🌐 Browser Environment:');
            console.log(`  User Agent: ${navigator.userAgent}`);
            console.log(`  Hardware Concurrency: ${navigator.hardwareConcurrency || 'Unknown'} cores`);
            console.log(`  Memory: ${navigator.deviceMemory || 'Unknown'} GB`);
            
            return {
                capabilities: detector,
                performance: window.smartCAManager ? window.smartCAManager.getPerformanceInfo() : null
            };
        },
        
        /**
         * Run performance benchmark comparing CPU vs GPU
         */
        benchmark: async function(options = {}) {
            console.log('\n🏁 Starting Performance Benchmark...');
            
            const defaultOptions = {
                testDuration: 3000,
                gridSizes: [100, 200, 500],
                rules: [30, 110]
            };
            
            const config = { ...defaultOptions, ...options };
            console.log('Test Configuration:', config);
            
            try {
                const results = await benchmarkCellularAutomata(config);
                
                if (results && results.comparison) {
                    console.log('\n🎯 Benchmark Results Summary:');
                    Object.entries(results.comparison).forEach(([gridSize, comparison]) => {
                        const emoji = comparison.speedup > 2 ? '🚀' : comparison.speedup > 1.2 ? '⚡' : '🔄';
                        console.log(`  ${emoji} ${gridSize}x${gridSize}: ${comparison.speedup.toFixed(2)}x speedup (${comparison.recommendation})`);
                    });
                    
                    return results;
                } else {
                    console.log('❌ Benchmark failed or GPU not available');
                    return null;
                }
                
            } catch (error) {
                console.error('Benchmark error:', error);
                return null;
            }
        },
        
        /**
         * Force switch to GPU implementation
         */
        switchToGPU: function() {
            console.log('🚀 Switching to GPU implementation...');
            
            if (!window.smartCAManager) {
                console.error('Smart CA Manager not available');
                return false;
            }
            
            const detector = new APP.CellularAutomata.GPUCapabilityDetector();
            if (!detector.isGPUAccelerationAvailable()) {
                console.error('GPU acceleration not available on this device');
                return false;
            }
            
            window.smartCAManager.switchImplementation('GPU');
            console.log('✅ Switched to GPU implementation');
            return true;
        },
        
        /**
         * Force switch to CPU implementation
         */
        switchToCPU: function() {
            console.log('💻 Switching to CPU implementation...');
            
            if (!window.smartCAManager) {
                console.error('Smart CA Manager not available');
                return false;
            }
            
            window.smartCAManager.switchImplementation('CPU');
            console.log('✅ Switched to CPU implementation');
            return true;
        },
        
        /**
         * Run automatic performance optimization
         */
        optimize: async function() {
            console.log('🎯 Running automatic performance optimization...');
            
            if (!window.smartCAManager) {
                console.error('Smart CA Manager not available');
                return null;
            }
            
            try {
                const optimalImplementation = await window.smartCAManager.optimizePerformance();
                console.log(`✅ Optimization complete: ${optimalImplementation} implementation selected`);
                return optimalImplementation;
            } catch (error) {
                console.error('Optimization failed:', error);
                return null;
            }
        },
        
        /**
         * Start real-time performance monitoring
         */
        monitor: function(intervalMs = 5000) {
            if (this._monitorInterval) {
                console.log('⏹️  Stopping existing monitor');
                clearInterval(this._monitorInterval);
            }
            
            console.log(`📈 Starting performance monitor (${intervalMs}ms intervals)`);
            console.log('Use GPU.stopMonitor() to stop monitoring');
            
            this._monitorInterval = setInterval(() => {
                const perfInfo = getCellularAutomataPerformance();
                if (perfInfo) {
                    const timestamp = new Date().toLocaleTimeString();
                    console.log(`[${timestamp}] Performance Status:`, {
                        implementation: perfInfo.implementation,
                        backgroundFPS: perfInfo.background?.performance?.currentFPS || 'N/A',
                        headerFPS: perfInfo.header?.performance?.currentFPS || 'N/A',
                        usingGPU: perfInfo.implementation === 'GPU'
                    });
                }
            }, intervalMs);
            
            return this._monitorInterval;
        },
        
        /**
         * Stop performance monitoring
         */
        stopMonitor: function() {
            if (this._monitorInterval) {
                clearInterval(this._monitorInterval);
                this._monitorInterval = null;
                console.log('⏹️  Performance monitoring stopped');
                return true;
            }
            console.log('ℹ️  No active monitoring to stop');
            return false;
        },
        
        /**
         * Quick performance test for current implementation
         */
        quickTest: async function() {
            console.log('⚡ Running quick performance test...');
            
            const results = await this.benchmark({
                testDuration: 2000,
                gridSizes: [200],
                rules: [30]
            });
            
            if (results && results.comparison) {
                const comparison = results.comparison[200];
                console.log(`Quick Test Result: ${comparison.speedup.toFixed(2)}x speedup with GPU`);
                return comparison.speedup;
            }
            
            return null;
        },
        
        /**
         * Display available GPU extensions
         */
        extensions: function() {
            const detector = new APP.CellularAutomata.GPUCapabilityDetector();
            console.log('\n🧩 WebGL Extensions:');
            console.log(detector.extensions.sort());
            return detector.extensions;
        },
        
        /**
         * Show help information
         */
        help: function() {
            console.log('\n🆘 GPU Debug Console Help');
            console.log('========================');
            console.log('Available Commands:');
            console.log('  GPU.detectWebGL()   - Quick WebGL detection test (START HERE!)');
            console.log('  GPU.testShaders()   - Test shader compilation specifically');
            console.log('  GPU.test()          - Full GPU capabilities test');
            console.log('  GPU.info()          - Show GPU capabilities and status');
            console.log('  GPU.benchmark()     - Run performance benchmark');
            console.log('  GPU.quickTest()     - Quick performance test');
            console.log('  GPU.switchToGPU()   - Force switch to GPU');
            console.log('  GPU.switchToCPU()   - Force switch to CPU'); 
            console.log('  GPU.optimize()      - Auto-optimize implementation');
            console.log('  GPU.monitor()       - Start performance monitoring');
            console.log('  GPU.stopMonitor()   - Stop performance monitoring');
            console.log('  GPU.extensions()    - List WebGL extensions');
            console.log('  GPU.help()          - Show this help');
            console.log('\nRecommended Workflow:');
            console.log('  1. GPU.detectWebGL()   // First, check WebGL detection');
            console.log('  2. GPU.testShaders()   // If WebGL works, test shader compilation');
            console.log('  3. GPU.test()          // Then run full capabilities test');
            console.log('  4. GPU.info()          // Check current implementation status');
            console.log('  5. GPU.benchmark()     // Optional: performance comparison');
        }
    };
    
    // Initialize message
    console.log('\n🎮 GPU Debug Console Loaded');
    console.log('Type GPU.help() for available commands');
    
})();