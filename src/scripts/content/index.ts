import * as logger from '@/utils/logger';

import { printLine } from './modules/print';

logger.debug('Content script works!');
logger.debug('Must reload extension for modifications to take effect.');

printLine("Using the 'printLine' function from the Print Module");

function filterMicroApps() {
  const microApps = document.querySelectorAll('*');
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

// init microApp
let microApps = filterMicroApps();
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
    updateIcon: filterMicroApps(),
  });
  microApps = filterMicroApps();
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
  microApps = filterMicroApps();
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
    const microAppDevs = document.querySelectorAll('[name][url]');
    const result = [];
    microAppDevs.forEach(obj => result.push(obj.attributes[obj.attributes.length].value));
    sendResponse(microApps[0].baseURI);
  }
});
