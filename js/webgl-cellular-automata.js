// js/webgl-cellular-automata.js

/**
 * @file WebGL 2.0 runner for Cellular Automata.
 * This file provides a WebGL-based computation backend for the AutomataEngine.
 * It uses fragment shaders and ping-pong textures to compute cellular automata
 * generations on the GPU.
 */

window.APP = window.APP || {};

(function (APP) {
    'use strict';

    /**
     * A runner that computes cellular automata generations using WebGL 2.0.
     * It is designed to be used by the AutomataAnimator and conforms to the
     * runner interface.
     */
    class WebGLRunner {
        constructor(options = {}) {
            this.cols = options.cols || 0;
            this.rows = options.rows || 1; // 1D automata
            this.gl = null;
            this.shaderProgram = null;
            this.textures = [];
            this.frameBuffers = [];
            this.currentTextureIndex = 0;

            this.init();
        }

        init() {
            const canvas = document.createElement('canvas');
            this.gl = canvas.getContext('webgl2', { antialias: false, depth: false, stencil: false });
            if (!this.gl) {
                throw new Error('WebGL 2.0 not supported.');
            }
            this.setupShaders();
            this.setupGeometry();
            this.setupResources();
        }

        setupResources() {
            this.cleanupTexturesAndFramebuffers();
            this.setupTextures();
            this.setupFramebuffers();
        }

        updateRule(ruleNumber) {
            // WebGL runner gets rule passed in computeNextGeneration
            // No state to update here, but method must exist for interface
        }

        setupShaders() {
            const vs = `#version 300 es
                precision highp float;
                in vec2 a_position;
                out vec2 v_texCoord;
                void main() {
                    gl_Position = vec4(a_position, 0.0, 1.0);
                    v_texCoord = a_position * 0.5 + 0.5;
                }`;

            const fs = `#version 300 es
                precision highp float;
                uniform sampler2D u_currentGeneration;
                uniform vec2 u_textureSize;
                uniform float u_rule[8];
                in vec2 v_texCoord;
                out vec4 fragColor;

                void main() {
                    vec2 onePixel = 1.0 / u_textureSize;
                    float left = texture(u_currentGeneration, v_texCoord - vec2(onePixel.x, 0.0)).r;
                    float center = texture(u_currentGeneration, v_texCoord).r;
                    float right = texture(u_currentGeneration, v_texCoord + vec2(onePixel.x, 0.0)).r;

                    int ruleIndex = int(left * 4.0 + center * 2.0 + right);
                    float result = u_rule[ruleIndex];
                    fragColor = vec4(result, 0.0, 0.0, 1.0);
                }`;

            this.shaderProgram = this.createProgram(vs, fs);
            this.uniformLocations = {
                currentGeneration: this.gl.getUniformLocation(this.shaderProgram, 'u_currentGeneration'),
                textureSize: this.gl.getUniformLocation(this.shaderProgram, 'u_textureSize'),
                rule: this.gl.getUniformLocation(this.shaderProgram, 'u_rule'),
            };
        }

        setupGeometry() {
            const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
            const buffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

            const vao = this.gl.createVertexArray();
            this.gl.bindVertexArray(vao);
            const posLocation = this.gl.getAttribLocation(this.shaderProgram, 'a_position');
            this.gl.enableVertexAttribArray(posLocation);
            this.gl.vertexAttribPointer(posLocation, 2, this.gl.FLOAT, false, 0, 0);
            this.vao = vao;
        }

        setupTextures() {
            for (let i = 0; i < 2; i++) {
                const texture = this.gl.createTexture();
                this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.R8, this.cols, 1, 0, this.gl.RED, this.gl.UNSIGNED_BYTE, null);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
                this.textures.push(texture);
            }
        }

        setupFramebuffers() {
            for (let i = 0; i < 2; i++) {
                const fbo = this.gl.createFramebuffer();
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
                this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.textures[i], 0);
                this.frameBuffers.push(fbo);
            }
        }

        async computeNextGeneration(grid, ruleNumber) {
            if (grid.length !== this.cols) {
                this.cols = grid.length;
                this.setupResources();
            }

            const ruleArray = new Float32Array(
                APP.CellularAutomataShared.CellularAutomataRules.getRule(ruleNumber)
            );

            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffers[1 - this.currentTextureIndex]);
            this.gl.viewport(0, 0, this.cols, 1);
            this.gl.useProgram(this.shaderProgram);

            this.uploadGridToTexture(grid);

            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[this.currentTextureIndex]);
            this.gl.uniform1i(this.uniformLocations.currentGeneration, 0);
            this.gl.uniform2f(this.uniformLocations.textureSize, this.cols, 1);
            this.gl.uniform1fv(this.uniformLocations.rule, ruleArray);

            this.gl.bindVertexArray(this.vao);
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

            const results = new Uint8Array(this.cols);
            this.gl.readPixels(0, 0, this.cols, 1, this.gl.RED, this.gl.UNSIGNED_BYTE, results);

            this.currentTextureIndex = 1 - this.currentTextureIndex;

            return Array.from(results);
        }

        uploadGridToTexture(grid) {
            const textureData = new Uint8Array(grid);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[this.currentTextureIndex]);
            this.gl.texSubImage2D(this.gl.TEXTURE_2D, 0, 0, 0, this.cols, 1, this.gl.RED, this.gl.UNSIGNED_BYTE, textureData);
        }

        createProgram(vsSource, fsSource) {
            const program = this.gl.createProgram();
            const vs = this.compileShader(vsSource, this.gl.VERTEX_SHADER);
            const fs = this.compileShader(fsSource, this.gl.FRAGMENT_SHADER);
            this.gl.attachShader(program, vs);
            this.gl.attachShader(program, fs);
            this.gl.linkProgram(program);
            if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
                throw new Error(this.gl.getProgramInfoLog(program));
            }
            return program;
        }

        compileShader(source, type) {
            const shader = this.gl.createShader(type);
            this.gl.shaderSource(shader, source);
            this.gl.compileShader(shader);
            if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
                throw new Error(this.gl.getShaderInfoLog(shader));
            }
            return shader;
        }

        cleanupTexturesAndFramebuffers() {
            this.textures.forEach(t => this.gl.deleteTexture(t));
            this.frameBuffers.forEach(f => this.gl.deleteFramebuffer(f));
            this.textures = [];
            this.frameBuffers = [];
        }

        cleanup() {
            this.cleanupTexturesAndFramebuffers();
            this.gl.deleteProgram(this.shaderProgram);
            this.gl.deleteVertexArray(this.vao);
        }
    }

    APP.WebGLRunner = WebGLRunner;

})(window.APP);