import { InlineLoading } from 'carbon-components-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import App from './App';
import { getConfig, loadConfig } from './config';
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
  if (!gapi) {
    ReactDOM.render(
      <InlineLoading description="Error. Please reload" />,
      document.getElementById('root')
    );
  }
  gapi.load('client:auth2', () => {
    gapi.client.load('drive', 'v3', async () => {
      try {
        await loadConfig();

        const initConfig = {
          apiKey: getConfig().REACT_APP_GAPI_KEY,
          clientId: getConfig().REACT_APP_GAPI_CLIENT_ID,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          scope:
            'https://www.googleapis.com/auth/drive.metadata https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/documents.readonly',
          hosted_domain: getConfig().REACT_APP_GAPI_HOSTED_DOMAIN,
          cookie_policy: getConfig().REACT_APP_GAPI_COOKIE_POLICY,
        };

        await gapi.client.init(initConfig);
        const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();

        ReactDOM.render(
          <React.StrictMode>
            <Provider store={store}>
              <App isSignedIn={isSignedIn} />
            </Provider>
          </React.StrictMode>,
          document.getElementById('root')
        );
      } catch (ex) {
        console.error(ex);
        ReactDOM.render(
          <InlineLoading description="Error. Please reload" />,
          document.getElementById('root')
        );
      }
    });
  });

  ReactDOM.render(
    <InlineLoading description="Loading Google API..." />,
    document.getElementById('root')
  );

  reportManifestUrl();
  dayjs.extend(relativeTime);
  registerIcons();
}

main().catch((e) => console.error(e));
