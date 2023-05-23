import React from 'react';

import { DevToolsInfo } from '../../types';

import styles from './index.module.less';

interface RouteProps {
  info: DevToolsInfo;
}

const Route: React.FC<RouteProps> = props => (
  <div className={styles.container}>
    <h1>敬请期待~</h1>
  </div>
);

export default Route;
