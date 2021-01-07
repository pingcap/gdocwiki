import * as H from 'history';
import { DriveFile } from '.';

export type MarkdownLink = {
  url: string;
  title: string;
};

function parse(link?: string): MarkdownLink | null {
  if (!link) {
    return null;
  }
  const m = link.match(/^\[([\s\S]*?)\]\(([\s\S]*?)\)$/);
  if (!m) {
    return null;
  }
  return {
    title: m[1],
    url: m[2],
  };
}

function handleFileLinkClick<HistoryLocationState = H.LocationState>(
  history: H.History<HistoryLocationState>,
  file: DriveFile,
  alwaysOpenInNewWindow?: boolean
) {
  const link = mdLink.parse(file.name);
  if (link) {
    window.open(link.url, '_blank');
  } else if (alwaysOpenInNewWindow) {
    const href = history.createHref({ pathname: `/view/${file.id}` });
    window.open(href);
  } else {
    history.push(`/view/${file.id}`);
  }
}

export const mdLink = {
  parse,
  handleFileLinkClick,
};
