/**
 * This file is part of react-boilerplate.
 * @link     : https://zhaiyiming.com/
 * @author   : Emil Zhai (root@derzh.com)
 * @modifier : Emil Zhai (root@derzh.com)
 * @copyright: Copyright (c) 2018 TINYMINS.
 */

/**
 * Stringify JSON
 * @param v Data to be stringify
 * @returns Stringified JSON, or empty string while encode failed.
 */
export const encodeJSON = (v: unknown): string => {
  try {
    return JSON.stringify(v);
  } catch {
    return '';
  }
};

/**
 * Decode JSON.
 * @param v Stringified JSON.
 * @returns JSON data, or undefined while decode failed.
 */
export const decodeJSON = <T = unknown>(v: string): T | undefined => {
  try {
    return JSON.parse(v);
  } catch {
    return void 0;
  }
};
