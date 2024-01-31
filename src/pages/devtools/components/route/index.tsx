/**
 * 路由匹配
 */

import React from 'react';
import {
    Descriptions,
    Typography,
    Space,
    ColorPicker,
    Switch,
} from 'antd'
import { FinalTreeData } from '@/utils/chrome';
const { Link } = Typography;


interface RouteProps {
    /**
    * 树形结构选择的微应用信息
    */
    selectInfo: FinalTreeData | null;
}

interface RouteState {
    /**
   * 高亮信息数据缓存
   */
    lighting: {
        [name: string]: {
            checked: boolean;
            color: string;
        };
    };
}


class Route extends React.PureComponent<RouteProps, RouteState> {
    public state = {
        lighting: {},
    };

    public componentDidMount(): void {
    }

    /**
   * 修改高亮状态
   * @param checked 是否高亮
   */
    private changeLighting = (checked: boolean) => {
        const {
            selectInfo
        } = this.props;
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

    /**
     * 修改高亮边框颜色
     * @param color 颜色
     * @param hex HEX颜色
     */
    private changeColor = (color: unknown, hex: string) => {
        const {
            selectInfo
        } = this.props;
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

    /**
     * 页面应用标记高亮
     */
    private doLighting = () => {
        const {
            lighting,
        } = this.state;
        const {
            selectInfo
        } = this.props;
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

    public render() {
        const {
            selectInfo
        } = this.props;
        const {
            lighting
        } = this.state;
        let href: string = '';
        if (selectInfo) {
            href = selectInfo.url as string;
            if (!(/^https?:\/\//u).test(href)) {
                href = `http://${href}`;
            }
        }
        return (<Descriptions size="small">
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
        </Descriptions>);
    }
}

export default Route;
