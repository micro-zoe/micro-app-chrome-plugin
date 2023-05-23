import React from 'react';
import { render } from 'react-dom';

import PopupPage from '@/pages/popup';

render(<PopupPage />, window.document.querySelector('#app'));

if (module.hot) { module.hot.accept(); }
