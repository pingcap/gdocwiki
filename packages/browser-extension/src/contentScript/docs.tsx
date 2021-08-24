import cx from 'classnames';
import { debounce } from 'lodash-es';
import { waitFor, waitSelector, triggerMouseEvent } from '../utils/contentScript';
import styles from './docs.module.scss';
import { Token } from 'client-oauth2';
import { GapiClient } from '../utils/gapi';
import { Singleflight } from '@zcong/singleflight';
import { getManifestInfo, ManifestDrive } from '../utils/manifest';
import ReactDOM from 'react-dom';
import { useEffect, useState } from 'react';
import { useToken } from '../utils/hooks/oauth';
import { ChevronRight16, Launch16, WarningAltFilled16 } from '@carbon/icons-react';
import Button from 'carbon-components-react/lib/components/Button';
import { log } from '../utils/log';

const sf = new Singleflight();

type TreePathItem = {
  name: string;
  url: string;
};

type ParentTree = {
  file: TreePathItem;
  folder?: TreePathItem;
  parents: Array<TreePathItem>;
}

type FileInfo = {
  isOrphanAndOwner?: boolean;
  parentTree: ParentTree;
  privateOwners?: null | gapi.client.drive.User[];
  trashed?: boolean;
};

function buildFolderUrl(id: string, drive?: ManifestDrive) {
  return drive
    ? `${drive.workspace}/view/${id}`
    : `https://drive.google.com/drive/folders/${id}`;
}

function buildFileUrl(id: string, drive?: ManifestDrive) {
  return drive
    ? `${drive.workspace}/view/${id}`
    : `https://drive.google.com/file/d/${id}`;
}

async function loadFileInfo(fileId: string, token: Token): Promise<FileInfo | undefined> {
  const manifest = await getManifestInfo();
  if (!manifest) {
    log.warn('manifest is unavailable');
  }
  const client = new GapiClient(token);
  log.info(`Getting file info for base file ${fileId}`);
  const file = await client.getDriveFile(fileId, {
    fields: '*',
    supportsAllDrives: true,
  });

  // Put the document name in the URL
  // Then when we send the link to others they will see the title
  try {
    var urlParams = new URLSearchParams(window.location.search);
    if (file.name && !urlParams.get('n')) {
      // Change invalid characters to '_' but don't show 2 of those next to each other
      // Change '_-_' to '-'
      const paramValue = encodeURIComponent(file.name.replaceAll('%', '_'))
        .replaceAll(/%../g, '_')
        .replaceAll(/_+/g, '_')
        .replaceAll(/_-/g, '-')
        .replaceAll(/-_+/g, '-')
        .replace(/_+$/, '')
        .replace(/^_+/, '');
      urlParams.set('n', paramValue);
      const newUrl = window.location.origin + window.location.pathname + '?' + urlParams.toString();
      window.history.replaceState({path: newUrl}, "", newUrl);
    }
  } catch (e) {
    console.warn("error trying to add doc name to parameters ", e);
  }

  log.info('File metadata', file);

  const drives = manifest?.data?.drives ?? {};
  const fileUrl = buildFileUrl(file.id!, drives[Object.keys(drives)[0]])
  const parentTree = {
    parents: [],
    file: {
      name: file.name ?? '',
      url: fileUrl
    }
  }

  if (file.trashed) {
    log.info('Skipped the file since it is trashed');
    return {
      parentTree,
      trashed: true,
    };
  }

  if (file.ownedByMe) {
    log.info('File is owned by current user, and it should be orphan');
    return {
      isOrphanAndOwner: true,
      parentTree,
    };
  }

  if (!file.driveId) {
    log.info(
      'File does not have a drive id, maybe the owner did not put it in the Wiki, skip listing parents'
    );
    const domain = manifest?.data.gapiHostedDomain
    const orgOwners = domain
      ? null
      : file.owners?.filter((owner) => owner.emailAddress?.split("@")?.[1] === domain)

    return {
      privateOwners: orgOwners,
      parentTree,
    };
  }

  let discoveredDrive: ManifestDrive | undefined;
  let discoveredWorkspace: string | undefined;

  for (const name in drives) {
    if (drives[name].driveId === file.driveId) {
      discoveredDrive = drives[name];
      discoveredWorkspace = name;
      break;
    }
  }

  // Now we know the drive of the file, let's list parents.
  log.info(`Listing parents for file ${fileId}`);
  const parents: Array<TreePathItem> = [];
  const visitedParentIds = new Set<string>();
  let currentFile = file;
  while (true) {
    const parentId = currentFile.parents?.[0];
    log.info(`Parent id = ${parentId}`);
    if (!parentId) {
      break;
    }
    if (visitedParentIds.has(parentId)) {
      log.info(`Parent has been visited, break the loop`);
      break;
    }
    visitedParentIds.add(parentId);

    if (discoveredDrive && (discoveredDrive.driveId === parentId || discoveredDrive.rootId === parentId)) {
      log.info(`Parent is the workspace, finished`, discoveredWorkspace, discoveredDrive);
      parents.push({
        name: discoveredWorkspace!,
        url: buildFolderUrl(parentId, discoveredDrive),
      });
      break;
    }
    try {
      log.info(`Getting parent file info (parent id = ${parentId})`);
      const parentFile = await client.getDriveFile(parentId, {
        fields: '*',
        supportsAllDrives: true,
      });
      log.info(`Parent file metadata`, parentFile);
      parents.push({
        name: parentFile.name!,
        url: buildFolderUrl(parentId, discoveredDrive),
      });
      currentFile = parentFile;
    } catch (e) {
      log.error(e);
      break;
    }
  }

  parents.reverse();

  log.info(`Parents list has been built`, parents);

  return {
    parentTree: {
      folder: parents.pop(),
      file: {
        name: file.name!,
        url: fileUrl,
      },
      parents
    },
  };
}

async function commentPleaseShare(fileId: string, token: Token, content: string): Promise<null> {
  const client = new GapiClient(token);
  log.info(`Getting file info for base file ${fileId}`);
  return await client.addComment(fileId, content);
}

function useFileInfo(fileId: string, token?: Token): [FileInfo | undefined, boolean] {
  const [loading, setLoading] = useState(false);
  const [loadToken, setLoadToken] = useState(0); // Used to reload the file
  const [fi, setFI] = useState<FileInfo | undefined>(undefined);

  useEffect(() => {
    async function run() {
      setLoading(true);
      try {
        log.info('Get Google drive file', fileId, token);
        const fi = await loadFileInfo(fileId, token!);
        setFI(fi);
      } catch (e) {
        log.error(e);
        setFI(undefined);
      } finally {
        setLoading(false);
      }
    }
    if (token) {
      sf.do(fileId, run);
    }
  }, [fileId, token, loadToken]);

  // Observe directory change
  useEffect(() => {
    const handlePickerHide = debounce(() => {
      // When picker is closed, trigger reload
      setLoadToken((t) => t + 1);
    }, 5000);

    const el = document.querySelector('#docs-chrome');
    if (!el) {
      log.error('GdocWiki failed to discover docs header, ignoring file location change');
      return;
    }
    const ms = new MutationObserver((records) => {
      for (let r of records) {
        const el = r.target as HTMLDivElement;
        if (!el.classList.contains('picker-iframe')) {
          continue;
        }
        if (el.style.visibility === 'hidden') {
          handlePickerHide();
        }
      }
    });
    ms.observe(el, {
      attributes: true,
      subtree: true,
      attributeFilter: ['style'],
    });
  }, []);

  return [fi, loading];
}

function App(props: { id: string }) {
  const [token, isTokenLoading] = useToken();
  const [fi] = useFileInfo(props.id, token);

  if (!token || isTokenLoading) {
    return <Loading token={token} isTokenLoading={isTokenLoading} />
  }
  if (!fi || fi.trashed) {
    return null
  }

  return (
    <>
      <a style={{ paddingRight: '10px' }} href={fi.parentTree.file.url} target="_blank" rel="noreferrer" className={styles.wikiTreeIcon}>
        <Launch16/>
      </a>
      {Boolean(fi.isOrphanAndOwner) && (
        <span className={cx(styles.tag, styles.warning)}>
          <WarningAltFilled16 style={{ marginRight: 6 }} />
          Document outside the Wiki
        </span>
      )}
      <PrivateOwners id={props.id} token={token} privateOwners={fi.privateOwners} />
      <Folders parentTree={fi.parentTree} />
    </>
  );
}

function Loading(props: { isTokenLoading?: boolean; token?: Token; }) {
  if (props.isTokenLoading || !props.token) {
    return null
  }

  return (
    <a
      className={cx(styles.tag, styles.danger, styles.clickable)}
      href={chrome.runtime.getURL('options.html')}
      target="_blank"
      rel="noreferrer"
    >
      <Launch16 style={{ marginRight: 6 }} />
      GdocWiki Extension Not Enabled
    </a>
  )
}

function PrivateOwners(props: { id: string, token: Token, privateOwners?: null | gapi.client.drive.User[]; }) {
  const [showExtra, setShowExtra] = useState(false);
  const [askShared, setAskShared] = useState(false);

  const { privateOwners, token, id } = props;
  if (!privateOwners?.length) {
    return null
  }

  async function askSharedDrive(user: gapi.client.drive.User) {
      const ask = "@" + user.displayName + " Please add this file to a shared drive. That helps organize information, make it more discoverable, and manage permissions."
      setAskShared(v => !v)
      try {
        log.info('Comment to move file to a shared drive', props.id);
        await commentPleaseShare(id, token, ask);
      } catch (e) {
        log.error(e);
      } finally {
        log.info("finally commented")
      }
  }

  return showExtra ?
  <>
    <WarningAltFilled16 style={{ marginRight: 6 }} />
    <span className={cx(styles.tag)} onClick={() => {setShowExtra(v => !v)}}>
      Owned by {privateOwners?.[0].displayName} {privateOwners?.[0].emailAddress}
    </span>
    {!askShared &&
    <Button className={cx(styles.tag)} onClick={() => {askSharedDrive(privateOwners?.[0]!)}}>
      Ask for shared drive
    </Button>
    }
  </> :
  <>
    <WarningAltFilled16 style={{ marginRight: 6 }} />
    <Button className={cx(styles.tag, styles.warning)} onClick={() => {setShowExtra(v => !v)}}>
      Not in shared drive
    </Button>
  </>
}

function Folders(props: {parentTree: ParentTree}) {
  const { parentTree } = props;
  if (!parentTree.folder) {
    return null
  }

  return (
    <div className={styles.wikiTree}>
      {parentTree.parents?.map((pi) => {
        return (
          <>
            <a href={pi.url} target="_blank" rel="noreferrer" className={styles.wikiTreeItem}>
              {pi.name}
            </a>
            <span className={styles.wikiTreeIcon}>
              <ChevronRight16 />
            </span>
          </>
        );
      })}
      <a href={parentTree.folder.url} target="_blank" rel="noreferrer" className={styles.wikiTreeItem}>
        {parentTree.folder.name}
      </a>
      <a href={parentTree.file.url} target="_blank" rel="noreferrer" className={styles.wikiTreeIcon}>
        <ChevronRight16 />
      </a>
    </div>
  )
}

export async function runDocs(id: string) {
  const isIframe = (window !== window.parent);

  // Users can add ?versions to the url params to deep-link to the versions page
  var urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('versions')) {
    console.debug('wait to click on versions link');
    const docsNotice = await waitFor(() => {
      const docsNotice = document.getElementById('docs-notice');
      if (!docsNotice || docsNotice.textContent === "" || docsNotice.getAttribute("aria-disabled") === "true") {
        throw new Error("No docs notice");
      }
      return docsNotice
    })
    if (docsNotice) {
      console.debug("found versions link, triggering click")
      triggerMouseEvent(docsNotice, "mousedown", {})
      setTimeout(function(){
        log.info("mouseup")
        triggerMouseEvent(docsNotice, "mouseup", {})
      }, 100)
    } else {
      log.debug("no docs version link found")
    }
  }

  // We assume an iframe means embedded inside gdocwiki.
  // TODO: if that is not the case, this code should be ran
  if (isIframe) {
    log.info('in Iframe, not loading all functionality');
  } else {
    const elements = await waitSelector('.docs-title-outer');
    const containerElement = elements[0] as HTMLDivElement;

    const appContainer = document.createElement('div');
    appContainer.classList.add(styles.container);
    containerElement.append(appContainer);
    ReactDOM.render(<App id={id} />, appContainer);
  }
}
