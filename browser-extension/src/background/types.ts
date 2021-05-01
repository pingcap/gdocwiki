export type MessageOAuth2Finish = {
  event: 'oauth2Finish';
  url: string;
};

export type Message = MessageOAuth2Finish;

export type ExternalMessageDetectInstall = {
  event: 'detectInstall';
};

export type ExternalMessageDetectInstallResponse = {
  event: 'detectInstallResponse';
  version: string;
};

export type ExternalMessage = ExternalMessageDetectInstall | ExternalMessageDetectInstallResponse;
