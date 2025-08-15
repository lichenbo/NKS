document.addEventListener('DOMContentLoaded', function() {
    initMarkdownRenderer();
    initChapterNavigation();
    initAnnotationSystem();
    initAnnotationContent();
    
    // Load first chapter by default
    loadChapter('chapter1');
});

// Annotation data - you can edit these in the HTML/JS
const annotations = {
    rule30: {
        title: "Rule 30 Cellular Automaton",
        content: `
            <p>Rule 30 is one of the most famous elementary cellular automata discovered by Wolfram. Despite its simple rule:</p>
            <ul>
                <li>111 → 0</li>
                <li>110 → 0</li>
                <li>101 → 0</li>
                <li>100 → 1</li>
                <li>011 → 1</li>
                <li>010 → 1</li>
                <li>001 → 1</li>
                <li>000 → 0</li>
            </ul>
            <p>Rule 30 generates patterns that appear completely random, yet are entirely deterministic. This challenges our intuitions about the relationship between simple rules and complex behavior.</p>
            <p>Wolfram used Rule 30 as a random number generator in Mathematica for several years, demonstrating its practical applications.</p>
        `
    },
    biology: {
        title: "Applications in Biology",
        content: `
            <p>Wolfram's insights about simple rules generating complex behavior have profound implications for biology:</p>
            <ul>
                <li><strong>Pattern Formation:</strong> How leopard spots, zebra stripes, and leaf venation patterns emerge</li>
                <li><strong>Growth Processes:</strong> Tree branching, root systems, and neural network development</li>
                <li><strong>Evolution:</strong> How complex organisms can arise from simple genetic programs</li>
                <li><strong>Morphogenesis:</strong> The development of form and structure in living organisms</li>
            </ul>
            <p>This suggests that many biological phenomena may be computational rather than purely chemical or physical processes.</p>
        `
    },
    physics: {
        title: "Implications for Physics",
        content: `
            <p>Wolfram proposes that the universe itself might be computational, with fundamental physical laws emerging from simple computational rules:</p>
            <ul>
                <li><strong>Space and Time:</strong> May be discrete rather than continuous</li>
                <li><strong>Quantum Mechanics:</strong> Uncertainty might arise from computational irreducibility</li>
                <li><strong>Relativity:</strong> Speed of light limits might reflect computational constraints</li>
                <li><strong>Conservation Laws:</strong> Could emerge from computational symmetries</li>
            </ul>
            <p>This "digital physics" approach suggests a fundamental revision of how we understand reality.</p>
        `
    },
    computation: {
        title: "Computation as Fundamental Framework",
        content: `
            <p>Wolfram argues that computation provides a more fundamental framework for understanding nature than traditional mathematics:</p>
            <ul>
                <li><strong>Universality:</strong> Simple computational systems can be as powerful as any computer</li>
                <li><strong>Irreducibility:</strong> Many computations cannot be shortened or predicted without running them</li>
                <li><strong>Emergence:</strong> Complex behaviors arise naturally from simple computational processes</li>
                <li><strong>Equivalence:</strong> Most complex systems exhibit equivalent computational sophistication</li>
            </ul>
            <p>This paradigm shift moves beyond equations to algorithmic thinking about natural phenomena.</p>
        `
    },
    vonneumann: {
        title: "John von Neumann's Contributions",
        content: `
            <p>John von Neumann (1903-1957) laid crucial groundwork for computational science:</p>
            <ul>
                <li><strong>Cellular Automata:</strong> Invented the concept in the 1940s to study self-reproduction</li>
                <li><strong>Universal Constructor:</strong> Designed a theoretical machine that could replicate itself</li>
                <li><strong>Computer Architecture:</strong> The "von Neumann architecture" still underlies modern computers</li>
                <li><strong>Mathematical Foundations:</strong> Contributed to game theory, quantum mechanics, and set theory</li>
            </ul>
            <p>Von Neumann recognized that computation could be a tool for scientific discovery, not just calculation.</p>
        `
    },
    "elementary-ca": {
        title: "Elementary Cellular Automata",
        content: `
            <p>Elementary cellular automata are the simplest class of cellular automata, operating on a one-dimensional array of cells with binary states (0 or 1).</p>
            <p><strong>Key Properties:</strong></p>
            <ul>
                <li>Each cell looks at itself and its two immediate neighbors</li>
                <li>There are 2³ = 8 possible local configurations</li>
                <li>There are 2⁸ = 256 possible rules</li>
                <li>Rules are numbered 0-255 in binary representation</li>
            </ul>
            <p>Despite their simplicity, these 256 rules exhibit an amazing variety of behaviors, from simple patterns to complex, seemingly random structures.</p>
        `
    },
    class4: {
        title: "Class 4 Cellular Automata",
        content: `
            <p>Wolfram classified cellular automata behavior into four classes:</p>
            <ul>
                <li><strong>Class 1:</strong> Evolution leads to homogeneous state</li>
                <li><strong>Class 2:</strong> Evolution leads to simple stable or periodic structures</li>
                <li><strong>Class 3:</strong> Evolution leads to chaotic, seemingly random patterns</li>
                <li><strong>Class 4:</strong> Complex, interesting behavior with local structures</li>
            </ul>
            <p><strong>Class 4 systems are special because:</strong></p>
            <ul>
                <li>They exist at the "edge of chaos" between order and randomness</li>
                <li>They can support complex computation and information processing</li>
                <li>They often exhibit universal computation capabilities</li>
                <li>Examples include Rule 110 and Conway's Game of Life</li>
            </ul>
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
        link.addEventListener('click', function(e) {
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
    console.log('Processing annotation links in Markdown:', markdown);
    // Convert [text](annotation:key) to HTML before markdown parsing
    const processed = markdown.replace(
        /\[([^\]]+)\]\(annotation:([^)]+)\)/g,
        '<span class="annotation-link" data-annotation="$2">$1</span>'
    );
    console.log('Processed Markdown:', processed);
    return processed;
}

function processAnnotationLinks(html) {
    console.log('Processing annotation links in HTML:', html);
    // Convert [text](annotation:key) to clickable annotation links
    const processed = html.replace(
        /\[([^\]]+)\]\(annotation:([^)]+)\)/g,
        '<a href="#" class="annotation-link" data-annotation="$2">$1</a>'
    );
    console.log('Processed HTML:', processed);
    return processed;
}

function initAnnotationSystem() {
    // Add click event listeners to all annotation links
    document.addEventListener('click', function(e) {
        console.log('Click detected on:', e.target);
        console.log('Has annotation-link class:', e.target.classList.contains('annotation-link'));
        
        if (e.target.classList.contains('annotation-link')) {
            e.preventDefault();
            console.log('Annotation link clicked!');
            
            // Remove active class from all annotation links
            document.querySelectorAll('.annotation-link').forEach(link => {
                link.classList.remove('active');
            });
            
            // Add active class to clicked link
            e.target.classList.add('active');
            
            // Get annotation data
            const annotationKey = e.target.getAttribute('data-annotation');
            console.log('Annotation key:', annotationKey);
            showAnnotation(annotationKey);
        }
    });
}

function showAnnotation(key) {
    console.log('showAnnotation called with key:', key);
    const annotationContent = document.getElementById('annotation-content');
    console.log('annotationContent element:', annotationContent);
    const annotation = annotations[key];
    console.log('Found annotation:', annotation);
    
    if (annotation) {
        annotationContent.innerHTML = `
            <div class="annotation-title">${annotation.title}</div>
            <div class="annotation-text">${annotation.content}</div>
        `;
        console.log('Annotation content updated');
    } else {
        annotationContent.innerHTML = `
            <h3>Annotation Not Found</h3>
            <p class="placeholder">The annotation "${key}" is not yet available. Add it to the annotations object in script.js</p>
        `;
        console.log('Annotation not found, showing error message');
    }
}

function clearAnnotationContent() {
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