import { DownOutlined } from '@ant-design/icons';
import { Alert, Modal, Space, Tree } from 'antd';
import React from 'react';

import { DevToolsInfo, MicroAppsInfos } from '../../types';

import styles from './index.module.less';

interface RouteProps {
  info: DevToolsInfo;
}

interface RouteState {
  appUrl1: string;
  appUrl2: string;
  appUrl3: string;
  baseURI: string;
  urlOrigin1: string | null;
  urlOrigin2: string | null;
  urlOrigin3: string | null;
  subAppUrl1: string;
  subAppUrl2: string;
  subAppUrl3: string;
  pathname: string | undefined | null;
  search: string | null;
  hash: string | null;
  baseRoute: string | undefined;
  isDecodeBaseUrl: string;
  microAppsInfo: MicroAppsInfos[];
  urlArray: [];
  nameArray: [];
}

class Route extends React.PureComponent<RouteProps, RouteState> {
  public state: RouteState = {
    appUrl1: '',
    appUrl2: '',
    appUrl3: '',
    baseURI: '',
    urlOrigin1: '',
    urlOrigin2: '',
    urlOrigin3: '',
    subAppUrl1: '',
    subAppUrl2: '',
    subAppUrl3: '',
    pathname: '',
    search: '',
    hash: '',
    baseRoute: '',
    isDecodeBaseUrl: '',
    microAppsInfo: [],
    urlArray: [],
    nameArray: [],
  };

  public componentDidMount(): void {
    this.getSubApp1();
    this.getSubApp2();
    this.getMicroApps();
  }

  public getMicroApps() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        const tabId = tabs[0].id;
        chrome.tabs.executeScript(tabId, { file: 'content.js' }, () => {
          chrome.tabs.sendMessage(
            tabId,
            { action: 'devtoolsMicroApp' },
            (response) => {
              const data = JSON.parse(response);
              const dataTree = data.children;
              this.setState({
                microAppsInfo: [...dataTree],
              }, () => {
                // Modal.warning({ title: response });
              });
            },
          );
        });
      } else {
        console.error('id error。');
      }
    });
  }

  /**
   * click get parent app data
   */
  public getSubApp1() {
    chrome.devtools.inspectedWindow.eval(
      'document.querySelectorAll("[name][url]")[0].appUrl',
      (res: string) => {
        if (res) {
          const subApp1 = res;
          const regex1 = /^(https?:\/\/[^/]+)/im;
          const match1 = res?.match(regex1);
          this.setState({ appUrl1: subApp1, urlOrigin1: match1 && match1[1], subAppUrl1: res, appUrl2: '', appUrl3: '' });
          this.getBaseURI();
        }
      },
    );
  }

  /**
   * click get parent app data
   */
  public getSubApp2() {
    chrome.devtools.inspectedWindow.eval(
      'document.querySelectorAll("[name][url]")[1].appUrl',
      (res: string) => {
        if (res) {
          const subApp2 = res;
          const regex1 = /^(https?:\/\/[^/]+)/im;
          const match1 = res?.match(regex1);
          this.setState({ appUrl2: subApp2, urlOrigin2: match1 && match1[1], subAppUrl2: res, appUrl3: '' });
          this.getBaseURI();
          this.getSubApp3();
        }
      },
    );
  }

  /**
   * click get parent app data
   */
  public getSubApp3() {
    chrome.devtools.inspectedWindow.eval(
      'document.querySelectorAll("[name][url]")[2].appUrl',
      (res: string) => {
        if (res) {
          const subApp3 = res;
          const regex1 = /^(https?:\/\/[^/]+)/im;
          const match1 = res?.match(regex1);
          this.setState({ appUrl3: subApp3, urlOrigin2: match1 && match1[1], subAppUrl3: res });
          this.getBaseURI();
        }
      },
    );
  }

  /**
   * click get parent app data
   */
  public getBaseURI() {
    chrome.devtools.inspectedWindow.eval(
      'document.querySelectorAll("micro-app")[0].baseURI',
      (res: string) => {
        if (res) {
          // 匹配父应用的pathname、search和hash
          const regex = /^(?:https?:\/\/[^/]+)?(\/[^#?]*)?(\?[^#]*)?(#.*)?$/;
          const match = res?.match(regex);
          if (res.includes('%2F') || res.includes('%3F') || res.includes('%3D') || res.includes('%3A')) {
            const decodedURL = JSON.parse(decodeURIComponent(JSON.stringify(res)));
            const Arr = decodedURL.split('#')[1];
            const hashArr = decodedURL.includes('#') ? '#'.concat(Arr) : '';
            this.setState({
              isDecodeBaseUrl: hashArr,
              hash: hashArr,
              pathname: this.props.info.currentMicroApp?.env?.__MICRO_APP_PUBLIC_PATH__,
              baseRoute: this.props.info.currentMicroApp?.env?.__MICRO_APP_BASE_ROUTE__,
            });
          } else {
            this.setState({
              isDecodeBaseUrl: res.includes('#') ? '#'.concat(res.split('#')[1]) : '',
              baseURI: res,
              pathname: match && match[1],
              search: match && match[2],
              hash: match && match[3],
              baseRoute: this.props.info.currentMicroApp?.env?.__MICRO_APP_BASE_ROUTE__,
            });
          }
        }
      },
    );
  }

  public handleUrl(urlOrigin: string | null, appUrl: string, subAppUrl: string) {
    const { baseRoute, pathname, search, hash, isDecodeBaseUrl } = this.state;
    const locationString = [urlOrigin, baseRoute, pathname, search, hash];
    const uniqueArray = locationString.filter((value, index, self) => self.indexOf(value) === index);
    const result = baseRoute ? uniqueArray.join('') : subAppUrl;
    const handleResult = JSON.stringify(isDecodeBaseUrl ? subAppUrl?.concat(hash || '') : result);
    const subAppLink = handleResult.includes('undefined') ? handleResult.replace('undefined', '') : JSON.parse(handleResult);
    return subAppLink;
  }

  public openNewWindow(urlOrigin: string | null, appUrl: string, subAppUrl: string) {
    window.open(this.handleUrl(urlOrigin, appUrl, subAppUrl) || '');
  }

  public render() {
    const { baseURI,
      microAppsInfo } = this.state;
    const treeData = [
      {
        title: `baseURI: ${baseURI}`,
        key: '0',
        children: microAppsInfo,
      },
    ];
    console.log(treeData, '-------microAppsInfo');

    return (
      <div style={{ display: 'flex', width: 2600 }}>
        <div className={styles.container}>
          <div>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="目前对于路径隐藏在路由里和对于有些特殊的虚拟路由拼接得到的链接的场景不能获取正确的子应用链接！"
                banner
                closable
              />
            </Space>
          </div>
          <Tree
            showLine
            switcherIcon={<DownOutlined />}
            defaultExpandedKeys={['0-0-0']}
            treeData={treeData}
          />
        </div>
      </div>
    );
  }
}

export default Route;
