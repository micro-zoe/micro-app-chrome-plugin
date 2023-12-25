import React, { useEffect } from 'react';

import { MICRO_APP_ENV_INFO } from '../../config';
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
  if (!props.info.currentMicroApp?.env) {
    return null;
  }

  const showDetailIcon = (link: string) => (
    <a href={link || 'https://micro-zoe.github.io/micro-app/docs.html#/zh-cn/env'} className={styles.detailIcon} target="blank">
      <svg viewBox="64 64 896 896" focusable="false" data-icon="info-circle" width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" />
        <path d="M464 336a48 48 0 1096 0 48 48 0 10-96 0zm72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z" />
      </svg>
    </a>
  );

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Value</th>
            <th>Describe</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div>__MICRO_APP_VERSION__</div>
            </td>
            <td>{ JSON.stringify(devInfo) }</td>
            <td>微前端版本号</td>
          </tr>
          { Object.keys(props.info.currentMicroApp?.env).map(p => (
            <tr key={p}>
              <td width="20%">
                <div>
                  { p }
                  { showDetailIcon(MICRO_APP_ENV_INFO[p]?.url) }
                </div>
              </td>
              <td>{ JSON.stringify(props.info.currentMicroApp?.env[p]) || 'undefined' }</td>
              <td width="30%">{ MICRO_APP_ENV_INFO[p]?.describe }</td>
            </tr>
          )) }
        </tbody>
      </table>
      <div />
    </div>
  );
};

export default MicroAppEnv;
