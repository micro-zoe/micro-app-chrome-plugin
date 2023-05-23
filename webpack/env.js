/**
 * This file is part of the jd-mkt5 launch.
 * @link     : https://ace.jd.com/
 * @author   : Emil Zhai (root@derzh.com)
 * @modifier : Emil Zhai (root@derzh.com)
 * @copyright: Copyright (c) 2020 JD Network Technology Co., Ltd.
 */

const path = require('path');
const process = require('process');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

const init = (args) => {
  if (!args) {
    args = hideBin(process.argv);
  }
  /**
   * Check params
   */
  const argv = yargs(args)
    // .strict()
    .usage('Usage: $0 <action> [<env>]')
    // commands
    .command({
      command: 'run [env]',
      desc: 'Start a local hot reload dev server',
      builder: e => e
        .option('action', { choices: ['run'], default: 'run' })
        .choices('env', ['development', 'production'])
        .default('env', 'development'),
    })
    .command({
      command: 'build [env]',
      desc: 'Build project to generate dist files',
      builder: e => e
        .option('action', { choices: ['build'], default: 'build' })
        .choices('env', ['development', 'production'])
        .default('env', 'production'),
    })
    .demandCommand(1, 'Action is required.')
    .example('$0 run development --router-mode="history"')
    // options
    .option('buildTarget', {
      nargs: 1,
      describe: 'Runner environment',
      choices: ['h5-app', 'chrome-ext'],
      default: 'chrome-ext',
    })
    .option('publicPath', {
      nargs: 1,
      describe: 'Webpack public path',
      default: '/',
    })
    .option('routerMode', {
      nargs: 1,
      describe: 'Router mode',
      choices: ['hash', 'browser', 'memory', 'auto'],
      default: 'hash',
    })
    .option('report', {
      type: 'boolean',
      describe: 'Show bundle analyzer report and speed measure report after build',
      default: false,
    })
    .option('port', {
      type: 'number',
      describe: 'Local dev server listen port',
      default: 8100,
    })
    .option('eslint', {
      type: 'boolean',
      describe: 'Enable ESLint',
      default: true,
    })
    .option('stylelint', {
      type: 'boolean',
      describe: 'Enable StyleLint',
      default: true,
    })
    .option('distPath', {
      describe: 'Dist file location',
      default: path.join(__dirname, '..', 'dist'),
    })
    .option('watchNodeModules', {
      type: 'boolean',
      describe: 'Watch node_modules change for hot reload',
      default: false,
    })
    .option('traceDeprecation', {
      type: 'boolean',
      describe: 'Trace deprecation stack for webpack',
      default: false,
    })
    .option('traceWarnings', {
      type: 'boolean',
      describe: 'Trace warnings stack for webpack',
      default: false,
    })
    // help
    .help('h')
    .alias('h', 'help')
    // copyright
    .epilog('copyright 2022')
    .argv;

  if (argv.buildTarget === 'chrome-ext') {
    argv.routerMode = 'hash';
    argv['router-mode'] = 'hash';
  }

  /**
   * Set environments
   */
  process.env.NODE_ACTION = argv.action;
  process.env.NODE_ENV = argv.env;
  process.env.PUBLIC_PATH = argv.publicPath;
  process.env.ROUTER_MODE = argv.routerMode;
  process.env.DIST_PATH = argv.distPath;
  process.env.PORT = argv.port;
  process.env.REPORT = argv.report ? 'Y' : 'N';
  process.env.BUILD_TARGET = argv.buildTarget;
  process.env.ESLINT = argv.esLint ? 'Y' : 'N';
  process.env.STYLELINT = argv.stylelint ? 'Y' : 'N';
  process.env.WATCH_NODE_MODULES = argv.watchNodeModules ? 'Y' : 'N';
  process.traceDeprecation = argv.traceDeprecation;
  process.traceWarnings = argv.traceWarnings;
  process.customWebpackEnvironmentInitialized = 'Y';
};

const initialized = () => !!process.customWebpackEnvironmentInitialized;

const fallback = (args) => {
  if (initialized()) {
    return;
  }
  init(args);
};

exports.init = init;
exports.initialized = initialized;
exports.fallback = fallback;
