/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable import/extensions */
/** @jsxRuntime classic */
/** @jsx jsxCustomEvent */
import {
  DeleteOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import jsxCustomEvent from '@micro-zoe/micro-app/polyfill/jsx-custom-event';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Divider,
  Form,
  Input,
  Layout,
  message,
  Select,
  Space,
  Switch,
  Table,
  Typography,
} from 'antd';
import React from 'react';

import { decodeJSON, encodeJSON } from '@/utils/json';

import microApp1 from './js/microApp1.js';
import microApp08, { unmountAllApps } from './js/microApp08.js';

import styles from './index.module.less';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
let microApp: any = microApp1;

// Fake all web requests' referer.
const onBeforeSendHeaders = window.chrome?.webRequest?.onBeforeSendHeaders;
if (onBeforeSendHeaders) {
  onBeforeSendHeaders.addListener((details) => {
    if (details.type === 'xmlhttprequest') {
      const referer = details.requestHeaders?.find(h => h.name === 'Referer');
      if (referer) {
        referer.value = details.url;
      } else {
        details.requestHeaders?.push({ name: 'Referer', value: details.url });
      }
      return { requestHeaders: details.requestHeaders };
    }
    return {};
  }, { urls: ['<all_urls>'] }, ['requestHeaders', 'blocking']);
}

interface ControlData {
  url: string;
  prefix: string;
  data: { key: string; value: string; valueType: string }[];
  ver?: string;
}

interface KeyValueData {
  id: number;
  key: string;
  value: string;
  valueType: 'string' | 'number' | 'boolean';
  checked: boolean;
}

interface SimulationPageProps { }

interface SimulationPageState {
  url: ControlData['url'];
  mode: 'json' | 'list';
  timeStr: number;
  fatherData: string;
  prefix: ControlData['prefix'];
  showKVType: boolean;
  dataSource: KeyValueData[];
  jsonInputError: boolean;
  microAppUrl: string;
  ver: string;
}

class SimulationPage extends React.PureComponent<SimulationPageProps, SimulationPageState> {
  public state: SimulationPageState = {
    url: '',
    mode: 'json',
    fatherData: '',
    timeStr: Date.now(),
    prefix: 'https://',
    showKVType: true, // 传递数据是否显示为KV格式
    dataSource: [{
      id: this.randomId(),
      checked: true,
      key: '',
      value: '',
      valueType: 'string',
    }],
    jsonInputError: false, // 手动输入的json格式错误
    microAppUrl: '',
    ver: '1.0', // microApp版本号
  };

  private initMicroApp() {
    console.log('初始化', microApp);
    const {
      prefix,
      microAppUrl,
      dataSource,
      ver,
    } = this.state;
    microApp = ver.startsWith('1') ? microApp1 : microApp08;
    microApp.start({
      fetch(url, options, appName) {
        if (url.slice(0, 2) === '//') {
          url = ((window as unknown as { __MICRO_APP_EXTENSION_URL_PROTOCOL__: string }).__MICRO_APP_EXTENSION_URL_PROTOCOL__ ?? 'http:') + url;
        }
        return window.fetch(url, options)
          .then(res => res.text());
      },
      plugins: {
        // 全局插件，作用于所有子应用的js文件
        global: [{
          // 必填，js处理函数，必须返回code值
          loader: (code: string, url: string) => `${[
            'if (!window.__MICRO_APP_EXTENSION_FETCH__) {',
            '  window.__MICRO_APP_EXTENSION_FETCH__ = window.fetch;',
            '  window.fetch = function(url, options) {',
            '    if (url.substring(0, 2) === \'//\') {',
            '      url = window.location.protocol + url;',
            '    }',
            '    return window.__MICRO_APP_EXTENSION_FETCH__(url, options);',
            '  };',
            '}',
          ].join('')
          }${code}`,
        }],
      },
    });
    if (ver.startsWith('1')) {
      console.log('渲染microApp', microApp);
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
      microApp.renderApp({
        url: prefix + microAppUrl,
        name: 'micro-app-demo',
        data,
        container: document.querySelector('#MicroApp'),
      });
    }
  }

  private applyControl() {
    const {
      url,
      prefix,
      dataSource,
      ver,
    } = this.state;
    window.location.search = encodeURIComponent(encodeJSON({
      url,
      prefix,
      data: JSON.stringify(dataSource.filter(el => el.checked && el.key !== '' && el.value !== '').map(el => ({
        key: el.key,
        value: el.value,
        valueType: el.valueType,
      }))),
      ver,
    }));
  }

  /**
   * 解析URL，并返回一个对象
   * @param path 路径类似： /test/test.html?type=1&joey=1#111
   * @returns 解析为： {pathname: "/test/test.html", search: "?type=1&joey=1", hash: "#111"}
   */
  private parsePath(path: string) {
    let pathname = path || '/';
    let search = '';
    let hash = '';

    const hashIndex = pathname.indexOf('#');
    if (hashIndex !== -1) {
      hash = pathname.slice(hashIndex);
      pathname = pathname.slice(0, Math.max(0, hashIndex));
    }

    const searchIndex = pathname.indexOf('?');
    if (searchIndex !== -1) {
      search = pathname.slice(searchIndex);
      pathname = pathname.slice(0, Math.max(0, searchIndex));
    }

    return {
      pathname,
      search: search === '?' ? '' : search,
      hash: hash === '#' ? '' : hash,
    };
  }

  private updateControl(str?: string) {
    const { timeStr } = this.state;
    const q = decodeJSON<ControlData>(decodeURIComponent(window.location.search.slice(1)));
    if (q || q === 'undefined') {
      const url = q.url;
      const dataSource: KeyValueData[] = [];
      if (typeof q.data === 'string' && q.data) {
        for (const oneData of JSON.parse(q.data)) {
          dataSource.push({
            id: this.randomId(),
            key: oneData.key,
            value: oneData.value,
            checked: true,
            valueType: oneData.valueType,
          });
        }
        dataSource.push({
          id: this.randomId(),
          key: '',
          value: '',
          checked: true,
          valueType: 'string',
        });
      }
      (window as unknown as { __MICRO_APP_EXTENSION_URL_PROTOCOL__: string }).__MICRO_APP_EXTENSION_URL_PROTOCOL__ = url.replace(/:\/\/.+$/ui, ':');
      this.setState({
        url,
        prefix: q.prefix,
        dataSource,
        timeStr: str === 'init' ? timeStr : Date.now(),
        microAppUrl: url,
        ver: q.ver || this.state.ver,
      }, () => {
        this.initMicroApp();
      });
    }
    if (q?.url && q?.url.indexOf('#')) {
      const urlLocation: string = q?.url.replace(/^https?:\/\/[^/]+/ui, '');
      if (this.parsePath(urlLocation).hash !== this.parsePath(window.location.href).hash) {
        if (this.parsePath(window.location.href).hash) {
          const finalUrl = window.location.href.replace(this.parsePath(window.location.href).hash, this.parsePath(urlLocation).hash);
          window.location.replace(finalUrl);
        }
        const finalUrl = window.location.href + this.parsePath(urlLocation).hash;
        window.location.replace(finalUrl);
      }
    }
  }

  public componentDidMount(): void {
    this.updateControl('init');
  }

  // 批量校验input必填项;
  private check = () => {
    const { url } = this.state;
    if (!url) {
      message.warning('请输入子页面URL');
      return void 0;
    }
    this.applyControl();
    this.updateControl();
    return void 0;
  };

  private randomId(): number {
    return Math.floor(Math.random() * 10000);
  }

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

  private changeInputUrl = (url: string) => {
    const matchUrl = url.match(/^http(s)?:\/\//u);
    if (matchUrl) {
      this.setState({
        prefix: matchUrl[0],
        url: url.replace(/^http(s)?:\/\//u, ''),
      });
    } else {
      this.setState({
        url,
      });
    }
  };

  private refresh = () => {
    this.applyControl();
    this.updateControl();
  };

  private changeMicroAppVer = (e: string) => {
    const oldVer = this.state.ver;
    this.setState({
      ver: e,
    }, () => {
      if (oldVer.startsWith('0')) {
        unmountAllApps({
          destroy: true,
          clearAliveState: true,
        }).then(() => {
          this.initMicroApp();
          return null;
        }).catch((error: any) => {
          console.error('卸载失败', error);
        });
      } else {
        microApp.unmountAllApps({
          destroy: true,
          clearAliveState: true,
        }).then(() => {
          this.initMicroApp();
          return null;
        }).catch((error: any) => {
          console.error('卸载失败', error);
        });
      }
    });
  };

  public render() {
    const { timeStr, url, prefix, showKVType, dataSource, jsonInputError, microAppUrl, ver } = this.state;
    const baceUrl = url ? url.split('#')[0] : '';
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
    let validateStatus: '' | 'error' = '';
    if (!showKVType && jsonInputError) {
      validateStatus = 'error';
    }
    return (
      <Space direction="vertical" style={{ width: '100%' }} size={[0, 48]}>
        <Header style={{ backgroundColor: '#ffffff' }}>
          <Title level={3}>子应用开发环境模拟</Title>
          <Alert
            type="warning"
            message={(
              <div>
                <div>目前插件只能模拟子应用为 hash 路由的场景；</div>
                <div>目前对于某些页面中http/https协议是简写//形式的链接由于插件本身限制无法实现跳转。</div>
              </div>
            )}
          />
        </Header>
        <Content style={{ padding: '0 50px' }}>
          <Card>
            <Form
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 14 }}
            >
              <Form.Item label="microApp版本" required>
                <Select value={ver} onChange={this.changeMicroAppVer}>
                  <Select.Option value="0.8">0.8</Select.Option>
                  <Select.Option value="1.0">1.0</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="子页面URL" required>
                <Input.Search
                  addonBefore={(
                    <Select value={prefix} onChange={newPrefix => this.setState({ prefix: newPrefix })}>
                      <Option value="http://">http://</Option>
                      <Option value="https://">https://</Option>
                    </Select>
                  )}
                  placeholder="请输入"
                  value={this.state?.url ? this.state.url : ''}
                  onChange={e => this.changeInputUrl(e.target.value)}
                  enterButton="确定"
                  onSearch={this.check}
                />
              </Form.Item>
              { url && (
                <Form.Item label="子应用嵌入代码">
                  <Text copyable>{ `<micro-app url="${prefix}${baceUrl}" name="micro-app-demo"></micro-app>` }</Text>
                </Form.Item>
              ) }
              <Form.Item
                label={(
                  <Space>
                    <span>父应用传递数据</span>
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
            </Form>
          </Card>
          <Divider orientation="left">
            子应用预览
            <Divider type="vertical" />
            <Button type="link" size="small" onClick={this.refresh} icon={<RedoOutlined rev={null} />}>刷新</Button>
          </Divider>
          { ver.startsWith('1')
            ? <div id="MicroApp" />
            : (
              <micro-app
                className={styles.demo}
                url={prefix + microAppUrl}
                name="micro-app-demo"
                data={data}
                key={timeStr}
              />
            ) }
        </Content>
      </Space>
    );
  }
}

export default SimulationPage;
