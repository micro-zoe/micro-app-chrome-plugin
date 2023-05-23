/**
 * This file is part of react-boilerplate.
 * @link     : https://zhaiyiming.com/
 * @author   : Emil Zhai (root@derzh.com)
 * @modifier : Emil Zhai (root@derzh.com)
 * @copyright: Copyright (c) 2018 TINYMINS.
 */

const path = require('path');
const rimraf = require('rimraf');

const isRun = process.env.NODE_ACTION === 'run';
const isProd = process.env.NODE_ENV === 'production';

const rm = p => new Promise((resolve, reject) => {
  rimraf(p, e => (e ? reject(e) : resolve()));
});

const fullPath = s => path.join(__dirname, '..', s);

const regexEscape = s => s.replace(/[\s!#$()*+,.:<=?[\\\]^{|}]/gu, '\\$&');

exports.isRun = isRun;
exports.isProd = isProd;
exports.rm = rm;
exports.fullPath = fullPath;
exports.regexEscape = regexEscape;
