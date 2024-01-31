import React from 'react';

import { HEADER_TAB_LIST } from '../../config';
import Tabs from '../tabs';

interface HeaderTabsProps {
  value: string;
  onChange: (value: string) => void;
}

const HeaderTabs: React.FC<HeaderTabsProps> = props => (
  <Tabs
    options={HEADER_TAB_LIST}
    value={props.value}
    onChange={props.onChange}
  />
);

export default HeaderTabs;
