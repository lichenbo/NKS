document.addEventListener('DOMContentLoaded', function () {
    initMarkdownRenderer();
    initLanguageSystem();
    initChapterNavigation();
    initAnnotationSystem();
    clearAnnotationContent();
    initScrollToTop();
    initImageLightbox();

    // Parse initial hash for language and chapter
    const { lang: initialLang, chapter: initialChapter } = parseHash();
    if (initialLang && initialLang !== currentLanguage) {
        currentLanguage = initialLang;
        localStorage.setItem('nks-language', currentLanguage);
        refreshLanguageUI();
    }

    const chapterToLoad = initialChapter || (!initialChapter && initialLang ? DEFAULT_CHAPTER : getChapterFromHash());
    if (chapterToLoad) {
        if (!navigateToChapter(chapterToLoad, { updateHash: false })) {
            navigateToChapter(DEFAULT_CHAPTER, { updateHash: true });
        } else if (initialLang) {
            // Normalize URL to chapter-only after applying language from hash
            const cleanHash = `#${chapterToLoad}`;
            if (window.location.hash !== cleanHash) {
                window.location.hash = cleanHash.substring(1);
            }
        }
    } else {
        navigateToChapter(DEFAULT_CHAPTER, { updateHash: false });
    }
});

const annotationCache = {};
const DEFAULT_CHAPTER = 'site-guide';

function initMarkdownRenderer() {
    marked.setOptions({
        breaks: true,
        gfm: true
    });
}

function initChapterNavigation() {
    document.addEventListener('click', function (e) {
        const link = e.target && e.target.closest ? e.target.closest('.chapter-link') : null;
        if (!link) return;
        if (link.classList.contains('external-demo-link')) return; // let normal nav happen
        e.preventDefault();

        const chapterId = link.getAttribute('data-chapter');
        if (!chapterId) return;

        navigateToChapter(chapterId);
    });

    window.addEventListener('hashchange', handleChapterHashChange);
}

async function loadChapter(chapterId) {
    const notesContent = DOM.byId('notes-content');

    try {
        const loadingText = translations[currentLanguage]['loading'] || 'Loading chapter content...';
        notesContent.innerHTML = `<div class="loading">${loadingText}</div>`;

        const markdownText = await loadLanguageFile('chapters', `${chapterId}.md`);
        if (!markdownText) {
            throw new Error(`Chapter file not found: ${chapterId}.md`);
        }

        const processedMarkdown = TextUtils.processAnnotationLinks(markdownText);
        notesContent.innerHTML = marked.parse(processedMarkdown);
        // Normalize image/link paths from Markdown to ./images/...
        if (window.TextUtils && typeof TextUtils.rewriteMarkdownAssets === 'function') {
            TextUtils.rewriteMarkdownAssets(notesContent);
        }

        setTimeout(() => { initLayeredContentSystem(); }, 200);
        if (chapterId === 'intro-demo') {
            setTimeout(() => {
                if (document.getElementById('game-canvas')) APP.GameOfLife.initGameOfLife();
            }, 200);
        }

    } catch (error) {
        console.error('Error loading chapter:', error);
        notesContent.innerHTML = `<div class="error"><h2>Error Loading Chapter</h2><p>Could not load <code>${chapterId}.md</code></p><p>Please make sure the file exists in the <code>chapters/</code> directory.</p></div>`;
    }
}

function getChapterFromHash() {
    if (!window.location.hash) return null;
    const raw = decodeURIComponent(window.location.hash.substring(1));
    // Support language-prefixed hashes like "en/chapter1"
    const parts = raw.split('/');
    if (parts.length >= 2 && isLanguageCode(parts[0])) {
        return parts.slice(1).join('/') || null;
    }
    // If hash is just a language code, no chapter
    if (isLanguageCode(raw)) return null;
    return raw || null;
}

function getLanguageFromHash() {
    if (!window.location.hash) return null;
    const raw = decodeURIComponent(window.location.hash.substring(1));
    if (!raw) return null;
    const parts = raw.split('/');
    if (isLanguageCode(parts[0])) return parts[0];
    return isLanguageCode(raw) ? raw : null;
}

function isLanguageCode(str) {
    return str === 'en' || str === 'zh' || str === 'ja';
}

function parseHash() {
    const lang = getLanguageFromHash();
    const chapter = getChapterFromHash();
    return { lang, chapter };
}

function handleChapterHashChange() {
    const { lang, chapter } = parseHash();
    const hadLangPrefix = !!lang;

    if (lang && lang !== currentLanguage) {
        currentLanguage = lang;
        localStorage.setItem('nks-language', currentLanguage);
        refreshLanguageUI();
        clearAnnotationContent();
        APP.CellularAutomata.updateRuleIndicators();
    }

    const chapterId = chapter || (lang ? DEFAULT_CHAPTER : null);
    if (chapterId) {
        // Load content without changing hash first
        if (!navigateToChapter(chapterId, { updateHash: false })) {
            navigateToChapter(DEFAULT_CHAPTER, { updateHash: true });
            return;
        }
        // Normalize to chapter-only hash if there was a language prefix
        const cleanHash = `#${chapterId}`;
        if (hadLangPrefix && window.location.hash !== cleanHash) {
            window.location.hash = cleanHash.substring(1);
        }
    } else {
        navigateToChapter(DEFAULT_CHAPTER, { updateHash: false });
    }
}

function navigateToChapter(chapterId, { updateHash = true } = {}) {
    if (!chapterId) return false;

    // Keep URL clean: always use chapter-only hash
    const targetHash = `#${chapterId}`;
    if (updateHash && window.location.hash !== targetHash) {
        window.location.hash = targetHash.substring(1);
        return true;
    }

    const link = document.querySelector(`.chapter-link[data-chapter="${chapterId}"]`);
    if (!link) {
        return false;
    }

    document.querySelectorAll('.chapter-link.active').forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    clearAnnotationContent();
    loadChapter(chapterId);
    return true;
}

// Annotation system: click delegation + loaders
function initAnnotationSystem() {
    document.addEventListener('click', function (e) {
        const target = e.target && e.target.closest ? e.target.closest('.annotation-link') : null;
        if (target) {
            e.preventDefault();

            document.querySelectorAll('.annotation-link').forEach(l => l.classList.remove('active'));
            target.classList.add('active');

            const annotationKey = target.getAttribute('data-annotation');
            showAnnotation(annotationKey, target);
        }
    });
}


// Global variable to track active Typed instance
let currentTyped = null;
let linkCheckInterval = null;

// debounce, isMobile, shouldUseInlineAnnotations live in js/utils.js

// Removed unused mobile scroll tracking

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
        let htmlContent = TextUtils.processExternalLinks(marked.parse(markdownText));

        // Normalize image/link paths before typing animation
        if (window.TextUtils && typeof TextUtils.rewriteMarkdownAssets === 'function') {
            const tempWrapper = document.createElement('div');
            tempWrapper.innerHTML = htmlContent;
            TextUtils.rewriteMarkdownAssets(tempWrapper);
            htmlContent = tempWrapper.innerHTML;
        }

        const annotation = {
            title: TextUtils.extractTitle(markdownText, key.replace('-', ' ')),
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

    annotationContent.innerHTML = `<div class="loading">Loading annotation...</div>`;

    const annotation = await loadAnnotation(key);

    if (annotation) {
        // Create the structure first
        annotationContent.innerHTML = `<div class="annotation-title">${annotation.title}</div><div class="annotation-text"><span id="typewriter-text"></span></div>`;

        // Custom incremental typing + link enabling
        startLinkMonitoring();

        // Use incremental typing that doesn't reset innerHTML
        currentTyped = startIncrementalTyping('typewriter-text', annotation.content, {
            typeSpeed: 10,
            onComplete: function () {
                stopLinkMonitoring();
                enableLinksIn('#typewriter-text');
                // Normalize any image/link paths within the annotation content
                const container = document.getElementById('typewriter-text');
                if (container && window.TextUtils && typeof TextUtils.rewriteMarkdownAssets === 'function') {
                    TextUtils.rewriteMarkdownAssets(container);
                }
            }
        });
    } else {
        annotationContent.innerHTML = `<h3>Annotation Not Found</h3><p class="placeholder">The annotation "${key}" could not be loaded. Make sure the file "annotations/${key}.md" exists.</p>`;
    }
}

async function showInlineAnnotation(key, clickedElement) {
    if (!clickedElement) return;

    // Remove any existing inline annotations
    DOM.queryAll('.inline-annotation').forEach(a => a.remove());

    // Destroy any existing Typed instance
    if (currentTyped) {
        currentTyped.destroy();
        currentTyped = null;
    }

    // Create the inline annotation element
    const inlineAnnotation = document.createElement('div');
    inlineAnnotation.className = 'inline-annotation';
    inlineAnnotation.setAttribute('data-annotation-key', key);

    inlineAnnotation.innerHTML = `<div class="inline-annotation-header"><div class="inline-annotation-title">Loading...</div><button class="inline-annotation-toggle" title="Collapse">−</button></div><div class="inline-annotation-content"><div class="loading">Loading annotation...</div></div>`;

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
        contentElement.innerHTML = `<div class="annotation-text"><span id="inline-typewriter-text-${key}"></span></div>`;

        // Custom incremental typing + link enabling
        startLinkMonitoring(`#inline-typewriter-text-${key}`);

        // Use incremental typing that doesn't reset innerHTML
        currentTyped = startIncrementalTyping(`inline-typewriter-text-${key}`, annotation.content, {
            typeSpeed: 10,
            onComplete: function () {
                stopLinkMonitoring();
                enableLinksIn(`#inline-typewriter-text-${key}`);
                const container = document.getElementById(`inline-typewriter-text-${key}`);
                if (container && window.TextUtils && typeof TextUtils.rewriteMarkdownAssets === 'function') {
                    TextUtils.rewriteMarkdownAssets(container);
                }
            }
        });
    } else {
        titleElement.textContent = 'Annotation Not Found';
        contentElement.innerHTML = `<p class="placeholder">The annotation "${key}" could not be loaded.</p>`;
    }

    // Add collapse/expand functionality
    toggleBtn.addEventListener('click', function (e) {
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

    setTimeout(() => {
        inlineAnnotation.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }, 100);
}

// Enable links within a container selector
function enableLinksIn(selector) {
    document.querySelectorAll(`${selector} a`).forEach(link => {
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
    linkCheckInterval = setInterval(() => enableLinksIn(selector), 50);
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

    annotationContent.innerHTML = `<h3>${annotationsTitle}</h3><p class="placeholder">${placeholderText}</p>`;

    // Remove any existing inline annotations
    DOM.queryAll('.inline-annotation').forEach(a => a.remove());

    // Remove active class from all annotation links
    document.querySelectorAll('.annotation-link').forEach(link => {
        link.classList.remove('active');
    });
}

// Scroll-to-top functionality
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

    // Smooth scroll to top
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Add scroll event listener with throttling
    window.addEventListener('scroll', debounce(toggleScrollToTopButton, 10));

    // Add click event listener
    scrollToTopBtn.addEventListener('click', function (e) {
        e.preventDefault();
        scrollToTop();
    });

    // Initial check
    toggleScrollToTopButton();
}


// Language system (translations/currentLanguage in js/translations.js)
let languageInitDone = false;
function initLanguageSystem() {
    if (!languageInitDone) {
        document.addEventListener('click', function (e) {
            const btn = e.target && e.target.closest ? e.target.closest('.lang-option') : null;
            if (!btn) return;
            const selectedLang = btn.getAttribute('data-lang');
            if (selectedLang === currentLanguage) return;
            currentLanguage = selectedLang;
            localStorage.setItem('nks-language', currentLanguage);
            refreshLanguageUI();
            clearAnnotationContent();
            APP.CellularAutomata.updateRuleIndicators();
            const activeChapter = document.querySelector('.chapter-link.active');
            if (activeChapter) {
                // Reload current chapter in new language and keep clean hash
                const chapterId = activeChapter.getAttribute('data-chapter');
                loadChapter(chapterId);
                const cleanHash = `#${chapterId}`;
                if (window.location.hash !== cleanHash) {
                    window.location.hash = cleanHash.substring(1);
                }
            } else {
                // No active chapter; go to default with clean hash
                navigateToChapter(DEFAULT_CHAPTER, { updateHash: true });
            }
        });
        languageInitDone = true;
    }
    refreshLanguageUI();
    APP.CellularAutomata.updateRuleIndicators();
}

function refreshLanguageUI() {
    const t = translations[currentLanguage] || {};
    DOM.queryAll('.lang-option').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLanguage);
    });
    DOM.queryAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });
    DOM.queryAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) el.placeholder = t[key];
    });
    DOM.queryAll('.chapter-link').forEach(link => {
        const chapterKey = link.getAttribute('data-chapter');
        if (t[chapterKey]) link.textContent = t[chapterKey];
    });
}

// Layered content (expand/collapse sections)
let layeredInitDone = false;
function initLayeredContentSystem() {
    if (layeredInitDone) return;
    document.addEventListener('click', function (e) {
        const toggle = e.target && e.target.closest ? e.target.closest('.expand-toggle') : null;
        if (!toggle) return;
        e.preventDefault();
        toggleLayeredSection(toggle);
    });
    layeredInitDone = true;
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

    if (!detailedLayer) return;

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
        const labels = {
            zh: ['收起详细内容', '展开详细内容'],
            ja: ['詳細を閉じる', '詳細を開く'],
            en: ['Collapse Details', 'Expand Details'],
        };
        const pair = labels[currentLanguage] || labels.en;
        textElement.textContent = isExpanded ? pair[0] : pair[1];
    }
    if (iconElement) iconElement.textContent = isExpanded ? '▲' : '▼';
}
