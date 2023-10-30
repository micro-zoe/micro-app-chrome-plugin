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

function arraysAreEqual(arr1: string | any[], arr2: string | any[]) {
  // 检查数组长度是否相同
  if (arr1.length !== arr2.length) {
    return false;
  }

  // 遍历数组元素
  for (let i = 0; i < arr1.length; i++) {
    const item1 = arr1[i];
    const item2 = arr2[i];

    // 如果元素是数组，则递归比较
    if (Array.isArray(item1) && Array.isArray(item2)) {
      if (!arraysAreEqual(item1, item2)) {
        return false;
      }
    }
    // 如果元素是对象，则递归比较
    else if (typeof item1 === 'object' && typeof item2 === 'object') {
      if (!objectsAreEqual(item1, item2)) {
        return false;
      }
    }
    // 比较基本类型元素
    else if (item1 !== item2) {
      return false;
    }
  }

  return true;
}

function objectsAreEqual(obj1: { [x: string]: any; }, obj2: { [x: string]: any; }) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // 检查对象键的数量是否相同
  if (keys1.length !== keys2.length) {
    return false;
  }

  // 遍历对象键
  for (let key of keys1) {
    const val1 = obj1[key];
    const val2 = obj2[key];

    // 如果值是数组，则递归比较
    if (Array.isArray(val1) && Array.isArray(val2)) {
      if (!arraysAreEqual(val1, val2)) {
        return false;
      }
    }
    // 如果值是对象，则递归比较
    else if (typeof val1 === 'object' && typeof val2 === 'object') {
      if (!objectsAreEqual(val1, val2)) {
        return false;
      }
    }
    // 比较基本类型值
    else if (val1 !== val2) {
      return false;
    }
  }

  return true;
}

// 找出DOM元素数组中的最顶层元素
function findTopLevelElements(elements: any) {
  const topLevelElements = [];
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    let isTopLevel = true;
    for (let j = 0; j < elements.length; j++) {
      if (i !== j && elements[j].contains(element)) {
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
const topFather = window.location.href;

// 第二步：获取父级micro-app
// const allMicroApp = filterMicroApps(document.querySelectorAll('*'));
// const topFather_1_el_maps = findTopLevelElements(allMicroApp);
// 核心-开始递归寻址子级
const topInitEntry = {
  // currentLevel: 0,
  key: '0',
  // name: topFather,
  title: topFather,
  // tag: 'document',
  // element: document,
  children: [],
};
const topMap = { 0: topInitEntry };

// 工具-是否还有子集
const hasChild = (context: Element) => context.getElementsByTagName('micro-app-body').length > 0;

// 工具-找出最近的子集的DOM
function getChildByDomRegex(citem) {
  // 多层嵌套时，子集标签格式：micro-app-XXX,但是不能包含['micro-app-head',"micro-app-body"]【 https://micro-zoe.github.io/micro-app/docs.html#/zh-cn/nest 】
  // const child_regex = /^(micro-app-).+(?<!(head|body))$/;
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
  const fa_maps = childItem.getElementsByTagName('micro-app-body');
  if (fa_maps && fa_maps.length > 0) {
    for (let index = 0; index < fa_maps.length; index++) {
      if (hasChild(fa_maps[index])) {
        const item = getChildByDomRegex(fa_maps[index]);
        const key = `${faLevel}-${index}`;
        const curItem = {
          key,
          title: `${item.getAttribute('name')}:${item.getAttribute('url')}`,
          children: [],
        };
        topMap[key] = curItem;
        topMap[faLevel]?.children.push(curItem);
        if (item && hasChild(item.getElementsByTagName('micro-app-body')[0])) {
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
    for (let index = 0; index < topFather_1_el_maps.length; index++) {
      const item = topFather_1_el_maps[index];
      const key = `${faLevel}-${index}`;
      const curItem = {
        // currentLevel: index,
        key,
        // name: item.getAttribute('name'),
        title: item.getAttribute('name') + ':' + item.getAttribute('url'),
        // tag: item.tagName.toLowerCase(),
        // element: item,
        children: [],
      };
      topMap[key] = curItem;
      topMap[faLevel]?.children.push(curItem);
      // 大于0，说明body内部还有body， 说明内部有嵌套，需要继续寻找
      if (item && (hasChild(item.getElementsByTagName('micro-app-body')[0]))) {
        getChildMap(item, key);
      }
      console.log(topMap['0'], '=======111111')
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
  // (microApp as HTMLElement).style.border = '2px solid red';

  // // setting button
  // button.textContent = '关闭子应用范围';
  // button.style.position = 'fixed';
  // button.style.bottom = '20px';
  // button.style.right = '20px';
  // button.style.backgroundColor = 'blue';
  // button.style.color = 'white';
  // button.style.border = 'none';
  // button.style.padding = '10px';
  // button.style.borderRadius = '5%';
  // button.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';

  /*
   * document.body.append(button);
   * button.style.display = 'none';
   */
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
