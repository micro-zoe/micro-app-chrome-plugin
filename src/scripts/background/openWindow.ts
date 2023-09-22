export type DevToolsPosition =
  | 'devtools-left'
  | 'devtools-right'
  | 'devtools-bottom'
  | 'devtools-panel'
  | 'devtools-remote';

const windows: { [K in DevToolsPosition]?: number } = {};
let lastPosition: DevToolsPosition | null = null;

export default function openDevToolsWindow(position: DevToolsPosition) {
  function popWindow(
    action: string,
    url: string,
    customOptions: chrome.windows.CreateData & chrome.windows.UpdateInfo,
  ) {
    function focusIfExist(callback: () => void) {
      if (!windows[position]) {
        callback();
        lastPosition = position;
      } else {
        let params = { focused: true };
        if (lastPosition !== position && position !== 'devtools-panel') {
          params = { ...params, ...customOptions };
        }
        chrome.windows.update(windows[position]!, params, () => {
          lastPosition = null;
          if (chrome.runtime.lastError) { callback(); }
        });
      }
    }

    focusIfExist(() => {
      const options: chrome.windows.CreateData = {
        type: 'popup',
        ...customOptions,
      };
      if (action === 'open') {
        options.url = chrome.extension.getURL(
          `${url}#${position.slice(position.indexOf('-') + 1)}`,
        );
        chrome.windows.create(options, (win) => {
          windows[position] = win!.id;
          if (navigator.userAgent.includes('Firefox')) {
            chrome.windows.update(win!.id!, {
              focused: true,
              ...customOptions,
            });
          }
        });
      }
    });
  }

  const params: chrome.windows.CreateData & chrome.windows.UpdateInfo = {
    left: 0,
    top: 0,
    width: 380,
    height: 400,
  };
  /*
   *   let url = 'window.html';
   *   switch (position) {
   *     case 'devtools-right':
   *       params.left =
   *         (window.screen as unknown as { availLeft: number }).availLeft +
   *         window.screen.availWidth -
   *         params.width!;
   *       break;
   *     case 'devtools-bottom':
   *       params.height = 420;
   *       params.top = window.screen.height - params.height;
   *       params.width = window.screen.availWidth;
   *       break;
   *     case 'devtools-panel':
   *       params.type = 'panel';
   *       break;
   *     case 'devtools-remote':
   *       params = { width: 850, height: 600 };
   *       url = 'remote.html';
   *       break;
   *   }
   */
  popWindow('open', 'devtools-app.html', params);
}
