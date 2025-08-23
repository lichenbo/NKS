document.addEventListener('DOMContentLoaded', function () {
    initMarkdownRenderer();
    initLanguageSystem();  // Initialize language first
    initChapterNavigation();
    initAnnotationSystem();
    initAnnotationContent();
    initScrollToTop();
    initChatbot();  // Initialize chatbot

    // Load preface by default
    loadChapter('preface');
});

// Cache for loaded annotations
const annotationCache = {};

// Utility: Unified language file loader with fallback system
async function loadLanguageFile(basePath, fileName, language = null) {
    const lang = language || currentLanguage;
    
    try {
        let response;
        if (lang === 'zh') {
            response = await fetch(`${basePath}/zh/${fileName}`);
            if (!response.ok) {
                response = await fetch(`${basePath}/${fileName}`);
            }
        } else if (lang === 'ja') {
            response = await fetch(`${basePath}/ja/${fileName}`);
            if (!response.ok) {
                // Japanese fallback: Chinese -> English
                response = await fetch(`${basePath}/zh/${fileName}`);
                if (!response.ok) {
                    response = await fetch(`${basePath}/${fileName}`);
                }
            }
        } else {
            response = await fetch(`${basePath}/${fileName}`);
        }
        
        if (!response.ok) {
            throw new Error(`File not found: ${fileName}`);
        }
        
        return await response.text();
    } catch (error) {
        console.error('Error loading language file:', error);
        return null;
    }
}

// DOM Utility Functions - reduce repeated queries
const DOM = {
    byId: (id) => document.getElementById(id),
    query: (selector) => document.querySelector(selector),
    queryAll: (selector) => document.querySelectorAll(selector),
    
    // Common element getters with caching
    _cache: new Map(),
    cached: function(id) {
        if (!this._cache.has(id)) {
            this._cache.set(id, document.getElementById(id));
        }
        return this._cache.get(id);
    },
    
    clearCache: function() {
        this._cache.clear();
    }
};

// Event Handler Utilities - reduce repeated patterns
const Events = {
    // Add click handler to element or elements
    onClick: function(selector, handler, options = {}) {
        const elements = typeof selector === 'string' ? DOM.queryAll(selector) : [selector];
        elements.forEach(el => {
            if (el) {
                el.addEventListener('click', handler, options);
            }
        });
    },
    
    // Add event handler with delegation
    delegate: function(parent, selector, event, handler) {
        const parentEl = typeof parent === 'string' ? DOM.query(parent) : parent;
        if (parentEl) {
            parentEl.addEventListener(event, function(e) {
                if (e.target.matches && e.target.matches(selector)) {
                    handler.call(e.target, e);
                }
            });
        }
    }
};

// Text Processing Utilities - common patterns
const TextUtils = {
    // Process external links to open in new tabs
    processExternalLinks: function(html) {
        return html.replace(/<a href="https?:\/\/[^"]*"/g, function(match) {
            return match + ' target="_blank" rel="noopener noreferrer"';
        });
    },
    
    // Extract title from markdown heading
    extractTitle: function(markdown, fallback = '') {
        const titleMatch = markdown.match(/^#\s+(.+)$/m);
        return titleMatch ? titleMatch[1] : fallback;
    },
    
    // Convert annotation links in markdown
    processAnnotationLinks: function(markdown) {
        return markdown.replace(
            /\[([^\]]+)\]\(annotation:([^)]+)\)/g,
            '<span class="annotation-link" data-annotation="$2">$1</span>'
        );
    }
};

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
    const element = DOM.byId(elementId);
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
    const chapterLinks = DOM.queryAll('.chapter-link');

    chapterLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            // Skip external demo links - let them work normally
            if (this.classList.contains('external-demo-link')) {
                return; // Don't preventDefault, allow normal navigation
            }
            
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
    const notesContent = DOM.byId('notes-content');

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

        // Handle Chapter 1 with layered content (only for Chinese)
        if (chapterId === 'chapter1' && currentLanguage === 'zh') {
            const response = await fetch('chapters/zh/chapter1_layered.md');
            
            if (response.ok) {
                const layeredContent = await response.text();
                const processedMarkdown = processAnnotationLinksInMarkdown(layeredContent);
                const parsedContent = marked.parse(processedMarkdown);
                
                notesContent.innerHTML = parsedContent;
                
                // Initialize layered content functionality
                setTimeout(() => {
                    initLayeredContentSystem();
                }, 200);
                
                return;
            } else {
                console.warn(`Chinese layered version not found, falling back to regular chapter1.md`);
            }
        }

        // Use unified language file loader
        const markdownText = await loadLanguageFile('chapters', `${chapterId}.md`);
        if (!markdownText) {
            throw new Error(`Chapter file not found: ${chapterId}.md`);
        }

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
    return TextUtils.processAnnotationLinks(markdown);
}

// Removed unused processAnnotationLinks function - functionality is handled by processAnnotationLinksInMarkdown

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
        // Use unified language file loader
        const markdownText = await loadLanguageFile('annotations', `${key}.md`);
        if (!markdownText) {
            throw new Error(`Annotation file not found: ${key}.md`);
        }
        let htmlContent = marked.parse(markdownText);
        
        // Process external links to open in new tab
        htmlContent = TextUtils.processExternalLinks(htmlContent);

        // Extract title from the first heading
        const title = TextUtils.extractTitle(markdownText, key.replace('-', ' '));

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
    const annotationContent = DOM.byId('annotation-content');

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
    const existingAnnotations = DOM.queryAll('.inline-annotation');
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
    const existingAnnotations = DOM.queryAll('.inline-annotation');
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
    const scrollToTopBtn = DOM.byId('scroll-to-top');
    
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

// Base class for cellular automata canvas animations
class CellularAutomataCanvas {
    constructor(canvasId, cellSize, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return null;
        
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = cellSize;
        this.cols = 0;
        this.rows = 0;
        this.grid = [];
        this.currentRow = 0;
        this.animationInterval = null;
        
        // Options
        this.animationSpeed = options.animationSpeed || 200;
        this.resizeDebounce = options.resizeDebounce || 250;
        this.parentElement = options.parentElement || null;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupResizeListener();
        this.initAnimation();
    }
    
    setupCanvas() {
        if (this.parentElement) {
            // Use parent element dimensions (for header)
            const parent = this.canvas.parentElement;
            this.canvas.width = parent.clientWidth;
            this.canvas.height = parent.clientHeight;
        } else {
            // Use window dimensions (for background)
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
        this.ctx.imageSmoothingEnabled = false;
    }
    
    setupResizeListener() {
        const resizeHandler = () => {
            // Skip resize during mobile scrolling to prevent animation restarts
            if (isMobile() && isScrolling) return;
            
            const newWidth = this.parentElement ? 
                this.canvas.parentElement.clientWidth : window.innerWidth;
            const newHeight = this.parentElement ?
                this.canvas.parentElement.clientHeight : window.innerHeight;
            
            // Only resize if dimensions changed significantly
            const widthDiff = Math.abs(this.canvas.width - newWidth);
            const heightDiff = Math.abs(this.canvas.height - newHeight);
            const threshold = this.parentElement ? 20 : 50;
            
            if (widthDiff > threshold || heightDiff > threshold) {
                this.setupCanvas();
                this.initAnimation();
            }
        };
        
        window.addEventListener('resize', debounce(resizeHandler, this.resizeDebounce));
    }
    
    initAnimation() {
        this.cols = Math.floor(this.canvas.width / this.cellSize);
        this.rows = Math.floor(this.canvas.height / this.cellSize);
        this.grid = new Array(this.cols).fill(0);
        this.grid[Math.floor(this.cols / 2)] = 1; // Start with center cell
        this.currentRow = 0;
    }
    
    startAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
        }
        this.animationInterval = setInterval(() => this.animate(), this.animationSpeed);
    }
    
    stopAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
    }
    
    // Override this method in subclasses
    animate() {
        console.warn('animate() method should be overridden in subclass');
    }
    
    // Override this method in subclasses  
    applyRule(left, center, right) {
        // Parameters are used by subclasses - suppress unused warning
        void left; void center; void right;
        console.warn('applyRule() method should be overridden in subclass');
        return 0;
    }
}

// Background Cellular Automata - extends base class
class BackgroundCellularAutomata extends CellularAutomataCanvas {
    constructor() {
        super('cellular-automata-bg', 3, { animationSpeed: 200 });
        if (!this.canvas) return;
        
        // Background uses only Rule 30 (static)
        this.rule30 = [0, 1, 1, 1, 1, 0, 0, 0];
        this.drawnRows = [];
        
        // Initialize background rule indicator
        updateBackgroundRuleIndicator();
        
        // Start animation
        this.startAnimation();
    }
    
    applyRule(left, center, right) {
        const pattern = left * 4 + center * 2 + right;
        return this.rule30[pattern];
    }
    
    animate() {
        // Only clear if starting over
        if (this.currentRow === 0) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawnRows.length = 0;
        }

        // Store current row
        this.drawnRows[this.currentRow] = [...this.grid];

        // Draw all stored rows with golden gradient effect
        for (let row = 0; row < this.drawnRows.length; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.drawnRows[row] && this.drawnRows[row][col] === 1) {
                    // Create gradient effect based on position and age
                    const distance = Math.sqrt(
                        Math.pow(col - this.cols / 2, 2) + Math.pow(row - this.currentRow / 2, 2)
                    );
                    const maxDistance = Math.sqrt(this.cols * this.cols / 4 + this.rows * this.rows / 4);
                    const intensity = Math.max(0.2, 1 - distance / maxDistance);

                    // Age effect - older rows fade
                    const age = this.currentRow - row;
                    const ageFactor = Math.max(0.1, 1 - age / (this.rows * 0.3));

                    // Very subtle golden pattern
                    const alpha = intensity * ageFactor * 0.08;
                    const red = Math.floor(212 * intensity * ageFactor);
                    const green = Math.floor(175 * intensity * ageFactor);
                    const blue = Math.floor(55 * intensity * ageFactor);

                    this.ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
                    this.ctx.fillRect(col * this.cellSize, row * this.cellSize, this.cellSize - 0.5, this.cellSize - 0.5);
                }
            }
        }

        // Calculate next generation
        if (this.currentRow < this.rows - 1) {
            const newGrid = new Array(this.cols).fill(0);
            for (let i = 0; i < this.cols; i++) {
                const left = this.grid[i - 1] || 0;
                const center = this.grid[i];
                const right = this.grid[i + 1] || 0;
                newGrid[i] = this.applyRule(left, center, right);
            }
            this.grid = newGrid;
            this.currentRow++;
        }
        // Background animation stops when complete - pattern stays static
    }
}

// Cellular Automata Background Animation (refactored)
function initCellularAutomataBackground() {
    new BackgroundCellularAutomata();
}

// Header Cellular Automata - extends base class with rule cycling
class HeaderCellularAutomata extends CellularAutomataCanvas {
    constructor() {
        super('header-cellular-automata', 2, { 
            animationSpeed: 150, 
            parentElement: true,
            resizeDebounce: 250 
        });
        if (!this.canvas) return;
        
        // Multiple cellular automata rules
        this.headerRules = {
            30: [0, 1, 1, 1, 1, 0, 0, 0],   // Chaotic
            90: [0, 1, 0, 1, 1, 0, 1, 0],   // Fractal 
            110: [0, 1, 1, 1, 0, 1, 1, 0],  // Complex
            54: [0, 1, 1, 0, 1, 1, 0, 0],   // Symmetric
            150: [1, 0, 1, 0, 0, 1, 0, 1],  // XOR
            126: [0, 1, 1, 1, 1, 1, 1, 0]   // Dense
        };
        
        this.headerRuleKeys = Object.keys(this.headerRules);
        this.headerRuleIndex = Math.floor(Math.random() * this.headerRuleKeys.length);
        this.headerCurrentRule = this.headerRules[this.headerRuleKeys[this.headerRuleIndex]];
        this.drawnRows = [];
        
        // Breathing effect variables
        this.fadeDirection = 1; // 1 for fade in, -1 for fade out
        this.globalAlpha = 0.3;
        
        // Update global rule name for indicator
        headerRuleName = this.headerRuleKeys[this.headerRuleIndex];
        
        // Initialize header rule indicator
        updateHeaderRuleIndicator();
        
        // Start animation
        this.startAnimation();
    }
    
    applyRule(left, center, right) {
        const pattern = left * 4 + center * 2 + right;
        return this.headerCurrentRule[pattern];
    }
    
    cycleToNextRule() {
        // Choose a random rule that's different from current one
        let newRuleIndex;
        do {
            newRuleIndex = Math.floor(Math.random() * this.headerRuleKeys.length);
        } while (newRuleIndex === this.headerRuleIndex && this.headerRuleKeys.length > 1);

        this.headerRuleIndex = newRuleIndex;
        this.headerCurrentRule = this.headerRules[this.headerRuleKeys[this.headerRuleIndex]];
        headerRuleName = this.headerRuleKeys[this.headerRuleIndex]; // Update global variable
        console.log(`Header: Switching to Rule ${headerRuleName}`);

        // Update header rule indicator
        updateHeaderRuleIndicator();

        // Reset animation for new rule
        this.initAnimation();
        this.drawnRows.length = 0;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    animate() {
        // Update global fade (breathing effect)
        this.globalAlpha += this.fadeDirection * 0.01;
        if (this.globalAlpha >= 0.6) {
            this.fadeDirection = -1;
        } else if (this.globalAlpha <= 0.2) {
            this.fadeDirection = 1;
        }

        // Only clear if starting over
        if (this.currentRow === 0) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawnRows.length = 0;
        }

        // Store current row
        this.drawnRows[this.currentRow] = [...this.grid];

        // Draw all stored rows with breathing golden effect
        for (let row = 0; row < this.drawnRows.length; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.drawnRows[row] && this.drawnRows[row][col] === 1) {
                    // Create gradient effect based on position and age
                    const distance = Math.sqrt(
                        Math.pow(col - this.cols / 2, 2) + Math.pow(row - this.currentRow / 2, 2)
                    );
                    const maxDistance = Math.sqrt(this.cols * this.cols / 4 + this.rows * this.rows / 4);
                    const intensity = Math.max(0.3, 1 - distance / maxDistance);

                    // Age effect - older rows fade
                    const age = this.currentRow - row;
                    const ageFactor = Math.max(0.2, 1 - age / (this.rows * 0.4));

                    // Golden pattern with breathing effect
                    const alpha = intensity * ageFactor * this.globalAlpha;
                    const red = Math.floor(212 * intensity * ageFactor);
                    const green = Math.floor(175 * intensity * ageFactor);
                    const blue = Math.floor(55 * intensity * ageFactor);

                    this.ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
                    this.ctx.fillRect(col * this.cellSize, row * this.cellSize, this.cellSize - 0.5, this.cellSize - 0.5);
                }
            }
        }

        // Calculate next generation
        if (this.currentRow < this.rows - 1) {
            const newGrid = new Array(this.cols).fill(0);
            for (let i = 0; i < this.cols; i++) {
                const left = this.grid[i - 1] || 0;
                const center = this.grid[i];
                const right = this.grid[i + 1] || 0;
                newGrid[i] = this.applyRule(left, center, right);
            }
            this.grid = newGrid;
            this.currentRow++;
        } else {
            // Cycle to next rule and restart after delay
            setTimeout(() => {
                this.cycleToNextRule();
            }, 1800);
        }
    }
}

// Header Cellular Automata Animation (refactored)
function initHeaderCellularAutomata() {
    new HeaderCellularAutomata();
}

// Rule indicator update functions (consolidated)
const RuleIndicators = {
    update: function(type, ruleNumber) {
        const elementId = type === 'background' ? 'bg-rule-text' : 'header-rule-text';
        const element = DOM.byId(elementId);
        
        if (element) {
            const typeKey = type === 'background' ? 'rule-bg' : 'rule-header';
            const typeText = translations[currentLanguage][typeKey] || (type === 'background' ? 'BG' : 'Header');
            const ruleText = translations[currentLanguage]['rule'] || 'Rule';
            element.textContent = `${typeText}: ${ruleText} ${ruleNumber}`;
        }
    }
};

function updateBackgroundRuleIndicator() {
    RuleIndicators.update('background', '30');
}

function updateHeaderRuleIndicator() {
    RuleIndicators.update('header', headerRuleName);
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
        'wolfram-demo': '🔬 Interactive Demo: Wolfram Rules Explorer',
        'play': '▶ Play',
        'pause': '⏸ Pause',
        'chatbot-title': 'NKS Assistant',
        'chatbot-welcome': 'Hello! I\'m your NKS Assistant. Ask me anything about Stephen Wolfram\'s "A New Kind of Science" - cellular automata, computational equivalence, emergence, or any concepts from the book!',
        'chatbot-placeholder': 'Ask about cellular automata, Rule 30, complexity...',
        'chatbot-thinking': 'NKS Assistant is thinking...',
        'chatbot-toggle-title': 'Chat with NKS Assistant',
        'chat-quick-placeholder': '💡 Ask about A New Kind of Science...',
        'chat-input-placeholder': 'Continue the conversation...'
    },
    zh: {
        preface: '前言',
        author: '斯蒂芬·沃尔夫拉姆',
        title: '一种新科学',
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
        'wolfram-demo': '🔬 交互演示：Wolfram规则探索器',
        'play': '▶ 播放',
        'pause': '⏸ 暂停',
        'chatbot-title': 'NKS 助手',
        'chatbot-welcome': '您好！我是您的 NKS 助手。请随时询问关于斯蒂芬·沃尔夫拉姆《一种新科学》的任何问题——细胞自动机、计算等价性、涌现或书中的任何概念！',
        'chatbot-placeholder': '询问细胞自动机、规则30、复杂性...',
        'chatbot-thinking': 'NKS 助手正在思考中...',
        'chatbot-toggle-title': '与 NKS 助手聊天',
        'chat-quick-placeholder': '💡 询问《一种新科学》相关问题...',
        'chat-input-placeholder': '继续对话...'
    },
    ja: {
        preface: '序文',
        author: 'スティーブン・ウルフラム',
        title: '新しい科学',
        subtitle: '個人ノートと注釈',
        outline: 'アウトライン',
        annotations: '注釈',
        'annotation-placeholder': 'ノート内のハイライトされたリンクをクリックして、詳細な注釈と追加のコンテキストを表示します。',
        'chapter1': '第1章：新しい科学の基礎',
        'chapter2': '第2章：決定的実験',
        'chapter3': '第3章：シンプルなプログラムの世界',
        'chapter4': '第4章：数値ベースのシステム',
        'chapter5': '第5章：二次元とその先',
        'chapter6': '第6章：ランダム性からの出発',
        'chapter7': '第7章：プログラムと自然界のメカニズム',
        'chapter8': '第8章：日常システムへの影響',
        'chapter9': '第9章：基礎物理学',
        'chapter10': '第10章：知覚と分析のプロセス',
        'chapter11': '第11章：計算の概念',
        'chapter12': '第12章：計算等価性の原理',
        'loading': 'チャプター内容を読み込み中...',
        'rule-bg': 'BG',
        'rule-header': 'ヘッダー',
        'rule': 'ルール',
        'intro-demo': 'インタラクティブデモ：コンウェイのライフゲーム',
        'wolfram-demo': '🔬 インタラクティブデモ：ウルフラムルール探索',
        'play': '▶ プレイ',
        'pause': '⏸ 一時停止',
        'chatbot-title': 'NKS アシスタント',
        'chatbot-welcome': 'こんにちは！私はあなたの NKS アシスタントです。スティーブン・ウルフラムの『新しい科学』について、セルオートマトン、計算等価性、創発、または本のあらゆる概念について何でもお聞きください！',
        'chatbot-placeholder': 'セルオートマトン、ルール30、複雑性について質問...',
        'chatbot-thinking': 'NKS アシスタントが考えています...',
        'chatbot-toggle-title': 'NKS アシスタントとチャット',
        'chat-quick-placeholder': '💡 『新しい科学』について質問...',
        'chat-input-placeholder': '会話を続ける...'
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
        this.gridSize = 20;
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
        // Make canvas responsive to container size
        const rect = this.canvas.getBoundingClientRect();
        const maxWidth = Math.min(600, rect.width || 600);
        const maxHeight = Math.min(400, window.innerWidth <= 768 ? 300 : 400);
        
        this.canvas.width = maxWidth;
        this.canvas.height = maxHeight;
        this.cellSize = Math.min(this.canvas.width / this.gridSize, this.canvas.height / this.gridSize);
        
        // Center the grid
        this.offsetX = (this.canvas.width - this.gridSize * this.cellSize) / 2;
        this.offsetY = (this.canvas.height - this.gridSize * this.cellSize) / 2;
        
        console.log(`Canvas setup: ${this.canvas.width}x${this.canvas.height}, cellSize: ${this.cellSize}, offset: (${this.offsetX}, ${this.offsetY})`);
    }
    
    initializeGrid() {
        this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));
        this.nextGrid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));
        
        // Add engaging starting patterns based on grid size
        if (this.gridSize === 20) {
            // 20x20: Simple patterns for beginners
            // Add a blinker pattern in the center
            const center = Math.floor(this.gridSize / 2);
            this.grid[center-1][center] = true;
            this.grid[center][center] = true;
            this.grid[center+1][center] = true;
            
            // Add a glider in the upper left area
            this.grid[3][4] = true;
            this.grid[4][5] = true;
            this.grid[5][3] = true;
            this.grid[5][4] = true;
            this.grid[5][5] = true;
            
        } else if (this.gridSize === 40) {
            // 40x40: Multiple interacting patterns
            // Add a beacon oscillator
            this.grid[8][8] = true;
            this.grid[8][9] = true;
            this.grid[9][8] = true;
            this.grid[10][11] = true;
            this.grid[11][10] = true;
            this.grid[11][11] = true;
            
            // Add a toad oscillator
            this.grid[15][20] = true;
            this.grid[15][21] = true;
            this.grid[15][22] = true;
            this.grid[16][19] = true;
            this.grid[16][20] = true;
            this.grid[16][21] = true;
            
            // Add two gliders moving toward each other
            // Glider 1 (moving southeast)
            this.grid[5][25] = true;
            this.grid[6][26] = true;
            this.grid[7][24] = true;
            this.grid[7][25] = true;
            this.grid[7][26] = true;
            
            // Glider 2 (moving northwest)
            this.grid[30][15] = true;
            this.grid[30][14] = true;
            this.grid[30][13] = true;
            this.grid[31][15] = true;
            this.grid[32][14] = true;
            
        } else if (this.gridSize === 100) {
            // 100x100: Complex patterns including Gosper Gun
            // Add a simplified Gosper Gun for glider generation
            const gunStartRow = 40;
            const gunStartCol = 20;
            // Left block
            this.grid[gunStartRow][gunStartCol] = true;
            this.grid[gunStartRow][gunStartCol+1] = true;
            this.grid[gunStartRow+1][gunStartCol] = true;
            this.grid[gunStartRow+1][gunStartCol+1] = true;
            
            // Main gun structure (simplified)
            this.grid[gunStartRow][gunStartCol+10] = true;
            this.grid[gunStartRow+1][gunStartCol+10] = true;
            this.grid[gunStartRow+2][gunStartCol+10] = true;
            this.grid[gunStartRow-1][gunStartCol+11] = true;
            this.grid[gunStartRow+3][gunStartCol+11] = true;
            this.grid[gunStartRow-2][gunStartCol+12] = true;
            this.grid[gunStartRow+4][gunStartCol+12] = true;
            this.grid[gunStartRow+1][gunStartCol+13] = true;
            this.grid[gunStartRow-1][gunStartCol+14] = true;
            this.grid[gunStartRow+3][gunStartCol+14] = true;
            this.grid[gunStartRow][gunStartCol+15] = true;
            this.grid[gunStartRow+1][gunStartCol+15] = true;
            this.grid[gunStartRow+2][gunStartCol+15] = true;
            this.grid[gunStartRow+1][gunStartCol+16] = true;
            
            // Right structures
            this.grid[gunStartRow-2][gunStartCol+20] = true;
            this.grid[gunStartRow-1][gunStartCol+20] = true;
            this.grid[gunStartRow][gunStartCol+20] = true;
            this.grid[gunStartRow-2][gunStartCol+21] = true;
            this.grid[gunStartRow-1][gunStartCol+21] = true;
            this.grid[gunStartRow][gunStartCol+21] = true;
            this.grid[gunStartRow-3][gunStartCol+22] = true;
            this.grid[gunStartRow+1][gunStartCol+22] = true;
            this.grid[gunStartRow-4][gunStartCol+24] = true;
            this.grid[gunStartRow-3][gunStartCol+24] = true;
            this.grid[gunStartRow+1][gunStartCol+24] = true;
            this.grid[gunStartRow+2][gunStartCol+24] = true;
            
            // Final block
            this.grid[gunStartRow-1][gunStartCol+34] = true;
            this.grid[gunStartRow][gunStartCol+34] = true;
            this.grid[gunStartRow-1][gunStartCol+35] = true;
            this.grid[gunStartRow][gunStartCol+35] = true;
            
            // Add a pulsar in another area
            const pulsarRow = 70;
            const pulsarCol = 60;
            // Pulsar pattern (13x13)
            const pulsarPattern = [
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
            ];
            for (let row = 0; row < pulsarPattern.length; row++) {
                for (let col = 0; col < pulsarPattern[row].length; col++) {
                    if (pulsarPattern[row][col] === 1) {
                        this.grid[pulsarRow + row][pulsarCol + col] = true;
                    }
                }
            }
            
        } else if (this.gridSize === 300) {
            // 300x300: Large scale patterns and methuselahs
            // Add multiple Gosper guns creating complex interactions
            this.addGosperGun(50, 50);
            this.addGosperGun(200, 50);
            this.addGosperGun(50, 200);
            
            // Add an R-pentomino (famous methuselah)
            const rRow = 150;
            const rCol = 150;
            this.grid[rRow][rCol+1] = true;
            this.grid[rRow][rCol+2] = true;
            this.grid[rRow+1][rCol] = true;
            this.grid[rRow+1][rCol+1] = true;
            this.grid[rRow+2][rCol+1] = true;
            
            // Add an acorn (another methuselah)
            const acornRow = 100;
            const acornCol = 100;
            this.grid[acornRow][acornCol+1] = true;
            this.grid[acornRow+1][acornCol+3] = true;
            this.grid[acornRow+2][acornCol] = true;
            this.grid[acornRow+2][acornCol+1] = true;
            this.grid[acornRow+2][acornCol+4] = true;
            this.grid[acornRow+2][acornCol+5] = true;
            this.grid[acornRow+2][acornCol+6] = true;
            
            // Add a diehard pattern
            const diehardRow = 80;
            const diehardCol = 220;
            this.grid[diehardRow+1][diehardCol] = true;
            this.grid[diehardRow+1][diehardCol+1] = true;
            this.grid[diehardRow+2][diehardCol+1] = true;
            this.grid[diehardRow+2][diehardCol+5] = true;
            this.grid[diehardRow+2][diehardCol+6] = true;
            this.grid[diehardRow+2][diehardCol+7] = true;
            this.grid[diehardRow][diehardCol+6] = true;
        }
    }
    
    // Helper function to add a Gosper gun at specified position
    addGosperGun(startRow, startCol) {
        const gunPattern = [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
            [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
            [1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ];
        
        for (let row = 0; row < gunPattern.length; row++) {
            for (let col = 0; col < gunPattern[row].length; col++) {
                if (gunPattern[row][col] === 1 && 
                    startRow + row < this.gridSize && 
                    startCol + col < this.gridSize) {
                    this.grid[startRow + row][startCol + col] = true;
                }
            }
        }
    }
    
    setInitialActiveButton() {
        // Set the correct initial active button for the default grid size (20)
        document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
        const initialBtn = document.getElementById('grid-smallest');
        if (initialBtn) initialBtn.classList.add('active');
    }
    
    setupEventListeners() {
        // Handle both mouse and touch events
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
        
        // Prevent default touch behavior to avoid scrolling issues
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault());
        this.canvas.addEventListener('touchend', (e) => e.preventDefault());
        
        // Handle window resize and orientation change for mobile
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 100); // Delay to let orientation settle
        });
        
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
            // Set initial display value for default slider position (value=5)
            if (speedDisplay) speedDisplay.textContent = '1.00x';

            speedSlider.addEventListener('input', (e) => {
                const sliderValue = parseInt(e.target.value);
                let speedMultiplier;

                if (sliderValue <= 5) {
                    // Scale from 0.25x to 1.0x for slider values 1-5
                    speedMultiplier = 0.25 + (sliderValue - 1) * 0.1875;
                } else {
                    // Scale from 1.0x to 10.0x for slider values 5-10
                    speedMultiplier = 1.0 + (sliderValue - 5) * 1.8;
                }
                
                // Update speed display
                if (speedDisplay) speedDisplay.textContent = speedMultiplier.toFixed(2) + 'x';

                // Calculate interval delay (1x speed = 600ms)
                this.speed = 600 / speedMultiplier;
                
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
        
        // Account for canvas scaling
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX - this.offsetX;
        const y = (e.clientY - rect.top) * scaleY - this.offsetY;
        
        this.toggleCell(x, y);
    }
    
    handleTouch(e) {
        e.preventDefault(); // Prevent default touch behavior
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0]; // Get first touch point
        
        // Account for canvas scaling and device pixel ratio
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = (touch.clientX - rect.left) * scaleX - this.offsetX;
        const y = (touch.clientY - rect.top) * scaleY - this.offsetY;
        
        // Visual feedback for touch detection
        console.log(`Touch detected: clientX=${touch.clientX}, clientY=${touch.clientY}`);
        console.log(`Canvas rect: left=${rect.left}, top=${rect.top}, width=${rect.width}, height=${rect.height}`);
        console.log(`Scale: X=${scaleX.toFixed(2)}, Y=${scaleY.toFixed(2)}`);
        
        this.toggleCell(x, y);
    }
    
    toggleCell(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        // Debug logging for mobile testing
        console.log(`Touch/Click at pixel (${x.toFixed(1)}, ${y.toFixed(1)}) -> grid (${col}, ${row})`);
        
        if (col >= 0 && col < this.gridSize && row >= 0 && row < this.gridSize) {
            this.grid[row][col] = !this.grid[row][col];
            this.draw();
            
            // Visual feedback for successful cell toggle
            console.log(`Cell toggled at grid (${col}, ${row}) to ${this.grid[row][col]}`);
        } else {
            console.log(`Touch/Click outside grid bounds`);
        }
    }
    
    handleResize() {
        console.log('Handling resize/orientation change');
        this.setupCanvas();
        this.draw();
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
        // Create completely empty grid (no initial patterns)
        this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));
        this.nextGrid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));
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
        
        // Draw grid lines with adaptive thickness
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = this.gridSize <= 20 ? 1 : 0.5;
        
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
        
        // Draw live cells with better visual feedback for smaller grids
        this.ctx.fillStyle = '#ffd700';
        const cellPadding = this.gridSize <= 20 ? 2 : 1;
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col]) {
                    // Add slight gradient effect for larger cells
                    if (this.gridSize <= 20) {
                        const gradient = this.ctx.createRadialGradient(
                            this.offsetX + col * this.cellSize + this.cellSize/2,
                            this.offsetY + row * this.cellSize + this.cellSize/2,
                            0,
                            this.offsetX + col * this.cellSize + this.cellSize/2,
                            this.offsetY + row * this.cellSize + this.cellSize/2,
                            this.cellSize/2
                        );
                        gradient.addColorStop(0, '#ffdd44');
                        gradient.addColorStop(1, '#daa520');
                        this.ctx.fillStyle = gradient;
                    } else {
                        this.ctx.fillStyle = '#ffd700';
                    }
                    
                    this.ctx.fillRect(
                        this.offsetX + col * this.cellSize + cellPadding,
                        this.offsetY + row * this.cellSize + cellPadding,
                        this.cellSize - cellPadding * 2,
                        this.cellSize - cellPadding * 2
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
    const langOptions = document.querySelectorAll('.lang-option');

    // currentLanguage is already initialized from localStorage at top level
    updateLanguageButtons();

    langOptions.forEach(button => {
        button.addEventListener('click', function () {
            const selectedLang = this.getAttribute('data-lang');
            if (selectedLang !== currentLanguage) {
                currentLanguage = selectedLang;
                localStorage.setItem('nks-language', currentLanguage);
                updateLanguageButtons();
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
            }
        });
    });

    // Initialize with current language
    updatePageLanguage();
    updateRuleIndicators();
}

function updateLanguageButtons() {
    const langOptions = DOM.queryAll('.lang-option');
    
    langOptions.forEach(button => {
        const buttonLang = button.getAttribute('data-lang');
        button.classList.toggle('active', buttonLang === currentLanguage);
    });
}

function updatePageLanguage() {
    const elements = DOM.queryAll('[data-i18n]');
    const currentTranslations = translations[currentLanguage] || {};

    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (currentTranslations[key]) {
            element.textContent = currentTranslations[key];
        }
    });

    // Update placeholder text for inputs
    const placeholderElements = DOM.queryAll('[data-i18n-placeholder]');
    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (currentTranslations[key]) {
            element.placeholder = currentTranslations[key];
        }
    });

    // Update chapter links text
    updateChapterLinks();
}

function updateChapterLinks() {
    const chapterLinks = DOM.queryAll('.chapter-link');
    const currentTranslations = translations[currentLanguage] || {};
    
    chapterLinks.forEach(link => {
        const chapterKey = link.getAttribute('data-chapter');
        if (currentTranslations[chapterKey]) {
            link.textContent = currentTranslations[chapterKey];
        }
    });
}

// Initialize layered content system for collapsible content
function initLayeredContentSystem() {
    console.log('🔧 Initializing layered content system...');
    
    // Add click event listeners to expand/collapse buttons
    const expandToggles = document.querySelectorAll('.expand-toggle');
    expandToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            toggleLayeredSection(this);
        });
    });
    
    console.log(`✅ Layered content system initialized with ${expandToggles.length} toggles`);
}

function toggleLayeredSection(toggleButton) {
    const isExpanded = toggleButton.dataset.expanded === 'true';
    
    // Find the detailed content layer in the same section
    let detailedLayer;
    let currentElement = toggleButton.previousElementSibling;
    
    // Look backwards for the detailed content layer
    while (currentElement) {
        const detailedContent = currentElement.querySelector('.content-layer.detailed');
        if (detailedContent) {
            detailedLayer = detailedContent;
            break;
        }
        if (currentElement.classList.contains('content-layer') && currentElement.classList.contains('detailed')) {
            detailedLayer = currentElement;
            break;
        }
        currentElement = currentElement.previousElementSibling;
    }
    
    if (!detailedLayer) {
        console.warn('No detailed content layer found for toggle button');
        return;
    }
    
    if (!isExpanded) {
        // Expand to show detailed content
        detailedLayer.style.display = 'block';
        detailedLayer.style.maxHeight = 'none';
        detailedLayer.style.opacity = '1';
        toggleButton.dataset.expanded = 'true';
        
        // Smooth scroll to bring detailed content into view
        setTimeout(() => {
            detailedLayer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest' 
            });
        }, 100);
    } else {
        // Collapse to hide detailed content
        detailedLayer.style.maxHeight = '0px';
        detailedLayer.style.opacity = '0';
        setTimeout(() => {
            detailedLayer.style.display = 'none';
        }, 300);
        toggleButton.dataset.expanded = 'false';
    }
    
    updateToggleText(toggleButton, !isExpanded);
}

function updateToggleText(toggle, isExpanded) {
    const textElement = toggle.querySelector('.toggle-text');
    const iconElement = toggle.querySelector('.toggle-icon');
    
    if (textElement) {
        if (currentLanguage === 'zh') {
            textElement.textContent = isExpanded ? '收起详细内容' : '展开详细内容';
        } else if (currentLanguage === 'ja') {
            textElement.textContent = isExpanded ? '詳細を閉じる' : '詳細を開く';
        } else {
            textElement.textContent = isExpanded ? 'Collapse Details' : 'Expand Details';
        }
    }
    
    if (iconElement) {
        iconElement.textContent = isExpanded ? '▲' : '▼';
    }
}

// ==============================
// CHATBOT FUNCTIONALITY
// ==============================

class NKSChatbot {
    constructor() {
        this.apiUrl = "https://nks-746942233281.us-west1.run.app";
        this.isExpanded = false;
        this.isTyping = false;
        this.messageHistory = [];
        this.storageKey = 'nks-chat-history';
        
        this.initializeElements();
        this.bindEvents();
        this.loadChatHistory();
    }
    
    initializeElements() {
        // Main container
        this.chatContainer = document.getElementById('nks-chat');
        
        // Mobile round button
        this.mobileButton = document.getElementById('mobile-chat-button');
        
        // Collapsed state elements
        this.inputBar = document.getElementById('chat-input-bar');
        this.quickInput = document.getElementById('chat-quick-input');
        this.quickSendButton = document.getElementById('chat-quick-send');
        
        // Track mobile state
        this.isMobile = window.innerWidth <= 768;
        
        // Expanded state elements
        this.conversation = document.getElementById('chat-conversation');
        this.minimizeButton = document.getElementById('chat-minimize');
        this.messagesContainer = document.getElementById('chat-messages');
        this.inputField = document.getElementById('chat-input');
        this.sendButton = document.getElementById('chat-send');
        this.typingIndicator = document.getElementById('chat-typing');
    }
    
    bindEvents() {
        // Mobile round button click
        this.mobileButton.addEventListener('click', () => this.handleMobileButtonClick());
        
        // Quick input events (collapsed state)
        this.quickSendButton.addEventListener('click', () => this.sendQuickMessage());
        this.quickInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendQuickMessage();
            }
        });
        
        // Full chat events (expanded state)
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Minimize button
        this.minimizeButton.addEventListener('click', () => this.minimizeChat());
        
        // Close chat when clicking outside (only when expanded)
        document.addEventListener('click', (e) => {
            if (this.isExpanded && !this.chatContainer.contains(e.target)) {
                this.minimizeChat();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 768;
        });
        
        // Update placeholder text when language changes
        document.addEventListener('languageChanged', () => this.updateLanguageElements());
    }
    
    handleMobileButtonClick() {
        if (this.isMobile) {
            // On mobile: directly open full conversation view
            this.expandChat();
        }
    }
    
    minimizeChat() {
        if (this.isMobile) {
            // On mobile: return to round button state
            this.isExpanded = false;
            this.conversation.classList.add('hidden');
        } else {
            // Desktop behavior unchanged
            this.isExpanded = false;
            this.conversation.classList.add('hidden');
        }
    }
    
    async sendQuickMessage() {
        const message = this.quickInput.value.trim();
        if (!message || this.isTyping) return;
        
        // Clear quick input
        this.quickInput.value = '';
        
        // Expand to conversation view
        this.expandChat();
        
        // Add user message and get bot response
        this.addMessage('user', message);
        await this.getBotResponse(message);
    }
    
    async sendMessage() {
        const message = this.inputField.value.trim();
        if (!message || this.isTyping) return;
        
        // Clear input
        this.inputField.value = '';
        
        // Add user message and get bot response
        this.addMessage('user', message);
        await this.getBotResponse(message);
    }
    
    expandChat() {
        this.isExpanded = true;
        this.inputBar.style.display = 'none';
        this.conversation.classList.remove('hidden');
        
        // Focus on the main input field
        setTimeout(() => {
            this.inputField.focus();
            this.scrollToBottom();
        }, 300);
    }
    
    minimizeChat() {
        this.isExpanded = false;
        this.conversation.classList.add('hidden');
        this.inputBar.style.display = 'flex';
        
        // Clear the quick input when minimizing
        setTimeout(() => {
            this.quickInput.focus();
        }, 300);
    }
    
    async getBotResponse(message) {
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Call RAG API
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: message })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // API returns pure text, so get it as text instead of JSON
            const botResponse = await response.text();
            console.log('🤖 API Response received:', botResponse);
            
            // Hide typing indicator and add bot response
            this.hideTypingIndicator();
            this.addMessage('bot', botResponse);
            
        } catch (error) {
            console.error('Chatbot API error:', error);
            
            // Hide typing indicator and show error message
            this.hideTypingIndicator();
            
            let errorMessage;
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'I\'m having trouble connecting to my knowledge base. Please check your internet connection and try again.';
            } else if (error.message.includes('HTTP 429')) {
                errorMessage = 'I\'m receiving too many requests right now. Please wait a moment and try again.';
            } else if (error.message.includes('HTTP 5')) {
                errorMessage = 'My knowledge service is temporarily unavailable. Please try again in a few minutes.';
            } else {
                errorMessage = 'I encountered an unexpected error. Please try asking your question in a different way.';
            }
            
            this.addMessage('bot', errorMessage, true);
        }
    }
    
    addMessage(type, content, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message${isError ? ' error-message' : ''}`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.textContent = type === 'user' ? '👤' : '🤖';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const contentP = document.createElement('p');
        contentP.textContent = content;
        
        contentDiv.appendChild(contentP);
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        this.messagesContainer.appendChild(messageDiv);
        
        // Store in history
        this.messageHistory.push({ type, content, isError });
        
        // Save to localStorage
        this.saveChatHistory();
        
        // Scroll to bottom
        this.scrollToBottom();
    }
    
    showTypingIndicator() {
        this.isTyping = true;
        if (this.typingIndicator) {
            this.typingIndicator.classList.remove('hidden');
        }
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.isTyping = false;
        if (this.typingIndicator) {
            this.typingIndicator.classList.add('hidden');
        }
    }
    
    scrollToBottom() {
        setTimeout(() => {
            if (this.messagesContainer) {
                this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            }
        }, 50);
    }
    
    updateLanguageElements() {
        // Update placeholder texts
        const quickPlaceholder = this.getTranslatedText('chat-quick-placeholder', 'Ask about A New Kind of Science...');
        if (this.quickInput) {
            this.quickInput.placeholder = quickPlaceholder;
        }
        
        const inputPlaceholder = this.getTranslatedText('chat-input-placeholder', 'Continue the conversation...');
        if (this.inputField) {
            this.inputField.placeholder = inputPlaceholder;
        }
        
        // Update other translatable elements
        const translatableElements = this.chatContainer.querySelectorAll('[data-i18n]');
        translatableElements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getTranslatedText(key);
            if (translation) {
                element.textContent = translation;
            }
        });
        
        // Update placeholder attributes
        const placeholderElements = this.chatContainer.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.getTranslatedText(key);
            if (translation) {
                element.placeholder = translation;
            }
        });
    }
    
    getTranslatedText(key, fallback = '') {
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            return translations[currentLanguage][key];
        }
        return fallback;
    }
    
    // localStorage methods for persistent chat history
    saveChatHistory() {
        try {
            const historyData = {
                messages: this.messageHistory,
                timestamp: Date.now(),
                version: '1.0' // For future compatibility
            };
            localStorage.setItem(this.storageKey, JSON.stringify(historyData));
            console.log('💾 Chat history saved to localStorage');
        } catch (error) {
            console.warn('⚠️ Failed to save chat history:', error);
        }
    }
    
    loadChatHistory() {
        try {
            const storedData = localStorage.getItem(this.storageKey);
            if (!storedData) {
                console.log('📭 No chat history found in localStorage');
                return;
            }
            
            const historyData = JSON.parse(storedData);
            
            // Validate data structure
            if (!historyData.messages || !Array.isArray(historyData.messages)) {
                console.warn('⚠️ Invalid chat history format, clearing...');
                this.clearChatHistory();
                return;
            }
            
            // Check if history is too old (optional: clear after 30 days)
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            if (historyData.timestamp && historyData.timestamp < thirtyDaysAgo) {
                console.log('🗓️ Chat history expired, clearing...');
                this.clearChatHistory();
                return;
            }
            
            this.messageHistory = historyData.messages;
            console.log(`📚 Loaded ${this.messageHistory.length} messages from chat history`);
            
            // Restore messages to UI if there are any
            if (this.messageHistory.length > 0) {
                this.restoreMessagesToUI();
            }
            
        } catch (error) {
            console.warn('⚠️ Failed to load chat history:', error);
            this.clearChatHistory();
        }
    }
    
    restoreMessagesToUI() {
        // Clear existing messages in UI
        if (this.messagesContainer) {
            this.messagesContainer.innerHTML = '';
        }
        
        // Restore each message to the UI
        this.messageHistory.forEach(({ type, content, isError }) => {
            this.displayMessageInUI(type, content, isError);
        });
        
        console.log('🔄 Chat history restored to UI');
    }
    
    displayMessageInUI(type, content, isError = false) {
        if (!this.messagesContainer) return;
        
        // Create message element (same as addMessage but without storing to history)
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message${isError ? ' error' : ''}`;
        
        // Avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.textContent = type === 'user' ? '👤' : '🤖';
        
        // Content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = content; // Use innerHTML to preserve formatting
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        this.messagesContainer.appendChild(messageDiv);
    }
    
    clearChatHistory() {
        try {
            localStorage.removeItem(this.storageKey);
            this.messageHistory = [];
            if (this.messagesContainer) {
                this.messagesContainer.innerHTML = '';
            }
            console.log('🗑️ Chat history cleared');
        } catch (error) {
            console.warn('⚠️ Failed to clear chat history:', error);
        }
    }
    
    // Public method to clear history (can be called from console or UI)
    clearHistory() {
        if (confirm('Are you sure you want to clear your chat history? This cannot be undone.')) {
            this.clearChatHistory();
        }
    }
}

// Position chat to align with annotations column
function positionChatWithAnnotationsColumn() {
    const annotationsColumn = document.querySelector('.annotations-column');
    const chatContainer = document.querySelector('.nks-chat-container');
    
    if (!annotationsColumn || !chatContainer) return;
    
    // Only position on desktop (width > 768px)
    // Also check if we're actually showing mobile UI elements
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        // Remove any inline positioning on mobile to let CSS take over
        chatContainer.style.left = '';
        chatContainer.style.width = '';
        chatContainer.classList.add('positioned');
        return;
    }
    
    const rect = annotationsColumn.getBoundingClientRect();
    const columnLeft = rect.left + window.scrollX;
    const columnWidth = rect.width;
    
    // Ensure minimum width for the chat component
    const minChatWidth = 200; // Matches CSS min-width
    const adjustedWidth = Math.max(columnWidth, minChatWidth);
    
    // If we need more width than the column provides, adjust positioning
    let adjustedLeft = columnLeft;
    if (adjustedWidth > columnWidth) {
        // Try to center the chat over the column
        adjustedLeft = columnLeft - (adjustedWidth - columnWidth) / 2;
        
        // Ensure we don't go off the left edge of the viewport
        adjustedLeft = Math.max(10, adjustedLeft);
        
        // Ensure we don't go off the right edge of the viewport
        const rightEdge = adjustedLeft + adjustedWidth;
        if (rightEdge > window.innerWidth - 10) {
            adjustedLeft = window.innerWidth - adjustedWidth - 10;
        }
    }
    
    console.log('📍 Positioning chat:', {
        columnLeft,
        columnWidth,
        adjustedLeft,
        adjustedWidth,
        viewportWidth: window.innerWidth,
        isMobile
    });
    
    chatContainer.style.left = adjustedLeft + 'px';
    chatContainer.style.width = adjustedWidth + 'px';
    chatContainer.classList.add('positioned');
}

// Initialize chatbot
function initChatbot() {
    console.log('🤖 Initializing NKS Chatbot...');
    window.nksChatbot = new NKSChatbot();
    console.log('✅ NKS Chatbot initialized');
    
    // Position chat to align with annotations column after a small delay
    // to ensure the CSS Grid layout has been fully calculated
    setTimeout(() => {
        positionChatWithAnnotationsColumn();
    }, 100);
    
    // Reposition on window resize
    window.addEventListener('resize', () => {
        setTimeout(positionChatWithAnnotationsColumn, 50);
    });
}