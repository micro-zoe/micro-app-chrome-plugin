import React from 'react';

import styles from './index.module.less';

interface ViewAppProps { }
interface ViewAppState {
}
class ViewAppPage extends React.PureComponent<ViewAppProps, ViewAppState> {
  public state: ViewAppState = {};

  public render() {
    return (
      <div style={{ display: 'flex' }}>
        <div className={styles.container}>
          <div
            className={styles['app-link']}
          >
            <button
              className={styles.btn}
              type="button"
              onClick={() => {
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
              }}
            >
              查看子应用范围
            </button>
          </div>
          <div
            className={styles['app-link']}
          >
            <button
              className={styles.btn}
              type="button"
              onClick={() => {
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
              }}
            >
              关闭子应用范围
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ViewAppPage;
