export async function loadHTML(path, container, append = false) {
  if (!container) {
    const IS_DEV = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (IS_DEV) {
      console.error('[ViewLoader] Container not provided');
    }
    return false;
  }
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${path}`);
    }
    const html = await response.text();
    if (append) {
      container.insertAdjacentHTML('beforeend', html);
    } else {
      container.innerHTML = html;
    }
    if (container.innerHTML.trim().length === 0) {
      const IS_DEV = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (IS_DEV) {
        console.error(`[ViewLoader] HTML was empty after insertion for ${path}`);
      }
      return false;
    }
    return true;
  } catch (error) {
    const IS_DEV = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (IS_DEV) {
      console.error(`[ViewLoader] Error loading ${path}:`, error);
    }
    return false;
  }
}
export async function loadMultipleHTMLs(items) {
  const promises = items.map(({ path, container }) => loadHTML(path, container));
  const results = await Promise.all(promises);
  return results.every(result => result === true);
}
export function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}
export function emitViewReady(viewName) {
  const event = new CustomEvent('view-ready', {
    detail: { view: viewName }
  });
  window.dispatchEvent(event);
}