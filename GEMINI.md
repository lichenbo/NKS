# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Project Overview

This is a client-side web application that presents notes and annotations for Stephen Wolfram's "A New Kind of Science". The project creates an interactive reading experience with three columns: chapter outline, main content, and detailed annotations.

## Architecture

- **Pure vanilla JavaScript** - No frameworks or build tools required
- **Static file serving** - All content is served as static files
- **Markdown-based content** - Chapter notes and annotations stored as individual `.md` files
- **Client-side rendering** - Uses `marked.js` library to parse markdown on the client
- **Animation libraries** - Uses AOS (Animate On Scroll) and custom incremental typing for visual effects
- **Multilingual support** - Full English/Chinese/Japanese language system with separate content files
- **Modular JavaScript architecture** - Core functionality separated into focused modules using IIFE patterns and APP namespace

## Key Files Structure

- `index.html` - Main HTML structure with three-column CSS Grid layout, language toggle, and cellular automata canvases
- `script.js` - Core JavaScript functionality including:
  - Chapter navigation and loading system with special handling for layered Chapter 1 (Chinese only)
  - Annotation system with custom incremental typing effects and caching
  - Dual cellular automata animations (background Rule 30, header cycling through multiple rules)
  - Markdown parsing with annotation link preprocessing
  - Visual enhancement system with educational images and computational art examples
  - **Layered content system with expand/collapse functionality for progressive disclosure**
- `js/` - Modular JavaScript components organized for maintainability:
  - `js/translations.js` - Complete trilingual translation system (EN/ZH/JA) with fallback mechanisms and localStorage persistence
  - `js/chatbot.js` - **AI-powered NKS Assistant with RAG model API integration for intelligent Q&A about "A New Kind of Science"**
  - `js/game-of-life.js` - **Conway's Game of Life implementation with 12 famous patterns, multiple grid sizes, and mobile optimization**
- `styles.css` - Modern CSS with:
  - CSS Grid responsive three-column layout
  - Glass-morphism design with hover effects
  - Custom scrollbars and animations
  - Mobile-first responsive breakpoints
  - Dark theme with gold accents
  - **Layered content system styling with smooth transitions and expand/collapse buttons**
- `chapters/` - Chapter content as markdown files
  - `intro-demo.md` - Interactive Conway's Game of Life demo (introduction page)
  - `chapter1.md` - Hybrid version combining comprehensive coverage with Wolfram's personal discovery narrative
  - `chapter2.md`, `chapter3.md` - Additional English chapters
  - `preface.md` - Project preface and introduction
  - `zh/` - Chinese translations (intro-demo.md, chapter1.md, chapter2.md, chapter3.md, preface.md)
    - `chapter1_layered.md` - **Special layered version of Chapter 1 with collapsible content sections**
  - `ja/` - Japanese translations (preface.md, intro-demo.md)
- `annotations/` - Annotation content as individual markdown files
  - Individual annotation files (e.g., `cellular-automata.md`, `emergence.md`, `computational-art.md`)
  - `zh/` subdirectory for Chinese translations
  - `ja/` subdirectory for Japanese translations
- `images/` - Educational visual content organized by category
  - `cellular-automata/` - Rule examples, evolution patterns, and CA demonstrations
  - `computational-art/` - Algorithmic art examples (fractals, patterns, generative art)
  - `chaos/` - Chaos theory visualizations and attractors
  - `fractals/` - Fractal geometry examples and mathematical visualizations
  - `turing-machines/` - Universal Turing Machine diagrams and computational examples
- `reference/` - Static assets including book cover and chapter PDFs organized by chapter directories

## Development Commands

Since this is a static HTML/CSS/JS project with no build system:

- **Local development**: Use any static file server (e.g., `python -m http.server 8000` or `npx serve`)
- **No build step required** - Files can be opened directly in browser or served statically
- **No linting configured** - Standard web development practices apply

## Content Management

### Chapter System
- **Adding chapters**: Create new `.md` files in `chapters/` directory following naming pattern `chapter[N].md`
- **Hybrid chapter approach**: Chapter 1 uses hybrid format combining comprehensive technical coverage with engaging personal narrative
  - `chapter1.md` contains the hybrid approach with Wolfram's personal discovery journey integrated throughout
  - Maintains all annotation links and educational completeness from academic structure
  - Integrates first-person narrative elements for enhanced reader engagement while preserving technical depth
- **Layered content system**: Chapter 1 Chinese version (`chapters/zh/chapter1_layered.md`) uses special layered format
  - Content organized into `.content-layer.simplified` and `.content-layer.detailed` sections
  - Expand/collapse buttons (`<button class="expand-toggle">`) allow progressive disclosure
  - Detailed sections start hidden and can be expanded section by section
  - Only available for Chinese language version - English/Japanese use regular format
  - Automatically detected and loaded when viewing Chapter 1 in Chinese
- **Multilingual chapters**: Add corresponding files in `chapters/zh/` for Chinese and `chapters/ja/` for Japanese versions
- **Chapter navigation**: Update chapter list in `index.html` and add translations to `script.js` translations object
- **Visual content**: Enhanced with educational images and computational art examples to improve accessibility

### Annotation System
- **Individual annotation files**: Each annotation is stored as a separate `.md` file in `annotations/` directory
- **Annotation naming**: Use kebab-case naming (e.g., `cellular-automata.md`, `emergence.md`, `computational-art.md`)
- **Multilingual annotations**: Add corresponding files in `annotations/zh/` for Chinese and `annotations/ja/` for Japanese versions
- **Linking annotations**: Use `[text](annotation:key)` syntax in chapter markdown files
- **Internal link restriction**: Annotation files should NOT contain internal annotation links `[text](annotation:key)` to prevent non-functional links
- **External links only**: Only external links (http/https) are allowed in annotation files and will open in new tabs
- **Visual content**: Annotations enhanced with educational images, diagrams, and computational art examples
- **Annotation caching**: Annotations are cached by language in `annotationCache` object

### Language System
- **Default language**: Application defaults to Chinese ('zh') for new users
- **Three-way language toggle**: Header displays all three languages (EN | 中文 | 日本語) simultaneously with active highlighting
- **Persistent language**: User's language preference is saved in localStorage as 'nks-language'
- **Content loading**: System automatically loads correct language version of chapters and annotations
- **Fallback system**: Japanese content falls back to Chinese, then English if translation doesn't exist
- **Translation object**: All UI text is stored in `translations` object in `js/translations.js` with complete EN/ZH/JA support

## Translation and Content Notes
- **Chinese Title for "A New Kind of Science"**: The standard Chinese translation for the book title "A New Kind of Science" should be "一种新科学", not "一种新的科学". This has been updated across all relevant files.

## Key Features

- **Interactive Conway's Game of Life demo** as introduction page with 12 sample patterns:
  - Glider, Blinker, Toad, Beacon (basic patterns)
  - Pulsar, Pentadecathlon (oscillators)
  - Lightweight Spaceship, Gosper Gun (spaceships/generators)
  - Acorn, Diehard, R-Pentomino, Infinite Growth (complex/methuselah patterns)
  - Full trilingual support (EN/ZH/JA) with interactive controls and pattern library
- **Responsive three-column layout** using CSS Grid with mobile breakpoints
- **Dual cellular automata animations**:
  - Background: Static Rule 30 pattern with golden fade effect
  - Header: Cycling through multiple rules (30, 90, 110, 54, 150, 126) with breathing animation
- **Custom incremental typing animation** for annotations with HTML content support (replaced Typed.js)
- **Glass-morphism UI design** with subtle transparency, blur effects, and hover interactions
- **Annotation linking system** connecting main content to detailed explanations with active state
- **Complete trilingual support** (EN/ZH/JA) with seamless language switching and visual content enhancement
- **Progressive disclosure system** with layered content for Chapter 1 Chinese version:
  - Simplified content shown by default for easier reading
  - Detailed explanations available through expand/collapse buttons
  - Smooth animations and auto-scroll for enhanced UX
  - Section-by-section control over content depth
- **Educational visual system** with computational art examples, cellular automata demonstrations, and mathematical visualizations
- **Image lightbox overlay** with click-to-zoom functionality for educational images and diagrams with accessibility features
- **Sticky sidebar panels** for outline and annotations with custom scrollbars
- **Mobile scroll-to-top button** for improved navigation on mobile devices
- **AI-powered NKS Chatbot** with intelligent question-answering capabilities:
  - Desktop: Expandable input bar positioned in annotations column area
  - Mobile: Round floating button (💬) expanding to full-screen conversation
  - RAG model integration via API (https://nks-746942233281.us-west1.run.app)
  - Complete trilingual support with context-aware responses
  - Glass-morphism design consistent with site aesthetics

## Technical Notes

### Cellular Automata System
- Background canvas runs Rule 30 continuously with slow animation (200ms intervals)
- Header canvas cycles through different cellular automata rules with faster animation (150ms intervals)
- Both use golden color scheme with gradient and age-based fading effects
- Rule indicators in header show current background and header rules with language support

### Conway's Game of Life Demo
- **Interactive canvas** with mouse click and touch input support for cell toggling
- **Control system**: Play/Pause, Step, Clear, Random, and speed controls (0.25x to 10x)
- **Grid size options**: 20×20, 40×40, 100×100, 300×300 with sophisticated initial patterns
- **Pattern library**: 12 famous Conway patterns with emoji icons and trilingual names
- **Game logic**: Complete implementation of Conway's rules with neighbor counting
- **Mobile optimizations**: Touch event handling, responsive canvas sizing, and flowing button layout
- **Trilingual support**: All UI elements and instructions available in English, Chinese, and Japanese
- **Advanced features**: Orientation change handling, coordinate scaling for accuracy, and visual feedback

### Annotation System
- **Desktop Mode (≥769px)**: Annotations display in right sidebar with custom incremental typing effect
- **Tablet & Mobile Mode (≤768px)**: Inline annotations insert directly into document flow
- **Inline Annotation Behavior**:
  - Insert immediately after paragraph/element containing clicked link
  - Push down subsequent content naturally (occupy document space)
  - Stay fixed with content during scrolling (not floating overlays)
  - Single instance: remove existing annotations before creating new ones
  - Expand/collapse toggle button (−/+) for content control
  - Smooth auto-scroll to bring annotation into view
- **Processing**: Links use pattern `[text](annotation:key)` converted to `<span class="annotation-link" data-annotation="key">text</span>`
- **Content**: Custom incremental typing supports HTML content with proper cursor styling
- **Visual**: Active annotation links highlighted with golden background

### Layered Content System
- **Chapter detection**: `loadChapter()` function automatically detects Chapter 1 + Chinese language combination
- **Special loading**: Uses `chapters/zh/chapter1_layered.md` instead of regular chapter file
- **Content structure**: Markdown contains HTML divs with `.content-layer.simplified` and `.content-layer.detailed` classes
- **Toggle buttons**: `<button class="expand-toggle" data-expanded="false">` elements control section visibility
- **JavaScript functions**:
  - `initLayeredContentSystem()` - Sets up event listeners for expand/collapse buttons
  - `toggleLayeredSection()` - Handles expanding/collapsing with smooth animations
  - `updateToggleText()` - Updates button text based on current language and state
- **Progressive disclosure**: Detailed content starts hidden (`display: none`) and expands on demand
- **Auto-scroll**: Expanded content automatically scrolls into view for better UX
- **Responsive**: Works on all device sizes with adjusted button sizing

### Language Implementation
- Fallback system: Japanese → Chinese → English for missing translations
- Language-specific caching prevents cross-language content mixing
- All UI elements use `data-i18n` attributes for automatic translation updates
- Chapter links are dynamically updated when language changes
- Three-button language selector shows all options simultaneously with active highlighting

### Responsive Design
- Mobile-first approach with breakpoints at 480px, 768px, 900px, 1024px, 1200px, 1400px
- Three-column layout collapses to stacked layout on tablets and below (≤768px)
- Annotations column is hidden in stacked layout (≤768px) to prevent duplication
- JavaScript handles annotation display: sidebar (≥769px) or inline (≤768px)
- Outline panel becomes non-sticky on tablets/mobile with reduced max-height
- Chapter navigation becomes grid layout on mobile for better touch interaction
- **Language switcher mobile optimization**: Header content positioned with adequate top margin (3rem on tablets, 3.5rem on phones) to prevent overlap with language selector

### Mobile Navigation Enhancement
- **Scroll-to-Top Button**: Fixed circular button in bottom-right corner (mobile phones only ≤480px)
- **Smart Visibility**: Appears only after scrolling 300px down from top
- **Responsive Sizing**: 50px (tablet) → 45px (mobile) → 40px (small mobile)
- **Smooth Behavior**: Throttled scroll detection and smooth scroll animation
- **Visual Design**: Glass-morphism with golden hover effects matching site theme
- **Touch-Friendly**: Adequate size for mobile touch targets with hover feedback

### NKS Chatbot System
- **API Integration**: Connects to RAG model API for intelligent responses about book content
- **Responsive Behavior**: Different UI patterns for desktop vs mobile
  - Desktop (≥769px): Input bar aligned with annotations column, expands to conversation view
  - Mobile (≤768px): Round floating button that opens full-screen conversation
- **State Management**: Tracks conversation history, typing indicators, and expanded states
- **Dynamic Positioning**: JavaScript calculates exact alignment with annotations column on desktop
- **Language Support**: Multilingual placeholders and UI elements with automatic translation updates
- **Error Handling**: Graceful fallbacks for API failures with user-friendly error messages
- **Visual Consistency**: Glass-morphism design with golden accents matching site aesthetic

### Modular JavaScript Architecture
- **IIFE Pattern**: All modules use Immediately Invoked Function Expression pattern for encapsulation
- **APP Namespace**: Consistent `window.APP` namespace prevents global scope pollution
- **Revealing Module Pattern**: Each module exposes only necessary public methods through APP namespace
- **Loading Order**: Critical dependency order: `translations.js` → `chatbot.js` → `game-of-life.js` → `script.js`
- **Backward Compatibility**: Global window exposure maintained for existing functionality
- **Module Structure**:
  ```javascript
  (function(APP) {
      'use strict';
      // Module implementation
      APP.ModuleName = {
          publicMethod1,
          publicMethod2
      };
  })(window.APP = window.APP || {});
  ```
- **Benefits**: Improved maintainability, reduced script.js size from ~3000+ to ~1750 lines (40% reduction)

## Dependencies

All external dependencies are loaded from CDN:
- `marked.js` - Markdown parsing
- `AOS` - Animate On Scroll library
- Google Fonts: Inter (primary) and JetBrains Mono (monospace)

Note: Typed.js was replaced with custom incremental typing implementation to prevent image reloading issues and improve performance.