import React from 'react';
import ReactJson from 'react-json-view';

import styles from './index.module.less';

interface CommunicateProps {}
interface CommunicateState {
  info: { [key: string]: string | number };
  isClickGetAppButton: boolean;
}

class CommunicatePage extends React.PureComponent<CommunicateProps, CommunicateState> {
  public state: CommunicateState = {
    info: {},
    isClickGetAppButton: false,
  };

  public getRenderData() {
    chrome.devtools.inspectedWindow.eval(
      'window.__MICRO_APP_PROXY_WINDOW__.microApp.getData()',
      (res: string) => {
        if (res) {
          this.setState({ info: JSON.parse(JSON.stringify(res)) });
        }
      },
    );
    this.setState({ isClickGetAppButton: true });
  }

  public render() {
    return (
      <div style={{ display: 'flex' }}>
        <div className={styles.container}>
          <button
            className={styles.btn}
            type="button"
            onClick={() => {
              this.getRenderData();
            }}
          >
            获取父应用数据

          </button>
          <div
            className={styles['app-link']}
          >
            <button
              className={styles.btn}
              type="button"
              onClick={() => {
                chrome.tabs.create({
                  url: 'simulation.html',
                });
              }}
            >
              子应用开发环境模拟
            </button>
          </div>
        </div>
        {
          this.state.isClickGetAppButton && (
          <div
            style={{ backgroundColor: '#FFF', width: 800, height: 290, overflow: 'hidden', marginLeft: 20, marginTop: 20 }}
          >
            <ReactJson
              style={{ overflowY: 'scroll', overflowX: 'hidden', height: 290 }}
              src={this.state.info}
            />
          </div>
          )
        }
      </div>
    );
  }
}

export default CommunicatePage;
