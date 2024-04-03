import * as logger from '@/utils/logger';

import { printLine } from './modules/print';

logger.debug('Content script works!');
logger.debug('Must reload extension for modifications to take effect.');

printLine("Using the 'printLine' function from the Print Module");

function filterMicroApps() {
  const microApps = document.querySelectorAll('*');
  const filteredMicroApps: Element[] = [];
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
  const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
  const defaultColor = 'black';
  const originalStyles = new Map(); // Initial style used to save elements
  microApps.forEach((microApp, index) => {
    if (microApp) {
      if (request.action === 'openView') {
        const color = index < colors.length ? colors[index] : defaultColor;
        const originalStyle = microApp.getAttribute('style'); // get initial style
        originalStyles.set(microApp, originalStyle); // save initial style
        (microApp as HTMLElement).style.border = `2px solid ${color}`;
        // fix some parent div setting display: contents cause border colors cannot be displayed
        (microApp as HTMLElement).style.display = 'block';
        // add transform is because some border colors cannot be displayed
        (microApp as HTMLElement).style.transformOrigin = 'center';
        (microApp as HTMLElement).style.transform = 'rotate(360deg)';
      } else if (request.action === 'closeView') {
        const originalStyle = originalStyles.get(microApp); // get save elements
        if (originalStyle) {
          microApp.setAttribute('style', originalStyle); // set save elements
        } else {
          microApp.removeAttribute('style'); // if there is no initial style, remove all inline styles
        }
      }
    }
  });
  if (request.action === 'devtoolsMicroApp') {
    const microAppDevs = document.querySelectorAll('[name][url]');
    const result: string[] = [];
    microAppDevs.forEach(obj => result.push(obj.attributes[obj.attributes.length].value));
    sendResponse(microApps[0].baseURI);
  }
});
