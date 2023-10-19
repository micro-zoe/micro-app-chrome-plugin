import React, { useEffect } from 'react';

import { MICRO_APP_ENV_LIST } from '../../config';
import { DevToolsInfo } from '../../types';

import styles from './index.module.less';

interface MicroAppEnvProps {
  info: DevToolsInfo;
}

const MicroAppEnv: React.FC<MicroAppEnvProps> = (props) => {
  const [devInfo, setDevInfo] = React.useState({});
  useEffect(() => {
    chrome.devtools.inspectedWindow.eval(
      'document.querySelector("micro-app")?.version',
      (res: string) => {
        if (res) {
          setDevInfo(res);
        }
      },
    );
  }, []);

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <tr>
          <th>Name</th>
          <th>Value</th>
          <th>Describe</th>
        </tr>
        { MICRO_APP_ENV_LIST.map(p => (
          <tr>
            <td>
              <div>{ p.name }</div>
            </td>
            <td>
              <div
                style={{
                  width: '1200px',
                  overflow: 'hidden',
                }}
              >
                { p.name === '__MICRO_APP_VERSION__'
                  ? JSON.stringify(devInfo)
                  : JSON.stringify(props.info.currentMicroApp?.env?.[p.name]) || 'undefined' }
              </div>
            </td>
            <td>{ p.describe }</td>
          </tr>
        )) }
      </table>
      <div />
    </div>
  );
};

export default MicroAppEnv;
