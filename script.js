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

/**
 * Cache for storing loaded annotation content by language to prevent redundant fetches
 * Structure: { 'en': { 'annotation-key': 'content' }, 'zh': { 'annotation-key': 'content' } }
 * @type {Object<string, Object<string, string>>}
 */
const annotationCache = {};

/**
 * Unified language file loader with intelligent fallback system
 * Implements language-specific file loading with graceful fallbacks:
 * - Chinese (zh): tries zh/file -> file
 * - Japanese (ja): tries ja/file -> zh/file -> file  
 * - English (en): tries file directly
 * 
 * Time Complexity: O(1) - constant network requests (max 3 fallback attempts)
 * Space Complexity: O(n) where n is the size of the loaded file content
 * 
 * @async
 * @function loadLanguageFile
 * @param {string} basePath - Base directory path (e.g., 'chapters', 'annotations')
 * @param {string} fileName - Target filename (e.g., 'chapter1.md')
 * @param {string|null} [language=null] - Language code ('en', 'zh', 'ja'), defaults to currentLanguage
 * @returns {Promise<string|null>} File content as text, or null if file not found
 * @throws {Error} Network errors are caught and logged, returns null on failure
 * 
 * Called by: loadChapter(), loadAnnotation()
 * Calls: fetch(), response.text()
 */
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

/**
 * DOM Utility Functions - optimized element access and caching
 * Provides performance-optimized DOM queries with built-in caching to reduce
 * repeated element lookups and improve application performance
 * 
 * Time Complexity: O(1) for cached elements, O(n) for new queries where n is DOM size
 * Space Complexity: O(k) where k is number of cached elements
 * 
 * @namespace DOM
 */
const DOM = {
    /**
     * Get element by ID
     * @param {string} id - Element ID
     * @returns {HTMLElement|null} Element or null if not found
     */
    byId: (id) => document.getElementById(id),
    
    /**
     * Get first element matching selector
     * @param {string} selector - CSS selector
     * @returns {HTMLElement|null} Element or null if not found
     */
    query: (selector) => document.querySelector(selector),
    
    /**
     * Get all elements matching selector
     * @param {string} selector - CSS selector
     * @returns {NodeList} Collection of matching elements
     */
    queryAll: (selector) => document.querySelectorAll(selector),
    
    /**
     * Internal cache for DOM elements (Map for better performance)
     * @private
     * @type {Map<string, HTMLElement>}
     */
    _cache: new Map(),
    
    /**
     * Get element by ID with caching for improved performance
     * Time Complexity: O(1) for cached elements, O(n) for new elements
     * @param {string} id - Element ID
     * @returns {HTMLElement|null} Cached element or null if not found
     */
    cached: function(id) {
        if (!this._cache.has(id)) {
            this._cache.set(id, document.getElementById(id));
        }
        return this._cache.get(id);
    },
    
    /**
     * Clear all cached DOM elements (useful for memory management)
     * Time Complexity: O(1)
     * @returns {void}
     */
    clearCache: function() {
        this._cache.clear();
    }
};

/**
 * Event Handler Utilities - streamlined event management patterns
 * Provides common event handling patterns with delegation support
 * to reduce boilerplate and improve maintainability
 * 
 * Time Complexity: O(n) for onClick where n is number of matching elements
 * Space Complexity: O(1) for event handlers (stored in DOM)
 * 
 * @namespace Events
 */
const Events = {
    /**
     * Add click event handler to element(s) with flexible selector support
     * Supports both CSS selector strings and direct element references
     * Time Complexity: O(n) where n is number of matching elements
     * 
     * @param {string|HTMLElement} selector - CSS selector or element reference
     * @param {Function} handler - Click event handler function
     * @param {Object} [options={}] - AddEventListener options (passive, once, etc.)
     * @returns {void}
     */
    onClick: function(selector, handler, options = {}) {
        const elements = typeof selector === 'string' ? DOM.queryAll(selector) : [selector];
        elements.forEach(el => {
            if (el) {
                el.addEventListener('click', handler, options);
            }
        });
    },
    
    /**
     * Add delegated event handler for dynamic content support
     * Uses event delegation pattern for elements that may be added/removed dynamically
     * Time Complexity: O(1) for setup, O(log n) for event bubbling where n is DOM depth
     * 
     * @param {string|HTMLElement} parent - Parent element or CSS selector
     * @param {string} selector - Child selector to match against event target
     * @param {string} event - Event type ('click', 'change', etc.)
     * @param {Function} handler - Event handler function
     * @returns {void}
     */
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

/**
 * Text Processing Utilities - markdown and HTML content processing
 * Provides common text transformation patterns for markdown content,
 * external link processing, and annotation link conversion
 * 
 * Time Complexity: O(n) where n is length of input text for most operations
 * Space Complexity: O(n) for processed output strings
 * 
 * @namespace TextUtils
 */
const TextUtils = {
    /**
     * Process external HTTP/HTTPS links to open in new tabs with security attributes
     * Adds target="_blank" and rel="noopener noreferrer" to external links
     * Time Complexity: O(n) where n is length of HTML string
     * 
     * @param {string} html - HTML string containing links
     * @returns {string} Processed HTML with external link attributes
     */
    processExternalLinks: function(html) {
        return html.replace(/<a href="https?:\/\/[^"]*"/g, function(match) {
            return match + ' target="_blank" rel="noopener noreferrer"';
        });
    },
    
    /**
     * Extract title from markdown's first H1 heading
     * Searches for first line starting with '# ' and extracts title text
     * Time Complexity: O(n) where n is length of markdown until first match
     * 
     * @param {string} markdown - Markdown content
     * @param {string} [fallback=''] - Default title if no heading found
     * @returns {string} Extracted title or fallback value
     */
    extractTitle: function(markdown, fallback = '') {
        const titleMatch = markdown.match(/^#\s+(.+)$/m);
        return titleMatch ? titleMatch[1] : fallback;
    },
    
    /**
     * Convert annotation links from markdown syntax to HTML spans
     * Transforms [text](annotation:key) to clickable annotation links
     * Time Complexity: O(n*m) where n is text length, m is number of annotation links
     * 
     * @param {string} markdown - Markdown content with annotation links
     * @returns {string} Processed content with HTML annotation spans
     */
    processAnnotationLinks: function(markdown) {
        return markdown.replace(
            /\[([^\]]+)\]\(annotation:([^)]+)\)/g,
            '<span class="annotation-link" data-annotation="$2">$1</span>'
        );
    }
};

/**
 * Custom incremental typing animation system with HTML content support
 * Provides typewriter-style text animation that preserves HTML structure and
 * doesn't reset innerHTML, preventing image reloading and maintaining DOM state.
 * 
 * Key Features:
 * - HTML-aware token parsing (preserves tags, attributes, structure)
 * - Character-by-character typing animation with configurable speed
 * - Non-destructive DOM manipulation (doesn't reset innerHTML)
 * - Completion callback support for chaining animations
 * - Image and media content preservation during animation
 * 
 * Time Complexity: O(n) where n is total characters + HTML tokens
 * Space Complexity: O(n) for token storage
 * 
 * @class IncrementalTyper
 */
class IncrementalTyper {
    /**
     * Initialize incremental typer with content parsing and configuration
     * Parses HTML content into tokens for character-by-character animation
     * 
     * @param {HTMLElement} element - Target DOM element for typing animation
     * @param {string} content - HTML content to animate (supports full HTML)
     * @param {Object} [options={}] - Configuration options
     * @param {number} [options.typeSpeed=10] - Milliseconds between characters
     * @param {Function} [options.onComplete=()=>{}] - Callback when animation completes
     */
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
    
    /**
     * Parse HTML content into animation tokens
     * Converts HTML string into structured tokens for incremental rendering
     * Time Complexity: O(n) where n is HTML content length
     * 
     * @param {string} html - HTML content to parse
     * @returns {Array<Object>} Array of token objects { type, content, [tagName] }
     */
    parseHTML(html) {
        const tokens = [];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        this.extractTokens(tempDiv.childNodes, tokens);
        return tokens;
    }
    
    /**
     * Recursively extract tokens from DOM nodes
     * Processes text nodes as individual characters, element nodes as tags
     * Time Complexity: O(n*m) where n is nodes, m is average text length per node
     * 
     * @param {NodeList} nodes - DOM nodes to process
     * @param {Array<Object>} tokens - Output array for tokens
     * @returns {void} Mutates tokens array
     */
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
    
    /**
     * Start the typing animation
     * Initializes DOM state, creates cursor, and begins token-by-token animation
     * Time Complexity: O(1) for initialization, O(n) total for all tokens
     * 
     * @returns {void}
     * @public
     */
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
    
    /**
     * Process the next token in the animation sequence
     * Handles different token types (characters, HTML tags, images) appropriately
     * Uses recursion with setTimeout for smooth animation timing
     * Time Complexity: O(1) per call, O(n) total for all tokens
     * 
     * @returns {void}
     * @private
     */
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
    
    /**
     * Clean up and stop the typing animation
     * Removes cursor and resets typing state for cleanup
     * Time Complexity: O(1)
     * 
     * @returns {void}
     * @public
     */
    destroy() {
        this.isTyping = false;
        // Remove cursor if it exists
        if (this.cursor && this.cursor.parentNode) {
            this.cursor.parentNode.removeChild(this.cursor);
        }
    }
}

/**
 * Factory function to create and start incremental typing animation
 * Convenience wrapper for IncrementalTyper class instantiation and startup
 * 
 * Time Complexity: O(n) where n is content length for parsing
 * Space Complexity: O(n) for token storage
 * 
 * @function startIncrementalTyping
 * @param {string} elementId - DOM element ID for typing animation
 * @param {string} content - HTML content to animate
 * @param {Object} [options={}] - Animation configuration options
 * @param {number} [options.typeSpeed=10] - Milliseconds between characters
 * @param {Function} [options.onComplete] - Completion callback
 * @returns {IncrementalTyper|null} Typer instance or null if element not found
 * 
 * Called by: showDesktopAnnotation()
 * Calls: new IncrementalTyper(), typer.start()
 */
function startIncrementalTyping(elementId, content, options = {}) {
    const element = DOM.byId(elementId);
    if (!element) return null;
    
    const typer = new IncrementalTyper(element, content, options);
    typer.start();
    return typer;
}


/**
 * Initialize markdown renderer with configuration for NKS content
 * Configures marked.js library with GitHub-flavored markdown and line breaks
 * 
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 * 
 * @function initMarkdownRenderer
 * @returns {void}
 * 
 * Called by: DOMContentLoaded event handler
 * Calls: marked.setOptions()
 */
function initMarkdownRenderer() {
    // Configure marked for our annotation syntax
    marked.setOptions({
        breaks: true,
        gfm: true
    });
}

/**
 * Initialize chapter navigation system with click handlers
 * Sets up event listeners for chapter links with active state management
 * Handles both internal navigation and external demo links
 * 
 * Time Complexity: O(n) where n is number of chapter links
 * Space Complexity: O(1) for event listeners
 * 
 * @function initChapterNavigation
 * @returns {void}
 * 
 * Called by: DOMContentLoaded event handler
 * Calls: loadChapter(), clearAnnotationContent()
 */
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

/**
 * Load and display chapter content with language support
 * Handles special cases like demo pages and layered content for Chapter 1 Chinese
 * Processes markdown content and manages annotation links
 * 
 * Key Features:
 * - Language-aware file loading with fallback system
 * - Special handling for intro-demo and layered Chapter 1 (Chinese)
 * - Markdown processing with annotation link conversion
 * - Loading state management and error handling
 * - Automatic layered content system initialization
 * 
 * Time Complexity: O(n) where n is content length for processing
 * Space Complexity: O(n) for content storage
 * 
 * @async
 * @function loadChapter
 * @param {string} chapterId - Chapter identifier ('preface', 'chapter1', 'intro-demo', etc.)
 * @returns {Promise<void>} Resolves when chapter is loaded and processed
 * 
 * Called by: initChapterNavigation(), DOMContentLoaded handler
 * Calls: loadLanguageFile(), processAnnotationLinksInMarkdown(), initLayeredContentSystem()
 */
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
                    APP.GameOfLife.initGameOfLife();
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

/**
 * Process annotation links in markdown content
 * Wrapper function for TextUtils.processAnnotationLinks to maintain API consistency
 * 
 * Time Complexity: O(n*m) where n is text length, m is number of annotation links
 * Space Complexity: O(n) for processed content
 * 
 * @function processAnnotationLinksInMarkdown
 * @param {string} markdown - Markdown content with annotation links
 * @returns {string} Processed markdown with HTML annotation spans
 * 
 * Called by: loadChapter()
 * Calls: TextUtils.processAnnotationLinks()
 */
function processAnnotationLinksInMarkdown(markdown) {
    return TextUtils.processAnnotationLinks(markdown);
}

// Removed unused processAnnotationLinks function - functionality is handled by processAnnotationLinksInMarkdown

/**
 * Initialize annotation system with global click event delegation
 * Sets up click handlers for annotation links with active state management
 * Uses event delegation pattern to handle dynamically added annotation links
 * 
 * Time Complexity: O(1) for setup, O(n) per click where n is annotation links
 * Space Complexity: O(1) for event listener
 * 
 * @function initAnnotationSystem
 * @returns {void}
 * 
 * Called by: DOMContentLoaded event handler
 * Calls: showAnnotation()
 */
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

/**
 * Debounce utility function to limit function call frequency
 * Prevents excessive function calls during events like scroll or resize
 * 
 * Time Complexity: O(1)
 * Space Complexity: O(1) for timeout storage
 * 
 * @function debounce
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait before executing
 * @returns {Function} Debounced function
 * 
 * Called by: various scroll and resize handlers
 */
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

/**
 * Detect mobile device based on user agent and touch capability
 * Uses comprehensive user agent detection and touch point analysis
 * 
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 * 
 * @function isMobile
 * @returns {boolean} True if mobile device detected
 * 
 * Called by: annotation display logic, responsive behavior
 */
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
}

/**
 * Determine if annotations should display inline (stacked layout)
 * Based on viewport width to match CSS media query breakpoints
 * 
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 * 
 * @function shouldUseInlineAnnotations
 * @returns {boolean} True if viewport width ≤ 768px (tablet/mobile)
 * 
 * Called by: showAnnotation()
 */
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

/**
 * Load annotation content with caching and language support
 * Implements efficient caching system to prevent redundant network requests
 * Supports language fallback system and external link processing
 * 
 * Key Features:
 * - Language-aware caching with compound cache keys (key-language)
 * - Markdown to HTML conversion with marked.js
 * - External link processing for security (target="_blank")
 * - Fallback system through loadLanguageFile utility
 * 
 * Time Complexity: O(1) for cached content, O(n) for new content where n is file size
 * Space Complexity: O(n) for content storage in cache
 * 
 * @async
 * @function loadAnnotation
 * @param {string} key - Annotation identifier (filename without extension)
 * @returns {Promise<string>} HTML content of the annotation
 * @throws {Error} If annotation file not found after fallback attempts
 * 
 * Called by: showAnnotation(), showDesktopAnnotation(), showInlineAnnotation()
 * Calls: loadLanguageFile(), marked.parse(), TextUtils.processExternalLinks()
 */
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

/**
 * Show annotation using appropriate display method (desktop sidebar or inline)
 * Responsive annotation display that switches based on viewport size
 * Routes to either desktop sidebar or inline mobile display
 * 
 * Time Complexity: O(1) for routing decision
 * Space Complexity: O(1)
 * 
 * @async
 * @function showAnnotation
 * @param {string} key - Annotation identifier
 * @param {HTMLElement|null} [clickedElement=null] - Element that triggered annotation (for positioning)
 * @returns {Promise<void>} Resolves when annotation is displayed
 * 
 * Called by: initAnnotationSystem() click handler
 * Calls: shouldUseInlineAnnotations(), showInlineAnnotation(), showDesktopAnnotation()
 */
async function showAnnotation(key, clickedElement = null) {
    // Check if we should use inline annotation for mobile phones or desktop sidebar
    if (shouldUseInlineAnnotations()) {
        await showInlineAnnotation(key, clickedElement);
    } else {
        await showDesktopAnnotation(key);
    }
}

/**
 * Display annotation in desktop sidebar with incremental typing animation
 * Handles desktop-specific annotation display in the right sidebar panel
 * Features custom incremental typing animation that preserves HTML structure
 * 
 * Key Features:
 * - Incremental typing animation with HTML preservation
 * - Sidebar container management and scrolling
 * - Link monitoring for dynamically added annotation links
 * - Error handling with fallback messages
 * 
 * Time Complexity: O(n) where n is annotation content length
 * Space Complexity: O(n) for content processing
 * 
 * @async
 * @function showDesktopAnnotation
 * @param {string} key - Annotation identifier
 * @returns {Promise<void>} Resolves when annotation is displayed and animated
 * 
 * Called by: showAnnotation()
 * Calls: loadAnnotation(), startIncrementalTyping(), startLinkMonitoring()
 */
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
/**
 * Base class for cellular automata canvas rendering and animation
 * Provides common functionality for cellular automata visualization including
 * canvas management, resize handling, animation control, and rule-based evolution
 * 
 * Key Features:
 * - Responsive canvas sizing with resize debouncing
 * - Rule-based cellular automata evolution (Elementary CA rules)
 * - Animation control with configurable speed
 * - Mobile-optimized scroll handling to prevent animation restarts
 * - Golden color scheme with age-based fading effects
 * 
 * Time Complexity: O(n) per animation frame where n is number of cells
 * Space Complexity: O(w*h) where w is width, h is height in cells
 * 
 * @class CellularAutomataCanvas
 */
class CellularAutomataCanvas {
    /**
     * Initialize cellular automata canvas with configuration
     * Sets up canvas context, dimensions, animation parameters, and options
     * 
     * @param {string} canvasId - DOM element ID for canvas
     * @param {number} cellSize - Size of each cell in pixels
     * @param {Object} [options={}] - Configuration options
     * @param {number} [options.animationSpeed=200] - Milliseconds between frames
     * @param {number} [options.resizeDebounce=250] - Resize debounce delay
     * @param {HTMLElement} [options.parentElement=null] - Parent for sizing reference
     */
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
    
    /**
     * Initialize canvas setup and event listeners
     * Time Complexity: O(1)
     * @returns {void}
     * @private
     */
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

// Language System - Note: translations and currentLanguage are now handled by js/translations.js

/**
 * Initialize multilingual language system with localStorage persistence
 * Sets up language toggle buttons and manages language switching with
 * automatic content reloading and UI updates
 * 
 * Key Features:
 * - Three-language support (EN/ZH/JA) with fallback system
 * - Persistent language preference in localStorage
 * - Automatic content reloading on language change
 * - UI element translation updates
 * - Chapter link updates for language-specific navigation
 * 
 * Time Complexity: O(n) where n is number of language buttons
 * Space Complexity: O(1) for event listeners
 * 
 * @function initLanguageSystem
 * @returns {void}
 * 
 * Called by: DOMContentLoaded event handler
 * Calls: updateLanguageButtons(), updatePageLanguage(), updateChapterLinks()
 */
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