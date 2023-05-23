import React from 'react';
import { render } from 'react-dom';

import OptionsPage from '@/pages/options';

render(
  <OptionsPage />,
  window.document.querySelector('#app'),
);

if (module.hot) { module.hot.accept(); }
