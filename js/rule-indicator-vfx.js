(function(APP) {
    'use strict';

    const VFX_DURATION = 800; // Duration for all effects
    const SCRAMBLE_CHARS = ['█', '▓', '░', '▒', '◆', '◇', '●', '○', '◊', '※'];
    const PARTICLE_COUNT = 12;

    // VFX Effects
    const effects = {
        // 1. Number Scrambling Animation
        numberScramble: function(element, finalRule, callback) {
            const originalText = element.textContent;
            let scrambleCount = 0;
            const maxScrambles = 30;
            
            const scrambleInterval = setInterval(() => {
                const randomRule = Math.floor(Math.random() * 256);
                element.textContent = originalText.replace(/\d+/, randomRule);
                element.style.color = `hsl(${45 + Math.random() * 20}, 80%, ${60 + Math.random() * 20}%)`;
                
                scrambleCount++;
                if (scrambleCount >= maxScrambles) {
                    clearInterval(scrambleInterval);
                    element.textContent = originalText.replace(/\d+/, finalRule);
                    element.style.color = '';
                    callback();
                }
            }, VFX_DURATION / maxScrambles);
        },

        // 2. Glitch/Static Effect
        glitchStatic: function(element, finalRule, callback) {
            const originalText = element.textContent;
            element.classList.add('vfx-glitch');
            
            let glitchCount = 0;
            const maxGlitches = 20;
            
            const glitchInterval = setInterval(() => {
                const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
                const scrambled = originalText.replace(/\d+/, () => {
                    return Array(3).fill().map(() => 
                        glitchChars[Math.floor(Math.random() * glitchChars.length)]
                    ).join('');
                });
                
                element.textContent = scrambled;
                element.style.textShadow = `
                    ${Math.random() * 4 - 2}px ${Math.random() * 4 - 2}px 0 #ffd700,
                    ${Math.random() * 4 - 2}px ${Math.random() * 4 - 2}px 0 #ff6b35
                `;
                
                glitchCount++;
                if (glitchCount >= maxGlitches) {
                    clearInterval(glitchInterval);
                    element.classList.remove('vfx-glitch');
                    element.textContent = originalText.replace(/\d+/, finalRule);
                    element.style.textShadow = '';
                    callback();
                }
            }, VFX_DURATION / maxGlitches);
        },

        // 3. Typewriter Scramble
        typewriterScramble: function(element, finalRule, callback) {
            const originalText = element.textContent;
            const ruleStr = finalRule.toString();
            const textBeforeRule = originalText.substring(0, originalText.lastIndexOf(originalText.match(/\d+/)[0]));
            const textAfterRule = originalText.substring(originalText.lastIndexOf(originalText.match(/\d+/)[0]) + originalText.match(/\d+/)[0].length);
            
            let revealIndex = 0;
            const scramblePhase = VFX_DURATION * 0.4;
            const revealPhase = VFX_DURATION * 0.6;
            
            // Scramble phase
            const scrambleInterval = setInterval(() => {
                const scrambled = Array(ruleStr.length).fill().map(() => 
                    SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
                ).join('');
                element.textContent = textBeforeRule + scrambled + textAfterRule;
            }, scramblePhase / 15);
            
            // Reveal phase
            setTimeout(() => {
                clearInterval(scrambleInterval);
                
                const revealInterval = setInterval(() => {
                    const revealed = ruleStr.substring(0, revealIndex + 1);
                    const remaining = Array(ruleStr.length - revealIndex - 1).fill().map(() => 
                        SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
                    ).join('');
                    
                    element.textContent = textBeforeRule + revealed + remaining + textAfterRule;
                    revealIndex++;
                    
                    if (revealIndex >= ruleStr.length) {
                        clearInterval(revealInterval);
                        callback();
                    }
                }, revealPhase / ruleStr.length);
            }, scramblePhase);
        },

        // 4. Particle Burst Effect
        particleBurst: function(element, finalRule, callback) {
            const originalText = element.textContent;
            const rect = element.getBoundingClientRect();
            const container = document.body;
            
            // Create particles
            const particles = [];
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const particle = document.createElement('div');
                particle.classList.add('vfx-particle');
                particle.style.left = (rect.left + rect.width / 2) + 'px';
                particle.style.top = (rect.top + rect.height / 2) + 'px';
                
                const angle = (Math.PI * 2 * i) / PARTICLE_COUNT;
                const velocity = 50 + Math.random() * 30;
                const vx = Math.cos(angle) * velocity;
                const vy = Math.sin(angle) * velocity;
                
                particle.dataset.vx = vx;
                particle.dataset.vy = vy;
                particle.dataset.life = 1.0;
                
                container.appendChild(particle);
                particles.push(particle);
            }
            
            // Animate particles
            const startTime = performance.now();
            const animateParticles = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = elapsed / VFX_DURATION;
                
                if (progress < 1) {
                    particles.forEach(particle => {
                        const life = parseFloat(particle.dataset.life);
                        const vx = parseFloat(particle.dataset.vx);
                        const vy = parseFloat(particle.dataset.vy);
                        
                        const currentLeft = parseFloat(particle.style.left);
                        const currentTop = parseFloat(particle.style.top);
                        
                        particle.style.left = (currentLeft + vx * 0.016) + 'px';
                        particle.style.top = (currentTop + vy * 0.016) + 'px';
                        particle.style.opacity = life * (1 - progress);
                        
                        particle.dataset.life = life * 0.98;
                    });
                    
                    requestAnimationFrame(animateParticles);
                } else {
                    particles.forEach(p => p.remove());
                    element.textContent = originalText.replace(/\d+/, finalRule);
                    callback();
                }
            };
            
            requestAnimationFrame(animateParticles);
        },

        // 5. Rotation/Flip Animation
        rotationFlip: function(element, finalRule, callback) {
            const originalText = element.textContent;
            element.classList.add('vfx-flip');
            
            // First half of rotation - hide content
            setTimeout(() => {
                element.style.opacity = '0.3';
                element.textContent = '???';
                element.style.filter = 'blur(2px)';
            }, VFX_DURATION * 0.25);
            
            // Second half - reveal new rule
            setTimeout(() => {
                element.textContent = originalText.replace(/\d+/, finalRule);
                element.style.opacity = '1';
                element.style.filter = 'blur(0)';
            }, VFX_DURATION * 0.75);
            
            // Complete animation
            setTimeout(() => {
                element.classList.remove('vfx-flip');
                callback();
            }, VFX_DURATION);
        }
    };

    // Main VFX controller
    const RuleIndicatorVFX = {
        // Apply random effect
        applyRandomEffect: function(element, newRule, callback = () => {}) {
            const effectNames = Object.keys(effects);
            const randomEffect = effectNames[Math.floor(Math.random() * effectNames.length)];
            
            console.log(`Applying VFX effect: ${randomEffect} for rule ${newRule}`);
            
            // Add visual indicator during effect
            element.classList.add('vfx-active');
            
            effects[randomEffect](element, newRule, () => {
                element.classList.remove('vfx-active');
                callback();
            });
        },

        // Apply specific effect
        applyEffect: function(effectName, element, newRule, callback = () => {}) {
            if (effects[effectName]) {
                element.classList.add('vfx-active');
                effects[effectName](element, newRule, () => {
                    element.classList.remove('vfx-active');
                    callback();
                });
            } else {
                console.warn(`VFX effect "${effectName}" not found`);
                callback();
            }
        },

        // Get available effects
        getAvailableEffects: function() {
            return Object.keys(effects);
        }
    };

    // Add to APP namespace
    APP.RuleIndicatorVFX = RuleIndicatorVFX;

    // Also expose globally for backward compatibility
    window.RuleIndicatorVFX = RuleIndicatorVFX;

})(window.APP = window.APP || {});