const IS_DEV = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const log = (...args) => IS_DEV && console.log(...args);
export const warn = (...args) => IS_DEV && console.warn(...args);
export const error = (...args) => IS_DEV && console.error(...args);

