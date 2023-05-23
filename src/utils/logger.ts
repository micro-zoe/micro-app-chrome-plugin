/**
 * This file is part of react-boilerplate.
 * @link     : https://zhaiyiming.com/
 * @author   : Emil Zhai (root@derzh.com)
 * @modifier : Emil Zhai (root@derzh.com)
 * @copyright: Copyright (c) 2018 TINYMINS.
 */

import { PROJECT_NAME } from '@/config';

const header = [
  `%c${PROJECT_NAME}`,
  'color: #ffffff; font-size: 14px; background: #2d64ff; padding: 1px 6px; border-radius: 2px',
];

export const debug = (...args: unknown[]) => {
  console.debug(...header, ...args);
};

export const info = (...args: unknown[]) => {
  console.info(...header, ...args);
};

export const warn = (...args: unknown[]) => {
  console.warn(...header, ...args);
};

export const error = (...args: unknown[]) => {
  console.error(...header, ...args);
};

/*
 * export const setColor = () => {
 *   if(window.__MICRO_APP_PROXY_WINDOW__.__MICRO_APP_ENVIRONMENT__) {
 */

/*
 *   }
 * }
 */
