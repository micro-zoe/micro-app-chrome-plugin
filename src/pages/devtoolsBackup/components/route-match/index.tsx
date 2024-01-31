import { Alert, Input, Space } from 'antd';
import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { DevToolsInfo } from '../../types';

import styles from './index.module.less';

interface RouteProps {
  info: DevToolsInfo;
}

interface RouteState {
  appUrl1: string;
  appUrl2: string;
  appUrl3: string;
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
}

class Route extends React.PureComponent<RouteProps, RouteState> {
  public state: RouteState = {
    appUrl1: '',
    appUrl2: '',
    appUrl3: '',
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
  };

  /**
   * click get parent app data
   */
  public getSubApp1() {
    chrome.devtools.inspectedWindow.eval(
      'document.querySelectorAll("[name][url]")[0].appUrl',
      (res: string) => {
        if (res) {
          const subApp1 = res;
          const regex1 = /^(https?:\/\/[^/]+)/uim;
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
          const regex1 = /^(https?:\/\/[^/]+)/uim;
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
          const regex1 = /^(https?:\/\/[^/]+)/uim;
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
          const regex = /^(?:https?:\/\/[^/]+)?(\/[^#?]*)?(\?[^#]*)?(#.*)?$/u;
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
    const { appUrl1, appUrl2, appUrl3, urlOrigin1, urlOrigin2, urlOrigin3, subAppUrl1, subAppUrl2, subAppUrl3 } = this.state;
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
            <button
              className={styles.btn}
              type="button"
              onClick={() => { this.getSubApp1(); this.getSubApp2(); }}
            >
              查看子应用URL
            </button>
            <Input
              placeholder="Sub-APP URL"
              style={{ width: 800, height: 30, overflow: 'hidden', marginLeft: 20, marginTop: 20 }}
              value={this.handleUrl(urlOrigin1, appUrl1, subAppUrl1) || ''}
            />
            <CopyToClipboard
              text={this.handleUrl(urlOrigin1, appUrl1, subAppUrl1) || ''}
            >
              <button
                style={{
                  backgroundColor: '#00bfff',
                  width: 80,
                  height: 30,
                  marginLeft: 20,
                  marginTop: 20,
                  borderRadius: 5,
                  borderColor: ' #00bfff',
                }}
                type="button"
              >
                复制
              </button>
            </CopyToClipboard>
            <button
              style={{
                backgroundColor: '#00bfff',
                width: 80,
                height: 30,
                marginLeft: 20,
                marginTop: 20,
                borderRadius: 5,
                borderColor: ' #00bfff',
              }}
              type="button"
              onClick={() => { this.openNewWindow(urlOrigin1, appUrl1, subAppUrl1); }}
            >
              打开
            </button>
          </div>
          { appUrl2 && (
          <div>
            <Input
              placeholder="Sub-APP URL"
              style={{ width: 800, height: 30, overflow: 'hidden', marginLeft: 220, marginTop: 20 }}
              value={this.handleUrl(urlOrigin2, appUrl2, subAppUrl2) || ''}
            />
            <CopyToClipboard
              text={this.handleUrl(urlOrigin2, appUrl2, subAppUrl2) || ''}
            >
              <button
                style={{
                  backgroundColor: '#00bfff',
                  width: 80,
                  height: 30,
                  marginLeft: 20,
                  marginTop: 20,
                  borderRadius: 5,
                  borderColor: ' #00bfff',
                }}
                type="button"
              >
                复制
              </button>
            </CopyToClipboard>
            <button
              style={{
                backgroundColor: '#00bfff',
                width: 80,
                height: 30,
                marginLeft: 20,
                marginTop: 20,
                borderRadius: 5,
                borderColor: ' #00bfff',
              }}
              type="button"
              onClick={() => { this.openNewWindow(urlOrigin2, appUrl2, subAppUrl2); }}
            >
              打开
            </button>
          </div>
          ) }
          { appUrl3 && (
          <div>
            <Input
              placeholder="Sub-APP URL"
              style={{ width: 800, height: 30, overflow: 'hidden', marginLeft: 220, marginTop: 20 }}
              value={this.handleUrl(urlOrigin3, appUrl3, subAppUrl3) || ''}
            />
            <CopyToClipboard
              text={this.handleUrl(urlOrigin3, appUrl3, subAppUrl3) || ''}
            >
              <button
                style={{
                  backgroundColor: '#00bfff',
                  width: 80,
                  height: 30,
                  marginLeft: 20,
                  marginTop: 20,
                  borderRadius: 5,
                  borderColor: ' #00bfff',
                }}
                type="button"
              >
                复制
              </button>
            </CopyToClipboard>
            <button
              style={{
                backgroundColor: '#00bfff',
                width: 80,
                height: 30,
                marginLeft: 20,
                marginTop: 20,
                borderRadius: 5,
                borderColor: ' #00bfff',
              }}
              type="button"
              onClick={() => { this.openNewWindow(urlOrigin3, appUrl3, subAppUrl3); }}
            >
              打开
            </button>
          </div>
          ) }
        </div>
      </div>
    );
  }
}

export default Route;
