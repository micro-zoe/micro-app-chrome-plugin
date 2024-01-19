const version = '0.8.10';
// do not use isUndefined
const isBrowser = typeof window !== 'undefined';
// do not use isUndefined
const globalThis = typeof global !== 'undefined'
  ? global
  : typeof window !== 'undefined'
    ? window
    : (typeof self !== 'undefined') ? self : Function('return this')();
// is Undefined
function isUndefined(target) {
  return target === undefined;
}
// is String
function isString(target) {
  return typeof target === 'string';
}
// is Boolean
function isBoolean(target) {
  return typeof target === 'boolean';
}
// is function
function isFunction(target) {
  return typeof target === 'function';
}
// is Array
const isArray = Array.isArray;
// is PlainObject
function isPlainObject(target) {
  return toString.call(target) === '[object Object]';
}
// is Promise
function isPromise(target) {
  return toString.call(target) === '[object Promise]';
}
// is bind function
function isBoundFunction(target) {
  return isFunction(target) && target.name.indexOf('bound ') === 0 && !target.hasOwnProperty('prototype');
}
// is ShadowRoot
function isShadowRoot(target) {
  return typeof ShadowRoot !== 'undefined' && target instanceof ShadowRoot;
}
const rawDefineProperty = Object.defineProperty;
const rawDefineProperties = Object.defineProperties;
const rawHasOwnProperty = Object.prototype.hasOwnProperty;
/**
 * format error log
 * @param msg message
 * @param appName app name, default is null
 */
function logError(msg, appName = null, ...rest) {
  const appNameTip = appName && isString(appName) ? ` app ${appName}:` : '';
  if (isString(msg)) {
    console.error(`[micro-app]${appNameTip} ${msg}`, ...rest);
  } else {
    console.error(`[micro-app]${appNameTip}`, msg, ...rest);
  }
}
/**
 * format warn log
 * @param msg message
 * @param appName app name, default is null
 */
function logWarn(msg, appName = null, ...rest) {
  const appNameTip = appName && isString(appName) ? ` app ${appName}:` : '';
  if (isString(msg)) {
    console.warn(`[micro-app]${appNameTip} ${msg}`, ...rest);
  } else {
    console.warn(`[micro-app]${appNameTip}`, msg, ...rest);
  }
}
/**
 * async execution
 * @param fn callback
 * @param args params
 */
function defer(fn, ...args) {
  Promise.resolve().then(fn.bind(null, ...args));
}
/**
 * Add address protocol
 * @param url address
 */
function addProtocol(url) {
  return url.startsWith('//') ? `${location.protocol}${url}` : url;
}
/**
 * format URL address
 * note the scenes:
 * 1. micro-app -> attributeChangedCallback
 * 2. preFetch
 */
function formatAppURL(url, appName = null) {
  if (!isString(url) || !url) { return ''; }
  try {
    const { origin, pathname, search } = new URL(addProtocol(url));
    // If it ends with .html/.node/.php/.net/.etc, don’t need to add /
    if ((/\.(\w+)$/).test(pathname)) {
      return `${origin}${pathname}${search}`;
    }
    const fullPath = `${origin}${pathname}/`.replace(/\/\/$/, '/');
    return (/^https?:\/\//).test(fullPath) ? `${fullPath}${search}` : '';
  } catch (error) {
    logError(error, appName);
    return '';
  }
}
/**
 * format name
 * note the scenes:
 * 1. micro-app -> attributeChangedCallback
 * 2. event_center -> EventCenterForMicroApp -> constructor
 * 3. event_center -> EventCenterForBaseApp -> all methods
 * 4. preFetch
 * 5. plugins
 */
function formatAppName(name) {
  if (!isString(name) || !name) { return ''; }
  return name.replace(/(^\d+)|(\W)/gi, '');
}
/**
 * Get valid address, such as https://xxx/xx/xx.html to https://xxx/xx/
 * @param url app.url
 */
function getEffectivePath(url) {
  const { origin, pathname } = new URL(url);
  if ((/\.(\w+)$/).test(pathname)) {
    const fullPath = `${origin}${pathname}`;
    const pathArr = fullPath.split('/');
    pathArr.pop();
    return `${pathArr.join('/')}/`;
  }
  return `${origin}${pathname}/`.replace(/\/\/$/, '/');
}
/**
 * Complete address
 * @param path address
 * @param baseURI base url(app.url)
 */
function CompletionPath(path, baseURI) {
  if (!path
        || (/^((((ht|f)tps?)|file):)?\/\//).test(path)
        || (/^(data|blob):/).test(path)) { return path; }
  return new URL(path, getEffectivePath(addProtocol(baseURI))).toString();
}
/**
 * Get the folder where the link resource is located,
 * which is used to complete the relative address in the css
 * @param linkPath full link address
 */
function getLinkFileDir(linkPath) {
  const pathArr = linkPath.split('/');
  pathArr.pop();
  return addProtocol(`${pathArr.join('/')}/`);
}
/**
 * promise stream
 * @param promiseList promise list
 * @param successCb success callback
 * @param errorCb failed callback
 * @param finallyCb finally callback
 */
function promiseStream(promiseList, successCb, errorCb, finallyCb) {
  let finishedNum = 0;
  function isFinished() {
    if (++finishedNum === promiseList.length && finallyCb) { finallyCb(); }
  }
  promiseList.forEach((p, i) => {
    if (isPromise(p)) {
      p.then((res) => {
        successCb({
          data: res,
          index: i,
        });
        isFinished();
      }).catch((error) => {
        errorCb({
          error,
          index: i,
        });
        isFinished();
      });
    } else {
      successCb({
        data: p,
        index: i,
      });
      isFinished();
    }
  });
}
// Check whether the browser supports module script
function isSupportModuleScript() {
  const s = document.createElement('script');
  return 'noModule' in s;
}
// Create a random symbol string
function createNonceSrc() {
  return `inline-${Math.random().toString(36).slice(2, 17)}`;
}
// Array deduplication
function unique(array) {
  return array.filter(function (item) {
    return item in this ? false : (this[item] = true);
  }, Object.create(null));
}
// requestIdleCallback polyfill
const requestIdleCallback = globalThis.requestIdleCallback
    || function (fn) {
      const lastTime = Date.now();
      return setTimeout(() => {
        fn({
          didTimeout: false,
          timeRemaining() {
            return Math.max(0, 50 - (Date.now() - lastTime));
          },
        });
      }, 50);
    };
/**
 * Record the currently running app.name
 */
let currentMicroAppName = null;
function setCurrentAppName(appName) {
  currentMicroAppName = appName;
}
function throttleDeferForSetAppName(appName) {
  if (currentMicroAppName !== appName) {
    setCurrentAppName(appName);
    defer(() => {
      setCurrentAppName(null);
    });
  }
}
// get the currently running app.name
function getCurrentAppName() {
  return currentMicroAppName;
}
// Clear appName
function removeDomScope() {
  setCurrentAppName(null);
}
/**
 * Create pure elements
 */
function pureCreateElement(tagName, options) {
  const element = document.createElement(tagName, options);
  if (element.__MICRO_APP_NAME__) { delete element.__MICRO_APP_NAME__; }
  return element;
}
/**
 * clone origin elements to target
 * @param origin Cloned element
 * @param target Accept cloned elements
 * @param deep deep clone or transfer dom
 */
function cloneContainer(origin, target, deep) {
  target.innerHTML = '';
  if (deep) {
    const clonedNode = origin.cloneNode(true);
    const fragment = document.createDocumentFragment();
    [...clonedNode.childNodes].forEach((node) => {
      fragment.append(node);
    });
    target.append(fragment);
  } else {
    [...origin.childNodes].forEach((node) => {
      target.append(node);
    });
  }
}
// is invalid key of querySelector
function isInvalidQuerySelectorKey(key) {
  return !key || (/(^\d)|([^\w\u4E00-\u9FA5])/gi).test(key);
}
// unique element
function isUniqueElement(key) {
  return (/^body$/i).test(key)
        || (/^head$/i).test(key)
        || (/^html$/i).test(key);
}
/**
 * get micro-app element
 * @param target app container
 */
function getRootContainer(target) {
  return isShadowRoot(target) ? target.host : target;
}
/**
 * trim start & end
 */
function trim(str) {
  return str ? str.replace(/^\s+|\s+$/g, '') : '';
}
function isFireFox() {
  return navigator.userAgent.includes('Firefox');
}

let ObservedAttrName;
(function (ObservedAttrName) {
  ObservedAttrName.NAME = 'name';
  ObservedAttrName.URL = 'url';
}(ObservedAttrName || (ObservedAttrName = {})));
// app status
let appStates;
(function (appStates) {
  appStates.NOT_LOADED = 'NOT_LOADED';
  appStates.LOADING_SOURCE_CODE = 'LOADING_SOURCE_CODE';
  appStates.LOAD_SOURCE_FINISHED = 'LOAD_SOURCE_FINISHED';
  appStates.LOAD_SOURCE_ERROR = 'LOAD_SOURCE_ERROR';
  appStates.MOUNTING = 'MOUNTING';
  appStates.MOUNTED = 'MOUNTED';
  appStates.UNMOUNT = 'UNMOUNT';
}(appStates || (appStates = {})));
// lifecycles
let lifeCycles;
(function (lifeCycles) {
  lifeCycles.CREATED = 'created';
  lifeCycles.BEFOREMOUNT = 'beforemount';
  lifeCycles.MOUNTED = 'mounted';
  lifeCycles.UNMOUNT = 'unmount';
  lifeCycles.ERROR = 'error';
  // 👇 keep-alive only
  lifeCycles.BEFORESHOW = 'beforeshow';
  lifeCycles.AFTERSHOW = 'aftershow';
  lifeCycles.AFTERHIDDEN = 'afterhidden';
}(lifeCycles || (lifeCycles = {})));
// keep-alive status
let keepAliveStates;
(function (keepAliveStates) {
  keepAliveStates.KEEP_ALIVE_SHOW = 'KEEP_ALIVE_SHOW';
  keepAliveStates.KEEP_ALIVE_HIDDEN = 'KEEP_ALIVE_HIDDEN';
}(keepAliveStates || (keepAliveStates = {})));
const globalKeyToBeCached = 'window,self,globalThis,Array,Object,String,Boolean,Math,Number,Symbol,Date,Promise,Function,Proxy,WeakMap,WeakSet,Set,Map,Reflect,Element,Node,Document,RegExp,Error,TypeError,JSON,isNaN,parseFloat,parseInt,performance,console,decodeURI,encodeURI,decodeURIComponent,encodeURIComponent,location,navigator,undefined';

/**
 * fetch source of html, js, css
 * @param url source path
 * @param appName app name
 * @param config config of fetch
 */
function fetchSource(url, appName = null, options = {}) {
  if (isFunction(microApp.fetch)) {
    return microApp.fetch(url, options, appName);
  }
  return fetch(url, options).then(res => res.text());
}

class HTMLLoader {
  static getInstance() {
    if (!this.instance) {
      this.instance = new HTMLLoader();
    }
    return this.instance;
  }

  /**
   * run logic of load and format html
   * @param successCb success callback
   * @param errorCb error callback, type: (err: Error, meetFetchErr: boolean) => void
   */
  run(app, successCb) {
    const appName = app.name;
    const htmlUrl = app.ssrUrl || app.url;
    fetchSource(htmlUrl, appName, { cache: 'no-cache' }).then((htmlStr) => {
      if (!htmlStr) {
        const msg = 'html is empty, please check in detail';
        app.onerror(new Error(msg));
        return logError(msg, appName);
      }
      htmlStr = this.formatHTML(htmlUrl, htmlStr, appName);
      successCb(htmlStr, app);
    }).catch((error) => {
      logError(`Failed to fetch data from ${app.url}, micro-app stop rendering`, appName, error);
      app.onLoadError(error);
    });
  }

  formatHTML(htmlUrl, htmlStr, appName) {
    return this.processHtml(htmlUrl, htmlStr, appName, microApp.plugins)
      .replace(/<head[^>]*>[\S\s]*?<\/head>/i, match => match
        .replace(/<head/i, '<micro-app-head')
        .replace(/<\/head>/i, '</micro-app-head>'))
      .replace(/<body[^>]*>[\S\s]*?<\/body>/i, match => match
        .replace(/<body/i, '<micro-app-body')
        .replace(/<\/body>/i, '</micro-app-body>'));
  }

  processHtml(url, code, appName, plugins) {
    let _a;
    if (!plugins) { return code; }
    const mergedPlugins = [];
    plugins.global && mergedPlugins.push(...plugins.global);
    ((_a = plugins.modules) === null || _a === void 0 ? void 0 : _a[appName]) && mergedPlugins.push(...plugins.modules[appName]);
    if (mergedPlugins.length > 0) {
      return mergedPlugins.reduce((preCode, plugin) => {
        if (isPlainObject(plugin) && isFunction(plugin.processHtml)) {
          return plugin.processHtml(preCode, url, plugin.options);
        }
        return preCode;
      }, code);
    }
    return code;
  }
}

// common reg
const rootSelectorREG = /(^|\s+)(html|:root)(?=[\s#.:>[~]+|$)/;
const bodySelectorREG = /(^|\s+)((html[\s>~]+body)|body)(?=[\s#.:>[~]+|$)/;
function parseError(msg, linkPath) {
  msg = linkPath ? `${linkPath} ${msg}` : msg;
  const err = new Error(msg);
  err.reason = msg;
  if (linkPath) {
    err.filename = linkPath;
  }
  throw err;
}
/**
 * Reference https://github.com/reworkcss/css
 * CSSParser mainly deals with 3 scenes: styleRule, @, and comment
 * And scopecss deals with 2 scenes: selector & url
 * And can also disable scopecss with inline comments
 */
class CSSParser {
  constructor() {
    this.cssText = ''; // css content
    this.prefix = ''; // prefix as micro-app[name=xxx]
    this.baseURI = ''; // domain name
    this.linkPath = ''; // link resource address, if it is the style converted from link, it will have linkPath
    this.result = ''; // parsed cssText
    this.scopecssDisable = false; // use block comments /* scopecss-disable */ to disable scopecss in your file, and use /* scopecss-enable */ to enable scopecss
    this.scopecssDisableSelectors = []; // disable or enable scopecss for specific selectors
    this.scopecssDisableNextLine = false; // use block comments /* scopecss-disable-next-line */ to disable scopecss on a specific line
    // https://developer.mozilla.org/en-US/docs/Web/API/CSSMediaRule
    this.mediaRule = this.createMatcherForAtRuleWithChildRule(/^@media *([^{]+)/, 'media');
    // https://developer.mozilla.org/en-US/docs/Web/API/CSSSupportsRule
    this.supportsRule = this.createMatcherForAtRuleWithChildRule(/^@supports *([^{]+)/, 'supports');
    this.documentRule = this.createMatcherForAtRuleWithChildRule(/^@([\w-]+)?document *([^{]+)/, 'document');
    this.hostRule = this.createMatcherForAtRuleWithChildRule(/^@host\s*/, 'host');
    // https://developer.mozilla.org/en-US/docs/Web/API/CSSImportRule
    this.importRule = this.createMatcherForNoneBraceAtRule('import');
    // Removed in most browsers
    this.charsetRule = this.createMatcherForNoneBraceAtRule('charset');
    // https://developer.mozilla.org/en-US/docs/Web/API/CSSNamespaceRule
    this.namespaceRule = this.createMatcherForNoneBraceAtRule('namespace');
  }

  exec(cssText, prefix, baseURI, linkPath) {
    this.cssText = cssText;
    this.prefix = prefix;
    this.baseURI = baseURI;
    this.linkPath = linkPath || '';
    this.matchRules();
    return isFireFox() ? decodeURIComponent(this.result) : this.result;
  }

  reset() {
    this.cssText = this.prefix = this.baseURI = this.linkPath = this.result = '';
    this.scopecssDisable = this.scopecssDisableNextLine = false;
    this.scopecssDisableSelectors = [];
  }

  // core action for match rules
  matchRules() {
    this.matchLeadingSpaces();
    this.matchComments();
    while (this.cssText.length > 0
            && this.cssText.charAt(0) !== '}'
            && (this.matchAtRule() || this.matchStyleRule())) {
      this.matchComments();
    }
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleRule
  matchStyleRule() {
    const selectors = this.formatSelector(true);
    // reset scopecssDisableNextLine
    this.scopecssDisableNextLine = false;
    if (!selectors) { return parseError('selector missing', this.linkPath); }
    this.recordResult(selectors);
    this.matchComments();
    this.styleDeclarations();
    this.matchLeadingSpaces();
    return true;
  }

  formatSelector(skip) {
    const m = this.commonMatch(/^([^{]+)/, skip);
    if (!m) { return false; }
    return m[0].replace(/(^|,\s*)([^,]+)/g, (_, separator, selector) => {
      selector = trim(selector);
      if (!(this.scopecssDisableNextLine
                || (this.scopecssDisable && (this.scopecssDisableSelectors.length === 0
                    || this.scopecssDisableSelectors.includes(selector)))
                || rootSelectorREG.test(selector))) {
        selector = bodySelectorREG.test(selector) ? selector.replace(bodySelectorREG, `${this.prefix} micro-app-body`) : `${this.prefix} ${selector}`;
      }
      return separator + selector;
    });
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration
  styleDeclarations() {
    if (!this.matchOpenBrace()) { return parseError("Declaration missing '{'", this.linkPath); }
    this.matchAllDeclarations();
    if (!this.matchCloseBrace()) { return parseError("Declaration missing '}'", this.linkPath); }
    return true;
  }

  matchAllDeclarations() {
    let cssValue = this.commonMatch(/^(?:url\(["']?[^"')}]+["']?\)|[^/}])*/, true)[0];
    if (cssValue) {
      if (!this.scopecssDisableNextLine
                && (!this.scopecssDisable || this.scopecssDisableSelectors.length > 0)) {
        cssValue = cssValue.replace(/url\(["']?([^"')]+)["']?\)/gm, (all, $1) => {
          if ((/^((data|blob):|#)/).test($1) || (/^(https?:)?\/\//).test($1)) {
            return all;
          }
          // ./a/b.png  ../a/b.png  a/b.png
          if ((/^((\.\.?\/)|[^/])/).test($1) && this.linkPath) {
            this.baseURI = getLinkFileDir(this.linkPath);
          }
          return `url("${CompletionPath($1, this.baseURI)}")`;
        });
      }
      this.recordResult(cssValue);
    }
    // reset scopecssDisableNextLine
    this.scopecssDisableNextLine = false;
    if (!this.cssText || this.cssText.charAt(0) === '}') { return; }
    // extract comments in declarations
    if (this.cssText.charAt(0) === '/' && this.cssText.charAt(1) === '*') {
      this.matchComments();
    } else {
      this.commonMatch(/\/+/);
    }
    return this.matchAllDeclarations();
  }

  matchAtRule() {
    if (this.cssText[0] !== '@') { return false; }
    // reset scopecssDisableNextLine
    this.scopecssDisableNextLine = false;
    return this.keyframesRule()
            || this.mediaRule()
            || this.customMediaRule()
            || this.supportsRule()
            || this.importRule()
            || this.charsetRule()
            || this.namespaceRule()
            || this.documentRule()
            || this.pageRule()
            || this.hostRule()
            || this.fontFaceRule();
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/CSSKeyframesRule
  keyframesRule() {
    if (!this.commonMatch(/^@([\w-]+)?keyframes\s*/)) { return false; }
    if (!this.commonMatch(/^([\w-]+)\s*/)) { return parseError('@keyframes missing name', this.linkPath); }
    this.matchComments();
    if (!this.matchOpenBrace()) { return parseError("@keyframes missing '{'", this.linkPath); }
    this.matchComments();
    while (this.keyframeRule()) {
      this.matchComments();
    }
    if (!this.matchCloseBrace()) { return parseError("@keyframes missing '}'", this.linkPath); }
    this.matchLeadingSpaces();
    return true;
  }

  keyframeRule() {
    let r;
    const valList = [];
    while (r = this.commonMatch(/^((\d+\.\d+|\.\d+|\d+)%?|[a-z]+)\s*/)) {
      valList.push(r[1]);
      this.commonMatch(/^,\s*/);
    }
    if (valList.length === 0) { return false; }
    this.styleDeclarations();
    this.matchLeadingSpaces();
    return true;
  }

  // https://github.com/postcss/postcss-custom-media
  customMediaRule() {
    if (!this.commonMatch(/^@custom-media\s+(--\S+)\s*([^;{]+);/)) { return false; }
    this.matchLeadingSpaces();
    return true;
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/CSSPageRule
  pageRule() {
    if (!this.commonMatch(/^@page */)) { return false; }
    this.formatSelector(false);
    // reset scopecssDisableNextLine
    this.scopecssDisableNextLine = false;
    return this.commonHandlerForAtRuleWithSelfRule('page');
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/CSSFontFaceRule
  fontFaceRule() {
    if (!this.commonMatch(/^@font-face\s*/)) { return false; }
    return this.commonHandlerForAtRuleWithSelfRule('font-face');
  }

  // common matcher for @media, @supports, @document, @host
  createMatcherForAtRuleWithChildRule(reg, name) {
    return () => {
      if (!this.commonMatch(reg)) { return false; }
      if (!this.matchOpenBrace()) { return parseError(`@${name} missing '{'`, this.linkPath); }
      this.matchComments();
      this.matchRules();
      if (!this.matchCloseBrace()) { return parseError(`@${name} missing '}'`, this.linkPath); }
      this.matchLeadingSpaces();
      return true;
    };
  }

  // common matcher for @import, @charset, @namespace
  createMatcherForNoneBraceAtRule(name) {
    const reg = new RegExp(`^@${name}\\s*([^;]+);`);
    return () => {
      if (!this.commonMatch(reg)) { return false; }
      this.matchLeadingSpaces();
      return true;
    };
  }

  // common handler for @font-face, @page
  commonHandlerForAtRuleWithSelfRule(name) {
    if (!this.matchOpenBrace()) { return parseError(`@${name} missing '{'`, this.linkPath); }
    this.matchAllDeclarations();
    if (!this.matchCloseBrace()) { return parseError(`@${name} missing '}'`, this.linkPath); }
    this.matchLeadingSpaces();
    return true;
  }

  // match and slice comments
  matchComments() {
    while (this.matchComment()) {}
  }

  // css comment
  matchComment() {
    if (this.cssText.charAt(0) !== '/' || this.cssText.charAt(1) !== '*') { return false; }
    // reset scopecssDisableNextLine
    this.scopecssDisableNextLine = false;
    let i = 2;
    while (this.cssText.charAt(i) !== '' && (this.cssText.charAt(i) !== '*' || this.cssText.charAt(i + 1) !== '/')) { ++i; }
    i += 2;
    if (this.cssText.charAt(i - 1) === '') {
      return parseError('End of comment missing', this.linkPath);
    }
    // get comment content
    let commentText = this.cssText.slice(2, i - 2);
    this.recordResult(`/*${commentText}*/`);
    commentText = trim(commentText.replace(/^\s*!/, ''));
    // set ignore config
    if (commentText === 'scopecss-disable-next-line') {
      this.scopecssDisableNextLine = true;
    } else if (commentText.startsWith('scopecss-disable')) {
      if (commentText === 'scopecss-disable') {
        this.scopecssDisable = true;
      } else {
        this.scopecssDisable = true;
        const ignoreRules = commentText.replace('scopecss-disable', '').split(',');
        ignoreRules.forEach((rule) => {
          this.scopecssDisableSelectors.push(trim(rule));
        });
      }
    } else if (commentText === 'scopecss-enable') {
      this.scopecssDisable = false;
      this.scopecssDisableSelectors = [];
    }
    this.cssText = this.cssText.slice(i);
    this.matchLeadingSpaces();
    return true;
  }

  commonMatch(reg, skip = false) {
    const matchArray = reg.exec(this.cssText);
    if (!matchArray) { return; }
    const matchStr = matchArray[0];
    this.cssText = this.cssText.slice(matchStr.length);
    if (!skip) { this.recordResult(matchStr); }
    return matchArray;
  }

  matchOpenBrace() {
    return this.commonMatch(/^{\s*/);
  }

  matchCloseBrace() {
    return this.commonMatch(/^}/);
  }

  // match and slice the leading spaces
  matchLeadingSpaces() {
    this.commonMatch(/^\s*/);
  }

  // splice string
  recordResult(strFragment) {
    // Firefox is slow when string contain special characters, see https://github.com/micro-zoe/micro-app/issues/256
    this.result += isFireFox() ? encodeURIComponent(strFragment) : strFragment;
  }
}
/**
 * common method of bind CSS
 */
function commonAction(styleElement, appName, prefix, baseURI, linkPath) {
  if (!styleElement.__MICRO_APP_HAS_SCOPED__) {
    styleElement.__MICRO_APP_HAS_SCOPED__ = true;
    let result = null;
    try {
      result = parser.exec(styleElement.textContent, prefix, baseURI, linkPath);
      parser.reset();
    } catch (error) {
      parser.reset();
      logError('An error occurred while parsing CSS:\n', appName, error);
    }
    if (result) { styleElement.textContent = result; }
  }
}
let parser;
/**
 * scopedCSS
 * @param styleElement target style element
 * @param appName app name
 */
function scopedCSS(styleElement, app) {
  if (app.scopecss) {
    const prefix = `${microApp.tagName}[name=${app.name}]`;
    if (!parser) { parser = new CSSParser(); }
    if (styleElement.textContent) {
      commonAction(styleElement, app.name, prefix, app.url, styleElement.__MICRO_APP_LINK_PATH__);
    } else {
      const observer = new MutationObserver(() => {
        observer.disconnect();
        // styled-component will be ignore
        if (styleElement.textContent && !Object.hasOwn(styleElement.dataset, 'styled')) {
          commonAction(styleElement, app.name, prefix, app.url, styleElement.__MICRO_APP_LINK_PATH__);
        }
      });
      observer.observe(styleElement, { childList: true });
    }
  }
  return styleElement;
}

function eventHandler(event, element) {
  Object.defineProperties(event, {
    currentTarget: {
      get() {
        return element;
      },
    },
    srcElement: {
      get() {
        return element;
      },
    },
    target: {
      get() {
        return element;
      },
    },
  });
}
function dispatchOnLoadEvent(element) {
  const event = new CustomEvent('load');
  eventHandler(event, element);
  if (isFunction(element.onload)) {
    element.onload(event);
  } else {
    element.dispatchEvent(event);
  }
}
function dispatchOnErrorEvent(element) {
  const event = new CustomEvent('error');
  eventHandler(event, element);
  if (isFunction(element.onerror)) {
    element.onerror(event);
  } else {
    element.dispatchEvent(event);
  }
}

// Global links, reuse across apps
const globalLinks = new Map();
/**
 * Extract link elements
 * @param link link element
 * @param parent parent element of link
 * @param app app
 * @param microAppHead micro-app-head element
 * @param isDynamic dynamic insert
 */
function extractLinkFromHtml(link, parent, app, isDynamic = false) {
  const rel = link.getAttribute('rel');
  let href = link.getAttribute('href');
  let replaceComment = null;
  if (rel === 'stylesheet' && href) {
    href = CompletionPath(href, app.url);
    if (!isDynamic) {
      replaceComment = document.createComment(`link element with href=${href} move to micro-app-head as style element`);
      app.source.links.set(href, {
        code: '',
        placeholder: replaceComment,
        isGlobal: link.hasAttribute('global'),
      });
    } else {
      return {
        url: href,
        info: {
          code: '',
          isGlobal: link.hasAttribute('global'),
        },
      };
    }
  } else if (rel && ['prefetch', 'preload', 'prerender', 'icon', 'apple-touch-icon'].includes(rel)) {
    // preload prefetch icon ....
    if (isDynamic) {
      replaceComment = document.createComment(`link element with rel=${rel}${href ? ` & href=${href}` : ''} removed by micro-app`);
    } else {
      link.remove();
    }
  } else if (href) {
    // dns-prefetch preconnect modulepreload search ....
    link.setAttribute('href', CompletionPath(href, app.url));
  }
  if (isDynamic) {
    return { replaceComment };
  }
  if (replaceComment) {
    return parent.replaceChild(replaceComment, link);
  }
}
/**
 * Get link remote resources
 * @param wrapElement htmlDom
 * @param app app
 * @param microAppHead micro-app-head
 */
function fetchLinksFromHtml(wrapElement, app, microAppHead) {
  const linkEntries = [...app.source.links.entries()];
  const fetchLinkPromise = linkEntries.map(([url]) => (globalLinks.has(url) ? globalLinks.get(url) : fetchSource(url, app.name)));
  promiseStream(fetchLinkPromise, (res) => {
    fetchLinkSuccess(linkEntries[res.index][0], linkEntries[res.index][1], res.data, microAppHead, app);
  }, (err) => {
    logError(err, app.name);
  }, () => {
    app.onLoad(wrapElement);
  });
}
/**
 * fetch link succeeded, replace placeholder with style tag
 * @param url resource address
 * @param info resource link info
 * @param data code
 * @param microAppHead micro-app-head
 * @param app app
 */
function fetchLinkSuccess(url, info, data, microAppHead, app) {
  if (info.isGlobal && !globalLinks.has(url)) {
    globalLinks.set(url, data);
  }
  const styleLink = pureCreateElement('style');
  styleLink.textContent = data;
  styleLink.__MICRO_APP_LINK_PATH__ = url;
  styleLink.dataset.originHref = url;
  if (info.placeholder.parentNode) {
    info.placeholder.parentNode.replaceChild(scopedCSS(styleLink, app), info.placeholder);
  } else {
    microAppHead.append(scopedCSS(styleLink, app));
  }
  info.placeholder = null;
  info.code = data;
}
/**
 * get css from dynamic link
 * @param url link address
 * @param info info
 * @param app app
 * @param originLink origin link element
 * @param replaceStyle style element which replaced origin link
 */
function formatDynamicLink(url, info, app, originLink, replaceStyle) {
  if (app.source.links.has(url)) {
    replaceStyle.textContent = app.source.links.get(url).code;
    scopedCSS(replaceStyle, app);
    defer(() => dispatchOnLoadEvent(originLink));
    return;
  }
  if (globalLinks.has(url)) {
    const code = globalLinks.get(url);
    info.code = code;
    app.source.links.set(url, info);
    replaceStyle.textContent = code;
    scopedCSS(replaceStyle, app);
    defer(() => dispatchOnLoadEvent(originLink));
    return;
  }
  fetchSource(url, app.name).then((data) => {
    info.code = data;
    app.source.links.set(url, info);
    info.isGlobal && globalLinks.set(url, data);
    replaceStyle.textContent = data;
    scopedCSS(replaceStyle, app);
    dispatchOnLoadEvent(originLink);
  }).catch((error) => {
    logError(error, app.name);
    dispatchOnErrorEvent(originLink);
  });
}

// Record element and map element
const dynamicElementInMicroAppMap = new WeakMap();
/**
 * Process the new node and format the style, link and script element
 * @param parent parent node
 * @param child new node
 * @param app app
 */
function handleNewNode(parent, child, app) {
  if (child instanceof HTMLStyleElement) {
    if (child.hasAttribute('exclude')) {
      const replaceComment = document.createComment('style element with exclude attribute ignored by micro-app');
      dynamicElementInMicroAppMap.set(child, replaceComment);
      return replaceComment;
    }
    if (app.scopecss && !child.hasAttribute('ignore')) {
      return scopedCSS(child, app);
    }
    return child;
  }
  if (child instanceof HTMLLinkElement) {
    if (child.hasAttribute('exclude') || checkExcludeUrl(child.getAttribute('href'), app.name)) {
      const linkReplaceComment = document.createComment('link element with exclude attribute ignored by micro-app');
      dynamicElementInMicroAppMap.set(child, linkReplaceComment);
      return linkReplaceComment;
    }
    if (child.hasAttribute('ignore')
            || checkIgnoreUrl(child.getAttribute('href'), app.name)
            || (child.href
                && isFunction(microApp.excludeAssetFilter)
                && microApp.excludeAssetFilter(child.href))) {
      return child;
    }
    const { url, info, replaceComment } = extractLinkFromHtml(child, parent, app, true);
    if (url && info) {
      const replaceStyle = pureCreateElement('style');
      replaceStyle.__MICRO_APP_LINK_PATH__ = url;
      formatDynamicLink(url, info, app, child, replaceStyle);
      dynamicElementInMicroAppMap.set(child, replaceStyle);
      return replaceStyle;
    }
    if (replaceComment) {
      dynamicElementInMicroAppMap.set(child, replaceComment);
      return replaceComment;
    }
    return child;
  }
  if (child instanceof HTMLScriptElement) {
    if (child.src
            && isFunction(microApp.excludeAssetFilter)
            && microApp.excludeAssetFilter(child.src)) {
      return child;
    }
    const { replaceComment, url, info } = extractScriptElement(child, parent, app, true) || {};
    if (url && info) {
      if (!info.isExternal) { // inline script
        const replaceElement = runScript(url, app, info, true);
        dynamicElementInMicroAppMap.set(child, replaceElement);
        return replaceElement;
      }
      // remote script
      const replaceElement = runDynamicRemoteScript(url, info, app, child);
      dynamicElementInMicroAppMap.set(child, replaceElement);
      return replaceElement;
    }
    if (replaceComment) {
      dynamicElementInMicroAppMap.set(child, replaceComment);
      return replaceComment;
    }
    return child;
  }
  return child;
}
/**
 * Handle the elements inserted into head and body, and execute normally in other cases
 * @param app app
 * @param method raw method
 * @param parent parent node
 * @param targetChild target node
 * @param passiveChild second param of insertBefore and replaceChild
 */
function invokePrototypeMethod(app, rawMethod, parent, targetChild, passiveChild) {
  const container = getContainer(parent, app);
  /**
   * If passiveChild is not the child node, insertBefore replaceChild will have a problem, at this time, it will be degraded to appendChild
   * E.g: document.head.insertBefore(targetChild, document.head.childNodes[0])
   */
  if (container) {
    /**
     * 1. If passiveChild exists, it must be insertBefore or replaceChild
     * 2. When removeChild, targetChild may not be in microAppHead or head
     */
    if (passiveChild && !container.contains(passiveChild)) {
      return globalEnv.rawAppendChild.call(container, targetChild);
    }
    if (rawMethod === globalEnv.rawRemoveChild && !container.contains(targetChild)) {
      if (parent.contains(targetChild)) {
        return rawMethod.call(parent, targetChild);
      }
      return targetChild;
    }
    return invokeRawMethod(rawMethod, container, targetChild, passiveChild);
  }
  return invokeRawMethod(rawMethod, parent, targetChild, passiveChild);
}
function invokeRawMethod(rawMethod, parent, targetChild, passiveChild) {
  if (isPendMethod(rawMethod)) {
    return rawMethod.call(parent, targetChild);
  }
  return rawMethod.call(parent, targetChild, passiveChild);
}
function isPendMethod(method) {
  return method === globalEnv.rawAppend || method === globalEnv.rawPrepend;
}
function getContainer(node, app) {
  let _a, _b;
  if (node === document.head) {
    return (_a = app === null || app === void 0 ? void 0 : app.container) === null || _a === void 0 ? void 0 : _a.querySelector('micro-app-head');
  }
  if (node === document.body) {
    return (_b = app === null || app === void 0 ? void 0 : app.container) === null || _b === void 0 ? void 0 : _b.querySelector('micro-app-body');
  }
  return null;
}
// Get the map element
function getMappingNode(node) {
  let _a;
  return (_a = dynamicElementInMicroAppMap.get(node)) !== null && _a !== void 0 ? _a : node;
}
/**
 * method of handle new node
 * @param parent parent node
 * @param newChild new node
 * @param passiveChild passive node
 * @param rawMethod method
 */
function commonElementHandler(parent, newChild, passiveChild, rawMethod) {
  if (newChild === null || newChild === void 0 ? void 0 : newChild.__MICRO_APP_NAME__) {
    const app = appInstanceMap.get(newChild.__MICRO_APP_NAME__);
    if (app === null || app === void 0 ? void 0 : app.container) {
      return invokePrototypeMethod(app, rawMethod, parent, handleNewNode(parent, newChild, app), passiveChild && getMappingNode(passiveChild));
    }
    if (rawMethod === globalEnv.rawAppend || rawMethod === globalEnv.rawPrepend) {
      return rawMethod.call(parent, newChild);
    }
    return rawMethod.call(parent, newChild, passiveChild);
  }
  if (rawMethod === globalEnv.rawAppend || rawMethod === globalEnv.rawPrepend) {
    const appName = getCurrentAppName();
    if (!(newChild instanceof Node) && appName) {
      const app = appInstanceMap.get(appName);
      if (app === null || app === void 0 ? void 0 : app.container) {
        if (parent === document.head) {
          return rawMethod.call(app.container.querySelector('micro-app-head'), newChild);
        }
        if (parent === document.body) {
          return rawMethod.call(app.container.querySelector('micro-app-body'), newChild);
        }
      }
    }
    return rawMethod.call(parent, newChild);
  }
  return rawMethod.call(parent, newChild, passiveChild);
}
/**
 * Rewrite element prototype method
 */
function patchElementPrototypeMethods() {
  patchDocument();
  // prototype methods of add element👇
  Element.prototype.appendChild = function appendChild(newChild) {
    return commonElementHandler(this, newChild, null, globalEnv.rawAppendChild);
  };
  Element.prototype.insertBefore = function insertBefore(newChild, refChild) {
    return commonElementHandler(this, newChild, refChild, globalEnv.rawInsertBefore);
  };
  Element.prototype.replaceChild = function replaceChild(newChild, oldChild) {
    return commonElementHandler(this, newChild, oldChild, globalEnv.rawReplaceChild);
  };
  Element.prototype.append = function append(...nodes) {
    let i = 0;
    const length = nodes.length;
    while (i < length) {
      commonElementHandler(this, nodes[i], null, globalEnv.rawAppend);
      i++;
    }
  };
  Element.prototype.prepend = function prepend(...nodes) {
    let i = nodes.length;
    while (i > 0) {
      commonElementHandler(this, nodes[i - 1], null, globalEnv.rawPrepend);
      i--;
    }
  };
  // prototype methods of delete element👇
  Element.prototype.removeChild = function removeChild(oldChild) {
    if (oldChild === null || oldChild === void 0 ? void 0 : oldChild.__MICRO_APP_NAME__) {
      const app = appInstanceMap.get(oldChild.__MICRO_APP_NAME__);
      if (app === null || app === void 0 ? void 0 : app.container) {
        return invokePrototypeMethod(app, globalEnv.rawRemoveChild, this, getMappingNode(oldChild));
      }
      return globalEnv.rawRemoveChild.call(this, oldChild);
    }
    return globalEnv.rawRemoveChild.call(this, oldChild);
  };
  // patch cloneNode
  Element.prototype.cloneNode = function cloneNode(deep) {
    const clonedNode = globalEnv.rawCloneNode.call(this, deep);
    this.__MICRO_APP_NAME__ && (clonedNode.__MICRO_APP_NAME__ = this.__MICRO_APP_NAME__);
    return clonedNode;
  };
  /*
   * patch getBoundingClientRect
   * TODO: scenes test
   * Element.prototype.getBoundingClientRect = function getBoundingClientRect () {
   *   const rawRect: DOMRect = globalEnv.rawGetBoundingClientRect.call(this)
   *   if (this.__MICRO_APP_NAME__) {
   *     const app = appInstanceMap.get(this.__MICRO_APP_NAME__)
   *     if (!app?.container) {
   *       return rawRect
   *     }
   *     const appBody = app.container.querySelector('micro-app-body')
   *     const appBodyRect: DOMRect = globalEnv.rawGetBoundingClientRect.call(appBody)
   *     const computedRect: DOMRect = new DOMRect(
   *       rawRect.x - appBodyRect.x,
   *       rawRect.y - appBodyRect.y,
   *       rawRect.width,
   *       rawRect.height,
   *     )
   *     return computedRect
   *   }
   *   return rawRect
   * }
   */
}
/**
 * Mark the newly created element in the micro application
 * @param element new element
 */
function markElement(element) {
  const appName = getCurrentAppName();
  if (appName) { element.__MICRO_APP_NAME__ = appName; }
  return element;
}
// methods of document
function patchDocument() {
  const rawDocument = globalEnv.rawDocument;
  // create element 👇
  Document.prototype.createElement = function createElement(tagName, options) {
    const element = globalEnv.rawCreateElement.call(this, tagName, options);
    return markElement(element);
  };
  Document.prototype.createElementNS = function createElementNS(namespaceURI, name, options) {
    const element = globalEnv.rawCreateElementNS.call(this, namespaceURI, name, options);
    return markElement(element);
  };
  Document.prototype.createDocumentFragment = function createDocumentFragment() {
    const element = globalEnv.rawCreateDocumentFragment.call(this);
    return markElement(element);
  };
  // query element👇
  function querySelector(selectors) {
    let _a, _b, _c;
    const appName = getCurrentAppName();
    if (!appName
            || !selectors
            || isUniqueElement(selectors)
            // see https://github.com/micro-zoe/micro-app/issues/56
            || rawDocument !== this) {
      return globalEnv.rawQuerySelector.call(this, selectors);
    }
    return (_c = (_b = (_a = appInstanceMap.get(appName)) === null || _a === void 0 ? void 0 : _a.container) === null || _b === void 0 ? void 0 : _b.querySelector(selectors)) !== null && _c !== void 0 ? _c : null;
  }
  function querySelectorAll(selectors) {
    let _a, _b, _c;
    const appName = getCurrentAppName();
    if (!appName
            || !selectors
            || isUniqueElement(selectors)
            || rawDocument !== this) {
      return globalEnv.rawQuerySelectorAll.call(this, selectors);
    }
    return (_c = (_b = (_a = appInstanceMap.get(appName)) === null || _a === void 0 ? void 0 : _a.container) === null || _b === void 0 ? void 0 : _b.querySelectorAll(selectors)) !== null && _c !== void 0 ? _c : [];
  }
  Document.prototype.querySelector = querySelector;
  Document.prototype.querySelectorAll = querySelectorAll;
  Document.prototype.getElementById = function getElementById(key) {
    if (!getCurrentAppName() || isInvalidQuerySelectorKey(key)) {
      return globalEnv.rawGetElementById.call(this, key);
    }
    try {
      return querySelector.call(this, `#${key}`);
    } catch {
      return globalEnv.rawGetElementById.call(this, key);
    }
  };
  Document.prototype.getElementsByClassName = function getElementsByClassName(key) {
    if (!getCurrentAppName() || isInvalidQuerySelectorKey(key)) {
      return globalEnv.rawGetElementsByClassName.call(this, key);
    }
    try {
      return querySelectorAll.call(this, `.${key}`);
    } catch {
      return globalEnv.rawGetElementsByClassName.call(this, key);
    }
  };
  Document.prototype.getElementsByTagName = function getElementsByTagName(key) {
    let _a;
    const appName = getCurrentAppName();
    if (!appName
            || isUniqueElement(key)
            || isInvalidQuerySelectorKey(key)
            || (!((_a = appInstanceMap.get(appName)) === null || _a === void 0 ? void 0 : _a.inline) && (/^script$/i).test(key))) {
      return globalEnv.rawGetElementsByTagName.call(this, key);
    }
    try {
      return querySelectorAll.call(this, key);
    } catch {
      return globalEnv.rawGetElementsByTagName.call(this, key);
    }
  };
  Document.prototype.getElementsByName = function getElementsByName(key) {
    if (!getCurrentAppName() || isInvalidQuerySelectorKey(key)) {
      return globalEnv.rawGetElementsByName.call(this, key);
    }
    try {
      return querySelectorAll.call(this, `[name=${key}]`);
    } catch {
      return globalEnv.rawGetElementsByName.call(this, key);
    }
  };
}
/**
 * patchSetAttribute is different from other patch
 * it not dependent on sandbox
 * it should exec when micro-app first created & release when all app unmounted
 */
let hasRewriteSetAttribute = false;
function patchSetAttribute() {
  if (hasRewriteSetAttribute) { return; }
  hasRewriteSetAttribute = true;
  Element.prototype.setAttribute = function setAttribute(key, value) {
    if ((/^micro-app(-\S+)?/i).test(this.tagName) && key === 'data') {
      if (isPlainObject(value)) {
        const cloneValue = {};
        Object.getOwnPropertyNames(value).forEach((propertyKey) => {
          if (!(isString(propertyKey) && propertyKey.indexOf('__') === 0)) {
            // @ts-ignore
            cloneValue[propertyKey] = value[propertyKey];
          }
        });
        this.data = cloneValue;
      } else if (value !== '[object Object]') {
        logWarn('property data must be an object', this.getAttribute('name'));
      }
    } else if ((((key === 'src' || key === 'srcset') && (/^(img|script)$/i).test(this.tagName))
            || (key === 'href' && (/^link$/i).test(this.tagName)))
            && this.__MICRO_APP_NAME__
            && appInstanceMap.has(this.__MICRO_APP_NAME__)) {
      const app = appInstanceMap.get(this.__MICRO_APP_NAME__);
      globalEnv.rawSetAttribute.call(this, key, CompletionPath(value, app.url));
    } else {
      globalEnv.rawSetAttribute.call(this, key, value);
    }
  };
}
function releasePatchSetAttribute() {
  hasRewriteSetAttribute = false;
  Element.prototype.setAttribute = globalEnv.rawSetAttribute;
}
function releasePatchDocument() {
  Document.prototype.createElement = globalEnv.rawCreateElement;
  Document.prototype.createElementNS = globalEnv.rawCreateElementNS;
  Document.prototype.createDocumentFragment = globalEnv.rawCreateDocumentFragment;
  Document.prototype.querySelector = globalEnv.rawQuerySelector;
  Document.prototype.querySelectorAll = globalEnv.rawQuerySelectorAll;
  Document.prototype.getElementById = globalEnv.rawGetElementById;
  Document.prototype.getElementsByClassName = globalEnv.rawGetElementsByClassName;
  Document.prototype.getElementsByTagName = globalEnv.rawGetElementsByTagName;
  Document.prototype.getElementsByName = globalEnv.rawGetElementsByName;
}
// release patch
function releasePatches() {
  setCurrentAppName(null);
  releasePatchDocument();
  Element.prototype.appendChild = globalEnv.rawAppendChild;
  Element.prototype.insertBefore = globalEnv.rawInsertBefore;
  Element.prototype.replaceChild = globalEnv.rawReplaceChild;
  Element.prototype.removeChild = globalEnv.rawRemoveChild;
  Element.prototype.append = globalEnv.rawAppend;
  Element.prototype.prepend = globalEnv.rawPrepend;
  Element.prototype.cloneNode = globalEnv.rawCloneNode;
  // Element.prototype.getBoundingClientRect = globalEnv.rawGetBoundingClientRect
}
// Set the style of micro-app-head and micro-app-body
let hasRejectMicroAppStyle = false;
function rejectMicroAppStyle() {
  if (!hasRejectMicroAppStyle) {
    hasRejectMicroAppStyle = true;
    const style = pureCreateElement('style');
    globalEnv.rawSetAttribute.call(style, 'type', 'text/css');
    style.textContent = `\n${microApp.tagName}, micro-app-body { display: block; } \nmicro-app-head { display: none; }`;
    globalEnv.rawDocument.head.append(style);
  }
}

// 管理 app 的单例
class AppManager {
  constructor() {
    // Todo: appInstanceMap 由 AppManager 来创建，不再由 create_app 管理
    this.appInstanceMap = appInstanceMap;
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new AppManager();
    }
    return this.instance;
  }

  get(appName) {
    return this.appInstanceMap.get(appName);
  }

  set(appName, app) {
    this.appInstanceMap.set(appName, app);
  }

  getAll() {
    return [...this.appInstanceMap.values()];
  }

  clear() {
    this.appInstanceMap.clear();
  }
}

function unmountNestedApp() {
  releaseUnmountOfNestedApp();
  AppManager.getInstance().getAll().forEach((app) => {
    // @ts-ignore
    app.container && getRootContainer(app.container).disconnectedCallback();
  });
  !window.__MICRO_APP_UMD_MODE__ && AppManager.getInstance().clear();
}
// if micro-app run in micro application, delete all next generation application when unmount event received
function listenUmountOfNestedApp() {
  if (window.__MICRO_APP_ENVIRONMENT__) {
    window.addEventListener('unmount', unmountNestedApp, false);
  }
}
// release listener
function releaseUnmountOfNestedApp() {
  if (window.__MICRO_APP_ENVIRONMENT__) {
    window.removeEventListener('unmount', unmountNestedApp, false);
  }
}

const globalEnv = {};
/**
 * Note loop nesting
 * Only prototype or unique values can be put here
 */
function initGlobalEnv() {
  if (isBrowser) {
    /**
     * save patch raw methods
     * pay attention to this binding
     */
    const rawSetAttribute = Element.prototype.setAttribute;
    const rawAppendChild = Element.prototype.appendChild;
    const rawInsertBefore = Element.prototype.insertBefore;
    const rawReplaceChild = Element.prototype.replaceChild;
    const rawRemoveChild = Element.prototype.removeChild;
    const rawAppend = Element.prototype.append;
    const rawPrepend = Element.prototype.prepend;
    const rawCloneNode = Element.prototype.cloneNode;
    // const rawGetBoundingClientRect = Element.prototype.getBoundingClientRect
    const rawCreateElement = Document.prototype.createElement;
    const rawCreateElementNS = Document.prototype.createElementNS;
    const rawCreateDocumentFragment = Document.prototype.createDocumentFragment;
    const rawQuerySelector = Document.prototype.querySelector;
    const rawQuerySelectorAll = Document.prototype.querySelectorAll;
    const rawGetElementById = Document.prototype.getElementById;
    const rawGetElementsByClassName = Document.prototype.getElementsByClassName;
    const rawGetElementsByTagName = Document.prototype.getElementsByTagName;
    const rawGetElementsByName = Document.prototype.getElementsByName;
    const ImageProxy = new Proxy(Image, {
      construct(Target, args) {
        const elementImage = new Target(...args);
        elementImage.__MICRO_APP_NAME__ = getCurrentAppName();
        return elementImage;
      },
    });
    const rawWindow = new Function('return window')();
    const rawDocument = new Function('return document')();
    const supportModuleScript = isSupportModuleScript();
    /**
     * save effect raw methods
     * pay attention to this binding, especially setInterval, setTimeout, clearInterval, clearTimeout
     */
    const rawWindowAddEventListener = rawWindow.addEventListener;
    const rawWindowRemoveEventListener = rawWindow.removeEventListener;
    const rawSetInterval = rawWindow.setInterval;
    const rawSetTimeout = rawWindow.setTimeout;
    const rawClearInterval = rawWindow.clearInterval;
    const rawClearTimeout = rawWindow.clearTimeout;
    const rawDocumentAddEventListener = rawDocument.addEventListener;
    const rawDocumentRemoveEventListener = rawDocument.removeEventListener;
    // mark current application as base application
    window.__MICRO_APP_BASE_APPLICATION__ = true;
    Object.assign(globalEnv, {
      // source/patch
      rawSetAttribute,
      rawAppendChild,
      rawInsertBefore,
      rawReplaceChild,
      rawRemoveChild,
      rawAppend,
      rawPrepend,
      rawCloneNode,
      // rawGetBoundingClientRect,
      rawCreateElement,
      rawCreateElementNS,
      rawCreateDocumentFragment,
      rawQuerySelector,
      rawQuerySelectorAll,
      rawGetElementById,
      rawGetElementsByClassName,
      rawGetElementsByTagName,
      rawGetElementsByName,
      ImageProxy,
      // common global vars
      rawWindow,
      rawDocument,
      supportModuleScript,
      // sandbox/effect
      rawWindowAddEventListener,
      rawWindowRemoveEventListener,
      rawSetInterval,
      rawSetTimeout,
      rawClearInterval,
      rawClearTimeout,
      rawDocumentAddEventListener,
      rawDocumentRemoveEventListener,
    });
    // global effect
    rejectMicroAppStyle();
    releaseUnmountOfNestedApp();
    listenUmountOfNestedApp();
  }
}

// Global scripts, reuse across apps
const globalScripts = new Map();
/**
 * Extract script elements
 * @param script script element
 * @param parent parent element of script
 * @param app app
 * @param isDynamic dynamic insert
 */
function extractScriptElement(script, parent, app, isDynamic = false) {
  let replaceComment = null;
  let src = script.getAttribute('src');
  if (src) {
    src = CompletionPath(src, app.url);
  }
  if (script.hasAttribute('exclude') || checkExcludeUrl(src, app.name)) {
    replaceComment = document.createComment('script element with exclude attribute removed by micro-app');
  } else if ((script.type && !['text/javascript', 'text/ecmascript', 'application/javascript', 'application/ecmascript', 'module', 'systemjs-module', 'systemjs-importmap'].includes(script.type))
        || script.hasAttribute('ignore') || checkIgnoreUrl(src, app.name)) {
    return null;
  } else if ((globalEnv.supportModuleScript && script.noModule)
        || (!globalEnv.supportModuleScript && script.type === 'module')) {
    replaceComment = document.createComment(`${script.noModule ? 'noModule' : 'module'} script ignored by micro-app`);
  } else if (src) { // remote script
    const info = {
      code: '',
      isExternal: true,
      isDynamic,
      async: script.hasAttribute('async'),
      defer: script.defer || script.type === 'module',
      module: script.type === 'module',
      isGlobal: script.hasAttribute('global'),
    };
    if (!isDynamic) {
      app.source.scripts.set(src, info);
      replaceComment = document.createComment(`script with src='${src}' extract by micro-app`);
    } else {
      return { url: src, info };
    }
  } else if (script.textContent) { // inline script
    const nonceStr = createNonceSrc();
    const info = {
      code: script.textContent,
      isExternal: false,
      isDynamic,
      async: false,
      defer: script.type === 'module',
      module: script.type === 'module',
    };
    if (!isDynamic) {
      app.source.scripts.set(nonceStr, info);
      replaceComment = document.createComment('inline script extract by micro-app');
    } else {
      return { url: nonceStr, info };
    }
  } else if (!isDynamic) {
    /**
     * script with empty src or empty script.textContent remove in static html
     * & not removed if it created by dynamic
     */
    replaceComment = document.createComment('script element removed by micro-app');
  }
  if (isDynamic) {
    return { replaceComment };
  }

  return parent.replaceChild(replaceComment, script);
}
/**
 * get assets plugins
 * @param appName app name
 */
function getAssetsPlugins(appName) {
  let _a, _b, _c;
  const globalPlugins = ((_a = microApp.plugins) === null || _a === void 0 ? void 0 : _a.global) || [];
  const modulePlugins = ((_c = (_b = microApp.plugins) === null || _b === void 0 ? void 0 : _b.modules) === null || _c === void 0 ? void 0 : _c[appName]) || [];
  return [...globalPlugins, ...modulePlugins];
}
/**
 * whether the url needs to be excluded
 * @param url css or js link
 * @param plugins microApp plugins
 */
function checkExcludeUrl(url, appName) {
  if (!url) { return false; }
  const plugins = getAssetsPlugins(appName) || [];
  return plugins.some((plugin) => {
    if (!plugin.excludeChecker) { return false; }
    return plugin.excludeChecker(url);
  });
}
/**
 * whether the url needs to be ignore
 * @param url css or js link
 * @param plugins microApp plugins
 */
function checkIgnoreUrl(url, appName) {
  if (!url) { return false; }
  const plugins = getAssetsPlugins(appName) || [];
  return plugins.some((plugin) => {
    if (!plugin.ignoreChecker) { return false; }
    return plugin.ignoreChecker(url);
  });
}
/**
 *  Get remote resources of script
 * @param wrapElement htmlDom
 * @param app app
 */
function fetchScriptsFromHtml(wrapElement, app) {
  const scriptEntries = [...app.source.scripts.entries()];
  const fetchScriptPromise = [];
  const fetchScriptPromiseInfo = [];
  for (const [url, info] of scriptEntries) {
    if (info.isExternal) {
      const globalScriptText = globalScripts.get(url);
      if (globalScriptText) {
        info.code = globalScriptText;
      } else if ((!info.defer && !info.async) || app.isPrefetch) {
        fetchScriptPromise.push(fetchSource(url, app.name));
        fetchScriptPromiseInfo.push([url, info]);
      }
    }
  }
  if (fetchScriptPromise.length > 0) {
    promiseStream(fetchScriptPromise, (res) => {
      fetchScriptSuccess(fetchScriptPromiseInfo[res.index][0], fetchScriptPromiseInfo[res.index][1], res.data);
    }, (err) => {
      logError(err, app.name);
    }, () => {
      app.onLoad(wrapElement);
    });
  } else {
    app.onLoad(wrapElement);
  }
}
/**
 * fetch js succeeded, record the code value
 * @param url script address
 * @param info resource script info
 * @param data code
 */
function fetchScriptSuccess(url, info, data) {
  if (info.isGlobal && !globalScripts.has(url)) {
    globalScripts.set(url, data);
  }
  info.code = data;
}
/**
 * Execute js in the mount lifecycle
 * @param scriptList script list
 * @param app app
 * @param initHook callback for umd mode
 */
function execScripts(scriptList, app, initHook) {
  const scriptListEntries = [...scriptList.entries()];
  const deferScriptPromise = [];
  const deferScriptInfo = [];
  for (const [url, info] of scriptListEntries) {
    if (!info.isDynamic) {
      // Notice the second render
      if (info.defer || info.async) {
        if (info.isExternal && !info.code) {
          deferScriptPromise.push(fetchSource(url, app.name));
        } else {
          deferScriptPromise.push(info.code);
        }
        deferScriptInfo.push([url, info]);
        info.module && (initHook.moduleCount = initHook.moduleCount ? ++initHook.moduleCount : 1);
      } else {
        runScript(url, app, info, false);
        initHook(false);
      }
    }
  }
  if (deferScriptPromise.length > 0) {
    promiseStream(deferScriptPromise, (res) => {
      const info = deferScriptInfo[res.index][1];
      info.code = info.code || res.data;
    }, (err) => {
      initHook.errorCount = initHook.errorCount ? ++initHook.errorCount : 1;
      logError(err, app.name);
    }, () => {
      deferScriptInfo.forEach(([url, info]) => {
        if (info.code) {
          runScript(url, app, info, false, initHook);
          !info.module && initHook(false);
        }
      });
      initHook(isUndefined(initHook.moduleCount)
                || initHook.errorCount === deferScriptPromise.length);
    });
  } else {
    initHook(true);
  }
}
/**
 * run code
 * @param url script address
 * @param app app
 * @param info script info
 * @param isDynamic dynamically created script
 * @param callback callback of module script
 */
function runScript(url, app, info, isDynamic, callback) {
  let _a;
  try {
    const code = bindScope(url, app, info.code, info);
    if (app.inline || info.module) {
      const scriptElement = pureCreateElement('script');
      runCode2InlineScript(url, code, info.module, scriptElement, callback);
      if (isDynamic) { return scriptElement; }
      // TEST IGNORE
      (_a = app.container) === null || _a === void 0 ? void 0 : _a.querySelector('micro-app-body').appendChild(scriptElement);
    } else {
      runCode2Function(code, info);
      if (isDynamic) { return document.createComment('dynamic script extract by micro-app'); }
    }
  } catch (error) {
    console.error(`[micro-app from runScript] app ${app.name}:`, error);
  }
}
/**
 * Get dynamically created remote script
 * @param url script address
 * @param info info
 * @param app app
 * @param originScript origin script element
 */
function runDynamicRemoteScript(url, info, app, originScript) {
  const dispatchScriptOnLoadEvent = () => dispatchOnLoadEvent(originScript);
  // url is unique
  if (app.source.scripts.has(url)) {
    const existInfo = app.source.scripts.get(url);
    !existInfo.module && defer(dispatchScriptOnLoadEvent);
    return runScript(url, app, existInfo, true, dispatchScriptOnLoadEvent);
  }
  if (globalScripts.has(url)) {
    const code = globalScripts.get(url);
    info.code = code;
    app.source.scripts.set(url, info);
    !info.module && defer(dispatchScriptOnLoadEvent);
    return runScript(url, app, info, true, dispatchScriptOnLoadEvent);
  }
  let replaceElement;
  replaceElement = app.inline || info.module ? pureCreateElement('script') : document.createComment(`dynamic script with src='${url}' extract by micro-app`);
  fetchSource(url, app.name).then((code) => {
    info.code = code;
    app.source.scripts.set(url, info);
    info.isGlobal && globalScripts.set(url, code);
    try {
      code = bindScope(url, app, code, info);
      if (app.inline || info.module) {
        runCode2InlineScript(url, code, info.module, replaceElement, dispatchScriptOnLoadEvent);
      } else {
        runCode2Function(code, info);
      }
    } catch (error) {
      console.error(`[micro-app from runDynamicScript] app ${app.name}:`, error, url);
    }
    !info.module && dispatchOnLoadEvent(originScript);
  }).catch((error) => {
    logError(error, app.name);
    dispatchOnErrorEvent(originScript);
  });
  return replaceElement;
}
/**
 * common handle for inline script
 * @param url script address
 * @param code bound code
 * @param module type='module' of script
 * @param scriptElement target script element
 * @param callback callback of module script
 */
function runCode2InlineScript(url, code, module, scriptElement, callback) {
  if (module) {
    // module script is async, transform it to a blob for subsequent operations
    const blob = new Blob([code], { type: 'text/javascript' });
    scriptElement.src = URL.createObjectURL(blob);
    scriptElement.setAttribute('type', 'module');
    if (callback) {
      callback.moduleCount && callback.moduleCount--;
      scriptElement.addEventListener('load', callback.bind(scriptElement, callback.moduleCount === 0));
    }
  } else {
    scriptElement.textContent = code;
  }
  if (!url.startsWith('inline-')) {
    scriptElement.dataset.originSrc = url;
  }
}
// init & run code2Function
function runCode2Function(code, info) {
  if (!info.code2Function) {
    info.code2Function = new Function(code);
  }
  info.code2Function.call(window);
}
/**
 * bind js scope
 * @param url script address
 * @param app app
 * @param code code
 * @param info source script info
 */
function bindScope(url, app, code, info) {
  if (isPlainObject(microApp.plugins)) {
    code = usePlugins(url, code, app.name, microApp.plugins, info);
  }
  if (app.sandBox && !info.module) {
    globalEnv.rawWindow.__MICRO_APP_PROXY_WINDOW__ = app.sandBox.proxyWindow;
    return `;(function(proxyWindow){with(proxyWindow.__MICRO_APP_WINDOW__){(function(${globalKeyToBeCached}){;${code}\n}).call(proxyWindow,${globalKeyToBeCached})}})(window.__MICRO_APP_PROXY_WINDOW__);`;
  }
  return code;
}
/**
 * Call the plugin to process the file
 * @param url script address
 * @param code code
 * @param appName app name
 * @param plugins plugin list
 * @param info source script info
 */
function usePlugins(url, code, appName, plugins, info) {
  let _a;
  const newCode = processCode(plugins.global, code, url, info);
  return processCode((_a = plugins.modules) === null || _a === void 0 ? void 0 : _a[appName], newCode, url, info);
}
function processCode(configs, code, url, info) {
  if (!isArray(configs)) {
    return code;
  }
  return configs.reduce((preCode, config) => {
    if (isPlainObject(config) && isFunction(config.loader)) {
      return config.loader(preCode, url, config.options, info);
    }
    return preCode;
  }, code);
}

/**
 * transform html string to dom
 * @param str string dom
 */
function getWrapElement(str) {
  const wrapDiv = pureCreateElement('div');
  wrapDiv.innerHTML = str;
  return wrapDiv;
}
/**
 * Recursively process each child element
 * @param parent parent element
 * @param app app
 * @param microAppHead micro-app-head element
 */
function flatChildren(parent, app, microAppHead) {
  const children = [...parent.children];
  children.length && children.forEach((child) => {
    flatChildren(child, app);
  });
  for (const dom of children) {
    if (dom instanceof HTMLLinkElement) {
      if (dom.hasAttribute('exclude') || checkExcludeUrl(dom.getAttribute('href'), app.name)) {
        parent.replaceChild(document.createComment('link element with exclude attribute ignored by micro-app'), dom);
      } else if (!(dom.hasAttribute('ignore') || checkIgnoreUrl(dom.getAttribute('href'), app.name))) {
        extractLinkFromHtml(dom, parent, app);
      } else if (dom.hasAttribute('href')) {
        dom.setAttribute('href', CompletionPath(dom.getAttribute('href'), app.url));
      }
    } else if (dom instanceof HTMLStyleElement) {
      if (dom.hasAttribute('exclude')) {
        parent.replaceChild(document.createComment('style element with exclude attribute ignored by micro-app'), dom);
      } else if (app.scopecss && !dom.hasAttribute('ignore')) {
        scopedCSS(dom, app);
      }
    } else if (dom instanceof HTMLScriptElement) {
      extractScriptElement(dom, parent, app);
    } else if (dom instanceof HTMLMetaElement || dom instanceof HTMLTitleElement) {
      dom.remove();
    } else if (dom instanceof HTMLImageElement && dom.hasAttribute('src')) {
      dom.setAttribute('src', CompletionPath(dom.getAttribute('src'), app.url));
    }
  }
}
/**
 * Extract link and script, bind style scope
 * @param htmlStr html string
 * @param app app
 */
function extractSourceDom(htmlStr, app) {
  const wrapElement = getWrapElement(htmlStr);
  const microAppHead = wrapElement.querySelector('micro-app-head');
  const microAppBody = wrapElement.querySelector('micro-app-body');
  if (!microAppHead || !microAppBody) {
    const msg = `element ${microAppHead ? 'body' : 'head'} is missing`;
    app.onerror(new Error(msg));
    return logError(msg, app.name);
  }
  flatChildren(wrapElement, app);
  if (app.source.links.size > 0) {
    fetchLinksFromHtml(wrapElement, app, microAppHead);
  } else {
    app.onLoad(wrapElement);
  }
  if (app.source.scripts.size > 0) {
    fetchScriptsFromHtml(wrapElement, app);
  } else {
    app.onLoad(wrapElement);
  }
}

class EventCenter {
  constructor() {
    this.eventList = new Map();
  }

  // whether the name is legal
  isLegalName(name) {
    if (!name) {
      logError('event-center: Invalid name');
      return false;
    }
    return true;
  }

  /**
   * add listener
   * @param name event name
   * @param f listener
   * @param autoTrigger If there is cached data when first bind listener, whether it needs to trigger, default is false
   */
  on(name, f, autoTrigger = false) {
    if (this.isLegalName(name)) {
      if (!isFunction(f)) {
        return logError('event-center: Invalid callback function');
      }
      let eventInfo = this.eventList.get(name);
      if (!eventInfo) {
        eventInfo = {
          data: {},
          callbacks: new Set(),
        };
        this.eventList.set(name, eventInfo);
      } else if (autoTrigger && Object.getOwnPropertyNames(eventInfo.data).length > 0) {
        // auto trigger when data not null
        f(eventInfo.data);
      }
      eventInfo.callbacks.add(f);
    }
  }

  // remove listener, but the data is not cleared
  off(name, f) {
    if (this.isLegalName(name)) {
      const eventInfo = this.eventList.get(name);
      if (eventInfo) {
        if (isFunction(f)) {
          eventInfo.callbacks.delete(f);
        } else {
          eventInfo.callbacks.clear();
        }
      }
    }
  }

  // dispatch data
  dispatch(name, data) {
    if (this.isLegalName(name)) {
      if (!isPlainObject(data)) {
        return logError('event-center: data must be object');
      }
      let eventInfo = this.eventList.get(name);
      if (eventInfo) {
        // Update when the data is not equal
        if (eventInfo.data !== data) {
          eventInfo.data = data;
          for (const f of eventInfo.callbacks) {
            f(data);
          }
        }
      } else {
        eventInfo = {
          data,
          callbacks: new Set(),
        };
        this.eventList.set(name, eventInfo);
      }
    }
  }

  // get data
  getData(name) {
    let _a;
    const eventInfo = this.eventList.get(name);
    return (_a = eventInfo === null || eventInfo === void 0 ? void 0 : eventInfo.data) !== null && _a !== void 0 ? _a : null;
  }
}

const eventCenter = new EventCenter();
/**
 * Format event name
 * @param appName app.name
 * @param fromBaseApp is from base app
 */
function formatEventName(appName, fromBaseApp) {
  if (!isString(appName) || !appName) { return ''; }
  return fromBaseApp ? `__from_base_app_${appName}__` : `__from_micro_app_${appName}__`;
}
// Global data
class EventCenterForGlobal {
  /**
   * add listener of global data
   * @param cb listener
   * @param autoTrigger If there is cached data when first bind listener, whether it needs to trigger, default is false
   */
  addGlobalDataListener(cb, autoTrigger) {
    const appName = this.appName;
    // if appName exists, this is in sub app
    if (appName) {
      cb.__APP_NAME__ = appName;
      cb.__AUTO_TRIGGER__ = autoTrigger;
    }
    eventCenter.on('global', cb, autoTrigger);
  }

  /**
   * remove listener of global data
   * @param cb listener
   */
  removeGlobalDataListener(cb) {
    isFunction(cb) && eventCenter.off('global', cb);
  }

  /**
   * dispatch global data
   * @param data data
   */
  setGlobalData(data) {
    // clear dom scope before dispatch global data, apply to micro app
    removeDomScope();
    eventCenter.dispatch('global', data);
  }

  /**
   * get global data
   */
  getGlobalData() {
    return eventCenter.getData('global');
  }

  /**
   * clear all listener of global data
   * if appName exists, only the specified functions is cleared
   * if appName not exists, only clear the base app functions
   */
  clearGlobalDataListener() {
    const appName = this.appName;
    const eventInfo = eventCenter.eventList.get('global');
    if (eventInfo) {
      for (const cb of eventInfo.callbacks) {
        if ((appName && appName === cb.__APP_NAME__)
                    || !(appName || cb.__APP_NAME__)) {
          eventInfo.callbacks.delete(cb);
        }
      }
    }
  }
}
// Event center for base app
class EventCenterForBaseApp extends EventCenterForGlobal {
  /**
   * add listener
   * @param appName app.name
   * @param cb listener
   * @param autoTrigger If there is cached data when first bind listener, whether it needs to trigger, default is false
   */
  addDataListener(appName, cb, autoTrigger) {
    eventCenter.on(formatEventName(formatAppName(appName), false), cb, autoTrigger);
  }

  /**
   * remove listener
   * @param appName app.name
   * @param cb listener
   */
  removeDataListener(appName, cb) {
    isFunction(cb) && eventCenter.off(formatEventName(formatAppName(appName), false), cb);
  }

  /**
   * get data from micro app or base app
   * @param appName app.name
   * @param fromBaseApp whether get data from base app, default is false
   */
  getData(appName, fromBaseApp = false) {
    return eventCenter.getData(formatEventName(formatAppName(appName), fromBaseApp));
  }

  /**
   * Dispatch data to the specified micro app
   * @param appName app.name
   * @param data data
   */
  setData(appName, data) {
    eventCenter.dispatch(formatEventName(formatAppName(appName), true), data);
  }

  /**
   * clear all listener for specified micro app
   * @param appName app.name
   */
  clearDataListener(appName) {
    eventCenter.off(formatEventName(formatAppName(appName), false));
  }
}
// Event center for sub app
class EventCenterForMicroApp extends EventCenterForGlobal {
  constructor(appName) {
    super();
    this.appName = formatAppName(appName);
    !this.appName && logError(`Invalid appName ${appName}`);
  }

  /**
   * add listener, monitor the data sent by the base app
   * @param cb listener
   * @param autoTrigger If there is cached data when first bind listener, whether it needs to trigger, default is false
   */
  addDataListener(cb, autoTrigger) {
    cb.__AUTO_TRIGGER__ = autoTrigger;
    eventCenter.on(formatEventName(this.appName, true), cb, autoTrigger);
  }

  /**
   * remove listener
   * @param cb listener
   */
  removeDataListener(cb) {
    isFunction(cb) && eventCenter.off(formatEventName(this.appName, true), cb);
  }

  /**
   * get data from base app
   */
  getData() {
    return eventCenter.getData(formatEventName(this.appName, true));
  }

  /**
   * dispatch data to base app
   * @param data data
   */
  dispatch(data) {
    removeDomScope();
    eventCenter.dispatch(formatEventName(this.appName, false), data);
    const app = appInstanceMap.get(this.appName);
    if ((app === null || app === void 0 ? void 0 : app.container) && isPlainObject(data)) {
      const event = new CustomEvent('datachange', {
        detail: {
          data,
        },
      });
      getRootContainer(app.container).dispatchEvent(event);
    }
  }

  /**
   * clear all listeners
   */
  clearDataListener() {
    eventCenter.off(formatEventName(this.appName, true));
  }
}
/**
 * Record UMD function before exec umdHookMount
 * @param microAppEventCenter
 */
function recordDataCenterSnapshot(microAppEventCenter) {
  const appName = microAppEventCenter.appName;
  microAppEventCenter.umdDataListeners = { global: new Set(), normal: new Set() };
  const globalEventInfo = eventCenter.eventList.get('global');
  if (globalEventInfo) {
    for (const cb of globalEventInfo.callbacks) {
      if (appName === cb.__APP_NAME__) {
        microAppEventCenter.umdDataListeners.global.add(cb);
      }
    }
  }
  const subAppEventInfo = eventCenter.eventList.get(formatEventName(appName, true));
  if (subAppEventInfo) {
    microAppEventCenter.umdDataListeners.normal = new Set(subAppEventInfo.callbacks);
  }
}
/**
 * Rebind the UMD function of the record before remount
 * @param microAppEventCenter instance of EventCenterForMicroApp
 */
function rebuildDataCenterSnapshot(microAppEventCenter) {
  for (const cb of microAppEventCenter.umdDataListeners.global) {
    microAppEventCenter.addGlobalDataListener(cb, cb.__AUTO_TRIGGER__);
  }
  for (const cb of microAppEventCenter.umdDataListeners.normal) {
    microAppEventCenter.addDataListener(cb, cb.__AUTO_TRIGGER__);
  }
}

/* eslint-disable no-return-assign */
function isBoundedFunction(value) {
  if (isBoolean(value.__MICRO_APP_IS_BOUND_FUNCTION__)) { return value.__MICRO_APP_IS_BOUND_FUNCTION__; }
  return value.__MICRO_APP_IS_BOUND_FUNCTION__ = isBoundFunction(value);
}
function isConstructor(value) {
  let _a;
  if (isBoolean(value.__MICRO_APP_IS_CONSTRUCTOR__)) { return value.__MICRO_APP_IS_CONSTRUCTOR__; }
  const valueStr = value.toString();
  const result = (((_a = value.prototype) === null || _a === void 0 ? void 0 : _a.constructor) === value
        && Object.getOwnPropertyNames(value.prototype).length > 1)
        || (/^function\s+[A-Z]/).test(valueStr)
        || (/^class\s+/).test(valueStr);
  return value.__MICRO_APP_IS_CONSTRUCTOR__ = result;
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function bindFunctionToRawWindow(rawWindow, value) {
  if (value.__MICRO_APP_BOUND_WINDOW_FUNCTION__) { return value.__MICRO_APP_BOUND_WINDOW_FUNCTION__; }
  if (!isConstructor(value) && !isBoundedFunction(value)) {
    const bindRawWindowValue = value.bind(rawWindow);
    for (const key in value) {
      bindRawWindowValue[key] = value[key];
    }
    if (value.hasOwnProperty('prototype')) {
      rawDefineProperty(bindRawWindowValue, 'prototype', {
        value: value.prototype,
        configurable: true,
        enumerable: false,
        writable: true,
      });
    }
    return value.__MICRO_APP_BOUND_WINDOW_FUNCTION__ = bindRawWindowValue;
  }
  return value;
}

// document.onclick binding list, the binding function of each application is unique
const documentClickListMap = new Map();
let hasRewriteDocumentOnClick = false;
/**
 * Rewrite document.onclick and execute it only once
 */
function overwriteDocumentOnClick() {
  hasRewriteDocumentOnClick = true;
  if (Object.getOwnPropertyDescriptor(document, 'onclick')) {
    return logWarn('Cannot redefine document property onclick');
  }
  const rawOnClick = document.onclick;
  document.onclick = null;
  let hasDocumentClickInited = false;
  function onClickHandler(e) {
    documentClickListMap.forEach((f) => {
      isFunction(f) && f.call(document, e);
    });
  }
  rawDefineProperty(document, 'onclick', {
    configurable: true,
    enumerable: true,
    get() {
      const appName = getCurrentAppName();
      return appName ? documentClickListMap.get(appName) : documentClickListMap.get('base');
    },
    set(f) {
      const appName = getCurrentAppName();
      if (appName) {
        documentClickListMap.set(appName, f);
      } else {
        documentClickListMap.set('base', f);
      }
      if (!hasDocumentClickInited && isFunction(f)) {
        hasDocumentClickInited = true;
        globalEnv.rawDocumentAddEventListener.call(globalEnv.rawDocument, 'click', onClickHandler, false);
      }
    },
  });
  rawOnClick && document.addEventListener('click', rawOnClick);
}
/**
 * The document event is globally, we need to clear these event bindings when micro application unmounted
 */
const documentEventListenerMap = new Map();
function effectDocumentEvent() {
  const { rawDocument, rawDocumentAddEventListener, rawDocumentRemoveEventListener } = globalEnv;
  !hasRewriteDocumentOnClick && overwriteDocumentOnClick();
  document.addEventListener = function (type, listener, options) {
    let _a;
    const appName = getCurrentAppName();
    /**
     * ignore bound function of document event in umd mode, used to solve problem of react global events
     */
    if (appName && !(((_a = appInstanceMap.get(appName)) === null || _a === void 0 ? void 0 : _a.umdMode) && isBoundFunction(listener))) {
      const appListenersMap = documentEventListenerMap.get(appName);
      if (appListenersMap) {
        const appListenerList = appListenersMap.get(type);
        if (appListenerList) {
          appListenerList.add(listener);
        } else {
          appListenersMap.set(type, new Set([listener]));
        }
      } else {
        documentEventListenerMap.set(appName, new Map([[type, new Set([listener])]]));
      }
      listener && (listener.__MICRO_APP_MARK_OPTIONS__ = options);
    }
    rawDocumentAddEventListener.call(rawDocument, type, listener, options);
  };
  document.removeEventListener = function (type, listener, options) {
    let _a;
    const appName = getCurrentAppName();
    if (appName && !(((_a = appInstanceMap.get(appName)) === null || _a === void 0 ? void 0 : _a.umdMode) && isBoundFunction(listener))) {
      const appListenersMap = documentEventListenerMap.get(appName);
      if (appListenersMap) {
        const appListenerList = appListenersMap.get(type);
        if ((appListenerList === null || appListenerList === void 0 ? void 0 : appListenerList.size) && appListenerList.has(listener)) {
          appListenerList.delete(listener);
        }
      }
    }
    rawDocumentRemoveEventListener.call(rawDocument, type, listener, options);
  };
}
// Clear the document event agent
function releaseEffectDocumentEvent() {
  document.addEventListener = globalEnv.rawDocumentAddEventListener;
  document.removeEventListener = globalEnv.rawDocumentRemoveEventListener;
}
// this events should be sent to the specified app
const formatEventList = new Set(['unmount', 'appstate-change']);
/**
 * Format event name
 * @param type event name
 * @param microAppWindow micro window
 */
function formatEventType(type, microAppWindow) {
  if (formatEventList.has(type)) {
    return `${type}-${microAppWindow.__MICRO_APP_NAME__}`;
  }
  return type;
}
/**
 * Rewrite side-effect events
 * @param microAppWindow micro window
 */
function effect(microAppWindow) {
  const appName = microAppWindow.__MICRO_APP_NAME__;
  const eventListenerMap = new Map();
  const intervalIdMap = new Map();
  const timeoutIdMap = new Map();
  const { rawWindow, rawDocument, rawWindowAddEventListener, rawWindowRemoveEventListener, rawSetInterval, rawSetTimeout, rawClearInterval, rawClearTimeout, rawDocumentRemoveEventListener } = globalEnv;
  // listener may be null, e.g test-passive
  microAppWindow.addEventListener = function (type, listener, options) {
    type = formatEventType(type, microAppWindow);
    const listenerList = eventListenerMap.get(type);
    if (listenerList) {
      listenerList.add(listener);
    } else {
      eventListenerMap.set(type, new Set([listener]));
    }
    listener && (listener.__MICRO_APP_MARK_OPTIONS__ = options);
    rawWindowAddEventListener.call(rawWindow, type, listener, options);
  };
  microAppWindow.removeEventListener = function (type, listener, options) {
    type = formatEventType(type, microAppWindow);
    const listenerList = eventListenerMap.get(type);
    if ((listenerList === null || listenerList === void 0 ? void 0 : listenerList.size) && listenerList.has(listener)) {
      listenerList.delete(listener);
    }
    rawWindowRemoveEventListener.call(rawWindow, type, listener, options);
  };
  microAppWindow.setInterval = function (handler, timeout, ...args) {
    const intervalId = rawSetInterval.call(rawWindow, handler, timeout, ...args);
    intervalIdMap.set(intervalId, { handler, timeout, args });
    return intervalId;
  };
  microAppWindow.setTimeout = function (handler, timeout, ...args) {
    const timeoutId = rawSetTimeout.call(rawWindow, handler, timeout, ...args);
    timeoutIdMap.set(timeoutId, { handler, timeout, args });
    return timeoutId;
  };
  microAppWindow.clearInterval = function (intervalId) {
    intervalIdMap.delete(intervalId);
    rawClearInterval.call(rawWindow, intervalId);
  };
  microAppWindow.clearTimeout = function (timeoutId) {
    timeoutIdMap.delete(timeoutId);
    rawClearTimeout.call(rawWindow, timeoutId);
  };
  const umdWindowListenerMap = new Map();
  const umdDocumentListenerMap = new Map();
  let umdIntervalIdMap = new Map();
  let umdTimeoutIdMap = new Map();
  let umdOnClickHandler;
  // record event and timer before exec umdMountHook
  const recordUmdEffect = () => {
    // record window event
    eventListenerMap.forEach((listenerList, type) => {
      if (listenerList.size > 0) {
        umdWindowListenerMap.set(type, new Set(listenerList));
      }
    });
    // record timers
    if (intervalIdMap.size > 0) {
      umdIntervalIdMap = new Map(intervalIdMap);
    }
    if (timeoutIdMap.size > 0) {
      umdTimeoutIdMap = new Map(timeoutIdMap);
    }
    // record onclick handler
    umdOnClickHandler = documentClickListMap.get(appName);
    // record document event
    const documentAppListenersMap = documentEventListenerMap.get(appName);
    if (documentAppListenersMap) {
      documentAppListenersMap.forEach((listenerList, type) => {
        if (listenerList.size > 0) {
          umdDocumentListenerMap.set(type, new Set(listenerList));
        }
      });
    }
  };
    // rebuild event and timer before remount umd app
  const rebuildUmdEffect = () => {
    // rebuild window event
    umdWindowListenerMap.forEach((listenerList, type) => {
      for (const listener of listenerList) {
        microAppWindow.addEventListener(type, listener, listener === null || listener === void 0 ? void 0 : listener.__MICRO_APP_MARK_OPTIONS__);
      }
    });
    // rebuild timer
    umdIntervalIdMap.forEach((info) => {
      microAppWindow.setInterval(info.handler, info.timeout, ...info.args);
    });
    umdTimeoutIdMap.forEach((info) => {
      microAppWindow.setTimeout(info.handler, info.timeout, ...info.args);
    });
    // rebuild onclick event
    umdOnClickHandler && documentClickListMap.set(appName, umdOnClickHandler);
    // rebuild document event
    setCurrentAppName(appName);
    umdDocumentListenerMap.forEach((listenerList, type) => {
      for (const listener of listenerList) {
        document.addEventListener(type, listener, listener === null || listener === void 0 ? void 0 : listener.__MICRO_APP_MARK_OPTIONS__);
      }
    });
    setCurrentAppName(null);
  };
    // release all event listener & interval & timeout when unmount app
  const releaseEffect = () => {
    // Clear window binding events
    if (eventListenerMap.size > 0) {
      eventListenerMap.forEach((listenerList, type) => {
        for (const listener of listenerList) {
          rawWindowRemoveEventListener.call(rawWindow, type, listener);
        }
      });
      eventListenerMap.clear();
    }
    // Clear timers
    if (intervalIdMap.size > 0) {
      intervalIdMap.forEach((_, intervalId) => {
        rawClearInterval.call(rawWindow, intervalId);
      });
      intervalIdMap.clear();
    }
    if (timeoutIdMap.size > 0) {
      timeoutIdMap.forEach((_, timeoutId) => {
        rawClearTimeout.call(rawWindow, timeoutId);
      });
      timeoutIdMap.clear();
    }
    // Clear the function bound by micro application through document.onclick
    documentClickListMap.delete(appName);
    // Clear document binding event
    const documentAppListenersMap = documentEventListenerMap.get(appName);
    if (documentAppListenersMap) {
      documentAppListenersMap.forEach((listenerList, type) => {
        for (const listener of listenerList) {
          rawDocumentRemoveEventListener.call(rawDocument, type, listener);
        }
      });
      documentAppListenersMap.clear();
    }
  };
  return {
    recordUmdEffect,
    rebuildUmdEffect,
    releaseEffect,
  };
}

// Variables that can escape to rawWindow
const staticEscapeProperties = new Set([
  'System',
  '__cjsWrapper',
]);
// Variables that can only assigned to rawWindow
const escapeSetterKeyList = new Set([
  'location',
]);
const globalPropertyList = ['window', 'self', 'globalThis'];
class SandBox {
  constructor(appName, url) {
    /**
     * Scoped global Properties(Properties that can only get and set in microAppWindow, will not escape to rawWindow)
     * https://github.com/micro-zoe/micro-app/issues/234
     */
    this.scopeProperties = ['webpackJsonp', 'Vue'];
    // Properties that can be escape to rawWindow
    this.escapeProperties = [];
    // Properties newly added to microAppWindow
    this.injectedKeys = new Set();
    // Properties escape to rawWindow, cleared when unmount
    this.escapeKeys = new Set();
    // sandbox state
    this.active = false;
    this.microAppWindow = {}; // Proxy target
    // get scopeProperties and escapeProperties from plugins
    this.getSpecialProperties(appName);
    // create proxyWindow with Proxy(microAppWindow)
    this.proxyWindow = this.createProxyWindow(appName);
    // inject global properties
    this.initMicroAppWindow(this.microAppWindow, appName, url);
    // Rewrite global event listener & timeout
    Object.assign(this, effect(this.microAppWindow));
  }

  start(baseRoute) {
    if (!this.active) {
      this.active = true;
      this.microAppWindow.__MICRO_APP_BASE_ROUTE__ = this.microAppWindow.__MICRO_APP_BASE_URL__ = baseRoute;
      // BUG FIX: bable-polyfill@6.x
      globalEnv.rawWindow._babelPolyfill && (globalEnv.rawWindow._babelPolyfill = false);
      if (++SandBox.activeCount === 1) {
        effectDocumentEvent();
        patchElementPrototypeMethods();
      }
    }
  }

  stop(umdMode) {
    if (this.active) {
      this.active = false;
      this.releaseEffect();
      this.microAppWindow.microApp.clearDataListener();
      this.microAppWindow.microApp.clearGlobalDataListener();
      if (!umdMode) {
        this.injectedKeys.forEach((key) => {
          Reflect.deleteProperty(this.microAppWindow, key);
        });
        this.injectedKeys.clear();
        this.escapeKeys.forEach((key) => {
          Reflect.deleteProperty(globalEnv.rawWindow, key);
        });
        this.escapeKeys.clear();
      }
      if (--SandBox.activeCount === 0) {
        releaseEffectDocumentEvent();
        releasePatches();
      }
    }
  }

  // record umd snapshot before the first execution of umdHookMount
  recordUmdSnapshot() {
    this.microAppWindow.__MICRO_APP_UMD_MODE__ = true;
    this.recordUmdEffect();
    recordDataCenterSnapshot(this.microAppWindow.microApp);
    this.recordUmdInjectedValues = new Map();
    this.injectedKeys.forEach((key) => {
      this.recordUmdInjectedValues.set(key, Reflect.get(this.microAppWindow, key));
    });
  }

  // rebuild umd snapshot before remount umd app
  rebuildUmdSnapshot() {
    this.recordUmdInjectedValues.forEach((value, key) => {
      Reflect.set(this.proxyWindow, key, value);
    });
    this.rebuildUmdEffect();
    rebuildDataCenterSnapshot(this.microAppWindow.microApp);
  }

  /**
   * get scopeProperties and escapeProperties from plugins
   * @param appName app name
   */
  getSpecialProperties(appName) {
    let _a;
    if (!isPlainObject(microApp.plugins)) { return; }
    this.commonActionForSpecialProperties(microApp.plugins.global);
    this.commonActionForSpecialProperties((_a = microApp.plugins.modules) === null || _a === void 0 ? void 0 : _a[appName]);
  }

  // common action for global plugins and module plugins
  commonActionForSpecialProperties(plugins) {
    if (isArray(plugins)) {
      for (const plugin of plugins) {
        if (isPlainObject(plugin)) {
          if (isArray(plugin.scopeProperties)) {
            this.scopeProperties = this.scopeProperties.concat(plugin.scopeProperties);
          }
          if (isArray(plugin.escapeProperties)) {
            this.escapeProperties = this.escapeProperties.concat(plugin.escapeProperties);
          }
        }
      }
    }
  }

  // create proxyWindow with Proxy(microAppWindow)
  createProxyWindow(appName) {
    const rawWindow = globalEnv.rawWindow;
    const descriptorTargetMap = new Map();
    // window.xxx will trigger proxy
    return new Proxy(this.microAppWindow, {
      get: (target, key) => {
        throttleDeferForSetAppName(appName);
        if (Reflect.has(target, key)
                    || (isString(key) && key.startsWith('__MICRO_APP_'))
                    || this.scopeProperties.includes(key)) { return Reflect.get(target, key); }
        const rawValue = Reflect.get(rawWindow, key);
        return isFunction(rawValue) ? bindFunctionToRawWindow(rawWindow, rawValue) : rawValue;
      },
      set: (target, key, value) => {
        if (this.active) {
          if (escapeSetterKeyList.has(key)) {
            Reflect.set(rawWindow, key, value);
          } else if (
          // target.hasOwnProperty has been rewritten
            !rawHasOwnProperty.call(target, key)
                        && rawHasOwnProperty.call(rawWindow, key)
                        && !this.scopeProperties.includes(key)) {
            const descriptor = Object.getOwnPropertyDescriptor(rawWindow, key);
            const { configurable, enumerable, writable, set } = descriptor;
            // set value because it can be set
            rawDefineProperty(target, key, {
              value,
              configurable,
              enumerable,
              writable: writable !== null && writable !== void 0 ? writable : !!set,
            });
            this.injectedKeys.add(key);
          } else {
            Reflect.set(target, key, value);
            this.injectedKeys.add(key);
          }
          if ((this.escapeProperties.includes(key)
                        || (staticEscapeProperties.has(key) && !Reflect.has(rawWindow, key)))
                        && !this.scopeProperties.includes(key)) {
            Reflect.set(rawWindow, key, value);
            this.escapeKeys.add(key);
          }
        }
        return true;
      },
      has: (target, key) => {
        if (this.scopeProperties.includes(key)) { return key in target; }
        return key in target || key in rawWindow;
      },
      // Object.getOwnPropertyDescriptor(window, key)
      getOwnPropertyDescriptor: (target, key) => {
        if (rawHasOwnProperty.call(target, key)) {
          descriptorTargetMap.set(key, 'target');
          return Object.getOwnPropertyDescriptor(target, key);
        }
        if (rawHasOwnProperty.call(rawWindow, key)) {
          descriptorTargetMap.set(key, 'rawWindow');
          const descriptor = Object.getOwnPropertyDescriptor(rawWindow, key);
          if (descriptor && !descriptor.configurable) {
            descriptor.configurable = true;
          }
          return descriptor;
        }
        return undefined;
      },
      // Object.defineProperty(window, key, Descriptor)
      defineProperty: (target, key, value) => {
        const from = descriptorTargetMap.get(key);
        if (from === 'rawWindow') {
          return Reflect.defineProperty(rawWindow, key, value);
        }
        return Reflect.defineProperty(target, key, value);
      },
      // Object.getOwnPropertyNames(window)
      ownKeys: target => unique(Reflect.ownKeys(rawWindow).concat(Reflect.ownKeys(target))),
      deleteProperty: (target, key) => {
        if (rawHasOwnProperty.call(target, key)) {
          this.injectedKeys.has(key) && this.injectedKeys.delete(key);
          this.escapeKeys.has(key) && Reflect.deleteProperty(rawWindow, key);
          return Reflect.deleteProperty(target, key);
        }
        return true;
      },
    });
  }

  /**
   * inject global properties to microAppWindow
   * @param microAppWindow micro window
   * @param appName app name
   * @param url app url
   */
  initMicroAppWindow(microAppWindow, appName, url) {
    microAppWindow.__MICRO_APP_ENVIRONMENT__ = true;
    microAppWindow.__MICRO_APP_NAME__ = appName;
    microAppWindow.__MICRO_APP_PUBLIC_PATH__ = getEffectivePath(url);
    microAppWindow.__MICRO_APP_WINDOW__ = microAppWindow;
    microAppWindow.microApp = Object.assign(new EventCenterForMicroApp(appName), {
      removeDomScope,
      pureCreateElement,
    });
    microAppWindow.rawWindow = globalEnv.rawWindow;
    microAppWindow.rawDocument = globalEnv.rawDocument;
    microAppWindow.hasOwnProperty = key => rawHasOwnProperty.call(microAppWindow, key) || rawHasOwnProperty.call(globalEnv.rawWindow, key);
    this.setMappingPropertiesWithRawDescriptor(microAppWindow);
    this.setHijackProperties(microAppWindow, appName);
  }

  // properties associated with the native window
  setMappingPropertiesWithRawDescriptor(microAppWindow) {
    let parentValue, topValue;
    const rawWindow = globalEnv.rawWindow;
    if (rawWindow === rawWindow.parent) { // not in iframe
      topValue = parentValue = this.proxyWindow;
    } else { // in iframe
      topValue = rawWindow.top;
      parentValue = rawWindow.parent;
    }
    rawDefineProperty(microAppWindow, 'top', this.createDescriptorForMicroAppWindow('top', topValue));
    rawDefineProperty(microAppWindow, 'parent', this.createDescriptorForMicroAppWindow('parent', parentValue));
    globalPropertyList.forEach((key) => {
      rawDefineProperty(microAppWindow, key, this.createDescriptorForMicroAppWindow(key, this.proxyWindow));
    });
  }

  createDescriptorForMicroAppWindow(key, value) {
    const { configurable = true, enumerable = true, writable, set } = Object.getOwnPropertyDescriptor(globalEnv.rawWindow, key) || { writable: true };
    const descriptor = {
      value,
      configurable,
      enumerable,
      writable: writable !== null && writable !== void 0 ? writable : !!set,
    };
    return descriptor;
  }

  // set hijack Properties to microAppWindow
  setHijackProperties(microAppWindow, appName) {
    let modifiedEval, modifiedImage;
    rawDefineProperties(microAppWindow, {
      document: {
        get() {
          throttleDeferForSetAppName(appName);
          return globalEnv.rawDocument;
        },
        configurable: false,
        enumerable: true,
      },
      eval: {
        get() {
          throttleDeferForSetAppName(appName);
          return modifiedEval || eval;
        },
        set: (value) => {
          modifiedEval = value;
        },
        configurable: true,
        enumerable: false,
      },
      Image: {
        get() {
          throttleDeferForSetAppName(appName);
          return modifiedImage || globalEnv.ImageProxy;
        },
        set: (value) => {
          modifiedImage = value;
        },
        configurable: true,
        enumerable: false,
      },
    });
  }
}
SandBox.activeCount = 0; // number of active sandbox

function formatEventInfo(event, element) {
  Object.defineProperties(event, {
    currentTarget: {
      get() {
        return element;
      },
    },
    target: {
      get() {
        return element;
      },
    },
  });
}
/**
 * dispatch lifeCycles event to base app
 * created, beforemount, mounted, unmount, error
 * @param element container
 * @param appName app.name
 * @param lifecycleName lifeCycle name
 * @param error param from error hook
 */
function dispatchLifecyclesEvent(element, appName, lifecycleName, error) {
  let _a;
  if (!element) {
    return logError(`element does not exist in lifecycle ${lifecycleName}`, appName);
  }
  element = getRootContainer(element);
  // clear dom scope before dispatch lifeCycles event to base app, especially mounted & unmount
  removeDomScope();
  const detail = Object.assign({
    name: appName,
    container: element,
  }, error && {
    error,
  });
  const event = new CustomEvent(lifecycleName, {
    detail,
  });
  formatEventInfo(event, element);
  // global hooks
  // @ts-ignore
  if (isFunction((_a = microApp.lifeCycles) === null || _a === void 0 ? void 0 : _a[lifecycleName])) {
    // @ts-ignore
    microApp.lifeCycles[lifecycleName](event);
  }
  element.dispatchEvent(event);
}
/**
 * Dispatch custom event to micro app
 * @param eventName event name
 * @param appName app name
 * @param detail event detail
 */
function dispatchCustomEventToMicroApp(eventName, appName, detail = {}) {
  const event = new CustomEvent(`${eventName}-${appName}`, {
    detail,
  });
  window.dispatchEvent(event);
}

// micro app instances
const appInstanceMap = new Map();
class CreateApp {
  constructor({ name, url, ssrUrl, container, inline, scopecss, useSandbox, baseroute }) {
    this.state = appStates.NOT_LOADED;
    this.keepAliveState = null;
    this.keepAliveContainer = null;
    this.loadSourceLevel = 0;
    this.umdHookMount = null;
    this.umdHookUnmount = null;
    this.libraryName = null;
    this.umdMode = false;
    this.isPrefetch = false;
    this.prefetchResolve = null;
    this.container = null;
    this.baseroute = '';
    this.sandBox = null;
    this.container = container !== null && container !== void 0 ? container : null;
    this.inline = inline !== null && inline !== void 0 ? inline : false;
    this.baseroute = baseroute !== null && baseroute !== void 0 ? baseroute : '';
    this.ssrUrl = ssrUrl !== null && ssrUrl !== void 0 ? ssrUrl : '';
    // optional during init👆
    this.name = name;
    this.url = url;
    this.useSandbox = useSandbox;
    this.scopecss = this.useSandbox && scopecss;
    this.source = {
      links: new Map(),
      scripts: new Map(),
    };
    this.loadSourceCode();
    this.useSandbox && (this.sandBox = new SandBox(name, url));
  }

  // Load resources
  loadSourceCode() {
    this.state = appStates.LOADING_SOURCE_CODE;
    HTMLLoader.getInstance().run(this, extractSourceDom);
  }

  /**
   * When resource is loaded, mount app if it is not prefetch or unmount
   */
  onLoad(html) {
    let _a;
    if (++this.loadSourceLevel === 2) {
      this.source.html = html;
      if (this.isPrefetch) {
        (_a = this.prefetchResolve) === null || _a === void 0 ? void 0 : _a.call(this);
        this.prefetchResolve = null;
      } else if (appStates.UNMOUNT !== this.state) {
        this.state = appStates.LOAD_SOURCE_FINISHED;
        this.mount();
      }
    }
  }

  /**
   * Error loading HTML
   * @param e Error
   */
  onLoadError(e) {
    this.loadSourceLevel = -1;
    if (this.prefetchResolve) {
      this.prefetchResolve();
      this.prefetchResolve = null;
    }
    if (appStates.UNMOUNT !== this.state) {
      this.onerror(e);
      this.state = appStates.LOAD_SOURCE_ERROR;
    }
  }

  /**
   * mount app
   * @param container app container
   * @param inline js runs in inline mode
   * @param baseroute route prefix, default is ''
   */
  mount(container, inline, baseroute) {
    let _a, _b, _c;
    if (isBoolean(inline) && inline !== this.inline) {
      this.inline = inline;
    }
    this.container = (_a = this.container) !== null && _a !== void 0 ? _a : container;
    this.baseroute = baseroute !== null && baseroute !== void 0 ? baseroute : this.baseroute;
    if (this.loadSourceLevel !== 2) {
      this.state = appStates.LOADING_SOURCE_CODE;
      return;
    }
    dispatchLifecyclesEvent(this.container, this.name, lifeCycles.BEFOREMOUNT);
    this.state = appStates.MOUNTING;
    cloneContainer(this.source.html, this.container, !this.umdMode);
    (_b = this.sandBox) === null || _b === void 0 ? void 0 : _b.start(this.baseroute);
    let umdHookMountResult; // result of mount function
    if (!this.umdMode) {
      let hasDispatchMountedEvent = false;
      // if all js are executed, param isFinished will be true
      execScripts(this.source.scripts, this, (isFinished) => {
        let _a;
        if (!this.umdMode) {
          const { mount, unmount } = this.getUmdLibraryHooks();
          // if mount & unmount is function, the sub app is umd mode
          if (isFunction(mount) && isFunction(unmount)) {
            this.umdHookMount = mount;
            this.umdHookUnmount = unmount;
            this.umdMode = true;
            (_a = this.sandBox) === null || _a === void 0 ? void 0 : _a.recordUmdSnapshot();
            try {
              umdHookMountResult = this.umdHookMount();
            } catch (error) {
              logError('an error occurred in the mount function \n', this.name, error);
            }
          }
        }
        if (!hasDispatchMountedEvent && (isFinished === true || this.umdMode)) {
          hasDispatchMountedEvent = true;
          this.handleMounted(umdHookMountResult);
        }
      });
    } else {
      (_c = this.sandBox) === null || _c === void 0 ? void 0 : _c.rebuildUmdSnapshot();
      try {
        umdHookMountResult = this.umdHookMount();
      } catch (error) {
        logError('an error occurred in the mount function \n', this.name, error);
      }
      this.handleMounted(umdHookMountResult);
    }
  }

  /**
   * handle for promise umdHookMount
   * @param umdHookMountResult result of umdHookMount
   */
  handleMounted(umdHookMountResult) {
    if (isPromise(umdHookMountResult)) {
      umdHookMountResult
        .then(() => this.dispatchMountedEvent())
        .catch(error => this.onerror(error));
    } else {
      this.dispatchMountedEvent();
    }
  }

  /**
   * dispatch mounted event when app run finished
   */
  dispatchMountedEvent() {
    if (appStates.UNMOUNT !== this.state) {
      this.state = appStates.MOUNTED;
      dispatchLifecyclesEvent(this.container, this.name, lifeCycles.MOUNTED);
    }
  }

  /**
   * unmount app
   * @param destroy completely destroy, delete cache resources
   * @param unmountcb callback of unmount
   */
  unmount(destroy, unmountcb) {
    if (this.state === appStates.LOAD_SOURCE_ERROR) {
      destroy = true;
    }
    this.state = appStates.UNMOUNT;
    this.keepAliveState = null;
    this.keepAliveContainer = null;
    // result of unmount function
    let umdHookUnmountResult;
    /**
     * send an unmount event to the micro app or call umd unmount hook
     * before the sandbox is cleared
     */
    if (this.umdHookUnmount) {
      try {
        umdHookUnmountResult = this.umdHookUnmount();
      } catch (error) {
        logError('an error occurred in the unmount function \n', this.name, error);
      }
    }
    // dispatch unmount event to micro app
    dispatchCustomEventToMicroApp('unmount', this.name);
    this.handleUnmounted(destroy, umdHookUnmountResult, unmountcb);
  }

  /**
   * handle for promise umdHookUnmount
   * @param destroy completely destroy, delete cache resources
   * @param umdHookUnmountResult result of umdHookUnmount
   * @param unmountcb callback of unmount
   */
  handleUnmounted(destroy, umdHookUnmountResult, unmountcb) {
    if (isPromise(umdHookUnmountResult)) {
      umdHookUnmountResult
        .then(() => this.actionsForUnmount(destroy, unmountcb))
        .catch(() => this.actionsForUnmount(destroy, unmountcb));
    } else {
      this.actionsForUnmount(destroy, unmountcb);
    }
  }

  /**
   * actions for unmount app
   * @param destroy completely destroy, delete cache resources
   * @param unmountcb callback of unmount
   */
  actionsForUnmount(destroy, unmountcb) {
    let _a;
    if (destroy) {
      this.actionsForCompletelyDestroy();
    } else if (this.umdMode && this.container.childElementCount) {
      cloneContainer(this.container, this.source.html, false);
    }
    // this.container maybe contains micro-app element, stop sandbox should exec after cloneContainer
    (_a = this.sandBox) === null || _a === void 0 ? void 0 : _a.stop(this.umdMode);
    if (getActiveApps().length === 0) {
      releasePatchSetAttribute();
    }
    // dispatch unmount event to base app
    dispatchLifecyclesEvent(this.container, this.name, lifeCycles.UNMOUNT);
    this.container.innerHTML = '';
    this.container = null;
    unmountcb && unmountcb();
  }

  // actions for completely destroy
  actionsForCompletelyDestroy() {
    if (!this.useSandbox && this.umdMode) {
      delete window[this.libraryName];
    }
    appInstanceMap.delete(this.name);
  }

  // hidden app when disconnectedCallback called with keep-alive
  hiddenKeepAliveApp() {
    const oldContainer = this.container;
    cloneContainer(this.container, this.keepAliveContainer ? this.keepAliveContainer : this.keepAliveContainer = document.createElement('div'), false);
    this.container = this.keepAliveContainer;
    this.keepAliveState = keepAliveStates.KEEP_ALIVE_HIDDEN;
    /*
     * event should dispatch before clone node
     * dispatch afterhidden event to micro-app
     */
    dispatchCustomEventToMicroApp('appstate-change', this.name, {
      appState: 'afterhidden',
    });
    // dispatch afterhidden event to base app
    dispatchLifecyclesEvent(oldContainer, this.name, lifeCycles.AFTERHIDDEN);
  }

  // show app when connectedCallback called with keep-alive
  showKeepAliveApp(container) {
    // dispatch beforeshow event to micro-app
    dispatchCustomEventToMicroApp('appstate-change', this.name, {
      appState: 'beforeshow',
    });
    // dispatch beforeshow event to base app
    dispatchLifecyclesEvent(container, this.name, lifeCycles.BEFORESHOW);
    cloneContainer(this.container, container, false);
    this.container = container;
    this.keepAliveState = keepAliveStates.KEEP_ALIVE_SHOW;
    // dispatch aftershow event to micro-app
    dispatchCustomEventToMicroApp('appstate-change', this.name, {
      appState: 'aftershow',
    });
    // dispatch aftershow event to base app
    dispatchLifecyclesEvent(this.container, this.name, lifeCycles.AFTERSHOW);
  }

  /**
   * app rendering error
   * @param e Error
   */
  onerror(e) {
    dispatchLifecyclesEvent(this.container, this.name, lifeCycles.ERROR, e);
  }

  // get app state
  getAppState() {
    return this.state;
  }

  // get keep-alive state
  getKeepAliveState() {
    return this.keepAliveState;
  }

  // get umd library, if it not exist, return empty object
  getUmdLibraryHooks() {
    let _a, _b;
    // after execScripts, the app maybe unmounted
    if (appStates.UNMOUNT !== this.state) {
      const global = (_b = (_a = this.sandBox) === null || _a === void 0 ? void 0 : _a.proxyWindow) !== null && _b !== void 0 ? _b : globalEnv.rawWindow;
      this.libraryName = getRootContainer(this.container).getAttribute('library') || `micro-app-${this.name}`;
      // do not use isObject
      return typeof global[this.libraryName] === 'object' ? global[this.libraryName] : {};
    }
    return {};
  }
}

/**
 * define element
 * @param tagName element name
 */
function defineElement(tagName) {
  class MicroAppElement extends HTMLElement {
    constructor() {
      super();
      this.isWaiting = false;
      this.cacheData = null;
      this.hasConnected = false;
      this.appName = ''; // app name
      this.appUrl = ''; // app url
      this.ssrUrl = ''; // html path in ssr mode
      this.version = version;
      /**
       * handle for change of name an url after element init
       */
      this.handleAttributeUpdate = () => {
        this.isWaiting = false;
        const formatAttrName = formatAppName(this.getAttribute('name'));
        const formatAttrUrl = formatAppURL(this.getAttribute('url'), this.appName);
        if (this.legalAttribute('name', formatAttrName) && this.legalAttribute('url', formatAttrUrl)) {
          const existApp = appInstanceMap.get(formatAttrName);
          if (formatAttrName !== this.appName && existApp // handling of cached and non-prefetch apps
                        && appStates.UNMOUNT !== existApp.getAppState()
                            && keepAliveStates.KEEP_ALIVE_HIDDEN !== existApp.getKeepAliveState()
                            && !existApp.isPrefetch) {
            this.setAttribute('name', this.appName);
            return logError(`app name conflict, an app named ${formatAttrName} is running`, this.appName);
          }
          if (formatAttrName !== this.appName || formatAttrUrl !== this.appUrl) {
            if (formatAttrName === this.appName) {
              this.handleUnmount(true, () => {
                this.actionsForAttributeChange(formatAttrName, formatAttrUrl, existApp);
              });
            } else if (this.getKeepAliveModeResult()) {
              this.handleHiddenKeepAliveApp();
              this.actionsForAttributeChange(formatAttrName, formatAttrUrl, existApp);
            } else {
              this.handleUnmount(this.getDestroyCompatibleResult(), () => {
                this.actionsForAttributeChange(formatAttrName, formatAttrUrl, existApp);
              });
            }
          }
        } else if (formatAttrName !== this.appName) {
          this.setAttribute('name', this.appName);
        }
      };
      patchSetAttribute();
    }

    static get observedAttributes() {
      return ['name', 'url'];
    }

    /*
     * 👇 Configuration
     * name: app name
     * url: html address
     * shadowDom: use shadowDOM, default is false
     * destroy: whether delete cache resources when unmount, default is false
     * inline: whether js runs in inline script mode, default is false
     * disableScopecss: whether disable css scoped, default is false
     * disableSandbox: whether disable sandbox, default is false
     * baseRoute: route prefix, default is ''
     * keep-alive: open keep-alive mode
     */
    connectedCallback() {
      this.hasConnected = true;
      defer(() => dispatchLifecyclesEvent(this, this.appName, lifeCycles.CREATED));
      this.initialMount();
    }

    disconnectedCallback() {
      this.hasConnected = false;
      // keep-alive
      if (this.getKeepAliveModeResult()) {
        this.handleHiddenKeepAliveApp();
      } else {
        this.handleUnmount(this.getDestroyCompatibleResult());
      }
    }

    attributeChangedCallback(attr, _oldVal, newVal) {
      if (this.legalAttribute(attr, newVal)
                && this[attr === ObservedAttrName.NAME ? 'appName' : 'appUrl'] !== newVal) {
        if (attr === ObservedAttrName.URL && !this.appUrl) {
          newVal = formatAppURL(newVal, this.appName);
          if (!newVal) {
            return logError(`Invalid attribute url ${newVal}`, this.appName);
          }
          this.appUrl = newVal;
          this.handleInitialNameAndUrl();
        } else if (attr === ObservedAttrName.NAME && !this.appName) {
          const formatNewName = formatAppName(newVal);
          if (!formatNewName) {
            return logError(`Invalid attribute name ${newVal}`, this.appName);
          }
          if (this.cacheData) {
            microApp.setData(formatNewName, this.cacheData);
            this.cacheData = null;
          }
          this.appName = formatNewName;
          if (formatNewName !== newVal) {
            this.setAttribute('name', this.appName);
          }
          this.handleInitialNameAndUrl();
        } else if (!this.isWaiting) {
          this.isWaiting = true;
          defer(this.handleAttributeUpdate);
        }
      }
    }

    // handle for connectedCallback run before attributeChangedCallback
    handleInitialNameAndUrl() {
      this.hasConnected && this.initialMount();
    }

    /**
     * first mount of this app
     */
    initialMount() {
      if (!this.appName || !this.appUrl) { return; }
      if (this.getDisposeResult('shadowDOM') && !this.shadowRoot && isFunction(this.attachShadow)) {
        this.attachShadow({ mode: 'open' });
      }
      if (this.getDisposeResult('ssr')) {
        this.ssrUrl = CompletionPath(globalEnv.rawWindow.location.pathname, this.appUrl);
      } else if (this.ssrUrl) {
        this.ssrUrl = '';
      }
      if (appInstanceMap.has(this.appName)) {
        const app = appInstanceMap.get(this.appName);
        const existAppUrl = app.ssrUrl || app.url;
        const activeAppUrl = this.ssrUrl || this.appUrl;
        /*
         * keep-alive don't care about ssrUrl
         * Even if the keep-alive app is pushed into the background, it is still active and cannot be replaced. Otherwise, it is difficult for developers to troubleshoot in case of conflict and  will leave developers at a loss
         */
        if (app.getKeepAliveState() === keepAliveStates.KEEP_ALIVE_HIDDEN
                    && app.url === this.appUrl) {
          this.handleShowKeepAliveApp(app);
        } else if (existAppUrl === activeAppUrl && (app.isPrefetch
                    || app.getAppState() === appStates.UNMOUNT)) {
          this.handleAppMount(app);
        } else if (app.isPrefetch || app.getAppState() === appStates.UNMOUNT) {
          /**
           * url is different & old app is unmounted or prefetch, create new app to replace old one
           */
          logWarn(`the ${app.isPrefetch ? 'prefetch' : 'unmounted'} app with url: ${existAppUrl} is replaced by a new app`, this.appName);
          this.handleCreateApp();
        } else {
          logError(`app name conflict, an app named ${this.appName} is running`, this.appName);
        }
      } else {
        this.handleCreateApp();
      }
    }

    // remount app or create app if attribute url or name change
    actionsForAttributeChange(formatAttrName, formatAttrUrl, existApp) {
      let _a;
      /**
       * change ssrUrl in ssr mode
       * do not add judgment of formatAttrUrl === this.appUrl
       */
      if (this.getDisposeResult('ssr')) {
        this.ssrUrl = CompletionPath(globalEnv.rawWindow.location.pathname, formatAttrUrl);
      } else if (this.ssrUrl) {
        this.ssrUrl = '';
      }
      this.appName = formatAttrName;
      this.appUrl = formatAttrUrl;
      ((_a = this.shadowRoot) !== null && _a !== void 0 ? _a : this).innerHTML = '';
      if (formatAttrName !== this.getAttribute('name')) {
        this.setAttribute('name', this.appName);
      }
      /**
       * when existApp not null: this.appName === existApp.name
       * scene1: if formatAttrName and this.appName are equal: exitApp is the current app, the url must be different, existApp has been unmounted
       * scene2: if formatAttrName and this.appName are different: existApp must be prefetch or unmounted, if url is equal, then just mount, if url is different, then create new app to replace existApp
       * scene3: url is different but ssrUrl is equal
       * scene4: url is equal but ssrUrl is different, if url is equal, name must different
       * scene5: if existApp is KEEP_ALIVE_HIDDEN, name must different
       */
      if (existApp) {
        if (existApp.getKeepAliveState() === keepAliveStates.KEEP_ALIVE_HIDDEN) {
          if (existApp.url === this.appUrl) {
            this.handleShowKeepAliveApp(existApp);
          } else {
            // the hidden keep-alive app is still active
            logError(`app name conflict, an app named ${this.appName} is running`, this.appName);
          }
        } else if (existApp.url === this.appUrl && existApp.ssrUrl === this.ssrUrl) {
          // mount app
          this.handleAppMount(existApp);
        } else {
          this.handleCreateApp();
        }
      } else {
        this.handleCreateApp();
      }
    }

    /**
     * judge the attribute is legal
     * @param name attribute name
     * @param val attribute value
     */
    legalAttribute(name, val) {
      if (!isString(val) || !val) {
        logError(`unexpected attribute ${name}, please check again`, this.appName);
        return false;
      }
      return true;
    }

    /**
     * mount app
     * some serious note before mount:
     * 1. is prefetch ?
     * 2. is remount in another container ?
     * 3. is remount with change properties of the container ?
     */
    handleAppMount(app) {
      app.isPrefetch = false;
      defer(() => {
        let _a;
        return app.mount((_a = this.shadowRoot) !== null && _a !== void 0 ? _a : this, this.getDisposeResult('inline'), this.getBaseRouteCompatible());
      });
    }

    // create app instance
    handleCreateApp() {
      let _a;
      /**
       * actions for destory old app
       * fix of unmounted umd app with disableSandbox
       */
      if (appInstanceMap.has(this.appName)) {
        appInstanceMap.get(this.appName).actionsForCompletelyDestroy();
      }
      const instance = new CreateApp({
        name: this.appName,
        url: this.appUrl,
        ssrUrl: this.ssrUrl,
        container: (_a = this.shadowRoot) !== null && _a !== void 0 ? _a : this,
        inline: this.getDisposeResult('inline'),
        scopecss: !(this.getDisposeResult('disableScopecss') || this.getDisposeResult('shadowDOM')),
        useSandbox: !this.getDisposeResult('disableSandbox'),
        baseroute: this.getBaseRouteCompatible(),
      });
      appInstanceMap.set(this.appName, instance);
    }

    /**
     * unmount app
     * @param destroy delete cache resources when unmount
     */
    handleUnmount(destroy, unmountcb) {
      const app = appInstanceMap.get(this.appName);
      if (app
                && app.getAppState() !== appStates.UNMOUNT) { app.unmount(destroy, unmountcb); }
    }

    // hidden app when disconnectedCallback called with keep-alive
    handleHiddenKeepAliveApp() {
      const app = appInstanceMap.get(this.appName);
      if (app
                && app.getAppState() !== appStates.UNMOUNT
                && app.getKeepAliveState() !== keepAliveStates.KEEP_ALIVE_HIDDEN) { app.hiddenKeepAliveApp(); }
    }

    // show app when connectedCallback called with keep-alive
    handleShowKeepAliveApp(app) {
      // must be async
      defer(() => { let _a; return app.showKeepAliveApp((_a = this.shadowRoot) !== null && _a !== void 0 ? _a : this); });
    }

    /**
     * Get configuration
     * Global setting is lowest priority
     * @param name Configuration item name
     */
    getDisposeResult(name) {
      // @ts-ignore
      return (this.compatibleSpecialProperties(name) || microApp[name]) && this.compatibleDisableSpecialProperties(name);
    }

    // compatible of disableScopecss & disableSandbox
    compatibleSpecialProperties(name) {
      if (name === 'disableScopecss') {
        return this.hasAttribute('disableScopecss') || this.hasAttribute('disable-scopecss');
      }
      if (name === 'disableSandbox') {
        return this.hasAttribute('disableSandbox') || this.hasAttribute('disable-sandbox');
      }
      return this.hasAttribute(name);
    }

    // compatible of disableScopecss & disableSandbox
    compatibleDisableSpecialProperties(name) {
      if (name === 'disableScopecss') {
        return this.getAttribute('disableScopecss') !== 'false' && this.getAttribute('disable-scopecss') !== 'false';
      }
      if (name === 'disableSandbox') {
        return this.getAttribute('disableSandbox') !== 'false' && this.getAttribute('disable-sandbox') !== 'false';
      }
      return this.getAttribute(name) !== 'false';
    }

    /**
     * 2021-09-08
     * get baseRoute
     * getAttribute('baseurl') is compatible writing of versions below 0.3.1
     */
    getBaseRouteCompatible() {
      let _a, _b;
      return (_b = (_a = this.getAttribute('baseroute')) !== null && _a !== void 0 ? _a : this.getAttribute('baseurl')) !== null && _b !== void 0 ? _b : '';
    }

    // compatible of destroy
    getDestroyCompatibleResult() {
      return this.getDisposeResult('destroy') || this.getDisposeResult('destory');
    }

    /**
     * destroy has priority over destroy keep-alive
     */
    getKeepAliveModeResult() {
      return this.getDisposeResult('keep-alive') && !this.getDestroyCompatibleResult();
    }

    /**
     * Data from the base application
     */
    set data(value) {
      if (this.appName) {
        microApp.setData(this.appName, value);
      } else {
        this.cacheData = value;
      }
    }

    /**
     * get data only used in jsx-custom-event once
     */
    get data() {
      if (this.appName) {
        return microApp.getData(this.appName, true);
      }
      if (this.cacheData) {
        return this.cacheData;
      }
      return null;
    }
  }
  window.customElements.define(tagName, MicroAppElement);
}

/**
 * preFetch([
 *  {
 *    name: string,
 *    url: string,
 *    disableScopecss?: boolean,
 *    disableSandbox?: boolean,
 *  },
 *  ...
 * ])
 * Note:
 *  1: preFetch is asynchronous and is performed only when the browser is idle
 *  2: disableScopecss, disableSandbox must be same with micro-app element, if conflict, the one who executes first shall prevail
 * @param apps micro apps
 */
function preFetch(apps) {
  if (!isBrowser) {
    return logError('preFetch is only supported in browser environment');
  }
  requestIdleCallback(() => {
    isFunction(apps) && (apps = apps());
    if (isArray(apps)) {
      apps.reduce((pre, next) => pre.then(() => preFetchInSerial(next)), Promise.resolve());
    }
  });
}
// sequential preload app
function preFetchInSerial(prefetchApp) {
  return new Promise((resolve) => {
    requestIdleCallback(() => {
      let _a, _b;
      if (isPlainObject(prefetchApp) && navigator.onLine) {
        prefetchApp.name = formatAppName(prefetchApp.name);
        prefetchApp.url = formatAppURL(prefetchApp.url, prefetchApp.name);
        if (prefetchApp.name && prefetchApp.url && !appInstanceMap.has(prefetchApp.name)) {
          const app = new CreateApp({
            name: prefetchApp.name,
            url: prefetchApp.url,
            scopecss: !((_a = prefetchApp.disableScopecss) !== null && _a !== void 0 ? _a : microApp.disableScopecss),
            useSandbox: !((_b = prefetchApp.disableSandbox) !== null && _b !== void 0 ? _b : microApp.disableSandbox),
          });
          app.isPrefetch = true;
          app.prefetchResolve = resolve;
          appInstanceMap.set(prefetchApp.name, app);
        } else {
          resolve();
        }
      } else {
        resolve();
      }
    });
  });
}
/**
 * load global assets into cache
 * @param assets global assets of js, css
 */
function getGlobalAssets(assets) {
  if (isPlainObject(assets)) {
    requestIdleCallback(() => {
      fetchGlobalResources(assets.js, 'js', globalScripts);
      fetchGlobalResources(assets.css, 'css', globalLinks);
    });
  }
}
// TODO: requestIdleCallback for every file
function fetchGlobalResources(resources, suffix, cache) {
  if (isArray(resources)) {
    const effectiveResource = resources.filter(path => isString(path) && path.includes(`.${suffix}`) && !cache.has(path));
    const fetchResourcePromise = effectiveResource.map(path => fetchSource(path));
    // fetch resource with stream
    promiseStream(fetchResourcePromise, (res) => {
      const path = effectiveResource[res.index];
      if (!cache.has(path)) {
        cache.set(path, res.data);
      }
    }, (err) => {
      logError(err);
    });
  }
}

/**
 * if app not prefetch & not unmount, then app is active
 * @param excludeHiddenApp exclude hidden keep-alive app, default is false
 * @returns active apps
 */
function getActiveApps(excludeHiddenApp) {
  const activeApps = [];
  appInstanceMap.forEach((app, appName) => {
    if (appStates.UNMOUNT !== app.getAppState()
            && !app.isPrefetch
            && (!excludeHiddenApp
                || keepAliveStates.KEEP_ALIVE_HIDDEN !== app.getKeepAliveState())) {
      activeApps.push(appName);
    }
  });
  return activeApps;
}
// get all registered apps
function getAllApps() {
  return [...appInstanceMap.keys()];
}
/**
 * unmount app by appName
 * @param appName
 * @param options unmountAppParams
 * @returns Promise<void>
 */
function unmountApp(appName, options) {
  const app = appInstanceMap.get(formatAppName(appName));
  return new Promise((resolve) => {
    if (app) {
      if (app.getAppState() === appStates.UNMOUNT || app.isPrefetch) {
        if (options === null || options === void 0 ? void 0 : options.destroy) {
          app.actionsForCompletelyDestroy();
        }
        resolve();
      } else if (app.getKeepAliveState() === keepAliveStates.KEEP_ALIVE_HIDDEN) {
        if (options === null || options === void 0 ? void 0 : options.destroy) {
          app.unmount(true, resolve);
        } else if (options === null || options === void 0 ? void 0 : options.clearAliveState) {
          app.unmount(false, resolve);
        } else {
          resolve();
        }
      } else {
        const container = getRootContainer(app.container);
        const unmountHandler = () => {
          container.removeEventListener('unmount', unmountHandler);
          container.removeEventListener('afterhidden', afterhiddenHandler);
          resolve();
        };
        const afterhiddenHandler = () => {
          container.removeEventListener('unmount', unmountHandler);
          container.removeEventListener('afterhidden', afterhiddenHandler);
          resolve();
        };
        container.addEventListener('unmount', unmountHandler);
        container.addEventListener('afterhidden', afterhiddenHandler);
        if (options === null || options === void 0 ? void 0 : options.destroy) {
          let destoryAttrValue, destroyAttrValue;
          container.hasAttribute('destroy') && (destroyAttrValue = container.getAttribute('destroy'));
          container.hasAttribute('destory') && (destoryAttrValue = container.getAttribute('destory'));
          container.setAttribute('destroy', 'true');
          container.remove();
          container.removeAttribute('destroy');
          typeof destroyAttrValue === 'string' && container.setAttribute('destroy', destroyAttrValue);
          typeof destoryAttrValue === 'string' && container.setAttribute('destory', destoryAttrValue);
        } else if ((options === null || options === void 0 ? void 0 : options.clearAliveState) && container.hasAttribute('keep-alive')) {
          const keepAliveAttrValue = container.getAttribute('keep-alive');
          container.removeAttribute('keep-alive');
          container.remove();
          container.setAttribute('keep-alive', keepAliveAttrValue);
        } else {
          container.remove();
        }
      }
    } else {
      logWarn(`app ${appName} does not exist`);
      resolve();
    }
  });
}
// unmount all apps in turn
function unmountAllApps(options) {
  return [...appInstanceMap.keys()].reduce((pre, next) => pre.then(() => unmountApp(next, options)), Promise.resolve());
}
class MicroApp extends EventCenterForBaseApp {
  constructor() {
    super(...arguments);
    this.tagName = 'micro-app';
    this.preFetch = preFetch;
  }

  start(options) {
    if (!isBrowser || !window.customElements) {
      return logError('micro-app is not supported in this environment');
    }
    if (options === null || options === void 0 ? void 0 : options.tagName) {
      if ((/^micro-app(-\S+)?/).test(options.tagName)) {
        this.tagName = options.tagName;
      } else {
        return logError(`${options.tagName} is invalid tagName`);
      }
    }
    if (window.customElements.get(this.tagName)) {
      return logWarn(`element ${this.tagName} is already defined`);
    }
    initGlobalEnv();
    if (options && isPlainObject(options)) {
      this.shadowDOM = options.shadowDOM;
      this.destroy = options.destroy;
      /**
       * compatible with versions below 0.4.2 of destroy
       * do not merge with the previous line
       */
      // @ts-ignore
      this.destory = options.destory;
      this.inline = options.inline;
      this.disableScopecss = options.disableScopecss;
      this.disableSandbox = options.disableSandbox;
      this.ssr = options.ssr;
      isFunction(options.fetch) && (this.fetch = options.fetch);
      isPlainObject(options.lifeCycles) && (this.lifeCycles = options.lifeCycles);
      // load app assets when browser is idle
      options.preFetchApps && preFetch(options.preFetchApps);
      // load global assets when browser is idle
      options.globalAssets && getGlobalAssets(options.globalAssets);
      isFunction(options.excludeAssetFilter) && (this.excludeAssetFilter = options.excludeAssetFilter);
      if (isPlainObject(options.plugins)) {
        const modules = options.plugins.modules;
        if (isPlainObject(modules)) {
          for (const appName in modules) {
            const formattedAppName = formatAppName(appName);
            if (formattedAppName && appName !== formattedAppName) {
              modules[formattedAppName] = modules[appName];
              delete modules[appName];
            }
          }
        }
        this.plugins = options.plugins;
      }
    }
    // define customElement after init
    defineElement(this.tagName);
  }
}
var microApp = new MicroApp();

export default microApp;
export { EventCenterForMicroApp, MicroApp, getActiveApps, getAllApps, preFetch, pureCreateElement, removeDomScope, unmountAllApps, unmountApp, version };
// # sourceMappingURL=index.esm.js.map
