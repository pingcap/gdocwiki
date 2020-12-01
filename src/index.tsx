import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './global.carbon.scss';
import './global.index.scss';
import { registerIcons } from './utils';

dayjs.extend(relativeTime);

registerIcons();

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
