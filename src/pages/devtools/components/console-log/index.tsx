import React from 'react';

import { DevToolsInfo } from '../../types';

import styles from './index.module.less';

interface ConsoleProps {
  info: DevToolsInfo;
}

const Console: React.FC<ConsoleProps> = props => (
  <div className={styles.container}>
    <h1>敬请期待~</h1>
  </div>
);

export default Console;
