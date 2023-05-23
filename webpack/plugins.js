/**
 * This file is part of react-boilerplate.
 * @link     : https://zhaiyiming.com/
 * @author   : Emil Zhai (root@derzh.com)
 * @modifier : Emil Zhai (root@derzh.com)
 * @copyright: Copyright (c) 2018 TINYMINS.
 */

const ESLintWebpackPlugin = require('eslint-webpack-plugin');
const StylelintWebpackPlugin = require('stylelint-webpack-plugin');

const utils = require('./utils');

const eslintPlugin = options => new ESLintWebpackPlugin(Object.assign({
  overrideConfigFile: '.eslintrc.js',
  files: [
    'src/**/*.js',
    'src/**/*.jsx',
    'src/**/*.ts',
    'src/**/*.tsx',
    'src/**/*.tx',
    'src/**/*.json',
  ],
  cache: true,
  cacheLocation: utils.fullPath('./node_modules/.cache/.eslintcache'),
  failOnWarning: false,
  failOnError: false,
  formatter: require('eslint-formatter-pretty'),
}, options));

const stylelintPlugin = options => new StylelintWebpackPlugin(Object.assign({
  configFile: utils.fullPath('.stylelintrc.js'),
  files: [
    'src/**/*.vue',
    'src/**/*.css',
    'src/**/*.less',
    'src/**/*.sass',
    'src/**/*.scss',
    '!**/iconfont.css',
  ],
  cache: true,
  cacheLocation: utils.fullPath('./node_modules/.cache/.stylelintcache'),
  failOnWarning: false,
  failOnError: false,
  formatter: require('stylelint-formatter-pretty'),
}, options));

exports.eslintPlugin = eslintPlugin;
exports.stylelintPlugin = stylelintPlugin;
