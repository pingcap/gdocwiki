import SlsWebLogger from 'js-sls-logger';

let logger: any = undefined;

if (process.env.REACT_APP_SLS_HOST) {
  const opts = {
    host: process.env.REACT_APP_SLS_HOST,
    project: process.env.REACT_APP_SLS_PROJECT,
    logstore: process.env.REACT_APP_SLS_LOGSTORE,
  };
  logger = new SlsWebLogger(opts);
}

export function track(data: Object) {
  if (!logger) {
    return;
  }
  logger.send(data);
}
