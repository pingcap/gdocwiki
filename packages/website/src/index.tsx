import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import App from './App';
import { overwriteConfig } from './config';
import './global.carbon.scss';
import './global.index.scss';
import { registerIcons, store } from './utils';
import { extConn } from './utils/extensionApi';

async function reportManifestUrl() {
  // TODO: Maybe infer manifest url from config is better.
  const url = `${window.location.protocol}//${window.location.host}`;
  console.log('Storing manifest url', url);
  const sender = await extConn;
  await sender.setManifestProbeUrl(url);
  console.log('Manifest url stored');
}

async function main() {
  dayjs.extend(relativeTime);
  reportManifestUrl();

  await overwriteConfig();

  registerIcons();

  ReactDOM.render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>,
    document.getElementById('root')
  );
}

main().catch((e) => console.error(e));
