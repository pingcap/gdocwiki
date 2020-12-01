import * as H from 'history';

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
  file: gapi.client.drive.File,
  alwaysOpenInNewWindow?: boolean
) {
  const link = mdLink.parse(file.name);
  if (link) {
    window.open(link.url, '_blank');
  } else if (alwaysOpenInNewWindow) {
    // FIXME: Will be broken when we switch from HashRouter to BrowserRouter
    window.open(`#/view/${file.id}`);
  } else {
    history.push(`/view/${file.id}`);
  }
}

const mdLink = {
  parse,
  handleFileLinkClick,
};

export default mdLink;
