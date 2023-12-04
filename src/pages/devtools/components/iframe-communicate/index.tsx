/* eslint-disable etc/no-commented-out-code */
import { CopyOutlined, DeleteOutlined, LinkOutlined, RedoOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  message,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  TreeSelect,
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
  treeData: any[];
  treeValue: string;
  canDispatchData: any[];
  selectDispatchAppName: string;
}

class IframeCommunicatePage extends React.PureComponent<CommunicateProps, CommunicateState> {
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
    treeValue: '',
    canDispatchData: [],
    selectDispatchAppName: '',
  };

  componentDidMount() {
    this.getTree();
  }

  private getData = () => {
    const {
      currentTab,
      treeValue,
    } = this.state;
    let evalLabel = '';
    let domName = 'micro-app';
    if (treeValue) {
      domName += `[name='${treeValue}']`;
    }
    evalLabel = currentTab === 'getSubToMainData'
      ? `JSON.stringify(function () {
        if (!document.body.getSendData){
          window.addEventListener('message', event => {
          document.body.getSendData = event.data;
        });
        }
        return document.body.getSendData;
    }())`
      : `JSON.stringify(document.querySelector("${domName}").data)`;
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

  private changeTreeValue = (e: string) => {
    console.log('changeTreeValue', e);
    this.setState({
      treeValue: e,
    }, () => {
      this.getData();
    });
  };

  private getDataDOM = () => {
    const {
      info,
    } = this.state;
    return (
      <div>
        <Space>
          <span>子应用名称：</span>
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
  };

  private changeDispatchAppName = (e: string) => {
    this.setState({
      selectDispatchAppName: e,
    });
  };

  private getCanDispatchData = () => {
    console.log('获取有Dispatch方法的name');
    const evalLabel = `JSON.stringify(function (){
        const rawWindow = window.__MICRO_APP_PROXY_WINDOW__?.rawWindow || [];
        let result = [];
        for (var i = 0; i < rawWindow.length; i++){
            const oneWindow = rawWindow[i];
            result.push(oneWindow.microApp.appName);
        }
        return result;
    }())`;
    chrome.devtools.inspectedWindow.eval(
      evalLabel,
      (res: string) => {
        console.log('获取结果', res);
        const canDispatchData = JSON.parse(res);
        let selectDispatchAppName = '';
        if (canDispatchData.length > 0) {
          selectDispatchAppName = canDispatchData[0];
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
      treeData,
      treeValue,
      currentTab,
      canDispatchData,
      selectDispatchAppName,
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
        {currentTab === 'sendDataFromMainToSub' && (
          <Form.Item label="设置接收的子应用">
            <TreeSelect
              placeholder="选择子应用"
              treeDefaultExpandAll
              treeData={treeData}
              value={treeValue}
              style={{
                width: 200,
              }}
              onChange={this.changeTreeValue}
            />
            <Button
              type="link"
              icon={<RedoOutlined rev={null} />}
              onClick={() => {
                this.getTree();
                message.success('已刷新');
              }}
            />
          </Form.Item>
        )}
        {currentTab === 'sendDataFromSubToMain' && canDispatchData.length > 0 && (
          <Form.Item label="设置发送的子应用">
            <Select value={selectDispatchAppName} onChange={this.changeDispatchAppName} style={{ width: 200 }}>
              {canDispatchData.map(el => (<Option value={el} key={el}>{el}</Option>))}
            </Select>
            <Button
              type="link"
              icon={<RedoOutlined rev={null} />}
              onClick={() => {
                this.getCanDispatchData();
                message.success('已刷新');
              }}
            />
          </Form.Item>
        )}
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
            valueType: 'string',
          }],
        });
      }
    });
  };

  private sendData = () => {
    const {
      currentTab,
      dataSource,
      treeValue,
      canDispatchData,
      selectDispatchAppName
    } = this.state;
    const data = this.formatData(dataSource);
    let evalLabel = '';
    if (currentTab === 'sendDataFromSubToMain') {
      if (canDispatchData.length === 0) {
        evalLabel = `window.__MICRO_APP_PROXY_WINDOW__.microApp.dispatch(${JSON.stringify(data)})`;
      } else {
        evalLabel = `JSON.stringify(function (){
            const rawWindow = window.__MICRO_APP_PROXY_WINDOW__?.rawWindow || [];
            for (var i = 0; i < rawWindow.length; i++){
                const oneWindow = rawWindow[i];
                if (oneWindow.microApp.appName === "${selectDispatchAppName}"){
                  console.log('发送', oneWindow.microApp);
                    oneWindow.microApp.dispatch(${JSON.stringify(data)});
                    break;
                }
            }
        }())`;
      }
      evalLabel = `document.getElementById('iframe').contentWindow.parent.postMessage({
        data: ${JSON.stringify(data)}
      }, "*");`
    } else {
      let domName = 'micro-app';
      if (treeValue) {
        domName += `[name='${treeValue}']`;
      }
      evalLabel = `document.querySelector("${domName}").data = ${JSON.stringify(data)}`;
      evalLabel = `document.getElementById('iframe').contentWindow.postMessage({
        data: ${JSON.stringify(data)}
      }, "*");`
    }
    console.log('evalLabel', evalLabel);
    chrome.devtools.inspectedWindow.eval(
      evalLabel,
      () => {
        message.success('发送成功');
      },
    );
  };

  private getTree = () => {
    console.log('获取层级结构');
    const evalLabel = `JSON.stringify(
      function () {
          function buildMicroAppHierarchy(node = document.body) {
              let hierarchy = {};
              node.childNodes.forEach((childNode) => {
                  if (childNode.nodeType === Node.ELEMENT_NODE) {
                      if (childNode.tagName.toLowerCase() === 'micro-app') {
                          let childHierarchy = buildMicroAppHierarchy(childNode);
                          let name = childNode.getAttribute('name') || 'unnamed';
                          hierarchy[name] = childHierarchy;
                      } else {
                          Object.assign(hierarchy, buildMicroAppHierarchy(childNode));
                      }
                  }
              });
              return hierarchy;
          }

          function objectToArray(obj) {
            let result = [];
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    let value = obj[key];
                    let children = objectToArray(value);
                    result.push({
                        title: key,
                        value: key,
                        children
                    });
                }
            }
            return result;
        }
          const microAppHierarchy = buildMicroAppHierarchy();
          return objectToArray(microAppHierarchy)
      }()
  );`;
    chrome.devtools.inspectedWindow.eval(
      evalLabel,
      (res: string) => {
        console.log('接收层级', res);
        const treeData = JSON.parse(res);
        let treeValue = '';
        if (treeData.length > 0) {
          treeValue = treeData[0].value;
        }
        this.setState({
          treeData,
          treeValue,
        }, () => {
          if (['getMainToSubData', 'getSubToMainData'].includes(this.state.currentTab)) {
            this.getData();
          }
        });
      },
    );
  };

  public render() {
    const {
      currentTab,
    } = this.state;
    return (
      <Card>
        <Tabs
          tabPosition="left"
          size="small"
          items={[
            // {
            //   key: 'getMainToSubData',
            //   label: '获取父应用传递给子应用的数据',
            //   children: this.getDataDOM(),
            // },
            {
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
                }],
              }, () => {
                if (['getMainToSubData', 'getSubToMainData', 'sendDataFromSubToMain'].includes(activityTab)) {
                  this.getTree();
                }
                if (activityTab === 'sendDataFromSubToMain') {
                  this.getCanDispatchData();
                }
              });
            }
          }}
        />
      </Card>
    );
  }
}

export default IframeCommunicatePage;
