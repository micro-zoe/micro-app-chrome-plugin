import React from 'react';

import styles from './index.module.less';

interface PopupPageProps {}

interface PopupPageProps {
}

class PopupPage extends React.PureComponent<PopupPageProps, PopupPageProps> {
  private open() {
    // https://developer.chrome.com/docs/extensions/reference/tabs/#examples
    chrome.tabs.create({
      url: 'simulation.html',
    });
  }

  public render() {
    return (
      <div className={styles.app}>
        <div className={styles['app-link']} onClick={() => { this.open(); }}>
          <a>
            打开“子应用开发环境模拟”页面
          </a>
        </div>

      </div>
    );
  }
}

export default PopupPage;
