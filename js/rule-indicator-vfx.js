(function(APP) {
    'use strict';

    const VFX_DURATION = 800; // Duration for all effects
    const SCRAMBLE_CHARS = ['█', '▓', '░', '▒', '◆', '◇', '●', '○', '◊', '※'];
    const PARTICLE_COUNT = 12;
    
    // Prevent overlapping VFX
    let vfxInProgress = false;

    // VFX Effects
    const effects = {
        // 1. Number Scrambling Animation
        numberScramble: function(element, finalRule, callback) {
            const originalText = element.textContent;
            const finalText = originalText.replace(/\d+/, finalRule);
            let scrambleCount = 0;
            const maxScrambles = 30;
            
            const scrambleInterval = setInterval(() => {
                const randomRule = Math.floor(Math.random() * 256);
                element.textContent = originalText.replace(/\d+/, randomRule);
                element.style.color = `hsl(${45 + Math.random() * 20}, 80%, ${60 + Math.random() * 20}%)`;
                
                scrambleCount++;
                if (scrambleCount >= maxScrambles) {
                    clearInterval(scrambleInterval);
                    element.textContent = finalText;
                    element.style.color = '';
                    callback();
                }
            }, VFX_DURATION / maxScrambles);
        },

        // 2. Glitch/Static Effect
        glitchStatic: function(element, finalRule, callback) {
            const originalText = element.textContent;
            const finalText = originalText.replace(/\d+/, finalRule);
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
                    element.textContent = finalText;
                    element.style.textShadow = '';
                    callback();
                }
            }, VFX_DURATION / maxGlitches);
        },

        // 3. Typewriter Scramble
        typewriterScramble: function(element, finalRule, callback) {
            const originalText = element.textContent;
            const ruleStr = finalRule.toString();
            const ruleMatch = originalText.match(/\d+/);
            if (!ruleMatch) {
                element.textContent = originalText.replace(/\d+/, finalRule);
                callback();
                return;
            }
            
            const textBeforeRule = originalText.substring(0, originalText.lastIndexOf(ruleMatch[0]));
            const textAfterRule = originalText.substring(originalText.lastIndexOf(ruleMatch[0]) + ruleMatch[0].length);
            
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
            const finalText = originalText.replace(/\d+/, finalRule);
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
                    element.textContent = finalText;
                    callback();
                }
            };
            
            requestAnimationFrame(animateParticles);
        },

        // 5. Rotation/Flip Animation
        rotationFlip: function(element, finalRule, callback) {
            const originalText = element.textContent;
            const finalText = originalText.replace(/\d+/, finalRule);
            element.classList.add('vfx-flip');
            
            // First half of rotation - hide content
            setTimeout(() => {
                element.style.opacity = '0.3';
                element.textContent = '???';
                element.style.filter = 'blur(2px)';
            }, VFX_DURATION * 0.25);
            
            // Second half - reveal new rule
            setTimeout(() => {
                element.textContent = finalText;
                element.style.opacity = '1';
                element.style.filter = 'blur(0)';
            }, VFX_DURATION * 0.75);
            
            // Complete animation
            setTimeout(() => {
                element.classList.remove('vfx-flip');
                callback();
            }, VFX_DURATION);
        },

        // 6. Odometer Roll (per-digit vertical roll 0-9)
        odometerRoll: function(element, finalRule, callback) {
            const originalText = element.textContent;
            const match = originalText.match(/\d+/);
            if (!match) {
                element.textContent = originalText.replace(/\d+/, finalRule);
                callback();
                return;
            }

            const ruleStr = String(finalRule);
            const before = originalText.slice(0, match.index);
            const after = originalText.slice(match.index + match[0].length);

            // Build odometer DOM
            const wrapper = document.createElement('span');
            wrapper.className = 'vfx-odometer';
            for (let i = 0; i < ruleStr.length; i++) {
                const digit = parseInt(ruleStr[i], 10);
                const digitWrap = document.createElement('span');
                digitWrap.className = 'vfx-odometer-digit';

                const column = document.createElement('span');
                column.className = 'vfx-odometer-column';
                // Fill column with 0-9 once (could randomize start for flair)
                for (let n = 0; n <= 9; n++) {
                    const cell = document.createElement('span');
                    cell.className = 'vfx-odometer-cell';
                    cell.textContent = String(n);
                    column.appendChild(cell);
                }

                digitWrap.appendChild(column);
                wrapper.appendChild(digitWrap);

                // Staggered start for a nicer cascade
                setTimeout(() => {
                    // Use translateY to target digit (cells are 1em high via CSS)
                    column.style.transform = `translateY(${-digit}em)`;
                }, i * 50);
            }

            // Render
            element.innerHTML = '';
            element.append(document.createTextNode(before));
            element.appendChild(wrapper);
            element.append(document.createTextNode(after));

            // Finish after duration, restore plain text
            setTimeout(() => {
                const finalText = `${before}${ruleStr}${after}`;
                element.textContent = finalText;
                callback();
            }, VFX_DURATION + 60);
        },

        // 7. Wipe Reveal (mask sweeps across; swap mid-way)
        wipeReveal: function(element, finalRule, callback) {
            const originalText = element.textContent;
            const finalText = originalText.replace(/\d+/, finalRule);
            element.classList.add('vfx-wipe');

            // Swap text at mid animation
            const mid = Math.max(0, Math.floor(VFX_DURATION * 0.5));
            const end = VFX_DURATION;

            const midTimer = setTimeout(() => {
                element.textContent = finalText;
            }, mid);

            const endTimer = setTimeout(() => {
                element.classList.remove('vfx-wipe');
                clearTimeout(midTimer);
                callback();
            }, end);
        },

        // 8. Counter Tween (numeric ease from current to target)
        counterTween: function(element, finalRule, callback) {
            const originalText = element.textContent;
            const match = originalText.match(/\d+/);
            const target = parseInt(finalRule, 10);
            if (!match || Number.isNaN(target)) {
                element.textContent = originalText.replace(/\d+/, finalRule);
                callback();
                return;
            }

            const start = parseInt(match[0], 10);
            const before = originalText.slice(0, match.index);
            const after = originalText.slice(match.index + match[0].length);

            element.classList.add('vfx-counter');

            const startTime = performance.now();
            const easeOut = (t) => 1 - Math.pow(1 - t, 3);

            const tick = (now) => {
                const elapsed = now - startTime;
                const p = Math.min(1, elapsed / VFX_DURATION);
                const eased = easeOut(p);
                const value = Math.round(start + (target - start) * eased);
                element.textContent = `${before}${value}${after}`;
                if (p < 1) {
                    requestAnimationFrame(tick);
                } else {
                    element.classList.remove('vfx-counter');
                    callback();
                }
            };
            requestAnimationFrame(tick);
        }
    };

    // Main VFX controller
    const RuleIndicatorVFX = {
        // Apply random effect
        applyRandomEffect: function(element, newRule, callback = () => {}) {
            if (vfxInProgress) {
                console.log('VFX already in progress, skipping');
                callback();
                return;
            }
            
            console.log('VFX applyRandomEffect called:', {
                element: element,
                elementId: element.id,
                newRule: newRule,
                currentText: element.textContent
            });
            
            vfxInProgress = true;
            const effectNames = Object.keys(effects);
            const randomEffect = effectNames[Math.floor(Math.random() * effectNames.length)];
            
            console.log(`Applying VFX effect: ${randomEffect} for rule ${newRule}`);
            
            // Add visual indicator during effect
            element.classList.add('vfx-active');
            
            effects[randomEffect](element, newRule, () => {
                element.classList.remove('vfx-active');
                vfxInProgress = false;
                console.log(`VFX effect ${randomEffect} completed`);
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

    // Test function for debugging
    window.testVFX = function() {
        const element = document.getElementById('header-rule-text');
        if (element) {
            console.log('Testing VFX on element:', element);
            RuleIndicatorVFX.applyRandomEffect(element, '999', () => {
                console.log('Test VFX completed');
            });
        } else {
            console.log('Header rule element not found');
        }
    };

})(window.APP = window.APP || {});
