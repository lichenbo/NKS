document.addEventListener('DOMContentLoaded', function () {
    initMarkdownRenderer();
    initChapterNavigation();
    initAnnotationSystem();
    initAnnotationContent();
    initLanguageSystem();

    // Load first chapter by default
    loadChapter('chapter1');
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
            showAnnotation(annotationKey);
        }
    });
}

// Global variable to track active Typed instance
let currentTyped = null;

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
        const htmlContent = marked.parse(markdownText);
        
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

async function showAnnotation(key) {
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
            currentTyped = new Typed('#typewriter-text', {
                strings: [annotation.content], // Use HTML content directly
                typeSpeed: 1,
                backSpeed: 0,
                fadeOut: false,
                showCursor: true,
                cursorChar: '|',
                autoInsertCss: true,
                contentType: 'html', // Allow HTML content
                onComplete: function () {
                    // Optional: do something when typing is complete
                }
            });
        } else {
            // Fallback: display content immediately if Typed.js is not available
            document.getElementById('typewriter-text').innerHTML = annotation.content;
        }
    } else {
        annotationContent.innerHTML = `
            <h3>Annotation Not Found</h3>
            <p class="placeholder">The annotation "${key}" could not be loaded. Make sure the file "annotations/${key}.md" exists.</p>
        `;
    }
}


function clearAnnotationContent() {
    // Destroy any existing Typed instance
    if (currentTyped && typeof currentTyped.destroy === 'function') {
        currentTyped.destroy();
        currentTyped = null;
    }

    const annotationContent = document.getElementById('annotation-content');
    const annotationsTitle = translations[currentLanguage]['annotations'] || 'Annotations';
    const placeholderText = translations[currentLanguage]['annotation-placeholder'] || 'Click on any highlighted link in the notes to view detailed annotations and additional context.';
    
    annotationContent.innerHTML = `
        <h3>${annotationsTitle}</h3>
        <p class="placeholder">${placeholderText}</p>
    `;

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
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initAnimation();
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

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
    const bgRuleText = document.getElementById('bg-rule-text');
    if (bgRuleText) {
        bgRuleText.textContent = `BG: Rule 30`;
    }
    
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
        const header = canvas.parentElement;
        canvas.width = header.clientWidth;
        canvas.height = header.clientHeight;
        initAnimation();
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
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
    let headerRuleName = headerRuleKeys[headerRuleIndex];
    
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
        const headerRuleText = document.getElementById('header-rule-text');
        if (headerRuleText) {
            headerRuleText.textContent = `Header: Rule ${headerRuleName}`;
        }
        
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
    const headerRuleText = document.getElementById('header-rule-text');
    if (headerRuleText) {
        headerRuleText.textContent = `Header: Rule ${headerRuleName}`;
    }
    
    // Initialize
    initAnimation();
    
    // Animate faster for header effect
    setInterval(drawHeaderCellularAutomata, 150);
}

// Language System
let currentLanguage = 'zh';

const translations = {
    en: {
        author: 'Stephen Wolfram',
        title: 'A New Kind of Science',
        subtitle: 'Personal notes and annotations',
        outline: 'Outline',
        annotations: 'Annotations',
        'annotation-placeholder': 'Click on any highlighted link in the notes to view detailed annotations and additional context.',
        'chapter1': 'Chapter 1: The Foundations for a New Kind of Science',
        'chapter1_backup': 'Chapter 1: Foundations (Detailed Version)',
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
        'loading': 'Loading chapter content...'
    },
    zh: {
        author: '斯蒂芬·沃尔夫拉姆',
        title: '一种新的科学',
        subtitle: '个人笔记和注释',
        outline: '大纲',
        annotations: '注释',
        'annotation-placeholder': '点击笔记中任何高亮链接以查看详细注释和额外内容。',
        'chapter1': '第1章：新科学的基础',
        'chapter1_backup': '第1章：基础（详细版本）',
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
        'loading': '正在加载章节内容...'
    }
};

function initLanguageSystem() {
    const languageBtn = document.getElementById('language-btn');
    
    // Load saved language preference
    const savedLanguage = localStorage.getItem('nks-language') || 'zh';
    currentLanguage = savedLanguage;
    updateLanguageButton();
    
    languageBtn.addEventListener('click', function() {
        currentLanguage = currentLanguage === 'en' ? 'zh' : 'en';
        localStorage.setItem('nks-language', currentLanguage);
        updateLanguageButton();
        updatePageLanguage();
        
        // Reload current chapter with new language
        const activeChapter = document.querySelector('.chapter-link.active');
        if (activeChapter) {
            const chapterId = activeChapter.getAttribute('data-chapter');
            loadChapter(chapterId);
        }
    });
    
    // Initialize with current language
    updatePageLanguage();
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