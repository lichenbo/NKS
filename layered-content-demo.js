// Layered Content System for Option 2 Implementation
// This would be integrated into the main script.js

class LayeredContentSystem {
    constructor() {
        this.currentMode = 'simplified';
        this.init();
    }

    init() {
        this.createModeToggleListeners();
        this.createExpandToggleListeners();
        this.updateContentVisibility();
    }

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

    createExpandToggleListeners() {
        document.addEventListener('click', (e) => {
            const expandToggle = e.target.closest('.expand-toggle');
            if (!expandToggle) return;

            const targetMode = expandToggle.dataset.target;
            this.toggleSection(expandToggle, targetMode);
        });
    }

    switchMode(newMode) {
        this.currentMode = newMode;
        this.updateModeButtons();
        this.updateContentVisibility();
        
        // Save preference
        localStorage.setItem('nks-reading-mode', newMode);
        
        // Smooth scroll to top when switching modes
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updateModeButtons() {
        const modeButtons = document.querySelectorAll('.mode-toggle');
        modeButtons.forEach(btn => {
            const isActive = btn.dataset.mode === this.currentMode;
            btn.classList.toggle('active', isActive);
        });
    }

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

    // Load saved reading mode preference
    loadSavedMode() {
        const savedMode = localStorage.getItem('nks-reading-mode');
        if (savedMode && (savedMode === 'simplified' || savedMode === 'detailed')) {
            this.currentMode = savedMode;
        }
        this.updateModeButtons();
        this.updateContentVisibility();
    }
}

// Initialize the layered content system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const layeredSystem = new LayeredContentSystem();
    layeredSystem.loadSavedMode();
});

// Integration with existing chapter loading system
function enhanceChapterLoading() {
    const originalLoadChapter = window.loadChapter;
    
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