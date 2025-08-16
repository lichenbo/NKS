document.addEventListener('DOMContentLoaded', function () {
    initMarkdownRenderer();
    initLanguageSystem();  // Initialize language first
    initChapterNavigation();
    initAnnotationSystem();
    initAnnotationContent();

    // Load first chapter by default
    loadChapter('chapter1');
    
    // Handle floating annotation responsive behavior
    window.addEventListener('resize', debounce(() => {
        const floatingAnnotation = document.getElementById('floating-annotation');
        if (floatingAnnotation && !floatingAnnotation.classList.contains('hidden')) {
            // Check if we should switch between mobile and desktop annotation
            const shouldFloat = shouldUseFloatingAnnotations();
            
            if (!shouldFloat) {
                // Switch to desktop annotation
                floatingAnnotation.classList.add('hidden');
                
                // Get current annotation key from active link
                const activeLink = document.querySelector('.annotation-link.active');
                if (activeLink) {
                    const annotationKey = activeLink.getAttribute('data-annotation');
                    showDesktopAnnotation(annotationKey);
                }
            } else {
                // Keep floating but reposition if needed
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                
                // Ensure annotation stays within viewport
                let left = parseInt(floatingAnnotation.style.left) || 20;
                let top = parseInt(floatingAnnotation.style.top) || 20;
                
                if (left + floatingAnnotation.offsetWidth > windowWidth) {
                    left = windowWidth - floatingAnnotation.offsetWidth - 20;
                }
                if (top + floatingAnnotation.offsetHeight > windowHeight) {
                    top = windowHeight - floatingAnnotation.offsetHeight - 20;
                }
                if (left < 20) left = 20;
                if (top < 20) top = 20;
                
                floatingAnnotation.style.left = `${left}px`;
                floatingAnnotation.style.top = `${top}px`;
            }
        }
    }, 250));
});

// Cache for loaded annotations
const annotationCache = {};

function initMarkdownRenderer() {
    // Configure marked for our annotation syntax
    marked.setOptions({
        breaks: true,
        gfm: true
    });
}

function initChapterNavigation() {
    const chapterLinks = document.querySelectorAll('.chapter-link');

    chapterLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            // Remove active class from all links
            chapterLinks.forEach(l => l.classList.remove('active'));

            // Add active class to clicked link
            this.classList.add('active');

            // Load the selected chapter
            const targetChapter = this.getAttribute('data-chapter');
            loadChapter(targetChapter);

            // Clear annotation content when switching chapters
            clearAnnotationContent();
        });
    });
}

async function loadChapter(chapterId) {
    const notesContent = document.getElementById('notes-content');

    try {
        // Show loading state
        const loadingText = translations[currentLanguage]['loading'] || 'Loading chapter content...';
        notesContent.innerHTML = `<div class="loading">${loadingText}</div>`;

        // Determine file path based on current language
        const filePath = currentLanguage === 'zh' ? `chapters/zh/${chapterId}.md` : `chapters/${chapterId}.md`;

        // Fetch the markdown file
        const response = await fetch(filePath);

        if (!response.ok) {
            throw new Error(`Chapter file not found: ${chapterId}.md`);
        }

        const markdownText = await response.text();

        // Process annotation links BEFORE markdown parsing
        const processedMarkdown = processAnnotationLinksInMarkdown(markdownText);

        // Parse markdown to HTML
        let htmlContent = marked.parse(processedMarkdown);

        // Display the content
        notesContent.innerHTML = htmlContent;

    } catch (error) {
        console.error('Error loading chapter:', error);
        notesContent.innerHTML = `
            <div class="error">
                <h2>Error Loading Chapter</h2>
                <p>Could not load <code>${chapterId}.md</code></p>
                <p>Please make sure the file exists in the <code>chapters/</code> directory.</p>
            </div>
        `;
    }
}

function processAnnotationLinksInMarkdown(markdown) {
    // Convert [text](annotation:key) to HTML before markdown parsing
    return markdown.replace(
        /\[([^\]]+)\]\(annotation:([^)]+)\)/g,
        '<span class="annotation-link" data-annotation="$2">$1</span>'
    );
}

function processAnnotationLinks(html) {
    // Convert [text](annotation:key) to clickable annotation links
    return html.replace(
        /\[([^\]]+)\]\(annotation:([^)]+)\)/g,
        '<a href="#" class="annotation-link" data-annotation="$2">$1</a>'
    );
}

function initAnnotationSystem() {
    // Add click event listeners to all annotation links
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('annotation-link')) {
            e.preventDefault();

            // Remove active class from all annotation links
            document.querySelectorAll('.annotation-link').forEach(link => {
                link.classList.remove('active');
            });

            // Add active class to clicked link
            e.target.classList.add('active');

            // Get annotation data
            const annotationKey = e.target.getAttribute('data-annotation');
            showAnnotation(annotationKey, e.target);
        }
    });
    
    // Initialize floating annotation controls
    initFloatingAnnotationControls();
}

function initFloatingAnnotationControls() {
    const floatingAnnotation = document.getElementById('floating-annotation');
    
    if (!floatingAnnotation) {
        console.error('Floating annotation element not found');
        return;
    }
    
    // Use event delegation for better reliability
    document.addEventListener('click', function(e) {
        if (e.target.id === 'minimize-annotation') {
            e.preventDefault();
            e.stopPropagation();
            console.log('Minimize button clicked');
            floatingAnnotation.classList.toggle('minimized');
        }
        
        if (e.target.id === 'close-annotation') {
            e.preventDefault();
            e.stopPropagation();
            console.log('Close button clicked');
            floatingAnnotation.classList.add('hidden');
            
            // Destroy any existing Typed instance
            if (currentTyped) {
                currentTyped.destroy();
                currentTyped = null;
            }
            
            // Remove active class from all annotation links
            document.querySelectorAll('.annotation-link').forEach(link => {
                link.classList.remove('active');
            });
        }
    });
    
    // Make floating annotation draggable (optional enhancement)
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    
    const header = document.querySelector('.floating-annotation-header');
    
    // Mouse events for desktop dragging
    header.addEventListener('mousedown', startDrag);
    
    // Touch events for mobile dragging
    header.addEventListener('touchstart', startDrag);
    
    function startDrag(e) {
        // Don't start dragging if clicking on control buttons
        if (e.target.classList.contains('control-btn') || e.target.closest('.floating-annotation-controls')) {
            return;
        }
        
        isDragging = true;
        const rect = floatingAnnotation.getBoundingClientRect();
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        
        dragOffsetX = clientX - rect.left;
        dragOffsetY = clientY - rect.top;
        
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
        
        e.preventDefault();
    }
    
    function onMove(e) {
        if (!isDragging) return;
        
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        
        const left = clientX - dragOffsetX;
        const top = clientY - dragOffsetY;
        
        // Keep within viewport bounds
        const maxLeft = window.innerWidth - floatingAnnotation.offsetWidth;
        const maxTop = window.innerHeight - floatingAnnotation.offsetHeight;
        
        floatingAnnotation.style.left = `${Math.max(0, Math.min(left, maxLeft))}px`;
        floatingAnnotation.style.top = `${Math.max(0, Math.min(top, maxTop))}px`;
        
        if (e.type === 'touchmove') {
            e.preventDefault();
        }
    }
    
    function onEnd() {
        isDragging = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
    }
}

// Global variable to track active Typed instance
let currentTyped = null;
let linkCheckInterval = null;

// Debounce helper function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Mobile detection
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
}

// Check if device should use floating annotations (mobile/small tablets)
function shouldUseFloatingAnnotations() {
    return window.innerWidth <= 768 || isMobile();
}

// Prevent animation restarts during mobile scrolling
let isScrolling = false;
let scrollTimeout;

if (isMobile()) {
    // Track scrolling state on mobile
    document.addEventListener('touchstart', () => {
        isScrolling = true;
        clearTimeout(scrollTimeout);
    });
    
    document.addEventListener('touchend', () => {
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
        }, 150);
    });
    
    document.addEventListener('scroll', () => {
        isScrolling = true;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
        }, 150);
    });
}

async function loadAnnotation(key) {
    // Create a cache key that includes language
    const cacheKey = `${key}-${currentLanguage}`;

    // Check cache first
    if (annotationCache[cacheKey]) {
        return annotationCache[cacheKey];
    }

    try {
        // Try language-specific annotation first, fallback to English
        let response;
        if (currentLanguage === 'zh') {
            response = await fetch(`annotations/zh/${key}.md`);
            if (!response.ok) {
                // Fallback to English version
                response = await fetch(`annotations/${key}.md`);
            }
        } else {
            response = await fetch(`annotations/${key}.md`);
        }

        if (!response.ok) {
            throw new Error(`Annotation file not found: ${key}.md`);
        }

        const markdownText = await response.text();
        let htmlContent = marked.parse(markdownText);
        
        // Process external links to open in new tab
        htmlContent = htmlContent.replace(/<a href="https?:\/\/[^"]*"/g, function(match) {
            return match + ' target="_blank" rel="noopener noreferrer"';
        });

        // Extract title from the first heading
        const titleMatch = markdownText.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : key.replace('-', ' ');

        const annotation = {
            title: title,
            content: htmlContent
        };

        // Cache the annotation with language-specific key
        annotationCache[cacheKey] = annotation;
        return annotation;

    } catch (error) {
        console.error('Error loading annotation:', error);
        return null;
    }
}

async function showAnnotation(key, clickedElement = null) {
    // Check if we should use floating annotation
    if (shouldUseFloatingAnnotations()) {
        await showFloatingAnnotation(key, clickedElement);
    } else {
        await showDesktopAnnotation(key);
    }
}

async function showDesktopAnnotation(key) {
    const annotationContent = document.getElementById('annotation-content');

    // Destroy any existing Typed instance
    if (currentTyped) {
        currentTyped.destroy();
        currentTyped = null;
    }

    // Show loading state
    annotationContent.innerHTML = `
        <div class="loading">Loading annotation...</div>
    `;

    const annotation = await loadAnnotation(key);

    if (annotation) {
        // Create the structure first
        annotationContent.innerHTML = `
            <div class="annotation-title">${annotation.title}</div>
            <div class="annotation-text">
                <span id="typewriter-text"></span>
            </div>
        `;

        // Initialize Typed.js with error handling
        if (typeof Typed !== 'undefined') {
            // Start checking for links during typing
            startLinkMonitoring();
            
            currentTyped = new Typed('#typewriter-text', {
                strings: [annotation.content], // Use HTML content directly
                typeSpeed: 10, // Much faster typing (was 1ms, now 10ms per character)
                backSpeed: 0,
                fadeOut: false,
                showCursor: true,
                cursorChar: '|',
                autoInsertCss: true,
                contentType: 'html', // Allow HTML content
                onComplete: function () {
                    // Stop monitoring and make sure all links are clickable
                    stopLinkMonitoring();
                    enableAnnotationLinks();
                }
            });
        } else {
            // Fallback: display content immediately if Typed.js is not available
            document.getElementById('typewriter-text').innerHTML = annotation.content;
            enableAnnotationLinks();
        }
    } else {
        annotationContent.innerHTML = `
            <h3>Annotation Not Found</h3>
            <p class="placeholder">The annotation "${key}" could not be loaded. Make sure the file "annotations/${key}.md" exists.</p>
        `;
    }
}

async function showFloatingAnnotation(key, clickedElement) {
    const floatingAnnotation = document.getElementById('floating-annotation');
    const floatingContent = document.getElementById('floating-annotation-content');
    const floatingTitle = document.querySelector('.floating-annotation-title');

    // Destroy any existing Typed instance
    if (currentTyped) {
        currentTyped.destroy();
        currentTyped = null;
    }

    // Show loading state
    floatingContent.innerHTML = `
        <div class="loading">Loading annotation...</div>
    `;
    floatingTitle.textContent = 'Loading...';

    const annotation = await loadAnnotation(key);

    if (annotation) {
        // Set title
        floatingTitle.textContent = annotation.title;

        // Create the structure first
        floatingContent.innerHTML = `
            <div class="annotation-text">
                <span id="floating-typewriter-text"></span>
            </div>
        `;

        // Position the floating window near the clicked element
        if (clickedElement) {
            positionFloatingAnnotation(floatingAnnotation, clickedElement);
        }

        // Show the floating annotation
        floatingAnnotation.classList.remove('hidden', 'minimized');

        // Initialize Typed.js with error handling
        if (typeof Typed !== 'undefined') {
            // Start checking for links during typing
            startLinkMonitoring('#floating-typewriter-text');
            
            currentTyped = new Typed('#floating-typewriter-text', {
                strings: [annotation.content], // Use HTML content directly
                typeSpeed: 10, // Much faster typing
                backSpeed: 0,
                fadeOut: false,
                showCursor: true,
                cursorChar: '|',
                autoInsertCss: true,
                contentType: 'html', // Allow HTML content
                onComplete: function () {
                    // Stop monitoring and make sure all links are clickable
                    stopLinkMonitoring();
                    enableFloatingAnnotationLinks();
                }
            });
        } else {
            // Fallback: display content immediately if Typed.js is not available
            document.getElementById('floating-typewriter-text').innerHTML = annotation.content;
            enableFloatingAnnotationLinks();
        }
    } else {
        floatingTitle.textContent = 'Annotation Not Found';
        floatingContent.innerHTML = `
            <p class="placeholder">The annotation "${key}" could not be loaded.</p>
        `;
        
        // Position and show even for errors
        if (clickedElement) {
            positionFloatingAnnotation(floatingAnnotation, clickedElement);
        }
        floatingAnnotation.classList.remove('hidden', 'minimized');
    }
}

function enableAnnotationLinks() {
    // Enable all links within the annotation text
    const annotationLinks = document.querySelectorAll('#typewriter-text a');
    annotationLinks.forEach(link => {
        link.style.pointerEvents = 'auto';
        link.style.cursor = 'pointer';
    });
}

function enableFloatingAnnotationLinks() {
    // Enable all links within the floating annotation text
    const annotationLinks = document.querySelectorAll('#floating-typewriter-text a');
    annotationLinks.forEach(link => {
        link.style.pointerEvents = 'auto';
        link.style.cursor = 'pointer';
    });
}

function positionFloatingAnnotation(floatingAnnotation, clickedElement) {
    const rect = clickedElement.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calculate initial position below the clicked element
    let left = rect.left;
    let top = rect.bottom + 10;
    
    // Ensure the annotation doesn't go off-screen horizontally
    const annotationWidth = Math.min(300, windowWidth * 0.85);
    if (left + annotationWidth > windowWidth - 20) {
        left = windowWidth - annotationWidth - 20;
    }
    if (left < 20) {
        left = 20;
    }
    
    // Ensure the annotation doesn't go off-screen vertically
    const annotationHeight = Math.min(400, windowHeight * 0.6);
    if (top + annotationHeight > windowHeight - 20) {
        // Position above the clicked element instead
        top = rect.top - annotationHeight - 10;
        if (top < 20) {
            top = 20; // Fallback to top of screen
        }
    }
    
    floatingAnnotation.style.left = `${left}px`;
    floatingAnnotation.style.top = `${top}px`;
}

function startLinkMonitoring(selector = '#typewriter-text') {
    // Clear any existing interval
    if (linkCheckInterval) {
        clearInterval(linkCheckInterval);
    }
    
    // Check for new links every 50ms during typing
    linkCheckInterval = setInterval(() => {
        if (selector === '#floating-typewriter-text') {
            enableFloatingAnnotationLinks();
        } else {
            enableAnnotationLinks();
        }
    }, 50);
}

function stopLinkMonitoring() {
    if (linkCheckInterval) {
        clearInterval(linkCheckInterval);
        linkCheckInterval = null;
    }
}

function clearAnnotationContent() {
    // Stop link monitoring
    stopLinkMonitoring();
    
    // Destroy any existing Typed instance
    if (currentTyped && typeof currentTyped.destroy === 'function') {
        currentTyped.destroy();
        currentTyped = null;
    }

    // Clear desktop annotation content
    const annotationContent = document.getElementById('annotation-content');
    const annotationsTitle = translations[currentLanguage]['annotations'] || 'Annotations';
    const placeholderText = translations[currentLanguage]['annotation-placeholder'] || 'Click on any highlighted link in the notes to view detailed annotations and additional context.';

    annotationContent.innerHTML = `
        <h3>${annotationsTitle}</h3>
        <p class="placeholder">${placeholderText}</p>
    `;

    // Hide floating annotation if it exists
    const floatingAnnotation = document.getElementById('floating-annotation');
    if (floatingAnnotation) {
        floatingAnnotation.classList.add('hidden');
    }

    // Remove active class from all annotation links
    document.querySelectorAll('.annotation-link').forEach(link => {
        link.classList.remove('active');
    });
}

// Initialize annotation content on page load
function initAnnotationContent() {
    clearAnnotationContent();
}

// Cellular Automata Background Animation
function initCellularAutomataBackground() {
    const canvas = document.getElementById('cellular-automata-bg');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Cellular automata parameters
    const cellSize = 3;
    let cols, rows, grid, currentRow;

    // Set canvas size
    function resizeCanvas() {
        // Skip resize during mobile scrolling to prevent animation restarts
        if (isMobile() && isScrolling) {
            return;
        }
        
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        
        // Only resize and reinitialize if dimensions actually changed significantly
        if (Math.abs(canvas.width - newWidth) > 50 || Math.abs(canvas.height - newHeight) > 50) {
            canvas.width = newWidth;
            canvas.height = newHeight;
            initAnimation();
        }
    }

    resizeCanvas();
    // Debounce resize events to prevent excessive animation restarts
    window.addEventListener('resize', debounce(resizeCanvas, 250));

    function initAnimation() {
        cols = Math.floor(canvas.width / cellSize);
        rows = Math.floor(canvas.height / cellSize);
        grid = new Array(cols).fill(0);
        grid[Math.floor(cols / 2)] = 1; // Start with center cell
        currentRow = 0;
    }

    // Background uses only Rule 30 (static)
    const rule30 = [0, 1, 1, 1, 1, 0, 0, 0];

    // Apply Rule 30 for background
    function applyRule30(left, center, right) {
        const pattern = left * 4 + center * 2 + right;
        return rule30[pattern];
    }

    const drawnRows = [];

    function drawCellularAutomata() {
        // Only clear if starting over
        if (currentRow === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawnRows.length = 0;
        }

        // Store current row
        drawnRows[currentRow] = [...grid];

        // Draw all stored rows
        for (let row = 0; row < drawnRows.length; row++) {
            for (let col = 0; col < cols; col++) {
                if (drawnRows[row] && drawnRows[row][col] === 1) {
                    // Create gradient effect based on position and age
                    const distance = Math.sqrt(
                        Math.pow(col - cols / 2, 2) + Math.pow(row - currentRow / 2, 2)
                    );
                    const maxDistance = Math.sqrt(cols * cols / 4 + rows * rows / 4);
                    const intensity = Math.max(0.2, 1 - distance / maxDistance);

                    // Age effect - older rows fade
                    const age = currentRow - row;
                    const ageFactor = Math.max(0.1, 1 - age / (rows * 0.3));

                    // Very subtle golden pattern
                    const alpha = intensity * ageFactor * 0.08;
                    const red = Math.floor(212 * intensity * ageFactor);
                    const green = Math.floor(175 * intensity * ageFactor);
                    const blue = Math.floor(55 * intensity * ageFactor);

                    ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
                    ctx.fillRect(col * cellSize, row * cellSize, cellSize - 0.5, cellSize - 0.5);
                }
            }
        }

        // Calculate next generation
        if (currentRow < rows - 1) {
            const newGrid = new Array(cols).fill(0);
            for (let i = 0; i < cols; i++) {
                const left = grid[i - 1] || 0;
                const center = grid[i];
                const right = grid[i + 1] || 0;
                newGrid[i] = applyRule30(left, center, right);
            }
            grid = newGrid;
            currentRow++;
        } else {
            // Background animation complete - stop here
            // No more generations, pattern stays static
        }
    }

    // Initialize background rule indicator
    updateBackgroundRuleIndicator();

    // Initialize
    initAnimation();

    // Animate very slowly for subtle effect
    setInterval(drawCellularAutomata, 200);
}

// Header Cellular Automata Animation
function initHeaderCellularAutomata() {
    const canvas = document.getElementById('header-cellular-automata');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Cellular automata parameters
    const cellSize = 2;
    let cols, rows, grid, currentRow;
    let fadeDirection = 1; // 1 for fade in, -1 for fade out
    let globalAlpha = 0.3;

    // Set canvas size to header dimensions
    function resizeCanvas() {
        // Skip resize during mobile scrolling to prevent animation restarts
        if (isMobile() && isScrolling) {
            return;
        }
        
        const header = canvas.parentElement;
        const newWidth = header.clientWidth;
        const newHeight = header.clientHeight;
        
        // Only resize and reinitialize if dimensions actually changed significantly
        if (Math.abs(canvas.width - newWidth) > 20 || Math.abs(canvas.height - newHeight) > 20) {
            canvas.width = newWidth;
            canvas.height = newHeight;
            initAnimation();
        }
    }

    resizeCanvas();
    // Debounce resize events to prevent excessive animation restarts
    window.addEventListener('resize', debounce(resizeCanvas, 250));

    function initAnimation() {
        cols = Math.floor(canvas.width / cellSize);
        rows = Math.floor(canvas.height / cellSize);
        grid = new Array(cols).fill(0);
        grid[Math.floor(cols / 2)] = 1; // Start with center cell
        currentRow = 0;
    }

    // Multiple cellular automata rules (same as background)
    const headerRules = {
        30: [0, 1, 1, 1, 1, 0, 0, 0],   // Chaotic
        90: [0, 1, 0, 1, 1, 0, 1, 0],   // Fractal 
        110: [0, 1, 1, 1, 0, 1, 1, 0],  // Complex
        54: [0, 1, 1, 0, 1, 1, 0, 0],   // Symmetric
        150: [1, 0, 1, 0, 0, 1, 0, 1],  // XOR
        126: [0, 1, 1, 1, 1, 1, 1, 0]   // Dense
    };

    const headerRuleKeys = Object.keys(headerRules);
    let headerRuleIndex = Math.floor(Math.random() * headerRuleKeys.length); // Start with random rule
    let headerCurrentRule = headerRules[headerRuleKeys[headerRuleIndex]];
    headerRuleName = headerRuleKeys[headerRuleIndex]; // Update global variable

    // Apply current cellular automata rule
    function applyHeaderRule(left, center, right) {
        const pattern = left * 4 + center * 2 + right;
        return headerCurrentRule[pattern];
    }

    // Cycle to next rule (randomized)
    function cycleHeaderRule() {
        // Choose a random rule that's different from current one
        let newRuleIndex;
        do {
            newRuleIndex = Math.floor(Math.random() * headerRuleKeys.length);
        } while (newRuleIndex === headerRuleIndex && headerRuleKeys.length > 1);

        headerRuleIndex = newRuleIndex;
        headerCurrentRule = headerRules[headerRuleKeys[headerRuleIndex]];
        headerRuleName = headerRuleKeys[headerRuleIndex];
        console.log(`Header: Switching to Rule ${headerRuleName}`);

        // Update header rule indicator
        updateHeaderRuleIndicator();

        // Reset animation for new rule
        initAnimation();
        drawnRows.length = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    const drawnRows = [];

    function drawHeaderCellularAutomata() {
        // Update global fade
        globalAlpha += fadeDirection * 0.01;
        if (globalAlpha >= 0.6) {
            fadeDirection = -1;
        } else if (globalAlpha <= 0.2) {
            fadeDirection = 1;
        }

        // Only clear if starting over
        if (currentRow === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawnRows.length = 0;
        }

        // Store current row
        drawnRows[currentRow] = [...grid];

        // Draw all stored rows
        for (let row = 0; row < drawnRows.length; row++) {
            for (let col = 0; col < cols; col++) {
                if (drawnRows[row] && drawnRows[row][col] === 1) {
                    // Create gradient effect based on position and age
                    const distance = Math.sqrt(
                        Math.pow(col - cols / 2, 2) + Math.pow(row - currentRow / 2, 2)
                    );
                    const maxDistance = Math.sqrt(cols * cols / 4 + rows * rows / 4);
                    const intensity = Math.max(0.3, 1 - distance / maxDistance);

                    // Age effect - older rows fade
                    const age = currentRow - row;
                    const ageFactor = Math.max(0.2, 1 - age / (rows * 0.4));

                    // Golden pattern with breathing effect
                    const alpha = intensity * ageFactor * globalAlpha;
                    const red = Math.floor(212 * intensity * ageFactor);
                    const green = Math.floor(175 * intensity * ageFactor);
                    const blue = Math.floor(55 * intensity * ageFactor);

                    ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
                    ctx.fillRect(col * cellSize, row * cellSize, cellSize - 0.5, cellSize - 0.5);
                }
            }
        }

        // Calculate next generation for header
        if (currentRow < rows - 1) {
            const newGrid = new Array(cols).fill(0);
            for (let i = 0; i < cols; i++) {
                const left = grid[i - 1] || 0;
                const center = grid[i];
                const right = grid[i + 1] || 0;
                newGrid[i] = applyHeaderRule(left, center, right);
            }
            grid = newGrid;
            currentRow++;
        } else {
            // Cycle to next rule and restart
            setTimeout(() => {
                cycleHeaderRule();
            }, 1800);
        }
    }

    // Initialize header rule indicator
    updateHeaderRuleIndicator();

    // Initialize
    initAnimation();

    // Animate faster for header effect
    setInterval(drawHeaderCellularAutomata, 150);
}

// Rule indicator update functions
function updateBackgroundRuleIndicator() {
    const bgRuleText = document.getElementById('bg-rule-text');
    if (bgRuleText) {
        const bgText = translations[currentLanguage]['rule-bg'] || 'BG';
        const ruleText = translations[currentLanguage]['rule'] || 'Rule';
        bgRuleText.textContent = `${bgText}: ${ruleText} 30`;
    }
}

function updateHeaderRuleIndicator() {
    const headerRuleText = document.getElementById('header-rule-text');
    if (headerRuleText) {
        const headerText = translations[currentLanguage]['rule-header'] || 'Header';
        const ruleText = translations[currentLanguage]['rule'] || 'Rule';
        headerRuleText.textContent = `${headerText}: ${ruleText} ${headerRuleName}`;
    }
}

function updateRuleIndicators() {
    updateBackgroundRuleIndicator();
    updateHeaderRuleIndicator();
}

// Global variables for cellular automata
let headerRuleName = '110'; // Default value

// Language System
let currentLanguage = localStorage.getItem('nks-language') || 'zh';

const translations = {
    en: {
        author: 'Stephen Wolfram',
        title: 'A New Kind of Science',
        subtitle: 'Personal notes and annotations',
        outline: 'Outline',
        annotations: 'Annotations',
        'annotation-placeholder': 'Click on any highlighted link in the notes to view detailed annotations and additional context.',
        'chapter1': 'Chapter 1: The Foundations for a New Kind of Science',
        'chapter2': 'Chapter 2: The Crucial Experiment',
        'chapter3': 'Chapter 3: The World of Simple Programs',
        'chapter4': 'Chapter 4: Systems Based on Numbers',
        'chapter5': 'Chapter 5: Two Dimensions and Beyond',
        'chapter6': 'Chapter 6: Starting from Randomness',
        'chapter7': 'Chapter 7: Mechanisms in Programs and Nature',
        'chapter8': 'Chapter 8: Implications for Everyday Systems',
        'chapter9': 'Chapter 9: Fundamental Physics',
        'chapter10': 'Chapter 10: Processes of Perception and Analysis',
        'chapter11': 'Chapter 11: The Notion of Computation',
        'chapter12': 'Chapter 12: The Principle of Computational Equivalence',
        'loading': 'Loading chapter content...',
        'rule-bg': 'BG',
        'rule-header': 'Header',
        'rule': 'Rule'
    },
    zh: {
        author: '斯蒂芬·沃尔夫拉姆',
        title: '一种新的科学',
        subtitle: '个人笔记和注释',
        outline: '大纲',
        annotations: '注释',
        'annotation-placeholder': '点击笔记中任何高亮链接以查看详细注释和额外内容。',
        'chapter1': '第1章：新科学的基础',
        'chapter2': '第2章：关键实验',
        'chapter3': '第3章：简单程序的世界',
        'chapter4': '第4章：基于数字的系统',
        'chapter5': '第5章：二维及更高维度',
        'chapter6': '第6章：从随机性开始',
        'chapter7': '第7章：程序和自然界的机制',
        'chapter8': '第8章：对日常系统的影响',
        'chapter9': '第9章：基础物理学',
        'chapter10': '第10章：感知和分析过程',
        'chapter11': '第11章：计算的概念',
        'chapter12': '第12章：计算等价性原理',
        'loading': '正在加载章节内容...',
        'rule-bg': '背景',
        'rule-header': '标题',
        'rule': '元胞自动机：规则'
    }
};

function initLanguageSystem() {
    const languageBtn = document.getElementById('language-btn');

    // currentLanguage is already initialized from localStorage at top level
    updateLanguageButton();

    languageBtn.addEventListener('click', function () {
        currentLanguage = currentLanguage === 'en' ? 'zh' : 'en';
        localStorage.setItem('nks-language', currentLanguage);
        updateLanguageButton();
        updatePageLanguage();

        // Update annotation content to show correct language
        clearAnnotationContent();

        // Update rule indicators to show correct language
        updateRuleIndicators();

        // Reload current chapter with new language
        const activeChapter = document.querySelector('.chapter-link.active');
        if (activeChapter) {
            const chapterId = activeChapter.getAttribute('data-chapter');
            loadChapter(chapterId);
        }
    });

    // Initialize with current language
    updatePageLanguage();
    updateRuleIndicators();
}

function updateLanguageButton() {
    const langText = document.querySelector('.lang-text');
    langText.textContent = currentLanguage === 'en' ? '中文' : 'EN';
}

function updatePageLanguage() {
    const elements = document.querySelectorAll('[data-i18n]');

    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });

    // Update chapter links text
    updateChapterLinks();
}

function updateChapterLinks() {
    const chapterLinks = document.querySelectorAll('.chapter-link');
    chapterLinks.forEach(link => {
        const chapterKey = link.getAttribute('data-chapter');
        if (translations[currentLanguage] && translations[currentLanguage][chapterKey]) {
            link.textContent = translations[currentLanguage][chapterKey];
        }
    });
}