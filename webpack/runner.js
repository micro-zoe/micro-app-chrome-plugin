/**
 * This file is part of react-boilerplate.
 * @link     : https://zhaiyiming.com/
 * @author   : Emil Zhai (root@derzh.com)
 * @modifier : Emil Zhai (root@derzh.com)
 * @copyright: Copyright (c) 2018 TINYMINS.
 */

/**
 * Set environments
 */
require('./env').init();

/**
 * Require must after set environments
 */
const chalk = require('chalk');
const ts = require('typescript');
const Webpack = require('webpack');

const { rm } = require('./utils');

/**
 * Load config
 */
const webpackConfig = require('../webpack.config');

if (!webpackConfig) {
  console.error('Load webpack config from webpack.config.js failed!');
  throw new Error('Load webpack config failed!');
}

/**
 * Start runner
 */

const start = () => {
  console.log(chalk.cyan.bold(`TypeScript Version: ${ts.version}`));

  if (process.env.NODE_ACTION === 'run') {
    const WebpackDevServer = require('webpack-dev-server');
    const compiler = Webpack(webpackConfig);
    const devServerOptions = webpackConfig.devServer;
    new WebpackDevServer(devServerOptions, compiler).start();
  } else {
    console.log('');
    console.log(`$ rm -rf ${process.env.DIST_PATH}`);
    rm(process.env.DIST_PATH)
      .catch((error) => {
        console.log(chalk.red.bold('error: rm dist failed!'));
        throw error;
      })
      .then((res) => {
        const compiler = Webpack(webpackConfig);
        compiler.run((err, stats) => {
          compiler.close((closeErr) => {
            if (err) {
              console.log('Webpack compiler encountered a fatal error.', err);
              throw err;
            }
            if (closeErr) {
              console.log('Webpack compiler encountered a fatal error on close.', closeErr);
              throw err;
            }
            console.log(stats.toString(webpackConfig.stats));
          });
        });
        return res;
      })
      .catch((error) => { throw error; });
  }
};

start();
