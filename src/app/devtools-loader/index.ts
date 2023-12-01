(() => {
  let isDevPanelVisible = false;
  let counter = 0;
  let timer = 0;
  function onPanelShow() {
    chrome.runtime.sendMessage('micro-app-dev-panel-shown');
  }
  function onPanelHide() {
    chrome.runtime.sendMessage('micro-app-dev-panel-hidden');
  }
  function updateDevPanel() {
    if (isDevPanelVisible || counter > 10) {
      window.clearInterval(timer);
    } else {
      chrome.devtools.inspectedWindow.eval(
        '!!(window.__MICRO_APP_BASE_APPLICATION__)',
        (hasMicroApp) => {
          if (hasMicroApp && !isDevPanelVisible) {
            window.clearInterval(timer);
            isDevPanelVisible = true;
            chrome.devtools.panels.create(
              '💠 Micro App',
              '',
              'devtools-app.html',
              (e) => {
                e.onShown.addListener(onPanelShow);
                e.onHidden.addListener(onPanelHide);
              },
            );
          }
        },
      );
      counter += 1;
    }
  }
  timer = window.setInterval(updateDevPanel, 1000);
  chrome.devtools.network.onNavigated.addListener(updateDevPanel);
  updateDevPanel();
})();
