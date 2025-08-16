# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a client-side web application that presents notes and annotations for Stephen Wolfram's "A New Kind of Science". The project creates an interactive reading experience with three columns: chapter outline, main content, and detailed annotations.

## Architecture

- **Pure vanilla JavaScript** - No frameworks or build tools required
- **Static file serving** - All content is served as static files
- **Markdown-based content** - Chapter notes and annotations stored as individual `.md` files
- **Client-side rendering** - Uses `marked.js` library to parse markdown on the client
- **Animation libraries** - Uses AOS (Animate On Scroll) and Typed.js for visual effects
- **Bilingual support** - Full English/Chinese language system with separate content files

## Key Files Structure

- `index.html` - Main HTML structure with three-column CSS Grid layout, language toggle, and cellular automata canvases
- `script.js` - Core JavaScript functionality including:
  - Chapter navigation and loading system
  - Annotation system with typewriter effects and caching
  - Dual cellular automata animations (background Rule 30, header cycling through multiple rules)
  - Markdown parsing with annotation link preprocessing
  - Complete internationalization system with localStorage persistence
- `styles.css` - Modern CSS with:
  - CSS Grid responsive three-column layout
  - Glass-morphism design with hover effects
  - Custom scrollbars and animations
  - Mobile-first responsive breakpoints
  - Dark theme with gold accents
- `chapters/` - Chapter content as markdown files
  - `chapter1.md`, `chapter2.md`, `chapter3.md` (English)
  - `zh/chapter1.md`, `zh/chapter2.md`, `zh/chapter3.md` (Chinese)
- `annotations/` - Annotation content as individual markdown files
  - Individual annotation files (e.g., `cellular-automata.md`, `emergence.md`, etc.)
  - `zh/` subdirectory for Chinese translations
- `reference/` - Static assets including book cover and chapter PDFs organized by chapter directories

## Development Commands

Since this is a static HTML/CSS/JS project with no build system:

- **Local development**: Use any static file server (e.g., `python -m http.server 8000` or `npx serve`)
- **No build step required** - Files can be opened directly in browser or served statically
- **No linting configured** - Standard web development practices apply

## Content Management

### Chapter System
- **Adding chapters**: Create new `.md` files in `chapters/` directory following naming pattern `chapter[N].md`
- **Bilingual chapters**: Add corresponding files in `chapters/zh/` for Chinese versions
- **Chapter navigation**: Update chapter list in `index.html` and add translations to `script.js` translations object

### Annotation System
- **Individual annotation files**: Each annotation is stored as a separate `.md` file in `annotations/` directory
- **Annotation naming**: Use kebab-case naming (e.g., `cellular-automata.md`, `emergence.md`)
- **Bilingual annotations**: Add corresponding files in `annotations/zh/` for Chinese versions
- **Linking annotations**: Use `[text](annotation:key)` syntax in chapter markdown files
- **Internal link restriction**: Annotation files should NOT contain internal annotation links `[text](annotation:key)` to prevent non-functional links
- **External links only**: Only external links (http/https) are allowed in annotation files and will open in new tabs
- **Annotation caching**: Annotations are cached by language in `annotationCache` object

### Language System
- **Default language**: Application defaults to Chinese ('zh') for new users
- **Language toggle**: Button in header switches between English ('en') and Chinese ('zh')
- **Persistent language**: User's language preference is saved in localStorage as 'nks-language'
- **Content loading**: System automatically loads correct language version of chapters and annotations
- **Translation object**: All UI text is stored in `translations` object in `script.js`

## Key Features

- **Responsive three-column layout** using CSS Grid with mobile breakpoints
- **Dual cellular automata animations**:
  - Background: Static Rule 30 pattern with golden fade effect
  - Header: Cycling through multiple rules (30, 90, 110, 54, 150, 126) with breathing animation
- **Typewriter animation** for annotations using Typed.js library with HTML content support
- **Glass-morphism UI design** with subtle transparency, blur effects, and hover interactions
- **Annotation linking system** connecting main content to detailed explanations with active state
- **Complete bilingual support** with seamless language switching
- **Sticky sidebar panels** for outline and annotations with custom scrollbars

## Technical Notes

### Cellular Automata System
- Background canvas runs Rule 30 continuously with slow animation (200ms intervals)
- Header canvas cycles through different cellular automata rules with faster animation (150ms intervals)
- Both use golden color scheme with gradient and age-based fading effects
- Rule indicators in header show current background and header rules with language support

### Annotation System
- **Desktop Mode**: Annotations display in right sidebar with typewriter effect
- **Mobile Mode (≤768px)**: Inline annotations insert directly into document flow
- **Inline Annotation Behavior**:
  - Insert immediately after paragraph/element containing clicked link
  - Push down subsequent content naturally (occupy document space)
  - Stay fixed with content during scrolling (not floating overlays)
  - Single instance: remove existing annotations before creating new ones
  - Expand/collapse toggle button (−/+) for content control
  - Smooth auto-scroll to bring annotation into view
- **Processing**: Links use pattern `[text](annotation:key)` converted to `<span class="annotation-link" data-annotation="key">text</span>`
- **Content**: Typewriter effect supports HTML content with proper cursor styling
- **Visual**: Active annotation links highlighted with golden background

### Language Implementation
- Fallback system: Chinese content falls back to English if translation doesn't exist
- Language-specific caching prevents cross-language content mixing
- All UI elements use `data-i18n` attributes for automatic translation updates
- Chapter links are dynamically updated when language changes

### Responsive Design
- Mobile-first approach with breakpoints at 480px, 768px, 900px, 1024px, 1200px, 1400px
- Three-column layout collapses to stacked layout on mobile (768px and below)
- Annotations column is hidden on mobile (≤768px) since inline annotations are used instead
- Outline panel becomes non-sticky on mobile with reduced max-height
- Chapter navigation becomes grid layout on mobile for better touch interaction

## Dependencies

All external dependencies are loaded from CDN:
- `marked.js` - Markdown parsing
- `Typed.js` - Typewriter animations
- `AOS` - Animate On Scroll library
- Google Fonts: Inter (primary) and JetBrains Mono (monospace)