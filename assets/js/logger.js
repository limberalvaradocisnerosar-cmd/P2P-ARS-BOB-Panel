import { IS_DEV } from './config.js';

export const log = (...args) => IS_DEV && console.log(...args);
export const warn = (...args) => IS_DEV && console.warn(...args);
export const error = (...args) => IS_DEV && console.error(...args);

