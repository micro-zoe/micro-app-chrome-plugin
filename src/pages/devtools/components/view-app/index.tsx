/* eslint-disable @typescript-eslint/no-explicit-any */
import { DownOutlined } from '@ant-design/icons';
import { Tree } from 'antd';
import React from 'react';

import styles from './index.module.less';

interface ViewAppProps {}
interface ViewAppState {
  info: { [key: string]: string | number };
  base: string;
  dataTree: any[];
  treeData: any[];
  viewSwitch: number;
}
class ViewAppPage extends React.PureComponent<ViewAppProps, ViewAppState> {
  public state: ViewAppState = {
    info: {},
    base: '',
    dataTree: [],
    treeData: [],
    viewSwitch: 0,
  };

  public getMicroApps = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        const tabId = tabs[0].id;
        chrome.tabs.executeScript(tabId, { file: 'content.js' }, () => {
          chrome.tabs.sendMessage(
            tabId,
            { action: 'devtoolsViewApp' },
            (response) => {
              const data = JSON.parse(response);
              const bases = data.title;
              this.setState({ base: bases });
              const dataTrees = data.children;
              this.setState({ dataTree: dataTrees });
              this.setState({
                treeData: [
                  {
                    title: `baseURI`,
                    key: '0',
                    children: this.state.dataTree,
                  },
                ],
              });
            },
          );
        });
      } else {
        console.error('id error。');
      }
    });
  };

  public onOpen = (keys: unknown, info: { node: { title: string | URL | undefined } }) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        const tabId = tabs[0].id;
        chrome.tabs.executeScript(tabId, { file: 'content.js' }, () => {
          chrome.tabs.sendMessage(tabId, { action: `open${info.node.title}` });
        });
      } else {
        console.error('id error。');
      }
    });
  };

  public onClose = (keys: unknown, info: { node: { title: string | URL | undefined } }) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        const tabId = tabs[0].id;
        chrome.tabs.executeScript(tabId, { file: 'content.js' }, () => {
          chrome.tabs.sendMessage(tabId, { action: `close${info.node.title}` });
        });
      } else {
        console.error('id error。');
      }
    });
  };

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
                this.getMicroApps();
                this.setState({ viewSwitch: 1 });
              }}
            >
              查看子应用范围
            </button>
          </div>
          { this.state.viewSwitch === 1
&& (
<Tree
  showLine
  switcherIcon={<DownOutlined rev={null} />}
  defaultExpandedKeys={['0-0-0']}
  treeData={this.state.treeData}
  onSelect={this.onOpen}
/>
) }
          <div
            className={styles['app-link']}
          >
            <button
              className={styles.btn}
              type="button"
              onClick={() => {
                this.getMicroApps();
                this.setState({ viewSwitch: 2 });
              }}
            >
              关闭子应用范围
            </button>
            { this.state.viewSwitch === 2
&& (
<Tree
  showLine
  switcherIcon={<DownOutlined rev={null} />}
  defaultExpandedKeys={['0-0-0']}
  treeData={this.state.treeData}
  onSelect={this.onClose}
/>
) }
          </div>
        </div>
      </div>
    );
  }
}

export default ViewAppPage;
