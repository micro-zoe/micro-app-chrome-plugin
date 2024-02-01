/**
 * 全局环境变量
 */

import React from 'react';
import {
  Table,
  Space,
  Typography,
  Button
} from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'

interface DevToolsPageProps { }

interface DevToolsPageState {
  environment: {
    key: string;
    value: unknown
  }[]
}

const MICRO_APP_ENV_INFO = {
  __MICRO_APP_ENVIRONMENT__: {
    describe: '判断应用是否在微前端环境中',
    url: 'https://micro-zoe.github.io/micro-app/docs.html#/zh-cn/env?id=__micro_app_environment__',
  },
  __MICRO_APP_NAME__: {
    describe: '应用名称',
    url: 'https://micro-zoe.github.io/micro-app/docs.html#/zh-cn/env?id=__micro_app_name__',
  },
  __MICRO_APP_PUBLIC_PATH__: {
    describe: '子应用的静态资源前缀',
    url: 'https://micro-zoe.github.io/micro-app/docs.html#/zh-cn/env?id=__micro_app_public_path__',
  },
  __MICRO_APP_URL__: {
    describe: '子应用的网址',
    url: 'https://micro-zoe.github.io/micro-app/docs.html#/zh-cn/env?id=__micro_app_base_route__',
  },
  __MICRO_APP_BASE_URL__: {
    describe: '子应用的基础网址',
    url: 'https://micro-zoe.github.io/micro-app/docs.html#/zh-cn/env?id=__micro_app_base_route__',
  },
  __MICRO_APP_BASE_ROUTE__: {
    describe: '子应用的基础路由',
    url: 'https://micro-zoe.github.io/micro-app/docs.html#/zh-cn/env?id=__micro_app_base_route__',
  },
  __MICRO_APP_SANDBOX_TYPE__: {
    describe: '子应用沙箱模式',
    url: 'https://micro-zoe.github.io/micro-app/docs.html#/zh-cn/configure?id=iframe',
  },
  __MICRO_APP_UMD_MODE__: {
    describe: '是否开启UMD模式',
    url: 'https://micro-zoe.github.io/micro-app/docs.html#/zh-cn/framework/vue?id=_1%e3%80%81%e5%bc%80%e5%90%afumd%e6%a8%a1%e5%bc%8f%ef%bc%8c%e4%bc%98%e5%8c%96%e5%86%85%e5%ad%98%e5%92%8c%e6%80%a7%e8%83%bd',
  },
  __MICRO_APP_PRE_RENDER__: {
    describe: '是否开启预渲染',
    url: 'https://micro-zoe.github.io/micro-app/docs.html#/zh-cn/router',
  },
  __MICRO_APP_BASE_APPLICATION__: {
    describe: '是否是主应用',
    url: 'https://micro-zoe.github.io/micro-app/docs.html#/zh-cn/env?id=__micro_app_base_application__',
  },
  __MICRO_APP_STATE__: {
    describe: '基座中获取子应用的状态',
    url: 'https://micro-zoe.github.io/micro-app/docs.html#/zh-cn/changelog?id=_100-rc3',
  },
};


class Environment extends React.PureComponent<DevToolsPageProps, DevToolsPageState> {
  public state = {
    environment: []
  };

  public componentDidMount(): void {
    this.getEnvironment();
  }

  private getEnvironment = () => {
    chrome.devtools.inspectedWindow.eval(
      `JSON.stringify(function (){
              const thisWindow = window.__MICRO_APP_PROXY_WINDOW__ || window;
              const allKey = JSON.stringify(Object.keys(thisWindow));
              let thisMicroAppInfo = {};
              for (let el of JSON.parse(allKey)){
                if (el.indexOf('__MICRO_APP') > -1 && ['__MICRO_APP_WINDOW__', '__MICRO_APP_SANDBOX__', '__MICRO_APP_PROXY_WINDOW__'].indexOf(el) == -1){
                    thisMicroAppInfo[el] = thisWindow[el];
                }
              }
              return thisMicroAppInfo;
            }())`,
      (res: string) => {
        console.log('getEnvironment', res);
        if (res && res !== 'undefined' && res !== 'null') {
          let environment = [];
          for (let [key, value] of Object.entries(JSON.parse(res))) {
            environment.push({
              key,
              value
            })
          }
          this.setState({
            environment
          })
        }
      },
    );
  }
  private openUrl = (record) => {
    const url = record.url || 'https://micro-zoe.github.io/micro-app/docs.html#/zh-cn/env';
    window.open(url, '_blank');
  }

  public render() {
    const {
      environment
    } = this.state;
    return (<div>
      <Table
        size='small'
        columns={[{
          title: '变量名称',
          dataIndex: 'key'
        }, {
          title: '变量值',
          dataIndex: 'value',
          render: text => {
            return JSON.stringify(text).replace(/"/g, '');
          }
        }, {
          title: '含义',
          dataIndex: 'description',
          render: (text, record) => {
            if (MICRO_APP_ENV_INFO[record.key]) {
              const info = MICRO_APP_ENV_INFO[record.key];
              return (<Space>
                <Typography.Text>{info.describe}</Typography.Text>
                <Button type='link' size='small' icon={<ExclamationCircleOutlined rev={null} style={{ color: '#aaa' }} />} onClick={() => this.openUrl(info)}></Button>
              </Space>)
            } else {
              return '-';
            }
          }
        }]}
        dataSource={environment}
        rowKey='key'
        pagination={false}
      />
    </div>);
  }
}

export default Environment;
