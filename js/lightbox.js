// Image lightbox extracted from script.js

function initImageLightbox() {
  let overlay = document.getElementById('image-lightbox');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'image-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Image viewer');
    overlay.innerHTML = `
      <div class="image-lightbox-content">
        <button class="image-lightbox-close" aria-label="Close">×</button>
        <img alt="" />
      </div>
    `;
    document.body.appendChild(overlay);
  }

  const imgEl = overlay.querySelector('img');
  const closeBtn = overlay.querySelector('.image-lightbox-close');
  let openerEl = null;
  let openerHadTabindex = null;
  let inertElements = [];

  const setInertOutside = (on) => {
    if (on) {
      inertElements = Array.from(document.body.children).filter((el) => el !== overlay);
      inertElements.forEach((el) => el.setAttribute('inert', ''));
    } else {
      inertElements.forEach((el) => el.removeAttribute('inert'));
      inertElements = [];
    }
  };

  const close = () => {
    if (openerEl && document.contains(openerEl)) {
      openerEl.focus({ preventScroll: true });
      if (openerHadTabindex === null && openerEl.hasAttribute('tabindex')) {
        openerEl.removeAttribute('tabindex');
      }
    }
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    setInertOutside(false);
    imgEl.src = '';
    imgEl.alt = '';
    openerEl = null;
    openerHadTabindex = null;
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target === closeBtn) {
      close();
    }
  });
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      close();
    }
  });

  document.addEventListener('click', (e) => {
    const targetImg = e.target.closest('img');
    if (!targetImg) return;
    const inNotes = !!document.getElementById('notes-content')?.contains(targetImg);
    const inAnnotation = !!targetImg.closest('.annotation-text');
    if (!inNotes && !inAnnotation) return;
    const anchor = targetImg.closest('a');
    let hrefSrc = null;
    if (anchor && anchor.getAttribute('href')) {
      const href = anchor.getAttribute('href');
      const isImageHref = /\.(png|jpe?g|gif|svg|webp)(\?.*)?$/i.test(href);
      if (isImageHref) {
        e.preventDefault();
        hrefSrc = href;
      }
    }
    const src = hrefSrc || targetImg.dataset.fullsize || targetImg.currentSrc || targetImg.src;
    if (!src) return;
    imgEl.src = src;
    imgEl.alt = targetImg.alt || '';
    openerEl = anchor || targetImg;
    openerHadTabindex = openerEl.getAttribute('tabindex');
    if (openerHadTabindex === null) {
      openerEl.setAttribute('tabindex', '-1');
    }
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    setInertOutside(true);
    setTimeout(() => {
      closeBtn.focus();
    }, 0);
  });
}

// Export to global scope for backward compatibility
window.initImageLightbox = initImageLightbox;

