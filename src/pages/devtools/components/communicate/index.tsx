/* eslint-disable etc/no-commented-out-code */
/**
 * 数据通信
 */

import { CopyOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Col,
  Dropdown,
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
  Typography,
} from 'antd';
import moment from 'moment';
import React from 'react';
import {
  CopyToClipboard,
} from 'react-copy-to-clipboard';
import ReactJson from 'react-json-view';

import { FinalTreeData } from '@/utils/chrome';

const { Text } = Typography;
const { Option } = Select;

interface CommunicateProps {
  /**
   * 树形结构选择的微应用信息
   */
  selectInfo: FinalTreeData | null;
}
interface KeyValueData {
  id: number;
  key: string;
  value: string;
  valueType: string;
  checked: boolean;
}

interface CommunicateState {
  /**
   * JSON展示面版信息
   */
  info: { [key: string]: string | number };
  /**
   * 当前选择Tab
   */
  currentTab: string;
  /**
   * 展示Key-Value模式
   */
  showKVType: boolean;
  /**
   * 发送数据
   */
  dataSource: KeyValueData[];
  /**
   * JSON校验错误信息
   */
  jsonInputError: boolean;
  /**
   * 能够子应用发送给父应用的应用
   * Tips:并不是所有子应用都可发数据给父应用，在iframe模式下均可以，在with模式下仅最后加载的应用可以
   */
  canDispatchData: FinalTreeData[];
  /**
   * 发送数据的应用名称
   */
  selectDispatchAppName: string;
  /**
   * 历史记录数据
   */
  history: HistoryData[];
}

/**
 * 平铺展示所有微应用，做数据处理用
 */
type AllAppInfoData = {
  name: string;
  info: FinalTreeData;
};

/**
 * 历史记录数据格式
 */
type HistoryData = {
  time: number;
  content: unknown;
  type: string;
}

class Communicate extends React.PureComponent<CommunicateProps, CommunicateState> {
  public state = {
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
    jsonInputError: false,
    canDispatchData: [],
    selectDispatchAppName: '',
    history: [],
  };

  public componentDidMount() {
    this.getCanDispatchData();
    this.getData();
  }

  /**
   * 从页面获取数据
   */
  private getData = () => {
    const {
      currentTab,
    } = this.state;
    const {
      selectInfo,
    } = this.props;
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

  /**
   * 保存历史数据至localStorage
   * @param content 待保存的内容
   */
  private saveHistory = (content: unknown) => {
    const {
      currentTab,
    } = this.state;
    const {
      selectInfo,
    } = this.props;
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

  /**
   * 从localStorage里读取历史数据
   */
  private loadHistory = () => {
    const {
      currentTab,
    } = this.state;
    const {
      selectInfo,
    } = this.props;
    const history = localStorage.getItem(`${currentTab}_${selectInfo?.name}`);
    this.setState({
      history: history ? JSON.parse(history) : [],
    });
  };

  private cleanHistory = () => {
    const {
      currentTab,
    } = this.state;
    const {
      selectInfo,
    } = this.props;
    localStorage.removeItem(`${currentTab}_${selectInfo?.name}`);
    this.setState({
      history: [],
    });
  };

  /**
   * 获取数据渲染
   * @returns DOM
   */
  private getDataDOM = (): JSX.Element => {
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
                    render: text => <Text copyable>{ JSON.stringify(text) }</Text>,
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

  /**
   * 生成随机ID，用于Table的key
   * @returns 随机数
   */
  private randomId(): number {
    return Math.floor(Math.random() * 10000);
  }

  /**
   * 修改传参数据并校验
   * @param value 待修改的数据
   */
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

  /**
   * 将Table的dataSource格式数据转换成标准传输数据
   * @param dataSource Table数据
   * @returns 标准数据
   */
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

  /**
   * 获取能够向父应用发送数据的子应用
   * Tips:并不是所有子应用都可发数据给父应用，在iframe模式下均可以，在with模式下仅最后加载的应用可以
   */
  private getCanDispatchData = () => {
    const {
      selectInfo,
    } = this.props;
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

  /**
   * 快速将历史数据填入表格
   * @param record 单条历史数据
   */
  private writeHistoryData = (record: HistoryData) => {
    this.setState({
      dataSource: record.content as KeyValueData[],
    });
  };

  /**
   * 发送数据渲染
   * @returns DOM
   */
  private sendDataDOM = (): JSX.Element => {
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
                    render: (text: unknown, record: unknown, index: number) => <div>{ index + 1 }</div>,
                  }, {
                    title: '内容',
                    dataIndex: 'content',
                    render: (text: unknown) => <Text copyable>{ JSON.stringify(this.formatData(text as KeyValueData[])) }</Text>,
                  }, {
                    title: '时间',
                    dataIndex: 'time',
                    render: (text: unknown) => moment(text as number).format('YYYY-MM-DD HH:mm:ss'),
                  }];
                  if (showKVType) {
                    columns.push({
                      title: '操作',
                      dataIndex: 'edit',
                      render: (text: unknown, record: unknown, index: number) => <Button type="link" size="small" onClick={() => this.writeHistoryData(record as HistoryData)}>填入</Button>,
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

  /**
   * 删除某行数据
   * @param e 待删除的信息
   */
  private deleteOneData = (e: KeyValueData): void => {
    this.setState(prevState => ({
      dataSource: prevState.dataSource.filter(el => el.id !== e.id),
    }));
  };

  /**
   * 将某行设置的数据转换成标准格式
   * @param e 行数据
   */
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

  /**
   * 从页面发送数据
   */
  private sendData = () => {
    const {
      currentTab,
      dataSource,
      canDispatchData,
      selectDispatchAppName,
    } = this.state;
    const {
      selectInfo,
    } = this.props;
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
   * 重新加载微应用
   */
  private reloadApp = () => {
    const {
      selectInfo,
    } = this.props;
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
      canDispatchData,
    } = this.state;
    const {
      selectInfo,
    } = this.props;
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
    if (canDispatchData.length > 0 && (selectInfo as FinalTreeData) && selectInfo.name && canDispatchData.includes(selectInfo.name)) {
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
    return (
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
            if (selectInfo && selectInfo.version && selectInfo.version.startsWith('0')) {
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
    );
  }
}

export default Communicate;
