document.addEventListener('DOMContentLoaded', function () {
    initMarkdownRenderer();
    initLanguageSystem();  // Initialize language first
    initChapterNavigation();
    initAnnotationSystem();
    initAnnotationContent();
    initScrollToTop();

    // Load preface by default
    loadChapter('preface');
});

// Cache for loaded annotations
const annotationCache = {};


// Custom incremental typing that doesn't reset innerHTML
class IncrementalTyper {
    constructor(element, content, options = {}) {
        this.element = element;
        this.content = content;
        this.typeSpeed = options.typeSpeed || 10;
        this.onComplete = options.onComplete || (() => {});
        this.currentIndex = 0;
        this.isTyping = false;
        
        // Parse HTML into tokens for incremental building
        this.tokens = this.parseHTML(content);
        this.currentTokenIndex = 0;
        this.currentCharIndex = 0;
        
        console.log('🔤 Parsed content into', this.tokens.length, 'tokens');
    }
    
    parseHTML(html) {
        const tokens = [];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        this.extractTokens(tempDiv.childNodes, tokens);
        return tokens;
    }
    
    extractTokens(nodes, tokens) {
        for (let node of nodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                // Split text into individual characters for typing
                const text = node.textContent;
                for (let char of text) {
                    tokens.push({ type: 'char', content: char });
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName.toLowerCase() === 'img') {
                    // Insert complete image element at once
                    tokens.push({ type: 'element', element: node.cloneNode(true) });
                } else {
                    // For other elements, open tag, content, close tag
                    tokens.push({ type: 'open_tag', element: node.cloneNode(false) });
                    this.extractTokens(node.childNodes, tokens);
                    tokens.push({ type: 'close_tag', tagName: node.tagName.toLowerCase() });
                }
            }
        }
    }
    
    start() {
        if (this.isTyping) return;
        this.isTyping = true;
        this.element.innerHTML = ''; // Clear only once at start
        this.currentStack = [this.element]; // Stack to track current parent element
        
        // Add cursor
        this.cursor = document.createElement('span');
        this.cursor.textContent = '|';
        this.cursor.className = 'typed-cursor';
        this.cursor.style.cssText = 'font-weight: 100; color: inherit; animation: typedjsBlink 0.7s infinite;';
        this.element.appendChild(this.cursor);
        
        this.typeNextToken();
    }
    
    typeNextToken() {
        if (this.currentTokenIndex >= this.tokens.length) {
            // Typing complete - remove cursor
            if (this.cursor && this.cursor.parentNode) {
                this.cursor.parentNode.removeChild(this.cursor);
            }
            this.isTyping = false;
            console.log('✅ Incremental typing completed');
            this.onComplete();
            return;
        }
        
        const token = this.tokens[this.currentTokenIndex];
        const currentParent = this.currentStack[this.currentStack.length - 1];
        
        // Insert before cursor if it exists
        const insertBefore = (element) => {
            if (this.cursor && this.cursor.parentNode === currentParent) {
                currentParent.insertBefore(element, this.cursor);
            } else {
                currentParent.appendChild(element);
            }
        };
        
        switch (token.type) {
            case 'char':
                // Append character to current parent
                const textNode = document.createTextNode(token.content);
                insertBefore(textNode);
                break;
                
            case 'element':
                // Insert complete element (like img) at once
                console.log('🖼️ Inserting complete element:', token.element.tagName);
                insertBefore(token.element);
                break;
                
            case 'open_tag':
                // Create and append opening element
                const newElement = token.element.cloneNode(false);
                insertBefore(newElement);
                this.currentStack.push(newElement);
                break;
                
            case 'close_tag':
                // Pop from stack (close current element)
                this.currentStack.pop();
                break;
        }
        
        this.currentTokenIndex++;
        
        // Continue typing after delay (except for complete elements)
        const delay = token.type === 'element' ? 0 : this.typeSpeed;
        setTimeout(() => this.typeNextToken(), delay);
    }
    
    destroy() {
        this.isTyping = false;
        // Remove cursor if it exists
        if (this.cursor && this.cursor.parentNode) {
            this.cursor.parentNode.removeChild(this.cursor);
        }
    }
}

// Start incremental typing
function startIncrementalTyping(elementId, content, options = {}) {
    const element = document.getElementById(elementId);
    if (!element) return null;
    
    const typer = new IncrementalTyper(element, content, options);
    typer.start();
    return typer;
}


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

        // Handle special demo pages
        if (chapterId === 'intro-demo') {
            const filePath = currentLanguage === 'zh' ? 'chapters/zh/intro-demo.md' : 'chapters/intro-demo.md';
            const response = await fetch(filePath);
            
            if (!response.ok) {
                throw new Error(`Demo file not found: ${filePath}`);
            }

            const markdownContent = await response.text();
            
            // Process the content as markdown to get proper formatting
            const processedMarkdown = processAnnotationLinksInMarkdown(markdownContent);
            const parsedContent = marked.parse(processedMarkdown);
            
            // Display the content
            notesContent.innerHTML = parsedContent;
            
            // Initialize Game of Life if the required elements exist
            setTimeout(() => {
                if (document.getElementById('game-canvas')) {
                    initGameOfLife();
                }
            }, 200);
            
            return;
        }

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

// Check if device should use inline annotations (stacked layout)
function shouldUseInlineAnnotations() {
    return window.innerWidth <= 768;
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
    // Check if we should use inline annotation for mobile phones or desktop sidebar
    if (shouldUseInlineAnnotations()) {
        await showInlineAnnotation(key, clickedElement);
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

        // Use custom incremental typing
        // Start checking for links during typing
        startLinkMonitoring();
        
        // Use incremental typing that doesn't reset innerHTML
        currentTyped = startIncrementalTyping('typewriter-text', annotation.content, {
            typeSpeed: 10,
            onComplete: function () {
                // Stop monitoring
                stopLinkMonitoring();
                enableAnnotationLinks();
            }
        });
    } else {
        annotationContent.innerHTML = `
            <h3>Annotation Not Found</h3>
            <p class="placeholder">The annotation "${key}" could not be loaded. Make sure the file "annotations/${key}.md" exists.</p>
        `;
    }
}

async function showInlineAnnotation(key, clickedElement) {
    if (!clickedElement) return;

    // Remove any existing inline annotations
    const existingAnnotations = document.querySelectorAll('.inline-annotation');
    existingAnnotations.forEach(annotation => {
        annotation.remove();
    });

    // Destroy any existing Typed instance
    if (currentTyped) {
        currentTyped.destroy();
        currentTyped = null;
    }

    // Create the inline annotation element
    const inlineAnnotation = document.createElement('div');
    inlineAnnotation.className = 'inline-annotation';
    inlineAnnotation.setAttribute('data-annotation-key', key);

    // Create initial structure with loading state
    inlineAnnotation.innerHTML = `
        <div class="inline-annotation-header">
            <div class="inline-annotation-title">Loading...</div>
            <button class="inline-annotation-toggle" title="Collapse">−</button>
        </div>
        <div class="inline-annotation-content">
            <div class="loading">Loading annotation...</div>
        </div>
    `;

    // Insert the annotation after the paragraph containing the clicked element
    const paragraph = clickedElement.closest('p, li, div, h1, h2, h3, h4, h5, h6');
    if (paragraph && paragraph.parentNode) {
        paragraph.parentNode.insertBefore(inlineAnnotation, paragraph.nextSibling);
    } else {
        // Fallback: insert after the clicked element's parent
        clickedElement.parentNode.insertBefore(inlineAnnotation, clickedElement.parentNode.nextSibling);
    }

    // Load the annotation content
    const annotation = await loadAnnotation(key);

    // Update the annotation with loaded content
    const titleElement = inlineAnnotation.querySelector('.inline-annotation-title');
    const contentElement = inlineAnnotation.querySelector('.inline-annotation-content');
    const toggleBtn = inlineAnnotation.querySelector('.inline-annotation-toggle');

    if (annotation) {
        // Set title
        titleElement.textContent = annotation.title;

        // Create the structure for content
        contentElement.innerHTML = `
            <div class="annotation-text">
                <span id="inline-typewriter-text-${key}"></span>
            </div>
        `;

        // Use custom incremental typing
        // Start checking for links during typing
        startLinkMonitoring(`#inline-typewriter-text-${key}`);
        
        // Use incremental typing that doesn't reset innerHTML
        currentTyped = startIncrementalTyping(`inline-typewriter-text-${key}`, annotation.content, {
            typeSpeed: 10,
            onComplete: function () {
                // Stop monitoring
                stopLinkMonitoring();
                enableInlineAnnotationLinks(key);
            }
        });
    } else {
        titleElement.textContent = 'Annotation Not Found';
        contentElement.innerHTML = `
            <p class="placeholder">The annotation "${key}" could not be loaded.</p>
        `;
    }

    // Add collapse/expand functionality
    toggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const content = inlineAnnotation.querySelector('.inline-annotation-content');
        const isCollapsed = content.style.display === 'none';
        
        if (isCollapsed) {
            content.style.display = 'block';
            toggleBtn.textContent = '−';
            toggleBtn.title = 'Collapse';
        } else {
            content.style.display = 'none';
            toggleBtn.textContent = '+';
            toggleBtn.title = 'Expand';
        }
    });

    // Scroll the annotation into view smoothly
    setTimeout(() => {
        inlineAnnotation.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });
    }, 100);
}

function enableAnnotationLinks() {
    // Enable all links within the annotation text
    const annotationLinks = document.querySelectorAll('#typewriter-text a');
    annotationLinks.forEach(link => {
        link.style.pointerEvents = 'auto';
        link.style.cursor = 'pointer';
    });
}

function enableInlineAnnotationLinks(key) {
    // Enable all links within the inline annotation text
    const annotationLinks = document.querySelectorAll(`#inline-typewriter-text-${key} a`);
    annotationLinks.forEach(link => {
        link.style.pointerEvents = 'auto';
        link.style.cursor = 'pointer';
    });
}

function startLinkMonitoring(selector = '#typewriter-text') {
    // Clear any existing interval
    if (linkCheckInterval) {
        clearInterval(linkCheckInterval);
    }
    
    // Check for new links every 50ms during typing
    linkCheckInterval = setInterval(() => {
        if (selector.includes('inline-typewriter-text-')) {
            const key = selector.replace('#inline-typewriter-text-', '');
            enableInlineAnnotationLinks(key);
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

    // Remove any existing inline annotations
    const existingAnnotations = document.querySelectorAll('.inline-annotation');
    existingAnnotations.forEach(annotation => {
        annotation.remove();
    });

    // Remove active class from all annotation links
    document.querySelectorAll('.annotation-link').forEach(link => {
        link.classList.remove('active');
    });
}

// Initialize annotation content on page load
function initAnnotationContent() {
    clearAnnotationContent();
}

// Initialize scroll-to-top functionality
function initScrollToTop() {
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    
    if (!scrollToTopBtn) return;

    // Show/hide button based on scroll position
    function toggleScrollToTopButton() {
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const showThreshold = 300; // Show button after scrolling 300px
        
        if (scrollY > showThreshold) {
            scrollToTopBtn.classList.remove('hidden');
        } else {
            scrollToTopBtn.classList.add('hidden');
        }
    }

    // Smooth scroll to top function
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Add scroll event listener with throttling
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(toggleScrollToTopButton, 10);
    });

    // Add click event listener
    scrollToTopBtn.addEventListener('click', function(e) {
        e.preventDefault();
        scrollToTop();
    });

    // Initial check
    toggleScrollToTopButton();
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
        'rule': 'Rule',
        'intro-demo': 'Interactive Demo: Conway\'s Game of Life',
        'play': '▶ Play',
        'pause': '⏸ Pause'
    },
    zh: {
        preface: '前言',
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
        'rule': '元胞自动机：规则',
        'intro-demo': '交互演示：康威的生命游戏',
        'play': '▶ 播放',
        'pause': '⏸ 暂停'
    }
};

// Game of Life implementation
function initGameOfLife() {
    if (window.gameOfLifeInstance) {
        window.gameOfLifeInstance.cleanup();
        window.gameOfLifeInstance = null;
    }
    
    window.gameOfLifeInstance = new window.GameOfLife('game-canvas');
}

// Define GameOfLife class only if not already defined
if (!window.GameOfLife) {
    window.GameOfLife = class GameOfLife {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Game of Life canvas not found:', canvasId);
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 40;
        this.cellSize = 0;
        this.grid = [];
        this.nextGrid = [];
        this.isPlaying = false;
        this.interval = null;
        this.speed = 600; // Default speed for slider value 5
        
        this.setupCanvas();
        this.initializeGrid();
        this.setupEventListeners();
        this.setInitialActiveButton();
        this.draw();
    }
    
    setupCanvas() {
        this.canvas.width = 600;
        this.canvas.height = 400;
        this.cellSize = Math.min(this.canvas.width / this.gridSize, this.canvas.height / this.gridSize);
        
        // Center the grid
        this.offsetX = (this.canvas.width - this.gridSize * this.cellSize) / 2;
        this.offsetY = (this.canvas.height - this.gridSize * this.cellSize) / 2;
    }
    
    initializeGrid() {
        this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));
        this.nextGrid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));
    }
    
    setInitialActiveButton() {
        // Set the correct initial active button for the default grid size (40)
        document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
        const initialBtn = document.getElementById('grid-small');
        if (initialBtn) initialBtn.classList.add('active');
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        const playBtn = document.getElementById('play-pause-btn');
        const stepBtn = document.getElementById('step-btn');
        const clearBtn = document.getElementById('clear-btn');
        const randomBtn = document.getElementById('random-btn');
        const speedSlider = document.getElementById('speed-slider');
        const speedDisplay = document.getElementById('speed-display');
        
        if (playBtn) playBtn.addEventListener('click', () => this.togglePlay());
        if (stepBtn) stepBtn.addEventListener('click', () => this.step());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clear());
        if (randomBtn) randomBtn.addEventListener('click', () => this.randomize());
        
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                const sliderValue = parseInt(e.target.value);
                // Convert slider value (1-10) to speed (1000ms-100ms)
                // Higher slider value = faster animation = lower delay
                this.speed = 1100 - (sliderValue * 100);
                
                // Display as speed multiplier (5 = 1x baseline)
                const speedMultiplier = sliderValue / 5;
                if (speedDisplay) speedDisplay.textContent = speedMultiplier + 'x';
                
                if (this.isPlaying) {
                    this.stop();
                    this.play();
                }
            });
        }
        
        const gridSmallest = document.getElementById('grid-smallest');
        const gridSmall = document.getElementById('grid-small');
        const gridMedium = document.getElementById('grid-medium');
        const gridLarge = document.getElementById('grid-large');
        
        if (gridSmallest) gridSmallest.addEventListener('click', () => this.setGridSize(20));
        if (gridSmall) gridSmall.addEventListener('click', () => this.setGridSize(40));
        if (gridMedium) gridMedium.addEventListener('click', () => this.setGridSize(100));
        if (gridLarge) gridLarge.addEventListener('click', () => this.setGridSize(300));
        
        document.querySelectorAll('.pattern-btn').forEach(btn => {
            btn.addEventListener('click', () => this.loadPattern(btn.dataset.pattern));
        });
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - this.offsetX;
        const y = e.clientY - rect.top - this.offsetY;
        
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        if (col >= 0 && col < this.gridSize && row >= 0 && row < this.gridSize) {
            this.grid[row][col] = !this.grid[row][col];
            this.draw();
        }
    }
    
    togglePlay() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.play();
        }
    }
    
    play() {
        this.isPlaying = true;
        const playBtn = document.getElementById('play-pause-btn');
        if (playBtn) {
            const pauseText = translations[currentLanguage] ? translations[currentLanguage]['pause'] : '⏸ Pause';
            playBtn.textContent = pauseText;
        }
        this.interval = setInterval(() => this.step(), this.speed);
    }
    
    stop() {
        this.isPlaying = false;
        const playBtn = document.getElementById('play-pause-btn');
        if (playBtn) {
            const playText = translations[currentLanguage] ? translations[currentLanguage]['play'] : '▶ Play';
            playBtn.textContent = playText;
        }
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    
    step() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const neighbors = this.countNeighbors(row, col);
                const isAlive = this.grid[row][col];
                
                if (isAlive) {
                    this.nextGrid[row][col] = neighbors === 2 || neighbors === 3;
                } else {
                    this.nextGrid[row][col] = neighbors === 3;
                }
            }
        }
        
        [this.grid, this.nextGrid] = [this.nextGrid, this.grid];
        this.draw();
    }
    
    countNeighbors(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                
                const newRow = row + i;
                const newCol = col + j;
                
                if (newRow >= 0 && newRow < this.gridSize && 
                    newCol >= 0 && newCol < this.gridSize && 
                    this.grid[newRow][newCol]) {
                    count++;
                }
            }
        }
        return count;
    }
    
    clear() {
        this.stop();
        this.initializeGrid();
        this.draw();
    }
    
    randomize() {
        this.stop();
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col] = Math.random() < 0.3;
            }
        }
        this.draw();
    }
    
    setGridSize(size) {
        this.stop();
        this.gridSize = size;
        this.cellSize = Math.min(this.canvas.width / this.gridSize, this.canvas.height / this.gridSize);
        this.offsetX = (this.canvas.width - this.gridSize * this.cellSize) / 2;
        this.offsetY = (this.canvas.height - this.gridSize * this.cellSize) / 2;
        
        document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
        if (size === 20) {
            const btn = document.getElementById('grid-smallest');
            if (btn) btn.classList.add('active');
        } else if (size === 40) {
            const btn = document.getElementById('grid-small');
            if (btn) btn.classList.add('active');
        } else if (size === 100) {
            const btn = document.getElementById('grid-medium');
            if (btn) btn.classList.add('active');
        } else if (size === 300) {
            const btn = document.getElementById('grid-large');
            if (btn) btn.classList.add('active');
        }
        
        this.initializeGrid();
        this.draw();
    }
    
    loadPattern(pattern) {
        this.clear();
        const centerRow = Math.floor(this.gridSize / 2);
        const centerCol = Math.floor(this.gridSize / 2);
        
        const patterns = {
            glider: [[0,1,0], [0,0,1], [1,1,1]],
            blinker: [[1], [1], [1]],
            toad: [[0,1,1,1], [1,1,1,0]],
            beacon: [[1,1,0,0], [1,1,0,0], [0,0,1,1], [0,0,1,1]],
            pulsar: [
                [0,0,1,1,1,0,0,0,1,1,1,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,0],
                [1,0,0,0,0,1,0,1,0,0,0,0,1],
                [1,0,0,0,0,1,0,1,0,0,0,0,1],
                [1,0,0,0,0,1,0,1,0,0,0,0,1],
                [0,0,1,1,1,0,0,0,1,1,1,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,1,1,1,0,0,0,1,1,1,0,0],
                [1,0,0,0,0,1,0,1,0,0,0,0,1],
                [1,0,0,0,0,1,0,1,0,0,0,0,1],
                [1,0,0,0,0,1,0,1,0,0,0,0,1],
                [0,0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,1,1,1,0,0,0,1,1,1,0,0]
            ],
            'lightweight-spaceship': [
                [1,0,0,1,0],
                [0,0,0,0,1],
                [1,0,0,0,1],
                [0,1,1,1,1]
            ],
            'gosper-gun': [
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
                [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            ],
            pentadecathlon: [
                [0,0,1,0,0,0,0,1,0,0],
                [1,1,0,1,1,1,1,0,1,1],
                [0,0,1,0,0,0,0,1,0,0]
            ],
            acorn: [
                [0,1,0,0,0,0,0],
                [0,0,0,1,0,0,0],
                [1,1,0,0,1,1,1]
            ],
            diehard: [
                [0,0,0,0,0,0,1,0],
                [1,1,0,0,0,0,0,0],
                [0,1,0,0,0,1,1,1]
            ],
            'r-pentomino': [
                [0,1,1],
                [1,1,0],
                [0,1,0]
            ],
            'infinite-growth': [
                [1,1,1,0,1],
                [1,0,0,0,0],
                [0,0,0,1,1],
                [0,1,1,0,1],
                [1,0,1,0,1]
            ]
        };
        
        const patternData = patterns[pattern];
        if (!patternData) return;
        
        const startRow = centerRow - Math.floor(patternData.length / 2);
        const startCol = centerCol - Math.floor(patternData[0].length / 2);
        
        for (let row = 0; row < patternData.length; row++) {
            for (let col = 0; col < patternData[row].length; col++) {
                const gridRow = startRow + row;
                const gridCol = startCol + col;
                
                if (gridRow >= 0 && gridRow < this.gridSize && 
                    gridCol >= 0 && gridCol < this.gridSize) {
                    this.grid[gridRow][gridCol] = patternData[row][col] === 1;
                }
            }
        }
        
        this.draw();
    }
    
    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid lines
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= this.gridSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.offsetX + i * this.cellSize, this.offsetY);
            this.ctx.lineTo(this.offsetX + i * this.cellSize, this.offsetY + this.gridSize * this.cellSize);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.offsetX, this.offsetY + i * this.cellSize);
            this.ctx.lineTo(this.offsetX + this.gridSize * this.cellSize, this.offsetY + i * this.cellSize);
            this.ctx.stroke();
        }
        
        // Draw live cells
        this.ctx.fillStyle = '#ffd700';
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col]) {
                    this.ctx.fillRect(
                        this.offsetX + col * this.cellSize + 1,
                        this.offsetY + row * this.cellSize + 1,
                        this.cellSize - 2,
                        this.cellSize - 2
                    );
                }
            }
        }
    }
    
    cleanup() {
        this.stop();
        if (this.canvas) {
            // Remove event listeners to prevent memory leaks
            const newCanvas = this.canvas.cloneNode(true);
            this.canvas.parentNode.replaceChild(newCanvas, this.canvas);
        }
    }
    };
}

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