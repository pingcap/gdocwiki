import type { MessageOAuth2Finish } from '../background/types';

export function run() {
  const url = window.location.href;
  let params = '?';
  const index = url.indexOf(params);
  if (index > -1) {
    params = url.substring(index);
  }

  const message: MessageOAuth2Finish = {
    event: 'oauth2Finish',
    url: window.location.href,
  };
  chrome.runtime.sendMessage(message);
}

run();
