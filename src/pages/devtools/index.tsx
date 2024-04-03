/* eslint-disable no-console */
/* eslint-disable etc/no-commented-out-code */
import { RedoOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Row,
  Tabs,
  Tree,
} from 'antd';
import React from 'react';

import { FinalTreeData, getMicroAppLevel } from '@/utils/chrome';

import Communicate from './components/communicate';
import Console from './components/console';
import Environment from './components/environment';
import Route from './components/route';

import styles from './index.module.less';

interface DevToolsPageProps { }

interface DevToolsPageState {
  treeData: (FinalTreeData & {
    key: string;
    title: string;
  })[];
  /**
   * 树形结构选择的微应用信息
   */
  selectInfo: FinalTreeData | null;
  /**
   * 当前选择的功能页签
   */
  activeKey: string;
}

/**
 * 平铺展示所有微应用，做数据处理用
 */
type AllAppInfoData = {
  name: string;
  info: FinalTreeData;
};

class DevToolsPage extends React.PureComponent<DevToolsPageProps, DevToolsPageState> {
  public state = {
    treeData: [],
    selectInfo: null,
    activeKey: 'environment',
  };

  public componentDidMount(): void {
    this.getTree();
  }

  /**
   * 获取页面微应用结构
   */
  private getTree = () => {
    const {
      selectInfo,
    } = this.state;
    getMicroAppLevel({
      key: 'name',
      title: 'name',
      url: 'url',
      iframe: 'iframe',
      version: 'version',
      href: 'href',
      fullPath: 'fullPath',
      baseroute: 'baseroute',
      tagName: 'tagName',
    }).then((treeData) => {
      console.log('microAppLevel返回', treeData);
      this.setState({
        treeData: treeData as (FinalTreeData & {
          key: string;
          title: string;
        })[],
      });
      const allAppInfo = this.getAllAppInfo(treeData);
      if (selectInfo) {
        let inAppInfo = false;
        for (const el of allAppInfo) {
          if (el.name === (selectInfo as FinalTreeData).name) {
            inAppInfo = true;
            this.setState({
              selectInfo: el.info,
            });
            break;
          }
        }
        if (!inAppInfo && allAppInfo.length > 0) {
          this.setState({
            selectInfo: allAppInfo[0].info,
          });
        }
      } else if (allAppInfo.length > 0) {
        this.setState({
          selectInfo: allAppInfo[0].info,
        });
      }
      return null;
    }).catch((error: unknown) => {
      console.error('err', error);
    });
  };

  /**
   * 平铺递归处理微应用树形结构数据
   * @param data 树形数据
   * @returns 平铺后的数据
   */
  private getAllAppInfo = (data: FinalTreeData[]): AllAppInfoData[] => {
    let result: AllAppInfoData[] = [];
    for (const el of data) {
      result.push({
        name: el.name,
        info: el,
      });
      if ((el.children as FinalTreeData[]).length > 0) {
        const subResult = this.getAllAppInfo(el.children as FinalTreeData[]);
        result = [...result, ...subResult];
      }
    }
    return result;
  };

  /**
   * 选择应用
   * @param selectedKeys 已选择的key
   * @param info 选择的数据
   */
  private selectTree = (selectedKeys: (string | number)[], info: { event: 'select'; selected: boolean; node: unknown; selectedNodes: unknown[]; nativeEvent: MouseEvent }) => {
    if (selectedKeys.length > 0) {
      this.setState({
        selectInfo: info.node as FinalTreeData,
      });
    }
  };

  private changeTab = (e) => {
    this.setState({
      activeKey: e,
    });
  };

  public render() {
    const {
      treeData,
      selectInfo,
      activeKey,
    } = this.state;
    return (
      <div className={styles.container}>
        <Row gutter={10} style={{ display: 'flex', alignItems: 'stretch' }}>
          <Col span={4} style={{ flex: 1 }}>
            <Card style={{ height: '100%' }} size="small" title="选择子应用" extra={<Button type="link" icon={<RedoOutlined rev={null} />} onClick={this.getTree} />}>
              <Tree
                defaultExpandAll
                autoExpandParent
                treeData={treeData}
                onSelect={this.selectTree}
                selectedKeys={selectInfo ? [(selectInfo as FinalTreeData).name] : []}
              />
            </Card>
          </Col>
          <Col span={20}>
            <Card size="small" bodyStyle={{ paddingTop: 0, paddingBottom: 0 }}>
              <Tabs
                tabBarStyle={{ marginBottom: 0 }}
                items={[{
                  key: 'environment',
                  label: '全局环境变量',
                }, {
                  key: 'communicate',
                  label: '数据通信',
                }, {
                  key: 'route',
                  label: '路由信息',
                }]}
                activeKey={activeKey}
                size="small"
                onChange={this.changeTab}
              />
            </Card>
            <Card size="small" style={{ marginTop: 10 }}>
              { activeKey === 'environment' && <Environment /> }
              { activeKey === 'communicate' && <Communicate selectInfo={selectInfo} /> }
              { activeKey === 'route' && <Route selectInfo={selectInfo} /> }
              { activeKey === 'console' && <Console /> }
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}

export default DevToolsPage;
