// js/main.js

/**
 * @file Main entry point for the cellular automata animations.
 * This file sets up the GPU manager, detects capabilities, and initializes
 * the header and background animations using the new AutomataEngine.
 */

window.APP = window.APP || {};

(function (APP) {
    'use strict';

    /**
     * Detects available GPU acceleration paths (WebGPU, WebGL, CPU).
     */
    class GPUCapabilityDetector {
        constructor() {
            this.capabilities = { webgpu: false, webgl2: false, cpu: true };
            this.selectedPath = 'cpu';
        }

        async detect() {
            await this.testWebGPUSupport();
            this.testWebGL2Support();
            this.selectOptimalPath();
            return this.selectedPath;
        }

        async testWebGPUSupport() {
            if (navigator.gpu) {
                try {
                    const adapter = await navigator.gpu.requestAdapter();
                    if (adapter) {
                        this.capabilities.webgpu = true;
                    }
                } catch (e) {
                    console.warn('WebGPU adapter request failed:', e);
                }
            }
        }

        testWebGL2Support() {
            try {
                const canvas = document.createElement('canvas');
                if (canvas.getContext('webgl2')) {
                    this.capabilities.webgl2 = true;
                }
            } catch (e) {}
        }

        selectOptimalPath() {
            if (this.capabilities.webgpu) {
                this.selectedPath = 'webgpu';
            } else if (this.capabilities.webgl2) {
                this.selectedPath = 'webgl2';
            } else {
                this.selectedPath = 'cpu';
            }
            console.log(`Selected rendering path: ${this.selectedPath.toUpperCase()}`);
        }
    }

    /**
     * Manages the creation of cellular automata animations with the best available backend.
     */
    class GPUCellularAutomataManager {
        constructor() {
            this.detector = new GPUCapabilityDetector();
            this.initialized = false;
            this.runner = null;
        }

        async initialize() {
            if (this.initialized) return;
            const path = await this.detector.detect();
            this.runner = this.createRunner(path);
            this.initialized = true;
        }

        createRunner(path) {
            try {
                if (path === 'webgpu' && APP.WebGPURunner) {
                    return new APP.WebGPURunner();
                }
                if (path === 'webgl2' && APP.WebGLRunner) {
                    return new APP.WebGLRunner();
                }
            } catch (error) {
                console.warn(`Failed to create ${path} runner, falling back to CPU.`, error);
            }
            return new APP.AutomataEngine.CPURunner();
        }

        async createBackgroundAnimation() {
            await this.initialize();
            const config = {
                cellSize: 3,
                animationSpeed: 200,
                isHeader: false,
                rule: 30,
            };
            return new APP.AutomataEngine.AutomataAnimator('cellular-automata-bg', this.runner, config);
        }

        async createHeaderAnimation() {
            await this.initialize();
            const config = {
                cellSize: 3,
                animationSpeed: 200,
                isHeader: true,
                rule: APP.CellularAutomataShared.CellularAutomataRules.getRandomRule(),
            };
            return new APP.AutomataEngine.AutomataAnimator('header-cellular-automata', this.runner, config);
        }
    }

    const manager = new GPUCellularAutomataManager();

    // Global initialization functions
    window.initCellularAutomataBackground = () => manager.createBackgroundAnimation();
    window.initCellularAutomataHeader = () => manager.createHeaderAnimation();

    // Expose the manager and detector for debugging or advanced usage
    APP.GPUCellularAutomata = {
        manager,
        GPUCapabilityDetector,
    };

})(window.APP);