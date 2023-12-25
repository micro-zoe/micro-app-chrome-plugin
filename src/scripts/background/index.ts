/*
 * This is the background page.
 * Put the background scripts here.
 */

import * as logger from '@/utils/logger';

logger.debug('Background page started.');
// create parent menu
chrome.contextMenus.create({
  title: 'Micro-app',
  id: '10',
  contexts: ['page'],
});
// create child menu
chrome.contextMenus.create({
  title: '子应用开发环境模拟',
  id: '1101',
  parentId: '10',
  contexts: ['page'],
});
// create child menu
chrome.contextMenus.create({
  title: '查看子应用范围',
  id: '1102',
  parentId: '10',
  contexts: ['page'],
});

// create child menu
chrome.contextMenus.create({
  title: '关闭子应用范围',
  id: '1103',
  parentId: '10',
  contexts: ['page'],
});

chrome.contextMenus.onClicked.addListener(({ menuItemId }) => {
  logger.debug('menuItemId.', menuItemId);
  // open simulation page
  if (menuItemId === '1101') {
    chrome.tabs.create({
      url: 'simulation.html',
    });
  }
  // click send msg to content.js
  if (menuItemId === '1102') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        const tabId = tabs[0].id;
        chrome.tabs.executeScript(tabId, { file: 'content.js' }, () => {
          chrome.tabs.sendMessage(tabId, { action: 'openView' });
        });
      } else {
        console.error('id error。');
      }
    });
  }
  if (menuItemId === '1103') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        const tabId = tabs[0].id;
        chrome.tabs.executeScript(tabId, { file: 'content.js' }, () => {
          chrome.tabs.sendMessage(tabId, { action: 'closeView' });
        });
      } else {
        console.error('id error。');
      }
    });
  }
});

/**
 * define two different icon file paths
 * and requires config manifest.json, icons
 * chrome.runtime.getURL () method can obtain the complete URL of the plugin resource
 */
const blueIconPath = chrome.runtime.getURL('static/icons/icon-128.png');
const grayIconPath = chrome.runtime.getURL('static/icons/icon-128-disable.png');
const storageData = {};
/**
 * 1、The first time loading or refreshing the listening tab update event
 * and two is content.js
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab1) => {
  logger.debug('load tabId', tabId);
  // 3、Obtained content.js through sent messages, isMicroApp
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    const isMicroApp = !!(msg && msg.updateIcon);
    logger.debug('isMicroApp', isMicroApp);
    // 4、get storage data is null, need save current tabId
    chrome.storage.sync.get([`${tabId}`], (result) => {
      if (JSON.stringify(result) === '{}') {
        storageData[tabId] = isMicroApp;
        chrome.storage.sync.set(storageData);
      }
      logger.debug(`first value currently is ${JSON.stringify(result)}`);
    });
    // 5、loading or refreshing will change storage data
    chrome.storage.onChanged.addListener((changes, namespace) => {
      logger.debug('changes', changes);
      Object.entries(changes).forEach(([key, storageChange]) => {
        logger.debug('key', key);
        logger.debug('storageChange', storageChange);
        if (key === `${tabId}`) {
          storageData[tabId] = isMicroApp;
          chrome.storage.sync.set(storageData);
        }
      });
    });
    // 6、according to isMicroApp setting iconPath
    chrome.browserAction.setIcon({ path: isMicroApp ? blueIconPath : grayIconPath, tabId });
  });
});
/**
 * change tab the listening tab update event
 * according to get storage, and isMicroApp status setting iconPath
 */
chrome.tabs.onActivated.addListener((changeInfo) => {
  logger.debug('change tabId', changeInfo.tabId);
  chrome.storage.sync.get([`${changeInfo.tabId}`], (result) => {
    if (result) {
      logger.debug(`change tab value currently is ${JSON.stringify(result)}`);
      const data = JSON.parse(JSON.stringify(result));
      logger.debug('isMicroApp', data[`${changeInfo.tabId}`]);
      chrome.browserAction.setIcon({ path: data[`${changeInfo.tabId}`] ? blueIconPath : grayIconPath, tabId: changeInfo.tabId });
    } else {
      chrome.browserAction.setIcon({ path: grayIconPath, tabId: changeInfo.tabId });
    }
  });
});
