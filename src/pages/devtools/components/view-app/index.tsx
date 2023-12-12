/* eslint-disable @typescript-eslint/no-explicit-any */
import { RedoOutlined } from '@ant-design/icons';
import { Button, Card, Space, Tree, Typography } from 'antd';
import React from 'react';

import { getMicroAppLevel } from '@/utils/chrome';

const { Text, Link } = Typography;

interface ViewAppProps { }
interface ViewAppState {
  treeData: any[];
  isLighting: string[];
}
class ViewAppPage extends React.PureComponent<ViewAppProps, ViewAppState> {
  public state: ViewAppState = {
    treeData: [],
    isLighting: [],
  };

  componentDidMount() {
    this.getAppTreeData();
  }

  private getAppTreeData = () => {
    getMicroAppLevel({
      key: 'name',
      title: 'name',
      url: 'url',
      selectable: false,
    }).then((res) => {
      console.log('getMicroAppLevel', res);
      this.setState({
        treeData: [{
          name: '主应用',
          type: 'main',
          children: res || [],
        }],
      });
    });
  };

  public onOpen = (name: string) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        const tabId = tabs[0].id;
        chrome.tabs.executeScript(tabId, { file: 'content.js' }, () => {
          chrome.tabs.sendMessage(tabId, { action: `open${name}` });
        });
      } else {
        console.error('id error。');
      }
    });
  };

  public onClose = (name: string) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        const tabId = tabs[0].id;
        chrome.tabs.executeScript(tabId, { file: 'content.js' }, () => {
          chrome.tabs.sendMessage(tabId, { action: `close${name}` });
        });
      } else {
        console.error('id error。');
      }
    });
  };

  private lighting = (name: string) => {
    if (!this.state.isLighting.includes(name)) {
      this.setState({
        isLighting: [...this.state.isLighting, name],
      });
      this.onOpen(name);
    } else {
      this.setState({
        isLighting: this.state.isLighting.filter(el => el != name),
      });
      this.onClose(name);
    }
  };

  public render() {
    const {
      treeData,
      isLighting,
    } = this.state;
    return (
      <Card>
        <Tree
          showLine
          defaultExpandAll
          autoExpandParent
          treeData={treeData}
          titleRender={(nodeData) => {
            const {
              type,
              name,
              url,
            } = nodeData;
            const isMainApp = type && type === 'main';
            const lighting = isLighting.includes(name);
            return (
              <Space>
                <Text copyable={!isMainApp} strong>{name}</Text>
                {isMainApp && <Button type="link" size="small" icon={<RedoOutlined rev={null} />} onClick={this.getAppTreeData} />}
                {!isMainApp && (
                  <Button type={lighting ? 'primary' : 'default'} size="small" onClick={() => this.lighting(name)}>
                    {lighting ? '取消' : '高亮'}
                    标记
                  </Button>
                )}
                {url && <Link href={url} target="_blank">{url}</Link>}
              </Space>
            );
          }}
        />
      </Card>
    );
  }
}

export default ViewAppPage;
