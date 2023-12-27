/* eslint-disable unicorn/prefer-spread */
/* eslint-disable no-console */
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
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tree,
  Typography,
} from 'antd';
import React from 'react';
import {
  CopyToClipboard,
} from 'react-copy-to-clipboard';
import ReactJson from 'react-json-view';

import { FinalTreeData, getIframeAppLevel, getMicroAppLevel } from '@/utils/chrome';

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
  iframe: boolean;
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
    iframe: false, // 是否是iframe模式
  };

  public componentDidMount() {
    this.getTree();
  }

  private getTree = () => {
    const {
      selectInfo,
      currentTab,
      iframe,
    } = this.state;
    this.getAppLevel().then((treeData) => {
      console.log('getAppLevel返回', JSON.stringify(treeData));
      this.setState({
        treeData: treeData as (FinalTreeData & {
          key: string;
          title: string;
        })[],
        info: {},
        init: false,
      }, () => {
        if (currentTab === 'getMainToSubData' && iframe) {
          this.setState({
            currentTab: 'getSubToMainData',
          });
        }
        if (['getMainToSubData', 'getSubToMainData'].includes(currentTab)) {
          this.getData();
        }
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
      return null;
    }).catch((error: unknown) => {
      console.error('err', error);
    });
  };

  private getAppLevel = () => {
    const {
      iframe,
    } = this.state;
    if (iframe) {
      console.log('纯iframe模式', iframe);
      return getIframeAppLevel({
        title: 'id',
        key: 'id',
        url: 'src',
        name: 'id',
      });
    }
    return getMicroAppLevel({
      key: 'name',
      title: 'name',
      url: 'url',
      iframe: 'iframe',
      version: 'version',
      href: 'href',
      fullPath: 'fullPath',
      baseroute: 'baseroute',
    });
  };

  private getData = () => {
    const {
      currentTab,
      selectInfo,
      iframe,
      treeData,
    } = this.state;
    let evalLabel = '';
    let domName = 'micro-app';
    const appName = selectInfo?.name || '';
    if (iframe) {
      if (currentTab === 'getSubToMainData' && treeData) {
        const nameLevel = this.findHierarchyNames(treeData, appName) || [];
        evalLabel = nameLevel.length <= 1
          ? `JSON.stringify(function () {
            if (!document.body.getIframeSendData){
              window.addEventListener('message', event => {
              document.body.getIframeSendData = event.data;
            });
            }
            return document.body.getIframeSendData;
        }())`
          : `JSON.stringify(
            function () {
                function listenToIframeMessages(iframeIds) {
                    function attachMessageListener(windowRef, ids, index) {
                        if (index >= ids.length - 1) {
                            if (!document.body.getIframeSendData${appName}){
                              windowRef.addEventListener('message', (event) => {
                                document.body.getIframeSendData${appName} = event.data;
                              });
                            }
                        } else {
                            const nextIframe = windowRef.document.getElementById(ids[index]);
                            if (nextIframe && nextIframe.contentWindow) {
                                attachMessageListener(nextIframe.contentWindow, ids, index + 1);
                            }
                        }
                    }
                    attachMessageListener(window, iframeIds, 0);
                }
                listenToIframeMessages(${JSON.stringify(nameLevel)});
                return document.body.getIframeSendData${appName};
            }()
        )`;
      }
    } else {
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
    }
    chrome.devtools.inspectedWindow.eval(
      evalLabel,
      (res: string) => {
        if (res) {
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

  private findHierarchyNames = (data: (FinalTreeData & {
    key: string;
    title: string;
  })[], targetName: string): string[] | null => {
    function search(nodes: (FinalTreeData & {
      key: string;
      title: string;
      children: unknown[];
    })[], path: string[]): string[] | null {
      for (const node of nodes) {
        const currentPath = path.concat(node.name);
        if (node.name === targetName) {
          return currentPath;
        }
        if (node.children && node.children.length > 0) {
          const result = search(node.children as (FinalTreeData & {
            key: string;
            title: string;
            children: unknown[];
          })[], currentPath);
          if (result) { return result; }
        }
      }
      return null;
    }

    return search(data as (FinalTreeData & {
      key: string;
      title: string;
      children: unknown[];
    })[], []);
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
      iframe,
      treeData,
    } = this.state;
    const data = this.formatData(dataSource);
    const appName = selectInfo?.name || '';
    let evalLabel = '';
    if (iframe) {
      const nameLevel = this.findHierarchyNames(treeData, appName) || [];
      evalLabel = `JSON.stringify(
        function () {
            function listenToIframeMessages(iframeIds) {
                function attachMessageListener(windowRef, ids, index) {
                    if (index >= ids.length - 1) {
                      if (${currentTab === 'sendDataFromSubToMain'}){
                        windowRef.postMessage({
                          data: ${JSON.stringify(data)}
                        }, "*");
                      } else {
                        windowRef.document.getElementById(ids[index]).contentWindow.postMessage({
                          data: ${JSON.stringify(data)}
                        }, "*");
                      }
                    } else {
                        const nextIframe = windowRef.document.getElementById(ids[index]);
                        if (nextIframe && nextIframe.contentWindow) {
                            attachMessageListener(nextIframe.contentWindow, ids, index + 1);
                        }
                    }
                }
                attachMessageListener(window, iframeIds, 0);
            }
            listenToIframeMessages(${JSON.stringify(nameLevel)});
        }()
    )`;
    } else if (currentTab === 'sendDataFromSubToMain') {
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
      let domName = 'micro-app';
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
      iframe,
      treeData,
    } = this.state;
    if (selectInfo) {
      const color = lighting[selectInfo.name].color || '#E2231A';
      let evalLabel = `JSON.stringify(function(){
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
      if (iframe) {
        const nameLevel = this.findHierarchyNames(treeData, selectInfo.name) || [];
        console.log('nameLevel', nameLevel);
        evalLabel = `JSON.stringify(
          function () {
              if (!window.originalStyles){
                window.originalStyles = new Map();
                window.setLightingStyle = [];
              }
              function listenToIframeMessages(iframeIds) {
                  function attachMessageListener(windowRef, ids, index) {
                      if (index >= ids.length - 1) {
                        var appDOM = windowRef.document.getElementById('${selectInfo.name}');
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
                      } else {
                          const nextIframe = windowRef.document.getElementById(ids[index]);
                          if (nextIframe && nextIframe.contentWindow) {
                              attachMessageListener(nextIframe.contentWindow, ids, index + 1);
                          }
                      }
                  }
                  attachMessageListener(window, iframeIds, 0);
              }
              listenToIframeMessages(${JSON.stringify(nameLevel)});
          }()
      )`;
      }
      console.log('evalLabel', evalLabel);
      chrome.devtools.inspectedWindow.eval(
        evalLabel,
      );
    }
  };

  private changeType = (type: string) => {
    console.log('调整模式', type);
    this.setState({
      iframe: type === 'iframe',
    }, () => {
      this.getTree();
    });
  };

  public render() {
    const {
      currentTab,
      treeData,
      selectInfo,
      canDispatchData,
      lighting,
      init,
      iframe,
    } = this.state;
    if (!init && treeData.length === 0) {
      return (
        <Card>
          <Empty description={(
            <Space direction="vertical" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div>
                未发现
                { iframe ? 'iframe' : 'MicroApp' }
                微应用
              </div>
              <Dropdown.Button
                menu={{
                  items: [{
                    key: 'MicroApp',
                    label: 'MicroApp模式',
                  }, {
                    key: 'iframe',
                    label: 'iframe模式',
                  }],
                  onClick: (e) => {
                    this.changeType(e.key);
                  },
                }}
                trigger={['click']}
                onClick={this.getTree}
                size="small"
                type="primary"
              >
                重新读取
              </Dropdown.Button>
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
      key: 'getSubToMainData',
      label: '获取此子应用传递给父应用的数据',
      children: this.getDataDOM(),
    }, {
      key: 'sendDataFromMainToSub',
      label: '模拟父应用向此子应用发送数据',
      children: this.sendDataDOM(),
    }];
    if (!iframe) {
      if (canDispatchData.length > 0 && selectInfo && selectInfo.name && canDispatchData.includes(selectInfo.name)) {
        tabItems.push({
          key: 'sendDataFromSubToMain',
          label: '模拟此子应用向父应用发送数据',
          children: this.sendDataDOM(),
        });
      }
      tabItems.unshift({
        key: 'getMainToSubData',
        label: '获取父应用传递给此子应用的数据',
        children: this.getDataDOM(),
      });
      tabItems.push({
        key: 'openSimulation',
        label: '此子应用开发环境模拟',
      });
    } else {
      tabItems.push({
        key: 'sendDataFromSubToMain',
        label: '模拟此子应用向父应用发送数据',
        children: this.sendDataDOM(),
      });
    }
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
            <Card
              style={{ height: '100%' }}
              size="small"
              title={(
                <Space>
                  <span>选择子应用</span>
                  <Popover title={(
                    <div>
                      <p>选择模式：</p>
                      <Radio.Group onChange={e => this.changeType(e.target.value)} value={iframe ? 'iframe' : 'MicroApp'}>
                        <Space direction="vertical">
                          <Radio value="MicroApp">MicroApp</Radio>
                          <Radio value="iframe">iframe</Radio>
                        </Space>
                      </Radio.Group>
                    </div>
                  )}
                  >
                    <Tag style={{ cursor: 'pointer' }}>{ iframe ? 'iframe' : 'MicroApp' }</Tag>
                  </Popover>
                </Space>
              )}
              extra={<Button type="link" icon={<RedoOutlined rev={null} />} onClick={this.getTree} />}
            >
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
                  <Descriptions.Item label={iframe ? 'id' : 'name'}>{ selectInfo.name }</Descriptions.Item>
                  <Descriptions.Item label="url"><Link copyable href={href} target="_blank">{ selectInfo.url }</Link></Descriptions.Item>
                  { !iframe && selectInfo.baseroute && <Descriptions.Item label="baseroute">{ selectInfo.baseroute }</Descriptions.Item> }
                  { !iframe && selectInfo.fullPath && <Descriptions.Item label="子路由">{ selectInfo.fullPath }</Descriptions.Item> }
                  <Descriptions.Item label="高亮范围">
                    <Space>
                      <ColorPicker value={lighting[selectInfo.name] ? lighting[selectInfo.name].color : '#E2231A'} size="small" onChange={this.changeColor} />
                      <Switch checked={lighting[selectInfo.name] ? lighting[selectInfo.name].checked : false} onChange={this.changeLighting} />
                    </Space>
                  </Descriptions.Item>
                  { !iframe && !(/^0\./u).test(selectInfo.version as string) && <Descriptions.Item label="iframe模式">{ selectInfo.iframe as string || 'false' }</Descriptions.Item> }
                  { !iframe && <Descriptions.Item label="MicroApp版本">{ selectInfo.version }</Descriptions.Item> }
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
