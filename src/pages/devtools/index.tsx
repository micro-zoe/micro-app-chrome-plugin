import React from 'react';
import styles from './index.module.less';
import { CopyOutlined, DeleteOutlined, LinkOutlined, RedoOutlined } from '@ant-design/icons';
import {
    Button,
    Card,
    Checkbox,
    Col,
    ColorPicker,
    Descriptions,
    Dropdown,
    Empty,
    Form,
    Input,
    message,
    Popover,
    Row,
    Select,
    Space,
    Switch,
    Table,
    Tabs,
    Tree,
    Typography,
} from 'antd';
import moment from 'moment';
import Communicate from './components/communicate';
import Console from './components/console';
import Environment from './components/environment';
import Route from './components/route';

import { FinalTreeData, getMicroAppLevel } from '@/utils/chrome';

const { Text, Link } = Typography;
const { Option } = Select;

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
    * 是否首次初始化
    */
    init: boolean;
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
        init: true,
        activeKey: 'environment'
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
                // info: {},
                init: false,
            }, () => {
                // this.getCanDispatchData();
            });
            const allAppInfo = this.getAllAppInfo(treeData);
            if (selectInfo) {
                let inAppInfo = false;
                for (const el of allAppInfo) {
                    if (el.name === selectInfo.name) {
                        inAppInfo = true;
                        this.setState({
                            selectInfo: el.info,
                        }, () => {
                            //   this.loadHistory();
                        });
                        break;
                    }
                }
                if (!inAppInfo && allAppInfo.length > 0) {
                    this.setState({
                        selectInfo: allAppInfo[0].info,
                    }, () => {
                        // this.loadHistory();
                    });
                }
            } else if (allAppInfo.length > 0) {
                this.setState({
                    selectInfo: allAppInfo[0].info,
                }, () => {
                    //   this.loadHistory();
                });
            }
            //   if (['getMainToSubData', 'getSubToMainData'].includes(this.state.currentTab)) {
            //     this.getData();
            //   }
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
        // const {
        //   currentTab,
        // } = this.state;
        if (selectedKeys.length > 0) {
            this.setState({
                selectInfo: info.node as FinalTreeData,
            }, () => {
                // this.loadHistory();
                // if (['getMainToSubData', 'getSubToMainData'].includes(currentTab)) {
                //   this.getData();
                // }
            });
        }
    };

    private changeTab = e => {
        // console.log('changeTab', e);
        this.setState({
            activeKey: e
        })
    }

    public render() {
        const {
            treeData,
            selectInfo,
            activeKey
        } = this.state;
        return (<div className={styles.container}>
            <Row gutter={10} style={{ display: 'flex', alignItems: 'stretch' }}>
                <Col span={4} style={{ flex: 1 }}>
                    <Card style={{ height: '100%' }} size="small" title="选择子应用" extra={<Button type="link" icon={<RedoOutlined rev={null} />} onClick={this.getTree} />}>
                        <Tree
                            defaultExpandAll
                            autoExpandParent
                            treeData={treeData}
                            onSelect={this.selectTree}
                            selectedKeys={selectInfo ? [selectInfo.name] : []}
                        />
                    </Card>
                </Col>
                <Col span={20}>
                    <Card size='small' bodyStyle={{ paddingTop: 0, paddingBottom: 0 }}>
                        <Tabs
                            tabBarStyle={{ marginBottom: 0 }}
                            items={[{
                                key: 'environment',
                                label: '全局环境变量'
                            }, {
                                key: 'communicate',
                                label: '数据通信'
                            }, {
                                key: 'route',
                                label: '路由信息'
                            }, {
                                key: 'console',
                                label: '子应用控制台'
                            }]}
                            activeKey={activeKey}
                            size='small'
                            onChange={this.changeTab}
                        />
                    </Card>
                    <Card size='small' style={{ marginTop: 10 }}>
                        {activeKey === 'environment' && <Environment />}
                        {activeKey === 'communicate' && <Communicate selectInfo={selectInfo} />}
                        {activeKey === 'route' && <Route selectInfo={selectInfo} />}
                        {activeKey === 'console' && <Console />}
                    </Card>
                </Col>
                {/* { selectInfo && (
            <Col span={20}>
              <Card style={{ marginBottom: 10 }} size="small" title="应用信息" extra={<Button type="link" icon={<RedoOutlined rev={null} />} onClick={this.reloadApp}>重新加载</Button>}>
                <Descriptions size="small">
                  <Descriptions.Item label="name">{ selectInfo.name }</Descriptions.Item>
                  <Descriptions.Item label="url"><Link copyable href={href} target="_blank">{ selectInfo.url }</Link></Descriptions.Item>
                  { selectInfo.baseroute && <Descriptions.Item label="baseroute">{ selectInfo.baseroute }</Descriptions.Item> }
                  { selectInfo.fullPath && <Descriptions.Item label="子路由">{ selectInfo.fullPath }</Descriptions.Item> }
                  <Descriptions.Item label="高亮范围">
                    <Space>
                      <ColorPicker value={lighting[selectInfo.name] ? lighting[selectInfo.name].color : '#E2231A'} size="small" onChange={this.changeColor} />
                      <Switch checked={lighting[selectInfo.name] ? lighting[selectInfo.name].checked : false} onChange={this.changeLighting} />
                    </Space>
                  </Descriptions.Item>
                  { !(/^0\./u).test(selectInfo.version as string) && <Descriptions.Item label="iframe模式">{ selectInfo.iframe as string || 'false' }</Descriptions.Item> }
                  <Descriptions.Item label="MicroApp版本">{ selectInfo.version }</Descriptions.Item>
                </Descriptions>
              </Card>
              <Card size="small">
                <Tabs
                  size="small"
                  items={tabItems}
                  activeKey={currentTab}
                  onChange={(activityTab) => {
                    if (activityTab === 'openSimulation') {
                      const url = (selectInfo.url as string).replace(/^(https?:)?\/\//u, '');
                      let prefix = '';
                      prefix = !(/^https?:\/\//u).test(selectInfo.url as string) ? 'http:' : new URL(selectInfo.url as string).protocol;
                      const params = {
                        url,
                        prefix: `${prefix}//`,
                        data: JSON.stringify([]),
                        ver: '1.0',
                      };
                      if (selectInfo.version && selectInfo.version.startsWith('0')) {
                        params.ver = '0.8';
                      }
                      chrome.tabs.create({
                        url: `simulation.html?${encodeURIComponent(JSON.stringify(params))}`,
                      });
                    } else {
                      this.setState({
                        info: {},
                        currentTab: activityTab,
                        dataSource: [{
                          id: this.randomId(),
                          checked: true,
                          key: '',
                          value: '',
                          valueType: 'string',
                        }],
                        history: [],
                      }, () => {
                        this.loadHistory();
                        if (activityTab === 'sendDataFromSubToMain') {
                          this.getCanDispatchData();
                        }
                        if (['getMainToSubData', 'getSubToMainData'].includes(activityTab)) {
                          this.getData();
                        }
                      });
                    }
                  }}
                />
              </Card>
            </Col>
          ) } */}
            </Row>
        </div>);
    }
}

export default DevToolsPage;
