# A New Kind of Science - Interactive Notes

Chinese version: `README.md`

A client-side web application presenting personal notes and annotations for Stephen Wolfram's groundbreaking book "A New Kind of Science". This project creates an immersive reading experience with a three-column layout featuring chapter outlines, main content, and detailed annotations.

## 🌐 Live Demo

**[View the Interactive Notes](https://lichenbo.github.io/NKS/)**

## ✨ Features

- **Three-Column Layout**: Chapter outline, main content, and detailed annotations
- **Interactive Annotations**: Click on highlighted terms to view detailed explanations with typewriter effects
- **Cellular Automata Background**: Live implementation of Wolfram's Rule 30 creating dynamic visual patterns
- **Responsive Design**: Optimized for desktop, tablet, and mobile viewing
- **Glass-Morphism UI**: Modern design with subtle animations and hover effects
- **Markdown-Based Content**: Easy-to-edit chapter content stored as individual `.md` files

## 🏗️ Architecture

- **Pure Vanilla JavaScript** - No frameworks or build tools required
- **Static File Serving** - All content served as static files, perfect for GitHub Pages
- **Client-Side Rendering** - Uses `marked.js` library for markdown parsing
- **Animation Libraries** - AOS (Animate On Scroll) and Typed.js for visual effects

## 📁 Project Structure

```
/
├── index.html              # Main HTML structure
├── script.js               # Core JavaScript functionality
├── styles.css              # Styling (three-column grid, glass UI)
├── js/                     # Localization + utilities (e.g. translations)
├── chapters/               # Chapter notes (Markdown, per language)
│   ├── en/
│   ├── zh/
│   └── ja/
├── annotations/            # Annotations (Markdown, per language)
│   ├── en/
│   ├── zh/
│   └── ja/
├── demos/                  # Interactive demos referenced by chapters
├── images/                 # Images used by chapters/notes
└── interactive/            # Additional interactive pages
```

## 🚀 Local Development

Since this is a static HTML/CSS/JS project, you can run it locally using any static file server:

```bash
# Using Python (recommended)
python -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## 📝 Content Management

### Adding New Chapters
1. Create a new `.md` file in the `chapters/` directory following the pattern `chapter[N].md`
2. Update the chapter list in `index.html`
3. Add any new annotations to the `annotations/` directory

### Creating Annotations
- Add new annotation files to the `annotations/` directory
- Link annotations in markdown using the syntax: `[text](annotation:key)`
- The annotation system automatically processes these links before markdown parsing

### Annotation Linking System
In your markdown files, you can link to annotations like this:
```markdown
The concept of [computational equivalence](annotation:computational-equivalence) suggests that...
```

## 🎨 Key Technical Features

### Cellular Automata Background
- Continuous implementation of Wolfram's Rule 30
- Creates dynamic, ever-changing visual patterns
- Optimized for performance across devices

### Typewriter Animation System
- Uses Typed.js for smooth typewriter effects
- Enhances the reading experience with progressive text revelation
- Customizable timing and styling

### Responsive Grid Layout
- CSS Grid-based three-column layout
- Gracefully adapts to different screen sizes
- Sticky sidebars for enhanced navigation

## 🛠️ Technologies Used

- **HTML5** - Semantic structure
- **CSS3** - Modern grid layout, animations, glass-morphism effects
- **Vanilla JavaScript** - Core functionality, no framework dependencies
- **[Marked.js](https://marked.js.org/)** - Markdown parsing
- **[Typed.js](https://mattboldt.com/demos/typed-js/)** - Typewriter effects
- **[AOS](https://michalsnik.github.io/aos/)** - Animate On Scroll library
- **Google Fonts** - Inter and JetBrains Mono typography

## 📚 About "A New Kind of Science"

Stephen Wolfram's "A New Kind of Science" is a comprehensive exploration of computational systems and their implications for understanding natural and artificial phenomena. This interactive notes project aims to make the complex concepts more accessible through:

- **Visual Learning**: Animated backgrounds demonstrating cellular automata principles
- **Interactive Exploration**: Clickable annotations for deeper understanding
- **Structured Navigation**: Clear chapter organization and progress tracking

## 🤝 Contributing

This is a personal notes project, but suggestions and improvements are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your improvements
4. Submit a pull request

## 📄 License

This project is for educational and personal use. "A New Kind of Science" is copyrighted by Stephen Wolfram.

## 🔗 Related Links

- [Stephen Wolfram's Official Website](https://www.stephenwolfram.com/)
- [Wolfram Science](https://www.wolframscience.com/)
- [A New Kind of Science Online](https://www.wolframscience.com/nks/)

---

*Experience the intersection of computation, mathematics, and natural phenomena through interactive exploration.*
