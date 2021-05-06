import { connectToChild } from 'penpal';

const iframe = document.createElement('iframe');
iframe.src = 'https://gdocwiki-api.web.app/api';
iframe.style.position = 'absolute';
iframe.width = '0px';
iframe.height = '0px';

const connection = connectToChild<GdocWiki.APIPortal.Methods>({
  iframe,
  debug: true,
  timeout: 5000,
});
export const extConn = connection.promise;

document.body.appendChild(iframe);
