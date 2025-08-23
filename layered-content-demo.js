/**
 * Layered Content System for progressive disclosure in educational content
 * Provides dual-mode content display (simplified/detailed) with expand/collapse functionality
 * Designed for integration with main script.js for Chapter 1 layered content feature
 * 
 * Key Features:
 * - Two reading modes: simplified and detailed views
 * - Section-by-section expand/collapse functionality
 * - Persistent user preference storage in localStorage
 * - Smooth animations and auto-scroll for enhanced UX
 * - Chinese text support with appropriate toggle text
 * 
 * Time Complexity: O(n) for DOM updates where n is number of content sections
 * Space Complexity: O(1) for mode state management
 * 
 * @class LayeredContentSystem
 */
class LayeredContentSystem {
    /**
     * Initialize layered content system with default simplified mode
     * Sets up initial state and triggers system initialization
     * 
     * Time Complexity: O(1)
     * Space Complexity: O(1)
     */
    constructor() {
        this.currentMode = 'simplified';
        this.init();
    }

    /**
     * Initialize event listeners and content visibility
     * Sets up all required event handlers and applies initial content state
     * 
     * Time Complexity: O(n) where n is number of content elements
     * Space Complexity: O(1) for event listeners
     * 
     * @returns {void}
     * @private
     */
    init() {
        this.createModeToggleListeners();
        this.createExpandToggleListeners();
        this.updateContentVisibility();
    }

    /**
     * Create event listeners for mode toggle buttons (simplified/detailed)
     * Uses event delegation to handle mode switching between simplified and detailed views
     * 
     * Time Complexity: O(1) for event listener setup
     * Space Complexity: O(1) for event handler
     * 
     * @returns {void}
     * @private
     */
    createModeToggleListeners() {
        document.addEventListener('click', (e) => {
            const modeToggle = e.target.closest('.mode-toggle');
            if (!modeToggle) return;

            const newMode = modeToggle.dataset.mode;
            if (newMode !== this.currentMode) {
                this.switchMode(newMode);
            }
        });
    }

    /**
     * Create event listeners for individual section expand/collapse toggles
     * Uses event delegation to handle section-level expand/collapse functionality
     * 
     * Time Complexity: O(1) for event listener setup
     * Space Complexity: O(1) for event handler
     * 
     * @returns {void}
     * @private
     */
    createExpandToggleListeners() {
        document.addEventListener('click', (e) => {
            const expandToggle = e.target.closest('.expand-toggle');
            if (!expandToggle) return;

            const targetMode = expandToggle.dataset.target;
            this.toggleSection(expandToggle, targetMode);
        });
    }

    /**
     * Switch between reading modes (simplified/detailed) with persistence
     * Updates UI state, saves preference, and provides smooth navigation experience
     * 
     * Time Complexity: O(n) where n is number of mode buttons and content elements
     * Space Complexity: O(1) for state storage
     * 
     * @param {string} newMode - Target mode ('simplified' or 'detailed')
     * @returns {void}
     * @public
     */
    switchMode(newMode) {
        this.currentMode = newMode;
        this.updateModeButtons();
        this.updateContentVisibility();
        
        // Save preference
        localStorage.setItem('nks-reading-mode', newMode);
        
        // Smooth scroll to top when switching modes
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Update visual state of mode toggle buttons
     * Applies active class to current mode button and removes from others
     * 
     * Time Complexity: O(n) where n is number of mode buttons
     * Space Complexity: O(1)
     * 
     * @returns {void}
     * @private
     */
    updateModeButtons() {
        const modeButtons = document.querySelectorAll('.mode-toggle');
        modeButtons.forEach(btn => {
            const isActive = btn.dataset.mode === this.currentMode;
            btn.classList.toggle('active', isActive);
        });
    }

    /**
     * Update visibility of content layers based on current mode
     * Handles complex visibility logic for simplified/detailed content and controls
     * 
     * Key Operations:
     * - Show/hide simplified and detailed content layers
     * - Toggle expand/collapse button visibility
     * - Update summary sections based on mode
     * - Reset expand states when switching modes
     * 
     * Time Complexity: O(n) where n is total number of content elements
     * Space Complexity: O(1)
     * 
     * @returns {void}
     * @private
     */
    updateContentVisibility() {
        const simplifiedLayers = document.querySelectorAll('.content-layer.simplified');
        const detailedLayers = document.querySelectorAll('.content-layer.detailed');
        const expandToggles = document.querySelectorAll('.expand-toggle');
        const summaries = document.querySelectorAll('.chapter-summary');

        if (this.currentMode === 'simplified') {
            // Show simplified content
            simplifiedLayers.forEach(layer => {
                layer.style.display = 'block';
                layer.classList.add('active-layer');
            });

            // Hide detailed content
            detailedLayers.forEach(layer => {
                layer.style.display = 'none';
                layer.classList.remove('active-layer');
            });

            // Show expand toggles
            expandToggles.forEach(toggle => {
                toggle.style.display = 'flex';
                toggle.dataset.expanded = 'false';
                this.updateToggleText(toggle, false);
            });

            // Show appropriate summary
            summaries.forEach(summary => {
                const isSimplified = summary.classList.contains('simplified');
                summary.style.display = isSimplified ? 'block' : 'none';
            });

        } else if (this.currentMode === 'detailed') {
            // Show detailed content
            detailedLayers.forEach(layer => {
                layer.style.display = 'block';
                layer.classList.add('active-layer');
            });

            // Hide simplified content and toggles
            simplifiedLayers.forEach(layer => {
                layer.style.display = 'none';
                layer.classList.remove('active-layer');
            });

            expandToggles.forEach(toggle => {
                toggle.style.display = 'none';
            });

            // Show appropriate summary
            summaries.forEach(summary => {
                const isDetailed = summary.classList.contains('detailed');
                summary.style.display = isDetailed ? 'block' : 'none';
            });
        }
    }

    /**
     * Toggle expand/collapse state of individual content section
     * Provides smooth animation with height transitions and auto-scroll
     * 
     * Animation Features:
     * - Smooth height transitions using maxHeight
     * - Auto-scroll to bring expanded content into view
     * - Delayed display changes for smooth visual transitions
     * 
     * Time Complexity: O(1) for DOM manipulation
     * Space Complexity: O(1)
     * 
     * @param {HTMLElement} toggleButton - The button element that triggered toggle
     * @param {string} targetMode - Target mode identifier (unused in current implementation)
     * @returns {void}
     * @public
     */
    toggleSection(toggleButton, targetMode) {
        const isExpanded = toggleButton.dataset.expanded === 'true';
        const section = toggleButton.parentElement;
        const detailedLayer = section.querySelector('.content-layer.detailed');

        if (!detailedLayer) return;

        if (!isExpanded) {
            // Expand to show detailed content
            detailedLayer.style.display = 'block';
            detailedLayer.style.maxHeight = detailedLayer.scrollHeight + 'px';
            toggleButton.dataset.expanded = 'true';
            
            // Smooth scroll to bring detailed content into view
            setTimeout(() => {
                detailedLayer.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start',
                    inline: 'nearest' 
                });
            }, 300);
        } else {
            // Collapse to hide detailed content
            detailedLayer.style.maxHeight = '0px';
            setTimeout(() => {
                detailedLayer.style.display = 'none';
            }, 300);
            toggleButton.dataset.expanded = 'false';
        }

        this.updateToggleText(toggleButton, !isExpanded);
    }

    /**
     * Update toggle button text and icon based on expand/collapse state
     * Handles Chinese text for expand/collapse and icon rotation animation
     * 
     * Time Complexity: O(1)
     * Space Complexity: O(1)
     * 
     * @param {HTMLElement} toggle - Toggle button element
     * @param {boolean} isExpanded - Current expanded state
     * @returns {void}
     * @private
     */
    updateToggleText(toggle, isExpanded) {
        const textElement = toggle.querySelector('.toggle-text');
        const iconElement = toggle.querySelector('.toggle-icon');
        
        if (textElement) {
            textElement.textContent = isExpanded ? '收起详细内容' : '展开详细内容';
        }
        
        if (iconElement) {
            iconElement.textContent = isExpanded ? '▲' : '▼';
            iconElement.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    }

    /**
     * Load saved reading mode preference from localStorage
     * Restores user's preferred reading mode and applies corresponding UI state
     * 
     * Time Complexity: O(n) where n is number of content elements for visibility update
     * Space Complexity: O(1) for preference retrieval
     * 
     * @returns {void}
     * @public
     */
    loadSavedMode() {
        const savedMode = localStorage.getItem('nks-reading-mode');
        if (savedMode && (savedMode === 'simplified' || savedMode === 'detailed')) {
            this.currentMode = savedMode;
        }
        this.updateModeButtons();
        this.updateContentVisibility();
    }
}

/**
 * Initialize the layered content system when DOM is ready
 * Creates LayeredContentSystem instance and loads saved user preferences
 * 
 * Time Complexity: O(n) where n is number of content elements
 * Space Complexity: O(1) for system instance
 */
document.addEventListener('DOMContentLoaded', () => {
    const layeredSystem = new LayeredContentSystem();
    layeredSystem.loadSavedMode();
});

/**
 * Integration with existing chapter loading system
 * Enhances the global loadChapter function to support layered content initialization
 * Uses function wrapping pattern to extend existing functionality without breaking changes
 * 
 * Integration Pattern:
 * - Preserves original loadChapter functionality
 * - Adds layered content system initialization for chapters with layered content
 * - Automatically detects and initializes layered content elements
 * 
 * Time Complexity: O(n) where n is content elements (when layered content present)
 * Space Complexity: O(1) for function enhancement
 * 
 * @function enhanceChapterLoading
 * @returns {void}
 * 
 * Called by: Manual integration when needed
 * Calls: LayeredContentSystem constructor and methods
 */
function enhanceChapterLoading() {
    const originalLoadChapter = window.loadChapter;
    
    /**
     * Enhanced loadChapter function with layered content support
     * Wraps original loadChapter to add layered content system initialization
     * 
     * @async
     * @param {string} chapterId - Chapter identifier to load
     * @returns {Promise<void>} Resolves when chapter and layered content are loaded
     */
    window.loadChapter = async function(chapterId) {
        // Call original function
        await originalLoadChapter(chapterId);
        
        // Initialize layered content for the new chapter
        if (document.querySelector('.content-layer')) {
            const layeredSystem = new LayeredContentSystem();
            layeredSystem.loadSavedMode();
        }
    };
}