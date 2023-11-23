import React from 'react';

import { decodeJSON } from '@/utils/json';

import Communicate from './components/communicate';
import Console from './components/console-log';
import HeaderTabs from './components/header-tabs';
import MicroAppEnv from './components/micro-app-env';
import Route from './components/route-match';
import { HEADER_TAB_LIST, MICRO_APP_ENV_LIST } from './config';
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
    const res = MICRO_APP_ENV_LIST.map(p => `[${JSON.stringify(p.name)}]: ${chrome.tabs.executeScript({ code: `${p.eval}` })}`).join(',');
    const env = decodeJSON<DevToolsMicroAppInfo['env']>(res);
    if (env) {
      this.setState({ info: { currentMicroApp: { env } } });
    }
  }

  public componentDidMount(): void {
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
