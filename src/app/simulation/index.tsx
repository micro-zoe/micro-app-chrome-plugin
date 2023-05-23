import React from 'react';
import { render } from 'react-dom';

import SimulationPage from '@/pages/simulation';

render(<SimulationPage />, window.document.querySelector('#app'));

if (module.hot) { module.hot.accept(); }
