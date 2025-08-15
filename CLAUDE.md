# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a client-side web application that presents notes and annotations for Stephen Wolfram's "A New Kind of Science". The project creates an interactive reading experience with three columns: chapter outline, main content, and detailed annotations.

## Architecture

- **Pure vanilla JavaScript** - No frameworks or build tools required
- **Static file serving** - All content is served as static files
- **Markdown-based content** - Chapter notes stored as individual `.md` files in `/chapters/`
- **Client-side rendering** - Uses `marked.js` library to parse markdown on the client
- **Animation libraries** - Uses AOS (Animate On Scroll) and Typed.js for visual effects

## Key Files Structure

- `index.html` - Main HTML structure with three-column grid layout
- `script.js` - Core JavaScript functionality including:
  - Chapter navigation and loading system
  - Annotation system with typewriter effects
  - Cellular automata background animation (Rule 30)
  - Markdown parsing and link processing
- `styles.css` - CSS with modern grid layout and glass-morphism design
- `chapters/` - Directory containing chapter content as markdown files
- `reference/` - Static assets like book cover image

## Development Commands

Since this is a static HTML/CSS/JS project with no build system:

- **Local development**: Use any static file server (e.g., `python -m http.server 8000` or `npx serve`)
- **No build step required** - Files can be opened directly in browser or served statically
- **No linting configured** - Standard web development practices apply

## Content Management

- **Adding chapters**: Create new `.md` files in `chapters/` directory following naming pattern `chapter[N].md`
- **Annotation system**: Add new annotations to the `annotations` object in `script.js`
- **Linking annotations**: Use `[text](annotation:key)` syntax in markdown files
- **Chapter navigation**: Update chapter list in `index.html` when adding new chapters

## Key Features

- **Responsive three-column layout** using CSS Grid
- **Cellular automata background** implementing Wolfram's Rule 30
- **Typewriter animation** for annotations using Typed.js library
- **Glass-morphism UI design** with subtle animations and hover effects
- **Annotation linking system** connecting main content to detailed explanations

## Technical Notes

- The cellular automata background runs Rule 30 continuously for visual effect
- Annotation links are processed before markdown parsing to maintain proper HTML structure
- The application gracefully handles missing chapter files with error states
- All external dependencies are loaded from CDN (marked.js, Typed.js, AOS)