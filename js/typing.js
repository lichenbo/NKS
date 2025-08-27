// Incremental typing module extracted from script.js

class IncrementalTyper {
  constructor(element, content, options = {}) {
    this.element = element;
    this.content = content;
    this.typeSpeed = options.typeSpeed || 10;
    this.onComplete = options.onComplete || (() => {});
    this.currentIndex = 0;
    this.isTyping = false;
    this.tokens = this.parseHTML(content);
    this.currentTokenIndex = 0;
    this.currentCharIndex = 0;
    this.cursor = null;
  }

  parseHTML(html) {
    const tokens = [];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    this.extractTokens(tempDiv.childNodes, tokens);
    return tokens;
  }

  extractTokens(nodes, tokens) {
    for (let node of nodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        for (let char of text) {
          tokens.push({ type: 'char', content: char });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName.toLowerCase() === 'img') {
          tokens.push({ type: 'element', element: node.cloneNode(true) });
        } else {
          tokens.push({ type: 'open_tag', element: node.cloneNode(false) });
          this.extractTokens(node.childNodes, tokens);
          tokens.push({ type: 'close_tag', tagName: node.tagName.toLowerCase() });
        }
      }
    }
  }

  start() {
    if (this.isTyping) return;
    this.isTyping = true;
    this.element.innerHTML = '';
    this.currentStack = [this.element];
    this.cursor = null;
    this.typeNextToken();
  }

  typeNextToken() {
    if (this.currentTokenIndex >= this.tokens.length) {
      if (this.cursor && this.cursor.parentNode) {
        this.cursor.parentNode.removeChild(this.cursor);
      }
      this.isTyping = false;
      this.onComplete();
      return;
    }

    const token = this.tokens[this.currentTokenIndex];
    const currentParent = this.currentStack[this.currentStack.length - 1];

    const insertBefore = (element) => {
      if (this.cursor && this.cursor.parentNode === currentParent) {
        currentParent.insertBefore(element, this.cursor);
      } else {
        currentParent.appendChild(element);
      }
    };

    switch (token.type) {
      case 'char': {
        const textNode = document.createTextNode(token.content);
        insertBefore(textNode);
        break;
      }
      case 'element': {
        insertBefore(token.element);
        break;
      }
      case 'open_tag': {
        const newElement = token.element.cloneNode(false);
        insertBefore(newElement);
        this.currentStack.push(newElement);
        break;
      }
      case 'close_tag': {
        this.currentStack.pop();
        break;
      }
    }

    this.currentTokenIndex++;
    const delay = token.type === 'element' ? 0 : this.typeSpeed;
    setTimeout(() => this.typeNextToken(), delay);
  }

  destroy() {
    this.isTyping = false;
    if (this.cursor && this.cursor.parentNode) {
      this.cursor.parentNode.removeChild(this.cursor);
    }
  }
}

function startIncrementalTyping(elementId, content, options = {}) {
  const element = DOM.byId(elementId);
  if (!element) return null;
  const typer = new IncrementalTyper(element, content, options);
  typer.start();
  return typer;
}

// Export to global scope for backward compatibility
window.IncrementalTyper = IncrementalTyper;
window.startIncrementalTyping = startIncrementalTyping;

