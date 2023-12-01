import React from 'react';

import { decodeJSON } from '@/utils/json';

import Communicate from './components/communicate';
import Console from './components/console-log';
import HeaderTabs from './components/header-tabs';
import MicroAppEnv from './components/micro-app-env';
import Route from './components/route-match';
import ViewApp from './components/view-app';
import { HEADER_TAB_LIST } from './config';
import { DevToolsInfo, DevToolsMicroAppInfo } from './types';

import styles from './index.module.less';

interface DevToolsPageProps { }

interface DevToolsPageState {
  activeTab: string;
  info: DevToolsInfo;
}

class DevToolsPage extends React.PureComponent<DevToolsPageProps, DevToolsPageState> {
  public state = {
    activeTab: HEADER_TAB_LIST[0].name,
    info: {},
  };

  private updateInfo() {
    chrome.devtools.inspectedWindow.eval(
      `JSON.stringify(function (){
        const thisWindow = window.__MICRO_APP_PROXY_WINDOW__ || window;
        const allKey = JSON.stringify(Object.keys(thisWindow));
        let microAppInfo = {};
        for (let el of JSON.parse(allKey)){
          if (el.indexOf('__MICRO_APP') > -1){
            microAppInfo[el] = thisWindow[el];
          }
        }
        return microAppInfo;
      }())`,
      (res: string) => {
        const env = decodeJSON<DevToolsMicroAppInfo['env']>(res);
        if (env) {
          this.setState({ info: { currentMicroApp: { env } } });
        }
      },
    );
  }

  private updateColorTheme() {
    if (chrome.devtools.panels.themeName === 'dark') {
      window.document.documentElement.style.setProperty('--color-border-primary', '#494c50');
      window.document.documentElement.style.setProperty('--color-text-primary', '#ffffff');
      window.document.documentElement.style.setProperty('--color-text-secondary', '#9aa0a6');
      window.document.documentElement.style.setProperty('--color-background-primary', '#242424');
      window.document.documentElement.style.setProperty('--color-background-primary-active', '#000000');
      window.document.documentElement.style.setProperty('--color-background-primary-hover', '#35363a');
    } else {
      window.document.documentElement.style.setProperty('--color-border-primary', '#cacdd1');
      window.document.documentElement.style.setProperty('--color-text-primary', '#000000');
      window.document.documentElement.style.setProperty('--color-text-secondary', '#5f6368');
      window.document.documentElement.style.setProperty('--color-background-primary', '#f1f3f4');
      window.document.documentElement.style.setProperty('--color-background-primary-active', '#ffffff');
      window.document.documentElement.style.setProperty('--color-background-primary-hover', '#dee1e6');
    }
  }

  public componentDidMount(): void {
    this.updateColorTheme();
    this.updateInfo();
  }

  public componentDidUpdate(): void {
    this.updateColorTheme();
    this.updateInfo();
  }

  /*
   * According to tab Switch content
   *
   */
  private renderContent() {
    switch (this.state.activeTab) {
      case 'ENV_VALUE_VIEWER':
        return <MicroAppEnv info={this.state.info} />;
      case 'COMMUNICATE':
        return <Communicate />;
      case 'VIEW_APP':
        return <ViewApp />;
      case 'ROUTE_MATCH':
        return <Route info={this.state.info} />;
      case 'CONSOLE':
        return <Console />;
      default:
        return null;
    }
  }

  public render() {
    return (
      <div className={styles.container}>
        <HeaderTabs value={this.state.activeTab} onChange={(value) => { this.setState({ activeTab: value }); }} />
        { this.renderContent() }
      </div>
    );
  }
}

export default DevToolsPage;
