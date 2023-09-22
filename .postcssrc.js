// https://github.com/michael-ciniawsky/postcss-load-config

module.exports = {
  plugins: {
    'postcss-import': {},
    'postcss-preset-env': {},
    // to edit target browsers: use "browserslist" field in package.json
    autoprefixer: {},
    'postcss-reporter': { clearReportedMessages: true },
  },
};
