document.addEventListener('DOMContentLoaded', function () {
    initMarkdownRenderer();
    initChapterNavigation();
    initAnnotationSystem();
    initAnnotationContent();

    // Load first chapter by default
    loadChapter('chapter1');
});

// Annotation data - you can edit these in the HTML/JS
const annotations = {
    "paradigm-shift": {
        title: "Scientific Paradigm Shift",
        content: `
            <p>Wolfram's "New Kind of Science" represents a fundamental paradigm shift in scientific thinking:</p>
            <ul>
                <li><strong>From Mathematical to Computational:</strong> Moving beyond traditional mathematical equations to computational rules</li>
                <li><strong>From Reductionism to Emergence:</strong> Understanding how simple parts interact to create complex wholes</li>
                <li><strong>From Continuous to Discrete:</strong> Viewing nature as fundamentally discrete rather than continuous</li>
                <li><strong>From Deterministic Predictability:</strong> Accepting that simple rules can produce unpredictable complexity</li>
            </ul>
            <p>This shift parallels other major scientific revolutions like those initiated by Copernicus, Newton, Darwin, and Einstein.</p>
        `
    },
    emergence: {
        title: "Emergence from Simple Rules",
        content: `
            <p>The central discovery that simple computational rules can produce immense complexity challenges fundamental assumptions about causation:</p>
            <ul>
                <li><strong>Counterintuitive Results:</strong> Complexity doesn't require complex causes or elaborate plans</li>
                <li><strong>Universal Phenomenon:</strong> This behavior appears across vastly different systems and domains</li>
                <li><strong>Irreducible Complexity:</strong> The resulting patterns often cannot be predicted without running the computation</li>
                <li><strong>Natural Implications:</strong> Suggests many natural phenomena arise from simple underlying rules</li>
            </ul>
            <p>Examples include weather patterns, biological growth, market dynamics, and social behaviors.</p>
        `
    },
    universality: {
        title: "Universality in Complex Systems",
        content: `
            <p>Universality refers to the remarkable finding that complex behavior is not rare but ubiquitous:</p>
            <ul>
                <li><strong>Independence from Details:</strong> Complex behavior arises regardless of specific system implementation</li>
                <li><strong>Cross-Domain Patterns:</strong> Similar patterns appear in physics, biology, economics, and social systems</li>
                <li><strong>Computational Universality:</strong> Many simple systems can perform arbitrary computations</li>
                <li><strong>Threshold Behavior:</strong> Complexity emerges beyond a minimal threshold of rule sophistication</li>
            </ul>
            <p>This universality suggests deep underlying principles governing complex systems across all of nature.</p>
        `
    },
    "cellular-automata": {
        title: "Cellular Automata",
        content: `
            <p>Cellular automata are discrete models consisting of a grid of cells that evolve through time according to simple rules:</p>
            <ul>
                <li><strong>Grid Structure:</strong> Regular arrangement of cells in one, two, or more dimensions</li>
                <li><strong>Local Rules:</strong> Each cell's next state depends only on its current state and nearby neighbors</li>
                <li><strong>Synchronous Updates:</strong> All cells update simultaneously at each time step</li>
                <li><strong>Simple States:</strong> Cells typically have just two states (0/1, on/off, alive/dead)</li>
            </ul>
            <p>Despite their simplicity, cellular automata can model complex phenomena including biological growth, physical processes, and computational systems.</p>
        `
    },
    "computational-equivalence": {
        title: "Principle of Computational Equivalence",
        content: `
            <p>Wolfram's most ambitious hypothesis states that almost all systems perform computations of equivalent sophistication:</p>
            <ul>
                <li><strong>Universal Computation:</strong> Simple programs, human brains, and natural processes all achieve the same computational level</li>
                <li><strong>Irreducibility:</strong> No system can predict another's behavior faster than running the computation</li>
                <li><strong>Natural Intelligence:</strong> Intelligence emerges naturally from computational processes, not special complexity</li>
                <li><strong>Limits to Science:</strong> Some phenomena may be fundamentally unpredictable due to computational irreducibility</li>
            </ul>
            <p>This principle implies fundamental limits to knowledge while suggesting intelligence and complexity are far more common than traditionally believed.</p>
        `
    },
    "wolfram-timeline": {
        title: "Wolfram's Scientific Journey",
        content: `
            <p>Stephen Wolfram's path to discovering this new kind of science began remarkably early:</p>
            <ul>
                <li><strong>1972 (Age 12):</strong> First experiments with cellular automata inspired by physics textbook</li>
                <li><strong>1974-1980s:</strong> Early work and academic publications, missed key discoveries initially</li>
                <li><strong>1980s-1990s:</strong> Created Mathematica, gained independence to pursue fundamental research</li>
                <li><strong>1990s-2002:</strong> Decade-long intensive research leading to "A New Kind of Science"</li>
            </ul>
            <p>His unique combination of early mathematical talent, technology development, and business success provided the freedom to pursue this ambitious intellectual project over decades.</p>
        `
    }
};

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

function showAnnotation(key) {
    const annotationContent = document.getElementById('annotation-content');
    const annotation = annotations[key];

    // Destroy any existing Typed instance
    if (currentTyped) {
        currentTyped.destroy();
        currentTyped = null;
    }

    if (annotation) {
        // Create the structure first
        annotationContent.innerHTML = `
            <div class="annotation-title">${annotation.title}</div>
            <div class="annotation-text">
                <span id="typewriter-text"></span>
            </div>
        `;

        // Convert HTML content to plain text for better typing effect
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = annotation.content;
        const plainText = tempDiv.textContent || tempDiv.innerText || '';

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
            <p class="placeholder">The annotation "${key}" is not yet available. Add it to the annotations object in script.js</p>
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