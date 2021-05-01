export type MessageOAuth2Finish = {
  event: 'oauth2Finish';
  url: string;
};

export type Message = MessageOAuth2Finish;
