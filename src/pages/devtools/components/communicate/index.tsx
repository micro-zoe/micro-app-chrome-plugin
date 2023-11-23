/* eslint-disable etc/no-commented-out-code */
import { CopyOutlined, LinkOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  message,
  Typography,
} from 'antd';
import React from 'react';
import {
  CopyToClipboard,
} from 'react-copy-to-clipboard';
import ReactJson from 'react-json-view';
const { Text } = Typography;
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
}

class CommunicatePage extends React.PureComponent<CommunicateProps, CommunicateState> {
  public state: CommunicateState = {
    info: {},
    currentTab: 'getMainToSubData',
    showKVType: true,
    dataSource: [{
      id: this.randomId(),
      checked: true,
      key: '',
      value: '',
      valueType: 'string',
    }],
    jsonInputError: false, // 手动输入的json格式错误
  };

  componentDidMount() {
    this.getData();
  }

  private getData = () => {
    const {
      currentTab,
    } = this.state;
    let evalLabel = 'JSON.stringify(window.__MICRO_APP_PROXY_WINDOW__.microApp.getData())';
    if (currentTab === 'getSubToMainData') {
      evalLabel = `JSON.stringify(function () {
        if (!document.querySelector("micro-app").getSendData){
          document.querySelector("micro-app").addEventListener('datachange', function (e) {
              document.querySelector("micro-app").getSendData = e.detail.data;
              document.querySelector("micro-app").onDataChange;
              // alert('子应用发送的信息:' + JSON.stringify(e.detail.data));
          })
        }
        return document.querySelector("micro-app").getSendData;
    }())`;
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

  private getDataDOM = () => {
    const {
      info,
    } = this.state;
    return (
      <div>
        <Space>
          <Button type="primary" icon={<LinkOutlined rev={null} />} onClick={this.getData}>重新获取</Button>
          <CopyToClipboard
            text={JSON.stringify(info)}
          >
            <Button icon={<CopyOutlined rev={null} />}>复制</Button>
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
        let valueType: 'string' | 'number' | 'boolean' = 'string';//TODO 动态判断数据类型
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
          valueType
        });
      }
      newDataSource.push({
        id: this.randomId(),
        checked: true,
        key: '',
        value: '',
        valueType: 'string'
      });
      this.setState({
        dataSource: newDataSource,
        jsonInputError: false,
      });
    } catch (error) {
      this.setState({
        jsonInputError: true,
      });
    }
  };

  private formatData = (dataSource: KeyValueData[]): any => {
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
  }

  private sendDataDOM = () => {
    const {
      showKVType,
      jsonInputError,
      dataSource,
    } = this.state;
    const data: any = this.formatData(dataSource);
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
        <div style={{ textAlign: 'center' }}>
          <Button type="primary" onClick={this.sendData} style={{ width: 100 }} disabled={JSON.stringify(data) === '{}'}>发送</Button>
        </div>
      </Form>
    );
  };

  private deleteOneData = (e: KeyValueData): void => {
    this.setState({
      dataSource: this.state.dataSource.filter(el => el.id !== e.id),
    });
  };

  private changeData = (e: {
    type: 'key' | 'value' | 'checked' | 'valueType';
    value: string | number | boolean;
    record: KeyValueData;
  }): void => {
    this.setState({
      dataSource: this.state.dataSource.map((el: KeyValueData): KeyValueData => {
        if (el.id === e.record.id) {
          return {
            ...el,
            [e.type]: e.type === 'checked' ? !!e.value : e.value,
          };
        }
        return el;
      }),
    }, () => {
      const lastRecord = this.state.dataSource[this.state.dataSource.length - 1];
      if (e.record.id === lastRecord.id && (lastRecord.key || lastRecord.value)) {
        this.setState({
          dataSource: [...this.state.dataSource, {
            id: this.randomId(),
            checked: true,
            key: '',
            value: '',
            valueType: 'string'
          }],
        });
      }
    });
  };

  private sendData = () => {
    const {
      currentTab,
      dataSource
    } = this.state;
    let data = this.formatData(dataSource);
    let evalLabel = `document.querySelector("micro-app").data = ${JSON.stringify(data)}`;
    if (currentTab === 'sendDataFromSubToMain') {
      evalLabel = `window.__MICRO_APP_PROXY_WINDOW__.microApp.dispatch(${JSON.stringify(data)})`;
    }
    chrome.devtools.inspectedWindow.eval(
      evalLabel,
      () => {
        message.success('发送成功');
      },
    );
  }

  public render() {
    const {
      currentTab,
    } = this.state;
    return (
      <Card>
        <Tabs
          tabPosition="left"
          size="small"
          items={[{
            key: 'getMainToSubData',
            label: '获取父应用传递给子应用的数据',
            children: this.getDataDOM(),
          }, {
            key: 'getSubToMainData',
            label: '获取子应用传递给父应用的数据',
            children: this.getDataDOM(),
          }, {
            key: 'sendDataFromMainToSub',
            label: '父应用向子应用发送数据',
            children: this.sendDataDOM(),
          }, {
            key: 'sendDataFromSubToMain',
            label: '子应用向父应用发送数据',
            children: this.sendDataDOM(),
          }, {
            key: 'openSimulation',
            label: '子应用开发环境模拟',
          }]}
          activeKey={currentTab}
          onChange={(activityTab) => {
            if (activityTab === 'openSimulation') {
              chrome.tabs.create({
                url: 'simulation.html',
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
                }]
              }, () => {
                if (['getMainToSubData', 'getSubToMainData'].includes(activityTab)) {
                  this.getData();
                }
              });
            }
          }}
        />
      </Card>
    );
  }
}

export default CommunicatePage;
