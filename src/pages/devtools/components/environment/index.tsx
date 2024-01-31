/**
 * 全局环境变量
 */

import React from 'react';
import {
    Table
} from 'antd'

interface DevToolsPageProps { }

interface DevToolsPageState {
}


class Environment extends React.PureComponent<DevToolsPageProps, DevToolsPageState> {
    public state = {
    };

    public componentDidMount(): void {
    }

    public render() {
        return (<div>
            <Table
                size='small'
                columns={[{
                    title: '变量名称',
                    dataIndex: 'name'
                }, {
                    title: '含义',
                    dataIndex: 'description'
                }]}
                dataSource={[{
                    id: 1,
                    name: '测试1',
                    description: '啦啦啦啦'
                }, {
                    id: 2,
                    name: '测试2',
                    description: '啦啦啦啦'
                }]}
                rowKey='id'
            />
        </div>);
    }
}

export default Environment;
