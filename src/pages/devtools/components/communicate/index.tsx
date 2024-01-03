/* eslint-disable no-console */
import { CopyOutlined, DeleteOutlined, LinkOutlined, RedoOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Checkbox,
  Col,
  ColorPicker,
  Descriptions,
  Empty,
  Form,
  Input,
  message,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tree,
  Typography,
} from 'antd';
import React from 'react';
import {
  CopyToClipboard,
} from 'react-copy-to-clipboard';
import ReactJson from 'react-json-view';

import { FinalTreeData, getMicroAppLevel } from '@/utils/chrome';

const { Text, Link } = Typography;
const { Option } = Select;

interface CommunicateProps { }
interface KeyValueData {
  id: number;
  key: string;
  value: string;
  valueType: 'string' | 'number' | 'boolean';
  checked: boolean;
}

interface CommunicateState {
  info: { [key: string]: string | number };
  currentTab: string;
  showKVType: boolean;
  dataSource: KeyValueData[];
  jsonInputError: boolean;
  treeData: (FinalTreeData & {
    key: string;
    title: string;
  })[];
  canDispatchData: unknown[];
  selectDispatchAppName: string;
  selectInfo: FinalTreeData | null;
  lighting: {
    [name: string]: {
      checked: boolean;
      color: string;
    };
  };
  init: boolean;
}

type AllAppInfoData = {
  name: string;
  info: FinalTreeData;
};

class CommunicatePage extends React.PureComponent<CommunicateProps, CommunicateState> {
  public state: CommunicateState = {
    info: {},
    currentTab: 'getMainToSubData', // 'getMainToSubData',
    showKVType: true,
    dataSource: [{
      id: this.randomId(),
      checked: true,
      key: '',
      value: '',
      valueType: 'string',
    }],
    jsonInputError: false, // 手动输入的json格式错误
    treeData: [],
    selectInfo: null, // 选择的子应用信息
    canDispatchData: [],
    selectDispatchAppName: '',
    lighting: {},
    init: true,
  };

  public componentDidMount() {
    this.getTree();
  }

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
        info: {},
        init: false,
      }, () => {
        this.getCanDispatchData();
      });
      const allAppInfo = this.getAllAppInfo(treeData);
      if (selectInfo) {
        let inAppInfo = false;
        for (const el of allAppInfo) {
          if (el.name === selectInfo.name) {
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
      if (['getMainToSubData', 'getSubToMainData'].includes(this.state.currentTab)) {
        this.getData();
      }
      return null;
    }).catch((error: unknown) => {
      console.error('err', error);
    });
  };

  private getData = () => {
    const {
      currentTab,
      selectInfo,
    } = this.state;
    let evalLabel = '';
    let domName = selectInfo?.tagName || 'micro-app';
    const appName = selectInfo?.name || '';
    if (appName) {
      domName += `[name='${appName}']`;
    }
    evalLabel = currentTab === 'getSubToMainData'
      ? `JSON.stringify(function () {
        if (!document.querySelector("${domName}").getSendData){
          document.querySelector("${domName}").addEventListener('datachange', function (e) {
              document.querySelector("${domName}").getSendData = e.detail.data;
              document.querySelector("${domName}").onDataChange;
          })
        }
        return document.querySelector("${domName}").getSendData;
    }())`
      : `JSON.stringify(document.querySelector("${domName}").data)`;
    chrome.devtools.inspectedWindow.eval(
      evalLabel,
      (res: string) => {
        if (res && res !== 'null') {
          this.setState({
            info: JSON.parse(res),
          });
        } else {
          this.setState({
            info: {},
          });
        }
      },
    );
  };

  private getDataDOM = () => {
    const {
      info,
    } = this.state;
    return (
      <div>
        <Space>
          <Button size="small" type="primary" icon={<LinkOutlined rev={null} />} onClick={this.getData}>重新获取</Button>
          <CopyToClipboard
            text={JSON.stringify(info)}
          >
            <Button size="small" icon={<CopyOutlined rev={null} />}>复制</Button>
          </CopyToClipboard>
        </Space>
        <ReactJson
          style={{ overflowY: 'scroll', overflowX: 'hidden', height: 200, marginTop: 10, border: 'solid 1px #000' }}
          src={info}
          name={false}
        />
      </div>
    );
  };

  private randomId(): number {
    return Math.floor(Math.random() * 10000);
  }

  private changeTextAreaData = (value: string): void => {
    try {
      const newValue = JSON.parse(value || '{}');
      const newDataSource: KeyValueData[] = [];
      for (const key of Object.keys(newValue)) {
        const newDataValue = newValue[key];
        let valueType: 'string' | 'number' | 'boolean' = 'string';// TODO 动态判断数据类型
        if (typeof newDataValue === 'number') {
          valueType = 'number';
        } else if (typeof newDataValue === 'boolean') {
          valueType = 'boolean';
        }
        newDataSource.push({
          id: this.randomId(),
          checked: true,
          key,
          value: String(newDataValue),
          valueType,
        });
      }
      newDataSource.push({
        id: this.randomId(),
        checked: true,
        key: '',
        value: '',
        valueType: 'string',
      });
      this.setState({
        dataSource: newDataSource,
        jsonInputError: false,
      });
    } catch {
      this.setState({
        jsonInputError: true,
      });
    }
  };

  private formatData = (dataSource: KeyValueData[]): {
    [key: string]: string | number | boolean;
  } => {
    const data = {};
    for (const el of dataSource) {
      if (el.checked && el.key !== '' && el.value !== '') {
        switch (el.valueType) {
          case 'string':
            data[el.key] = String(el.value);
            break;
          case 'number':
            data[el.key] = Number.parseFloat(el.value);
            break;
          case 'boolean':
            data[el.key] = Boolean(el.value);
            break;
          default:
            data[el.key] = el.value;
        }
      }
    }
    return data;
  };

  private getCanDispatchData = () => {
    const {
      selectInfo,
    } = this.state;
    const evalLabel = `JSON.stringify(function (){
      const rawWindow = window.__MICRO_APP_PROXY_WINDOW__?.rawWindow || [];
      if (rawWindow.length == 0){
          result = [window.__MICRO_APP_PROXY_WINDOW__?.microApp?.appName];
      } else {
          let result = [];
          for (var i = 0; i < rawWindow.length; i++){
              const oneWindow = rawWindow[i];
              result.push(oneWindow.microApp.appName);
          }
      }
      return result;
  }())`;
    chrome.devtools.inspectedWindow.eval(
      evalLabel,
      (res: string) => {
        const canDispatchData = JSON.parse(res);
        let selectDispatchAppName = '';
        if (canDispatchData.length > 0) {
          selectDispatchAppName = canDispatchData[0];
          if (selectInfo && canDispatchData.includes(selectInfo.name)) {
            selectDispatchAppName = selectInfo.name;
          }
        }
        this.setState({
          canDispatchData,
          selectDispatchAppName,
        });
      },
    );
  };

  private sendDataDOM = () => {
    const {
      showKVType,
      jsonInputError,
      dataSource,
    } = this.state;
    const data = this.formatData(dataSource);
    let validateStatus: '' | 'error' = '';
    if (!showKVType && jsonInputError) {
      validateStatus = 'error';
    }
    return (
      <Form
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 14 }}
      >
        <Form.Item
          label={(
            <Space>
              <span>设置传递数据</span>
              <Switch unCheckedChildren="JSON" checkedChildren="KV" checked={showKVType} onChange={e => this.setState({ showKVType: e })} />
            </Space>
          )}
          validateStatus={validateStatus}
          help={jsonInputError ? '请输入标准JSON格式数据' : ''}
        >
          { showKVType
            ? (
              <Table
                columns={[{
                  dataIndex: 'checked',
                  render: (text, record) => (
                    <Checkbox
                      checked={record.checked}
                      onChange={e => this.changeData({
                        type: 'checked',
                        value: e.target.checked,
                        record,
                      })}
                    />
                  ),
                }, {
                  title: 'Key',
                  dataIndex: 'key',
                  render: (text, record) => (
                    <Input
                      size="small"
                      value={text || ''}
                      onChange={e => this.changeData({
                        type: 'key',
                        value: e.target.value,
                        record,
                      })}
                    />
                  ),
                }, {
                  title: 'Value',
                  dataIndex: 'value',
                  render: (text, record) => (
                    <Input
                      size="small"
                      value={text || ''}
                      onChange={e => this.changeData({
                        type: 'value',
                        value: e.target.value,
                        record,
                      })}
                    />
                  ),
                }, {
                  title: '数据类型',
                  dataIndex: 'valueType',
                  render: (text, record) => (
                    <Select
                      size="small"
                      value={record.valueType}
                      onChange={e => this.changeData({
                        type: 'valueType',
                        value: e,
                        record,
                      })}
                    >
                      <Option value="string">string</Option>
                      <Option value="number">number</Option>
                      <Option value="boolean">boolean</Option>
                    </Select>
                  ),
                }, {
                  title: '操作',
                  dataIndex: 'edit',
                  render: (text, record, index) => <Button size="small" type="link" disabled={dataSource.length <= 1 || index === dataSource.length - 1} icon={<DeleteOutlined rev={null} className="DeleteIcon" />} onClick={() => this.deleteOneData(record)} />,
                }]}
                dataSource={dataSource}
                size="small"
                pagination={false}
                rowKey="id"
              />
            )
            : (
              <Input.TextArea
                bordered
                defaultValue={JSON.stringify(data)}
                onChange={e => this.changeTextAreaData(e.target.value)}
              />
            ) }
        </Form.Item>
        { JSON.stringify(data) !== '{}' && (
          <Form.Item
            label="最终传参"
          >
            <Text copyable>{ JSON.stringify(data) }</Text>
          </Form.Item>
        ) }
        <div style={{ textAlign: 'center' }}>
          <Button type="primary" onClick={this.sendData} style={{ width: 100 }} disabled={JSON.stringify(data) === '{}'}>发送</Button>
        </div>
      </Form>
    );
  };

  private deleteOneData = (e: KeyValueData): void => {
    this.setState(prevState => ({
      dataSource: prevState.dataSource.filter(el => el.id !== e.id),
    }));
  };

  private changeData = (e: {
    type: 'key' | 'value' | 'checked' | 'valueType';
    value: string | number | boolean;
    record: KeyValueData;
  }): void => {
    this.setState(prevState => ({
      dataSource: prevState.dataSource.map((el) => {
        if (el.id === e.record.id) {
          return {
            ...el,
            [e.type]: e.type === 'checked' ? !!e.value : e.value,
          };
        }
        return el;
      }),
    }), () => {
      const lastRecord = this.state.dataSource[this.state.dataSource.length - 1];
      if (e.record.id === lastRecord.id && (lastRecord.key || lastRecord.value)) {
        this.setState(prevState => ({
          dataSource: [
            ...prevState.dataSource,
            {
              id: this.randomId(),
              checked: true,
              key: '',
              value: '',
              valueType: 'string',
            },
          ],
        }));
      }
    });
  };

  private sendData = () => {
    const {
      currentTab,
      dataSource,
      selectInfo,
      canDispatchData,
      selectDispatchAppName,
    } = this.state;
    const data = this.formatData(dataSource);
    const appName = selectInfo?.name || '';
    let evalLabel = '';
    if (currentTab === 'sendDataFromSubToMain') {
      evalLabel = canDispatchData.length <= 1
        ? `window.__MICRO_APP_PROXY_WINDOW__.microApp.dispatch(${JSON.stringify(data)})`
        : `JSON.stringify(function (){
            const rawWindow = window.__MICRO_APP_PROXY_WINDOW__?.rawWindow || [];
            for (var i = 0; i < rawWindow.length; i++){
                const oneWindow = rawWindow[i];
                if (oneWindow.microApp.appName === "${selectDispatchAppName}"){
                    oneWindow.microApp.dispatch(${JSON.stringify(data)});
                    break;
                }
            }
        }())`;
    } else {
      let domName = selectInfo?.tagName || 'micro-app';
      if (appName) {
        domName += `[name='${appName}']`;
      }
      evalLabel = `document.querySelector("${domName}").data = ${JSON.stringify(data)}`;
    }
    chrome.devtools.inspectedWindow.eval(
      evalLabel,
      () => {
        message.success('发送成功');
      },
    );
  };

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

  private selectTree = (selectedKeys: (string | number)[], info: { event: 'select'; selected: boolean; node: unknown; selectedNodes: unknown[]; nativeEvent: MouseEvent }) => {
    const {
      currentTab,
    } = this.state;
    if (selectedKeys.length > 0) {
      this.setState({
        selectInfo: info.node as FinalTreeData,
      }, () => {
        if (['getMainToSubData', 'getSubToMainData'].includes(currentTab)) {
          this.getData();
        }
      });
    }
  };

  private changeLighting = (checked: boolean) => {
    const {
      selectInfo,
    } = this.state;
    if (selectInfo) {
      this.setState(prevState => ({
        lighting: {
          ...prevState.lighting,
          [selectInfo.name]: {
            ...prevState.lighting[selectInfo.name],
            checked,
          },
        },
      }), () => {
        this.doLighting();
      });
    }
  };

  private changeColor = (color: unknown, hex: string) => {
    const {
      selectInfo,
    } = this.state;
    console.log('修改颜色', color, hex);
    if (selectInfo) {
      this.setState(prevState => ({
        lighting: {
          ...prevState.lighting,
          [selectInfo.name]: {
            ...prevState.lighting[selectInfo.name],
            color: hex,
          },
        },
      }), () => {
        this.doLighting();
      });
    }
  };

  private doLighting = () => {
    const {
      lighting,
      selectInfo,
    } = this.state;
    if (selectInfo) {
      const color = lighting[selectInfo.name].color || '#E2231A';
      const evalLabel = `JSON.stringify(function(){
        if (!window.originalStyles){
          window.originalStyles = new Map();
          window.setLightingStyle = [];
        }
        var appDOM = document.getElementsByName('${selectInfo.name}')[0];
        if (${lighting[selectInfo.name].checked}) {
            const originalStyle = appDOM.getAttribute('style');
            if (window.setLightingStyle.indexOf('${selectInfo.name}') == -1 && !window.originalStyles.get('${selectInfo.name}')){
              window.setLightingStyle.push('${selectInfo.name}');
              window.originalStyles.set('${selectInfo.name}', originalStyle);
            }
            appDOM.style.border = '2px dashed ${color}';
            appDOM.style.display = 'block';
            appDOM.style.transformOrigin = 'center';
            appDOM.style.transform = 'rotate(360deg)';
        } else {
            const originalStyle = window.originalStyles.get('${selectInfo.name}');
            if (originalStyle) {
                appDOM.setAttribute('style', originalStyle);
            } else {
                appDOM.removeAttribute('style');
            }
        }
    }())`;
      console.log('evalLabel', evalLabel);
      chrome.devtools.inspectedWindow.eval(
        evalLabel,
      );
    }
  };

  public render() {
    const {
      currentTab,
      treeData,
      selectInfo,
      canDispatchData,
      lighting,
      init,
    } = this.state;
    if (!init && treeData.length === 0) {
      return (
        <Card>
          <Empty description={(
            <Space direction="vertical">
              <div>未发现MicroApp微应用</div>
              <Button type="primary" onClick={this.getTree} size="small">重新读取</Button>
            </Space>
          )}
          />
        </Card>
      );
    }
    const tabItems: {
      key: string;
      label: string;
      children?: JSX.Element;
    }[] = [{
      key: 'getMainToSubData',
      label: '获取父应用传递给此子应用的数据',
      children: this.getDataDOM(),
    }, {
      key: 'getSubToMainData',
      label: '获取此子应用传递给父应用的数据',
      children: this.getDataDOM(),
    }, {
      key: 'sendDataFromMainToSub',
      label: '模拟父应用向此子应用发送数据',
      children: this.sendDataDOM(),
    }];
    if (canDispatchData.length > 0 && selectInfo && selectInfo.name && canDispatchData.includes(selectInfo.name)) {
      tabItems.push({
        key: 'sendDataFromSubToMain',
        label: '模拟此子应用向父应用发送数据',
        children: this.sendDataDOM(),
      });
    }
    tabItems.push({
      key: 'openSimulation',
      label: '此子应用开发环境模拟',
    });
    let href: string = '';
    if (selectInfo) {
      href = selectInfo.url as string;
      if (!(/^https?:\/\//u).test(href)) {
        href = `http://${href}`;
      }
    }
    return (
      <div style={{ padding: 10 }}>
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
          { selectInfo && (
            <Col span={20}>
              <Card style={{ marginBottom: 10 }} size="small" title="应用信息" extra={<Button type="link" icon={<RedoOutlined rev={null} />} onClick={this.getTree} />}>
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
                      };
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
                      }, () => {
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
          ) }
        </Row>
      </div>
    );
  }
}

export default CommunicatePage;
