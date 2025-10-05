// Utility modules extracted from script.js

// DOM helpers
const DOM = {
  byId: (id) => document.getElementById(id),
  query: (selector) => document.querySelector(selector),
  queryAll: (selector) => document.querySelectorAll(selector),
  _cache: new Map(),
  cached: function (id) {
    if (!this._cache.has(id)) {
      this._cache.set(id, document.getElementById(id));
    }
    return this._cache.get(id);
  },
  clearCache: function () {
    this._cache.clear();
  },
};

// Event helpers
const Events = {
  onClick: function (selector, handler, options = {}) {
    const elements = typeof selector === 'string' ? DOM.queryAll(selector) : [selector];
    elements.forEach((el) => {
      if (el) {
        el.addEventListener('click', handler, options);
      }
    });
  },
  delegate: function (parent, selector, event, handler) {
    const parentEl = typeof parent === 'string' ? DOM.query(parent) : parent;
    if (parentEl) {
      parentEl.addEventListener(event, function (e) {
        if (e.target.matches && e.target.matches(selector)) {
          handler.call(e.target, e);
        }
      });
    }
  },
};

// Text utilities
const TextUtils = {
  processExternalLinks: function (html) {
    return html.replace(/<a href="https?:\/\/[^"]*"/g, function (match) {
      return match + ' target="_blank" rel="noopener noreferrer"';
    });
  },
  extractTitle: function (markdown, fallback = '') {
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : fallback;
  },
  processAnnotationLinks: function (markdown) {
    return markdown.replace(
      /\[([^\]]+)\]\(annotation:([^)]+)\)/g,
      '<span class="annotation-link" data-annotation="$2">$1</span>'
    );
  },
};

// Small helpers
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function isMobile() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 1)
  );
}

function shouldUseInlineAnnotations() {
  return window.innerWidth <= 768;
}

// Language-aware loader
async function loadLanguageFile(basePath, fileName, language = null) {
  const lang = language || window.currentLanguage;
  try {
    let response;
    if (lang === 'zh') {
      // Prefer Chinese-specific path, then generic
      response = await fetch(`${basePath}/zh/${fileName}`);
      if (!response.ok) {
        response = await fetch(`${basePath}/${fileName}`);
      }
    } else if (lang === 'ja') {
      // Prefer Japanese, then Chinese, then generic
      response = await fetch(`${basePath}/ja/${fileName}`);
      if (!response.ok) {
        response = await fetch(`${basePath}/zh/${fileName}`);
        if (!response.ok) {
          response = await fetch(`${basePath}/${fileName}`);
        }
      }
    } else if (lang === 'en') {
      // Prefer English subdir when available, then generic, then Chinese as last resort
      response = await fetch(`${basePath}/en/${fileName}`);
      if (!response.ok) {
        response = await fetch(`${basePath}/${fileName}`);
        if (!response.ok) {
          response = await fetch(`${basePath}/zh/${fileName}`);
        }
      }
    } else {
      // Unknown language code: try generic, then fall back to zh and en
      response = await fetch(`${basePath}/${fileName}`);
      if (!response.ok) {
        response = await fetch(`${basePath}/zh/${fileName}`);
        if (!response.ok) {
          response = await fetch(`${basePath}/en/${fileName}`);
        }
      }
    }

    if (!response || !response.ok) {
      throw new Error(`File not found: ${fileName}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error loading language file:', error);
    return null;
  }
}

// Export to global scope for backward compatibility
window.DOM = DOM;
window.Events = Events;
window.TextUtils = TextUtils;
window.debounce = debounce;
window.isMobile = isMobile;
window.shouldUseInlineAnnotations = shouldUseInlineAnnotations;
window.loadLanguageFile = loadLanguageFile;

// Add-on: normalize Markdown image/link paths to ./images/...
TextUtils.rewriteMarkdownAssets = function (container) {
  if (!container) return;

  const isAbsolute = (url) => /^(data:|https?:|\/\/)/.test(url);

  // Simple rule: convert any '../../' at start of attribute to './'
  container.querySelectorAll('img, a').forEach((el) => {
    const attr = el.tagName === 'A' ? 'href' : 'src';
    const val = el.getAttribute(attr);
    if (!val || isAbsolute(val)) return;

    if (val.startsWith('../')) {
      const normalized = val.replace(/^(\.\.\/)+/, './');
      el.setAttribute(attr, normalized);
    }
  });
};
