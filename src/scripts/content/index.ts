import { decodeJSON } from '@/utils/json';
import * as logger from '@/utils/logger';

import { printLine } from './modules/print';

logger.debug('Content script works!');
logger.debug('Must reload extension for modifications to take effect.');

printLine("Using the 'printLine' function from the Print Module");

/**
 *  多层嵌套时，子集标签格式：micro-app-XXX,但是不能包含['micro-app-head',"micro-app-body"]【 https://micro-zoe.github.io/micro-app/docs.html#/zh-cn/nest 】
 *
 *  0、最顶层父级
 *     - 当前页面的url
 *  1、父级
 *     - micro-app, 可以是多个
 *  2、次父级
 *     - micro-app-xxx且不是micro-app-head或者micro-app-body，可以多个，递归
 */

function filterMicroApps(dom: any) {
  const microApps = dom;
  const filteredMicroApps = [];
  for (const microApp of microApps) {
    const micro = microApp.tagName.toLowerCase();
    if (micro.startsWith('micro-app')
    && micro !== 'micro-app-head'
    && micro !== 'micro-app-body') {
      filteredMicroApps.push(microApp);
    }
  }
  return filteredMicroApps;
}

const DEC_AD_RE = /%M1/g; // &
const DEC_EQ_RE = /%M2/g; // =

// Recursively resolve address
function commonDecode(path: string): string {
  try {
    const decPath = decodeURIComponent(path);
    if (path === decPath || DEC_AD_RE.test(decPath) || DEC_EQ_RE.test(decPath)) { return decPath; }
    return commonDecode(decPath);
  } catch {
    return path;
  }
}

// decode path
export function decodeMicroPath(path: string): string {
  return commonDecode(path).replace(DEC_AD_RE, '&').replace(DEC_EQ_RE, '=');
}
function handleUrl(
  subAppUrl: string, /* 子应用url */
  baseRoute: string, /* baseRoute */
) {
  const regex1 = /^(https?:\/\/[^/]+)/im;
  const regex = /^(?:https?:\/\/[^/]+)?(\/[^#?]*)?(\?[^#]*)?(#.*)?$/;
  const urlOrigin = subAppUrl?.match(regex1);
  const baseUrl = window.location.href;
  const decodedURL = baseUrl.includes('%2F')
  || baseUrl.includes('%3F')
  || baseUrl.includes('%3D')
  || baseUrl.includes('%3A')
    ? decodeMicroPath(baseUrl)
    : baseUrl;
  const pathname = decodedURL.match(regex)[1];
  const search = decodedURL.match(regex)[2];
  const hash = decodedURL.match(regex)[3];
  const isDecodeBaseUrl = decodedURL.includes('#')
    ? '#'.concat(decodedURL.split('#')[1])
    : '';
  const locationString = [urlOrigin, baseRoute, pathname, search, hash];
  const uniqueArray = locationString.filter(
    (value, index, self) => self.indexOf(value) === index,
  );
  const result = baseRoute ? uniqueArray.join('') : subAppUrl;
  const handleResult = JSON.stringify(
    isDecodeBaseUrl ? subAppUrl?.concat(hash) : result,
  );
  const subAppLink = handleResult.includes('undefined')
    ? handleResult.replace('undefined', '')
    : JSON.parse(handleResult);
  return subAppLink;
}

// 找出DOM元素数组中的最顶层元素
function findTopLevelElements(elements: any) {
  const topLevelElements = [];
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    let isTopLevel = true;
    for (const [j, element_] of elements.entries()) {
      if (i !== j && element_.contains(element)) {
        isTopLevel = false;
        break;
      }
    }
    if (isTopLevel) {
      topLevelElements.push(element);
    }
  }
  return topLevelElements;
}

// 第一步：获取最顶层父级
const fatherUrl = window.location.href;
const topFather = fatherUrl.includes('%2F')
|| fatherUrl.includes('%3F')
|| fatherUrl.includes('%3D')
|| fatherUrl.includes('%3A')
  ? decodeMicroPath(fatherUrl)
  : fatherUrl;

/*
 * 第二步：获取父级micro-app
 * const allMicroApp = filterMicroApps(document.querySelectorAll('*'));
 * const topFather_1_el_maps = findTopLevelElements(allMicroApp);
 * 核心-开始递归寻址子级
 */
const topInitEntry = {
  key: '0',
  title: topFather,
  children: [],
};
const topMap = { 0: topInitEntry };

// 工具-是否还有子集
const hasChild = (context: Element) => context.querySelectorAll('micro-app-body').length > 0;

// 工具-找出最近的子集的DOM
function getChildByDomRegex(citem) {
  /*
   * 多层嵌套时，子集标签格式：micro-app-XXX,但是不能包含['micro-app-head',"micro-app-body"]【 https://micro-zoe.github.io/micro-app/docs.html#/zh-cn/nest 】
   * const child_regex = /^(micro-app-).+(?<!(head|body))$/;
   */
  const itemChildrens = citem.querySelectorAll('*');
  const output = [];
  for (const i of itemChildrens) {
    const micro = i.tagName.toLowerCase();
    if (micro.startsWith('micro-app')
    && micro !== 'micro-app-head'
    && micro !== 'micro-app-body') {
      output.push(i);
    }
  }
  return output[0];
}

// 深化：子集递归查找
const getChildMap = (childItem: Element, faLevel = '0') => {
  const fa_maps = childItem.querySelectorAll('micro-app-body');
  if (fa_maps && fa_maps.length > 0) {
    for (const [index, fa_map] of fa_maps.entries()) {
      if (hasChild(fa_map)) {
        const item = getChildByDomRegex(fa_map);
        const key = `${faLevel}-${index}`;
        const curItem = {
          key,
          title: `${item.getAttribute('name')}:${handleUrl(item.getAttribute('url'), item.getAttribute('baseroute'))}`,
          children: [],
        };
        topMap[key] = curItem;
        topMap[faLevel]?.children.push(curItem);
        if (item && hasChild(item.querySelectorAll('micro-app-body')[0])) {
          getChildMap(item, key);
        }
      }
    }
  }
};

// 初始化：进行一级查找
const getMap = (faLevel = '0') => {
  const topFather_1_el_maps = findTopLevelElements(microApps);
  if (topFather_1_el_maps && topFather_1_el_maps.length > 0) {
    for (const [index, item] of topFather_1_el_maps.entries()) {
      const key = `${faLevel}-${index}`;
      const curItem = {
        key,
        title: `${item.getAttribute('name')}:${handleUrl(item.getAttribute('url'), item.getAttribute('baseroute'))}`,
        children: [],
      };
      topMap[key] = curItem;
      topMap[faLevel]?.children.push(curItem);
      // 大于0，说明body内部还有body， 说明内部有嵌套，需要继续寻找
      if (item && hasChild(item.querySelectorAll('micro-app-body')[0])) {
        getChildMap(item, key);
      }
    }
  }
};

// init microApp
let microApps = filterMicroApps(document.querySelectorAll('*'));
/*
 * create button
 * const button = document.createElement('button');
 */
/**
 * 2、first open website or reload, send micro-app object data
 * if data not null, indicates access micro-app
 * else no access
 */
setTimeout(() => {
  chrome.runtime.sendMessage({
    updateIcon: filterMicroApps(document.querySelectorAll('*')),
  });
  microApps = filterMicroApps(document.querySelectorAll('*'));
}, 2000);

// get msg and setting button or microApp
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // to retrieve elements again within the page
  microApps = filterMicroApps(document.querySelectorAll('*'));
  chrome.runtime.sendMessage({
    updateIcon: microApps,
  });
  if (microApps === null) {
    return;
  }
  microApps.forEach((microApp) => {
    if (microApp) {
      if (request.action === 'openView') {
        (microApp as HTMLElement).style.border = '2px solid red';
      } else if (request.action === 'closeView') {
        (microApp as HTMLElement).style.border = '0px';
      }
    }
  });
  if (request.action === 'devtoolsMicroApp') {
  // start-天龙八部
    console.log(88888, '得到的顶层树形数据结构为：：：：', topMap['0']);
    if (Array.isArray(topMap['0'].children) && topMap['0'].children.length === 0) {
      getMap();
    }
    console.log(999999, '得到的顶层树形数据结构为：：：：', topMap['0']);
    sendResponse(JSON.stringify(topMap['0']));
  }
});
