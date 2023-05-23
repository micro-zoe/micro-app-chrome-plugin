/** @jsxRuntime classic */
/** @jsx jsxCustomEvent */
import microApp from '@micro-zoe/micro-app';
import jsxCustomEvent from '@micro-zoe/micro-app/polyfill/jsx-custom-event';
import classNames from 'classnames';
import React from 'react';

import { decodeJSON, encodeJSON } from '@/utils/json';

import styles from './index.module.less';

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

microApp.start({
  fetch (url, options, appName) {
    if (url.substring(0, 2) === '//') {
      url = ((window as unknown as { __MICRO_APP_EXTENSION_URL_PROTOCOL__: string }).__MICRO_APP_EXTENSION_URL_PROTOCOL__ ?? 'http:') + url;
    }
    return window.fetch(url, options)
      .then((res) => {
        return res.text();
      });
  },
  plugins: {
    // 全局插件，作用于所有子应用的js文件
    global: [{
      // 必填，js处理函数，必须返回code值
      loader: (code: string, url: string, option?: any) => {
        return `${
          [
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
        }${code}`;
      },
    }]
  }
});

interface ControlData {
  url: string;
  data: { key: string; value: string }[];
}

interface SimulationPageProps {}

interface SimulationPageState {
  url: ControlData['url'];
  mode: 'json' | 'list';
  data: ControlData['data'];
  timeStr: number;
  fatherData: string;
  childData: Record<string,unknown>;
  dataJSON: string;
  dataJSONValid: boolean;
  demo: {
    url: ControlData['url'];
    data: ControlData['data'];
  };
}

class SimulationPage extends React.PureComponent<SimulationPageProps, SimulationPageState> {
  public state: SimulationPageState = {
    url: '',
    mode: 'json',
    data: [],
    fatherData: '',
    timeStr: new Date().valueOf(),
    childData: {},
    dataJSON: '[]',
    dataJSONValid: true,
    demo: {
      url: '',
      data: [],
    },
  };

  private applyControl() {
    window.location.search = encodeURIComponent(encodeJSON({
      url: this.state.url,
      data: this.state.dataJSON,
      // 'micro-app-demo': this.state?.url.replace(/^https?:\/\/[^/]+/ui, ''),
    }));
  }

  private updateControl(str?: string) {
    const { childData, timeStr } = this.state;
    const q = decodeJSON<ControlData>(decodeURIComponent(window.location.search.slice(1)));
    console.log(q, typeof q, window.location.search '-----q');
    
    
    if (q || q === 'undefined') {
      const url = q.url;
      const data: SimulationPageState['data'] = [];
      if (typeof q.data === 'string' && q.data) {
        const list = JSON.parse(q.data);
        if (Array.isArray(list)) {
          list.forEach((d) => {
            data.push(d);
          });
        }
      } 
      (window as unknown as { __MICRO_APP_EXTENSION_URL_PROTOCOL__: string }).__MICRO_APP_EXTENSION_URL_PROTOCOL__ = url.replace(/:\/\/.+$/ui, ':');
      this.setState({ url, data, childData: str === 'init' ? childData: JSON.parse(this.state.fatherData), timeStr: str === 'init' ? timeStr: new Date().valueOf() ,dataJSON: data.length === 0 ? '' : encodeJSON(data), dataJSONValid: true, demo: { url, data } });
    }
    if(q?.url && q?.url.indexOf('#') ) {
      const urlLocation: string = q?.url.replace(/^https?:\/\/[^/]+/ui, ''); 
      if(parsePath(urlLocation).hash !== parsePath(window.location.href).hash) {
        if(parsePath(window.location.href).hash) {
          // parsePath(window.location.href).hash = parsePath(urlLocation).hash
          let finalUrl = window.location.href.replace(parsePath(window.location.href).hash, parsePath(urlLocation).hash);
          window.location.replace(finalUrl)
        }
        let finalUrl = window.location.href + parsePath(urlLocation).hash;
        window.location.replace(finalUrl)
      }
    }
    /**
 * 解析URL，并返回一个对象
 * 类似： /test/test.html?type=1&joey=1#111
 * 解析为： {pathname: "/test/test.html", search: "?type=1&joey=1", hash: "#111"}
 */
function parsePath(path: string) {
  var pathname = path || '/';
  var search = '';
  var hash = '';

  var hashIndex = pathname.indexOf('#');
  if (hashIndex !== -1) {
    hash = pathname.substr(hashIndex);
    pathname = pathname.substr(0, hashIndex);
  }

  var searchIndex = pathname.indexOf('?');
  if (searchIndex !== -1) {
    search = pathname.substr(searchIndex);
    pathname = pathname.substr(0, searchIndex);
  }

  return {
    pathname: pathname,
    search: search === '?' ? '' : search,
    hash: hash === '#' ? '' : hash
  };
  
}

  }

  private insertDataItem = () => {
    this.setState((state) => {
      const data = [...state.data, { key: '', value: '' }];
      return {
        data,
        dataJSON: encodeJSON(data),
        dataJSONValid: true,
      };
    });
  };

  private setDataItemValue<TK extends keyof ControlData['data'][number]>(item: ControlData['data'][number], k: TK, v: ControlData['data'][number][TK]) {
    this.setState((state) => {
      const data = [...state.data.map(d => (d === item ? { ...d, [k]: v } : d))];
      return {
        data,
        dataJSON: encodeJSON(data),
        dataJSONValid: true,
      };
    });
  }

  private removeDataItem(item: ControlData['data'][number]) {
    this.setState((state) => {
      const data = [...state.data.filter(d => d !== item)];
      return {
        data,
        dataJSON: encodeJSON(data),
        dataJSONValid: true,
      };
    });
  }

  private setDataJSON(dataJSON: string) {
    const data = decodeJSON<ControlData['data']>(dataJSON);
    const dataJSONValid = Array.isArray(data);
    this.setState({ data: dataJSONValid ? data : [], dataJSON, dataJSONValid });
  }

  public componentDidMount(): void {
    this.updateControl('init');
  }

  private renderData() {
    if (this.state.mode === 'list') {
      return this.state.data.map((item, i) => (
        <div className={styles['data-item']} key={i}>
          <input
            className={styles['data-item-key']}
            type="text"
            placeholder="Data Key"
            value={item.key}
            onChange={(e) => { this.setDataItemValue(item, 'key', e.target.value); }}
          />
          <span className={styles['data-item-text']}>=</span>
          <input
            className={styles['data-item-value']}
            type="text"
            placeholder="Data Value"
            value={item.value}
            onChange={(e) => { this.setDataItemValue(item, 'value', e.target.value); }}
          />
          <button className={styles['data-item-delete']} type="button" onClick={() => { this.removeDataItem(item); }}>➖</button>
        </div>
      ));
    }
    return (
      <div className={styles['data-json']}>
        <textarea
          className={
            classNames(
              styles['data-json__input'],
              { [styles.error]: !this.state.dataJSONValid },
            )
          }
          value={this.state.dataJSON === '[]' ? '' : this.state.dataJSON}
          placeholder="Data JSON"
          rows={3}
          onChange={(e) => { this.setDataJSON(e.target.value); }}
        />
      </div>
    );
  }

  // 批量校验input必填项;
  private check() {
    const { url } = this.state;
    if (!url) {
      alert('请输入子页面URL!!!');
      return void 0;
    }
    this.applyControl();
    // this.handleData();
    this.updateControl();
    return void 0;
    
  }

  // 格式化输入的fatherData
  private handleData = () => {
    const { fatherData } = this.state;
    try {
      const inputCode = JSON.parse(fatherData);
      const formattedCode = JSON.stringify(inputCode, null, 4);
      this.setState({fatherData:formattedCode })
    } catch {
      alert('解析出错, 请输入正确的JSON格式数据');
    }
  }

  private renderDateTable() {
    const { url } = this.state;
    const baceUrl = url ? url.split('#')[0] : '';    
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div>
        <div>
          <div className={styles.attention}>
            <p>温馨提示：</p>
            <div className={styles.text}>1、目前插件版本只能模拟 micro-app 版本为 0.x 且子应用为 hash 路由的场景!</div>
            <div className={styles.text}>2、目前对于某些页面中http/https协议是简写//形式的链接由于插件本身限制无法实现跳转！</div>
          </div>
        </div>
        <div className={styles.childrenUrl}>
          <p style={{ width: 100, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <span className="required" style={{ color: 'red' }}>*</span>
            <h3>子页面URL：</h3>
          </p>
          <input type="text" required style={{ width: 600 }} placeholder="子页面URL" value={this.state?.url ? this.state.url : ''} onChange={(e) => { this.setState({ url: e.target.value }); }} />
          <button style={{ backgroundColor: '#00BFFF', width: 80, borderRadius: 5, borderColor: '#00BFFF' }} type="button" onClick={(e) => { this.check(); }}>确认</button>
        </div>
        <div className={styles.childrenUrl}>
          <p style={{ paddingLeft: 18 }}>
            <h3>
              父应用数据:
            </h3>
          </p>
          <div className={styles.fatherData}>
            <textarea
              value={this.state.fatherData}
              style={{ width: 688 }}
              placeholder="请输入JSON格式的数据"
              rows={3}
              onChange={(e) => { this.setState({ fatherData: e.target.value}); }}
            />
            <div className={styles.btn} onClick={this.handleData}>JSON格式化</div>
          </div>

        </div>
        <div className={styles.childrenUrl}>
          <p>
            <h3>子应用嵌入代码:</h3>
          </p>
          <input style={{ width: 686 }} type="text" placeholder="子应用嵌入代码" value={this.state.url ? `<micro-app url=${baceUrl} name="micro-app-demo"></micro-app>` : ''} />
        </div>
      </div>
      </div>
      
    );
  }

  public render() {
    const { childData, timeStr } = this.state;
    console.log(this.state.demo.url,'======this.state.demo.url');
    
      console.log(this.state.childData, typeof childData, typeof ({ruleId: 'ro1HA4cBsQoJeOkDCGcp'}) ,'--childData');
    
    return (
      <div className={styles.container}>
        <div className={styles.control}>
          <div className={styles['control-form']}>
            <h1 style={{ display: 'flex', justifyContent: 'center' }}>子应用开发环境模拟</h1>
            <div>
              { this.renderDateTable() }
            </div>
            <hr />
            <div className={styles.url}>
              <button className={styles['url-mode']} type="button" onClick={() => { this.setState(state => ({ mode: state.mode === 'list' ? 'json' : 'list' })); }}>父应用数据JSON转换</button>
              { this.state.mode === 'list' && <button className={styles['url-data']} type="button" onClick={this.insertDataItem}>➕</button> }
            </div>
            <div className={styles.data}>
              { this.renderData() }
            </div>
          </div>
        </div>
        <micro-app
          class={styles.demo}
          url={this.state.demo.url}
          name="micro-app-demo"
          data={childData}
          key={`${timeStr}`}
        />);
      </div>
    );
  }
}

export default SimulationPage;
