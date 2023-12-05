import { DownOutlined } from '@ant-design/icons';
import { Alert, Space, Tree } from 'antd';
import React, { useEffect } from 'react';

import { DevToolsInfo, MicroAppsInfos } from '../../types';

import styles from './index.module.less';

interface RouteProps {
  info: DevToolsInfo;
}

const Route: React.FC<RouteProps> = (props) => {
  const [baseURI, setBaseURI] = React.useState('');
  const [microAppsInfo, setMicroAppsInfo] = React.useState<MicroAppsInfos[]>();
  const [treeData, setTreeData] = React.useState([
    {
      title: `${baseURI}`,
      key: '0',
      children: microAppsInfo,
    },
  ]);

  /**
   * click get parent app data
   */
  const getBaseURI = () => {
    chrome.devtools.inspectedWindow.eval(
      'document.querySelectorAll("micro-app")[0].baseURI',
      (res: string) => {
        if (res) {
          setBaseURI(res);
        }
      },
    );
  };

  const getMicroApps = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        const tabId = tabs[0].id;
        chrome.tabs.executeScript(tabId, { file: 'content.js' }, () => {
          chrome.tabs.sendMessage(
            tabId,
            { action: 'devtoolsMicroApp' },
            (response) => {
              const data = JSON.parse(response);
              const base = data.title;
              setBaseURI(base);
              const dataTree = data.children;
              setMicroAppsInfo(dataTree);
              getBaseURI();
              setTreeData([
                {
                  title: `baseURI: ${base}`,
                  key: '0',
                  children: dataTree,
                },
              ]);
            },
          );
        });
      } else {
        console.error('id error。');
      }
    });
  };

  const onSelect = (keys: unknown, info: { node: { title: string | URL | undefined } }) => {
    window.open(info.node.title);
  };

  useEffect(() => {
    getBaseURI();
    getMicroApps();
  },
  []);

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
          switcherIcon={<DownOutlined rev={null} />}
          defaultExpandedKeys={['0-0-0']}
          treeData={treeData}
          onSelect={onSelect}
        />
        <button
          className={styles.btn}
          type="button"
          onClick={() => {
            chrome.devtools.inspectedWindow.reload({
              ignoreCache: true,
              injectedScript: 'alert(刷新路由请切换devtool重新进入路由tab);',
            });
            getBaseURI();
            getMicroApps();
          }}
        >
          刷新
        </button>
      </div>
    </div>
  );
};

export default Route;
