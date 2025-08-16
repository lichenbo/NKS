document.addEventListener('DOMContentLoaded', function () {
    initMarkdownRenderer();
    initChapterNavigation();
    initAnnotationSystem();
    initAnnotationContent();

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
        notesContent.innerHTML = '<div class="loading">Loading chapter content...</div>';

        // Fetch the markdown file
        const response = await fetch(`chapters/${chapterId}.md`);

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
    // Check cache first
    if (annotationCache[key]) {
        return annotationCache[key];
    }

    try {
        const response = await fetch(`annotations/${key}.md`);
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

        // Cache the annotation
        annotationCache[key] = annotation;
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
    annotationContent.innerHTML = `
        <h3>Annotations</h3>
        <p class="placeholder">Click on any highlighted link in the notes to view detailed annotations and additional context.</p>
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

    // Rule 30 implementation
    function applyRule30(left, center, right) {
        const pattern = left * 4 + center * 2 + right;
        return [0, 1, 1, 1, 1, 0, 0, 0][pattern];
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
            // Reset and start over
            setTimeout(() => {
                initAnimation();
            }, 2000);
        }
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
    
    // Rule 30 implementation
    function applyRule30(left, center, right) {
        const pattern = left * 4 + center * 2 + right;
        return [0, 1, 1, 1, 1, 0, 0, 0][pattern];
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
            // Reset and start over
            setTimeout(() => {
                initAnimation();
            }, 1500);
        }
    }
    
    // Initialize
    initAnimation();
    
    // Animate faster for header effect
    setInterval(drawHeaderCellularAutomata, 150);
}