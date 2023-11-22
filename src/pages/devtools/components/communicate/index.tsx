/* eslint-disable etc/no-commented-out-code */
import React from 'react';
// import { CopyToClipboard } from 'react-copy-to-clipboard';
import ReactJson from 'react-json-view';

import styles from './index.module.less';

interface CommunicateProps { }
interface CommunicateState {
  info: { [key: string]: string | number };
  // isClickGetAppButton: boolean;
}

class CommunicatePage extends React.PureComponent<CommunicateProps, CommunicateState> {
  public state: CommunicateState = {
    info: {},
    // isClickGetAppButton: true,
  };

  /**
   * click get parent app data
   */
  public getRenderData() {
    chrome.devtools.inspectedWindow.eval(
      'window.__MICRO_APP_PROXY_WINDOW__.microApp.getData()',
      (res: string) => {
        if (res) {
          this.setState({ info: JSON.parse(JSON.stringify(res)) });
        } else {
          this.setState({
            info: {}
          })
        }
      },
    );
    // this.setState({ isClickGetAppButton: true });
  }

  private getMicroAppSendData() {
    const evalLabel = `JSON.stringify(function () {
      if (document.querySelector("micro-app").getSendData){
          console.log('已设置过');
      } else {
          document.querySelector("micro-app").addEventListener('datachange', function (e) {
              document.querySelector("micro-app").getSendData = e.detail.data;
              document.querySelector("micro-app").onDataChange;
              // alert('子应用发送的信息:' + JSON.stringify(e.detail.data));
          })
      }
      return document.querySelector("micro-app").getSendData;
  }())`;
    chrome.devtools.inspectedWindow.eval(
      evalLabel,
      (res: string) => {
        if (res) {
          this.setState({ info: JSON.parse(res) });
        } else {
          this.setState({
            info: {}
          })
        }
      },
    );
  }

  public render() {
    return (
      <div className={styles.container}>
        <div className={styles.leftBlock}>
          <button
            className={styles.oneBtn}
            type="button"
            onClick={() => {
              this.getRenderData();
            }}
          >
            获取父应用传递给子应用数据
          </button>
          <button
            className={styles.oneBtn}
            type="button"
            onClick={() => {
              this.getMicroAppSendData();
            }}
          >
            获取子应用传递给父应用数据
          </button>
          <button
            className={styles.oneBtn}
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
        <div
          className={styles.rightBlock}
        >
          <ReactJson
            style={{ overflowY: 'scroll', overflowX: 'hidden', height: 290 }}
            src={this.state.info}
            name={false}
          />
        </div>
        {/* <CopyToClipboard
          text={JSON.stringify(this.state.info)}
        >
          <button
            className={styles.oneBtn}
            type="button"
          >
            复制
          </button>
        </CopyToClipboard> */}
      </div>
    );
  }
}

export default CommunicatePage;
