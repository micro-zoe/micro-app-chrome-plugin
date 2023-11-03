import React from 'react';

import Communicate from './components/communicate';
import Console from './components/console-log';
import HeaderTabs from './components/header-tabs';
import MicroAppEnv from './components/micro-app-env';
import Route from './components/route-match';
import { HEADER_TAB_LIST } from './config';
import { DevToolsInfo } from './types';

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
        return <Console info={this.state.info} />;
      default:
        return null;
    }
  }

  public render() {
    return (
      <div className={styles.container}>
        <HeaderTabs value={this.state.activeTab} onChange={(value) => { this.setState({ activeTab: value }); }} />
        {this.renderContent()}
      </div>
    );
  }
}

export default DevToolsPage;
