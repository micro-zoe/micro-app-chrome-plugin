import classNames from 'classnames';
import React from 'react';

import styles from './index.module.less';

interface HeaderTabsProps {
  value: string;
  options: { name: string; label: string }[];
  onChange: (value: string) => void;
}

const Tabs: React.FC<HeaderTabsProps> = props => (
  <div className={styles['tab-list']}>
    {
      props.options.map(p => (
        <div
          key={p.name}
          className={
          classNames(
            styles['tab-item'],
            { [styles['tab-item--active']]: p.name === props.value },
          )
        }
          onClick={() => { props.onChange(p.name); }}
        >
          { p.label }
        </div>
      ))
    }
  </div>
);

export default Tabs;
