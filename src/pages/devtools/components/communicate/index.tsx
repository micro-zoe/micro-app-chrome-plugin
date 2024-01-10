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
  history: HistoryData[];
}

type AllAppInfoData = {
  name: string;
  info: FinalTreeData;
};

type HistoryData = {
  time: number;
  content: unknown;
  type: string;
}

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
    history: [],
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
            }, () => {
              this.loadHistory();
            });
            break;
          }
        }
        if (!inAppInfo && allAppInfo.length > 0) {
          this.setState({
            selectInfo: allAppInfo[0].info,
          }, () => {
            this.loadHistory();
          });
        }
      } else if (allAppInfo.length > 0) {
        this.setState({
          selectInfo: allAppInfo[0].info,
        }, () => {
          this.loadHistory();
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
          if (res !== '{}') {
            this.saveHistory(JSON.parse(res));
          }
        } else {
          this.setState({
            info: {},
          });
        }
      },
    );
  };

  private saveHistory = (content: unknown) => {
    const {
      selectInfo,
      currentTab,
    } = this.state;
    const oldHistory: string | null = localStorage.getItem(`${currentTab}_${selectInfo?.name}`);
    let result: HistoryData[] = [];
    if (!oldHistory) {
      result = [{
        time: moment().valueOf(),
        content,
        type: currentTab,
      }];
    } else {
      let history: HistoryData[] = JSON.parse(oldHistory).filter((el: HistoryData) => JSON.stringify(el.content) !== JSON.stringify(content));
      if (history.length >= 8) {
        history = history.slice(0, 7);
      }
      result = [{
        time: moment().valueOf(),
        content,
        type: currentTab,
      }, ...history];
    }
    localStorage.setItem(`${currentTab}_${selectInfo?.name}`, JSON.stringify(result));
    this.setState({
      history: result,
    });
  };

  private loadHistory = () => {
    const {
      currentTab,
      selectInfo,
    } = this.state;
    const history = localStorage.getItem(`${currentTab}_${selectInfo?.name}`);
    this.setState({
      history: history ? JSON.parse(history) : [],
    });
  };

  private cleanHistory = () => {
    const {
      selectInfo,
      currentTab,
    } = this.state;
    localStorage.removeItem(`${currentTab}_${selectInfo?.name}`);
    this.setState({
      history: [],
    });
  };

  private getDataDOM = () => {
    const {
      info,
      history,
    } = this.state;
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button size="small" type="primary" icon={<LinkOutlined rev={null} />} onClick={this.getData}>重新获取</Button>
            <CopyToClipboard
              text={JSON.stringify(info)}
            >
              <Button size="small" icon={<CopyOutlined rev={null} />}>复制</Button>
            </CopyToClipboard>
          </Space>
          <Popover
            placement="left"
            trigger="click"
            title={(
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>历史记录</div>
                <Button size="small" type="link" onClick={this.cleanHistory}>清空</Button>
              </div>
            )}
            content={(
              <div>
                <Table
                  size="small"
                  columns={[{
                    title: '序号',
                    dataIndex: 'index',
                    render: (text, record, index) => index + 1,
                  }, {
                    title: '内容',
                    dataIndex: 'content',
                    render: text => <Text copyable>{JSON.stringify(text)}</Text>,
                  }, {
                    title: '时间',
                    dataIndex: 'time',
                    render: text => moment(text).format('YYYY-MM-DD HH:mm:ss'),
                  }]}
                  pagination={false}
                  dataSource={history}
                  locale={{
                    emptyText: '暂无记录',
                  }}
                />
              </div>
            )}
          >
            <Button type="link">历史记录</Button>
          </Popover>
        </div>
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

  private writeHistoryData = (record: HistoryData) => {
    this.setState({
      dataSource: record.content as KeyValueData[],
    });
  };

  private sendDataDOM = () => {
    const {
      showKVType,
      jsonInputError,
      dataSource,
      history,
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
          {showKVType
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
            )}
        </Form.Item>
        {JSON.stringify(data) !== '{}' && (
          <Form.Item
            label="最终传参"
          >
            <Text copyable>{JSON.stringify(data)}</Text>
          </Form.Item>
        )}
        <Form.Item label="操作">
          <Row>
            <Col>
              <Dropdown.Button
                type="primary"
                onClick={this.sendData}
                disabled={JSON.stringify(data) === '{}'}
                menu={{
                  items: [{
                    label: '发送并重新加载',
                    key: '1',
                  }],
                  onClick: () => {
                    this.sendData();
                    this.reloadApp();
                  },
                }}
              >
                发送
              </Dropdown.Button>
            </Col>
            <Col>
              <Popover
                placement="top"
                trigger="click"
                title={(
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>历史记录</div>
                    <Button size="small" type="link" onClick={this.cleanHistory}>清空</Button>
                  </div>
                )}
                content={() => {
                  const columns = [{
                    title: '序号',
                    dataIndex: 'index',
                    render: (text: unknown, record: unknown, index: number) => index + 1,
                  }, {
                    title: '内容',
                    dataIndex: 'content',
                    render: (text: unknown) => <Text copyable>{JSON.stringify(this.formatData(text as KeyValueData[]))}</Text>,
                  }, {
                    title: '时间',
                    dataIndex: 'time',
                    render: (text: unknown) => moment(text as number).format('YYYY-MM-DD HH:mm:ss'),
                  }];
                  if (showKVType) {
                    columns.push({
                      title: '操作',
                      dataIndex: 'edit',
                      render: (text: unknown, record: unknown) => <Button type="link" size="small" onClick={() => this.writeHistoryData(record as HistoryData)}>填入</Button>,
                    });
                  }
                  return (
                    <div>
                      <Table
                        rowKey="time"
                        size="small"
                        columns={columns}
                        pagination={false}
                        dataSource={history}
                        locale={{
                          emptyText: '暂无记录',
                        }}
                      />
                    </div>
                  );
                }}
              >
                <Button type="link">历史记录</Button>
              </Popover>
            </Col>
          </Row>
        </Form.Item>
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
        this.saveHistory(dataSource);
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
        this.loadHistory();
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
      chrome.devtools.inspectedWindow.eval(
        evalLabel,
      );
    }
  };

  private reloadApp = () => {
    const {
      selectInfo,
    } = this.state;
    let domName = selectInfo?.tagName || 'micro-app';
    const appName = selectInfo?.name || '';
    if (appName) {
      domName += `[name='${appName}']`;
    }
    const evalLabel = `document.querySelector("${domName}").reload()`;
    chrome.devtools.inspectedWindow.eval(
      evalLabel,
    );
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
          {selectInfo && (
            <Col span={20}>
              <Card style={{ marginBottom: 10 }} size="small" title="应用信息" extra={<Button type="link" icon={<RedoOutlined rev={null} />} onClick={this.reloadApp}>重新加载</Button>}>
                <Descriptions size="small">
                  <Descriptions.Item label="name">{selectInfo.name}</Descriptions.Item>
                  <Descriptions.Item label="url"><Link copyable href={href} target="_blank">{selectInfo.url}</Link></Descriptions.Item>
                  {selectInfo.baseroute && <Descriptions.Item label="baseroute">{selectInfo.baseroute}</Descriptions.Item>}
                  {selectInfo.fullPath && <Descriptions.Item label="子路由">{selectInfo.fullPath}</Descriptions.Item>}
                  <Descriptions.Item label="高亮范围">
                    <Space>
                      <ColorPicker value={lighting[selectInfo.name] ? lighting[selectInfo.name].color : '#E2231A'} size="small" onChange={this.changeColor} />
                      <Switch checked={lighting[selectInfo.name] ? lighting[selectInfo.name].checked : false} onChange={this.changeLighting} />
                    </Space>
                  </Descriptions.Item>
                  {!(/^0\./u).test(selectInfo.version as string) && <Descriptions.Item label="iframe模式">{selectInfo.iframe as string || 'false'}</Descriptions.Item>}
                  <Descriptions.Item label="MicroApp版本">{selectInfo.version}</Descriptions.Item>
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
          )}
        </Row>
      </div>
    );
  }
}

export default CommunicatePage;
