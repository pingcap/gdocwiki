import cx from 'classnames';
import { debounce } from 'lodash-es';
import { waitFor, waitSelector, triggerMouseEvent } from '../utils/contentScript';
import styles from './docs.module.scss';
import { Token } from 'client-oauth2';
import { GapiClient } from '../utils/gapi';
import { Singleflight } from '@zcong/singleflight';
import { getManifestInfo, ManifestDrive } from '../utils/manifest';
import ReactDOM from 'react-dom';
import React, { useEffect, useState } from 'react';
import { useToken } from '../utils/hooks/oauth';
import { ChevronRight16, Launch16, WarningAltFilled16 } from '@carbon/icons-react';
import { log } from '../utils/log';

const sf = new Singleflight();

type TreePathItem = {
  name: string;
  url: string;
};

type FileInfo = {
  isOrphanAndOwner?: boolean;
  parentItems?: Array<TreePathItem>;
};

function buildWikiUrl(drive: ManifestDrive, id: string) {
  return `${drive.workspace}/view/${id}`;
}

async function loadFileInfo(fileId: string, token: Token): Promise<FileInfo | undefined> {
  const manifest = await getManifestInfo();
  if (!manifest) {
    log.warn('Skipped since manifest is unavailable');
  }
  const client = new GapiClient(token);
  log.info(`Getting file info for base file ${fileId}`);
  const file = await client.getDriveFile(fileId, {
    fields: '*',
    supportsAllDrives: true,
  });
  log.info('File metadata', file);
  if (file.trashed) {
    log.info('Skipped the file since it is trashed');
    return;
  }
  if (file.ownedByMe) {
    log.info('File is owned by current user, and it should be orphan');
    return {
      isOrphanAndOwner: true,
    };
  }
  if (!file.driveId) {
    log.info(
      'File does not have a drive id, maybe the owner did not put it in the Wiki, skip listing parents'
    );
    return {};
  }

  let discoveredDrive: ManifestDrive | undefined;
  let discoveredWorkspace: string | undefined;

  const { drives } = manifest!.data;
  for (const name in drives) {
    if (drives[name].driveId === file.driveId) {
      discoveredDrive = drives[name];
      discoveredWorkspace = name;
      break;
    }
  }
  if (discoveredDrive === undefined) {
    log.info(
      `File drive ${file.driveId} does not match drives in the manifest, skip listing parents`
    );
    return {};
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

    if (discoveredDrive.driveId === parentId || discoveredDrive.rootId === parentId) {
      log.info(`Parent is the workspace, finished`, discoveredWorkspace, discoveredDrive);
      parents.push({
        name: discoveredWorkspace!,
        url: buildWikiUrl(discoveredDrive, parentId),
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
        url: buildWikiUrl(discoveredDrive, parentId),
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
    parentItems: parents,
  };
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

  return (
    <>
      {Boolean(!isTokenLoading && !token) && (
        <a
          className={cx(styles.tag, styles.danger, styles.clickable)}
          href={chrome.runtime.getURL('options.html')}
          target="_blank"
          rel="noreferrer"
        >
          <Launch16 style={{ marginRight: 6 }} />
          GdocWiki Extension Not Enabled
        </a>
      )}
      {Boolean(fi && fi.isOrphanAndOwner) && (
        <span className={cx(styles.tag, styles.warning)}>
          <WarningAltFilled16 style={{ marginRight: 6 }} />
          Document outside the Wiki
        </span>
      )}
      {Boolean(fi && fi.parentItems) && (
        <div className={styles.wikiTree}>
          {fi?.parentItems?.map((pi) => {
            return (
              <>
                <a href={pi.url} target="_blank" rel="noreferrer" className={styles.wikiTreeItem}>
                  {pi.name}
                </a>
                <span>
                  <ChevronRight16 />
                </span>
              </>
            );
          })}
        </div>
      )}
    </>
  );
}

export async function runDocs(id: string) {
  // Add ?versions to the url params to deep-link to the versions page
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
        console.log("mouseup")
        triggerMouseEvent(docsNotice, "mouseup", {})
      }, 100)
    } else {
      console.debug("no docs version link found")
    }
  }

  const elements = await waitSelector('.docs-title-outer');
  const containerElement = elements[0] as HTMLDivElement;

  const appContainer = document.createElement('div');
  appContainer.classList.add(styles.container);
  containerElement.prepend(appContainer);
  ReactDOM.render(<App id={id} />, appContainer);
}
