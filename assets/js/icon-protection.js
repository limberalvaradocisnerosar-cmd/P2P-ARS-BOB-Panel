(function() {
  function isProtectedElement(element) {
    if (!element) return false;
    if (element.tagName === 'IMG') {
      const src = element.src || element.getAttribute('src') || '';
      if (src.includes('/assets/icons/') || src.includes('assets/icons/')) {
        return true;
      }
    }
    if (element.classList && (
      element.classList.contains('flag-icon') ||
      element.classList.contains('icon-ajustes') ||
      element.classList.contains('currency-flag') ||
      element.id === 'from-flag-img' ||
      element.id === 'to-flag-img' ||
      element.id === 'from-flag' ||
      element.id === 'to-flag'
    )) {
      return true;
    }
    return element.closest && (
      element.closest('.currency-flag') ||
      element.closest('[src*="/assets/icons/"]') ||
      element.closest('[src*="assets/icons/"]')
    );
  }
  function protectElement(element) {
    if (!element) return;
    element.setAttribute('draggable', 'false');
    element.setAttribute('ondragstart', 'return false;');
    element.setAttribute('onselectstart', 'return false;');
    element.setAttribute('oncontextmenu', 'return false;');
    element.style.userSelect = 'none';
    element.style.webkitUserSelect = 'none';
    element.style.mozUserSelect = 'none';
    element.style.msUserSelect = 'none';
    element.style.webkitUserDrag = 'none';
    element.style.khtmlUserDrag = 'none';
    element.style.mozUserDrag = 'none';
    element.style.oUserDrag = 'none';
    element.style.userDrag = 'none';
    element.style.webkitTouchCallout = 'none';
    element.style.pointerEvents = 'auto';
    ['contextmenu', 'dragstart', 'selectstart', 'mousedown', 'mouseup'].forEach(function(eventType) {
      element.addEventListener(eventType, function(e) {
        if (isProtectedElement(e.target) || isProtectedElement(e.currentTarget)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      }, { capture: true, passive: false });
    });
  }
  function protectIcons() {
    const selectors = [
      'img[src*="/assets/icons/"]',
      'img[src*="assets/icons/"]',
      '.flag-icon',
      '#from-flag-img',
      '#to-flag-img',
      '.currency-flag',
      '#from-flag',
      '#to-flag',
      '.icon-ajustes',
      '.app-header-logo-img'
    ];
    selectors.forEach(function(selector) {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(protectElement);
      } catch (e) {}
    });
  }
  document.addEventListener('contextmenu', function(e) {
    if (isProtectedElement(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true, passive: false });
  document.addEventListener('dragstart', function(e) {
    if (isProtectedElement(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true, passive: false });
  document.addEventListener('selectstart', function(e) {
    if (isProtectedElement(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true, passive: false });
  document.addEventListener('mousedown', function(e) {
    if (e.button === 2 && isProtectedElement(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true, passive: false });
  document.addEventListener('mouseup', function(e) {
    if (e.button === 2 && isProtectedElement(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true, passive: false });
  document.addEventListener('auxclick', function(e) {
    if (isProtectedElement(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true, passive: false });
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's' && isProtectedElement(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true, passive: false });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', protectIcons);
  } else {
    protectIcons();
  }
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) {
          if (isProtectedElement(node)) {
            protectElement(node);
          }
          const children = node.querySelectorAll && node.querySelectorAll('img[src*="/assets/icons/"], img[src*="assets/icons/"], .flag-icon, .currency-flag, .icon-ajustes');
          if (children) {
            children.forEach(protectElement);
          }
        }
      });
    });
  });
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        if (document.body) {
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
        }
      });
    }
  }
  setInterval(protectIcons, 2000);
})();

