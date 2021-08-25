import cx from 'classnames';
import { debounce } from 'lodash-es';
import { waitFor, waitSelector, triggerMouseEvent } from '../utils/contentScript';
import styles from './docs.module.scss';
import { Token } from 'client-oauth2';
import { GapiClient } from '../utils/gapi';
import { Singleflight } from '@zcong/singleflight';
import { getManifestInfo, ManifestDrive, ManifestData } from '../utils/manifest';
import ReactDOM from 'react-dom';
import { useEffect, useState, useMemo } from 'react';
import { useToken } from '../utils/hooks/oauth';
import { Folders16, Launch16, WarningAltFilled16 } from '@carbon/icons-react';
import Button from 'carbon-components-react/lib/components/Button';
import { log } from '../utils/log';

const sf = new Singleflight();

type FileHasId = gapi.client.drive.File & {
  id: string;
}

type TreePathItem = {
  name: string;
  url: string;
};

type FileInfo = {
  fileInfo?: BasicFileInfo
  parentTree?: ParentTree
  sharedExternally?: gapi.client.drive.Permission[]
}

type ParentTree = {
  folder?: TreePathItem;
  parents: Array<TreePathItem>;
}

type BasicFileInfo = {
  isOrphanAndOwner?: boolean;
  privateOwners?: null | gapi.client.drive.User[];
  trashed?: boolean;
  discoveredDrive: ManifestDrive | null;
  discoveredWorkspace: string | null;
  file: TreePathItem;
};

function buildFolderUrl(id: string, drive: ManifestDrive | null) {
  return drive
    ? `${drive.workspace}/view/${id}`
    : `https://drive.google.com/drive/folders/${id}`;
}

function buildFileUrl(id: string, drive: ManifestDrive | null) {
  return drive
    ? `${drive.workspace}/view/${id}`
    : `https://drive.google.com/file/d/${id}`;
}

interface HasEmailAddress {
  emailAddress?: string
}

function splitByDomain<T extends HasEmailAddress>(domain: string, users: T[]): [T[], T[]] {
  const usersWith = []
  const usersWithout = []
  for (const user of users) {
    const em = user.emailAddress
    if (!em) {
      continue
    }
    if (em.split("@")?.[1] === domain) {
      usersWith.push(user)
    } else {
      usersWithout.push(user)
    }
  }
  return [usersWith, usersWithout]
}

function initialFileInfo(
  manifestData: ManifestData | null,
  file: FileHasId,
): BasicFileInfo {
  const drives = manifestData?.drives ?? {};

  let discoveredDrive: ManifestDrive | null = null;
  let discoveredWorkspace: string | null = null;

  for (const name in drives) {
    if (drives[name].driveId === file.driveId) {
      discoveredDrive = drives[name];
      discoveredWorkspace = name;
      break;
    }
  }

  const driveForFile = discoveredDrive || drives[Object.keys(drives)[0]];
  const fileUrl = buildFileUrl(file.id, driveForFile)

  let fi: BasicFileInfo = {
    discoveredDrive,
    discoveredWorkspace,
    file: {
      name: file.name ?? file.id,
      url: fileUrl,
    },
  }

  if (file.trashed) {
    log.info('Skipped the file since it is trashed');
    return {
      ...fi,
      trashed: true,
    };
  }

  if (file.ownedByMe) {
    log.info('File is owned by current user, and it should be orphaned');
    return {
      ...fi,
      isOrphanAndOwner: true,
    };
  }

  if (!file.driveId) {
    log.info(
      'File does not have a drive id, maybe the owner did not put it in the Wiki, skip listing parents'
    );
    const domain = manifestData?.gapiHostedDomain
    const orgOwners = !domain
      ? (file.owners || null)
      : splitByDomain(domain, file.owners ?? [])[0]

    return {
      ...fi,
      privateOwners: orgOwners,
    };
  }

  return fi
}

async function loadFileInfo(
  client: GapiClient,
  fileInfo: BasicFileInfo,
  file: FileHasId,
  ): Promise<ParentTree | undefined> {
  // Now we know the drive of the file, let's list parents.
  log.info(`Listing parents for file ${file.id}`);
  const parents: Array<TreePathItem> = [];
  const visitedParentIds = new Set<string>();
  let currentFile = file as gapi.client.drive.File;
  while (true) {
    log.info('parents', currentFile.parents)
    const parentId = currentFile.parents?.[0];
    if (!parentId) {
      log.info(`break: no parent id`);
      break;
    }
    if (visitedParentIds.has(parentId)) {
      log.info(`Parent has been visited, break the loop`);
      break;
    }
    visitedParentIds.add(parentId);

    const { discoveredDrive, discoveredWorkspace } = fileInfo
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
    folder: parents.pop(),
    parents
  };
}

async function commentPleaseShare(fileId: string, token: Token, content: string): Promise<null> {
  const client = new GapiClient(token);
  log.info(`Getting file info for base file ${fileId}`);
  return await client.addComment(fileId, content);
}

function useFileInfo(fileId: string, token?: Token): [FileInfo, boolean] {
  const [loading, setLoading] = useState(true);
  const [loadToken, setLoadToken] = useState(0); // Used to reload the file
  const [file, setFile] = useState<FileHasId | undefined | null>(undefined);
  const [sharedExternally, setSharedExternally] = useState<gapi.client.drive.Permission[] | undefined>(undefined);
  const [manifestData, setManifestData] = useState<ManifestData | null | undefined>(undefined);
  const [fileInfo, setFileInfo] = useState<BasicFileInfo | undefined>(undefined);
  const [parentFi, setParentFi] = useState<ParentTree | undefined>(undefined);

  const client = useMemo(
    () => token ? new GapiClient(token!) : null,
    [token],
  )

  useEffect(function doGetManifest() {
    async function getManifest() {
      const manifest = await getManifestInfo();
      if (!manifest) {
        log.warn('manifest is unavailable');
        setManifestData(null)
      } else {
        const fi = initialFileInfo(manifest.data, file!)
        setFileInfo(fi)
        setManifestData(manifest.data)
      }
    }

    if (file) {
      sf.do('doGetManifest' + file.id, getManifest);
    }
  }, [file])

  useEffect(function doLoadFile() {
    async function loadFile() {
      if (!client) {
        return
      }

      setLoading(true);
      try {
        log.info('Get Google drive file', fileId);
        const f = await client!.getDriveFile(fileId, {
          fields: '*',
          supportsAllDrives: true,
        });
        if (!f.id) {
          throw new Error (`file does not have id ${f}`);
        } else {
          setFile(f as FileHasId)
        }
      } catch (e) {
        log.error(e);
        setFile(null);
      }
    }

    if (fileId) {
      sf.do('doLoadFile' + fileId, loadFile);
    }
  }, [fileId, client, loadToken]);

  useEffect(function doLoadFileInfo() {
    async function run() {
      if (!file || !client || !fileInfo) {
        return
      }

      setLoading(true);
      try {
        const parentTree = await loadFileInfo(client, fileInfo, file);
        setParentFi(parentTree);
      } catch (e) {
        log.error(e);
      } finally {
        setLoading(false);
      }
    }

    if (file) {
      sf.do('doLoadFileInfo' + file.id, run);
    }
  }, [file, client, fileInfo]);

  useEffect(function checkShareExternalFromDrive() {
    const domain = manifestData?.gapiHostedDomain
    if (!domain || !file) {
      return
    }

    async function checkSharing() {
      if (!file || !file.hasAugmentedPermissions || !client || !domain) {
        return
      }

      // This is for a folder in a shared drive
      log.debug(`file has ${file.permissionIds?.length} augmented permissions`)
      try {
        const data = await client.getFilePermissions(file.id, {
          fields: 'permissions(permissionDetails, id, type, kind, emailAddress, domain, role, displayName)',
          supportsAllDrives: true,
        });
        const anyPerm = data.permissions.filter((perm) => perm.type === 'anyone');
        if (anyPerm) {
          log.info('shared to any', anyPerm);
          setSharedExternally(anyPerm);
        } else {
          const [, notOrgMembers] = splitByDomain(domain, data.permissions)
          if (notOrgMembers.length > 0) {
            log.info('shared to not org', notOrgMembers);
            setSharedExternally(notOrgMembers);
          }
        }
      } catch (e) {
        console.error('error getting file permissions', e)
      }
    }

    if (file.shared && file.permissions) {
      const [, notOrgMembers] = splitByDomain(domain, file.permissions)
      if (notOrgMembers.length > 0) {
        setSharedExternally(notOrgMembers)
      }
      log.info(`file has been shared ${file.permissionIds?.length}`, notOrgMembers)
    } else {
      sf.do('checkShareExternalFromDrive' + file.id, checkSharing);
    }
  }, [file, manifestData, client])

  useEffect(function addFileNameToParam() {
    if (!file) {
      return
    }

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
      log.warn("error trying to add doc name to parameters ", e);
    }
  }, [file]);

  useEffect(function observeDirectoryChange() {
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

  return [{ sharedExternally, fileInfo, parentTree: parentFi }, loading];
}

function App(props: { id: string }) {
  const [token, isTokenLoading] = useToken();
  const [{ sharedExternally, fileInfo, parentTree }] = useFileInfo(props.id, token);

  if (!token || isTokenLoading) {
    return <Loading token={token} isTokenLoading={isTokenLoading} />
  }
  if (!fileInfo || fileInfo.trashed) {
    return null
  }

  return (
    <>
      {sharedExternally && sharedExternally.length > 0 && (
        <span className={cx(styles.tag, styles.warning)}>
          <WarningAltFilled16 style={{ marginRight: 6 }} />
          Externally Shared
        </span>
      )}
      {fileInfo.isOrphanAndOwner && (
        <span className={cx(styles.tag, styles.warning)}>
          <WarningAltFilled16 style={{ marginRight: 6 }} />
          Not in a shared drive
        </span>
      )}
      {fileInfo.privateOwners && <PrivateOwners id={props.id} token={token} privateOwners={fileInfo.privateOwners} />}
      {parentTree && <Folders file={fileInfo.file} parentTree={parentTree} />}
      <a href={fileInfo.file.url} target="_blank" rel="noreferrer" className={styles.wikiTreeIcon}>
        <Launch16/>
      </a>
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

function PrivateOwners(props: { id: string, token: Token, privateOwners: gapi.client.drive.User[]; }) {
  const [showExtra, setShowExtra] = useState(false);
  const [askShared, setAskShared] = useState(false);

  const { privateOwners, token, id } = props;

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
    <Button className={cx(styles.tag, styles.warning)} onClick={() => {setShowExtra(v => !v)}}>
      <WarningAltFilled16 style={{ marginRight: 6 }} />
      Not in a shared drive
    </Button>
  </>
}

function Folders(props: {file: TreePathItem, parentTree: ParentTree}) {
  const { parentTree, file } = props;
  if (!parentTree.folder) {
    return null
  }

  return (
    <div className={styles.wikiTree}>
      <a href={file.url} style={{ paddingRight: '3px', color: 'black' }} target="_blank" rel="noreferrer" className={styles.wikiTreeIcon}>
        <Folders16 />
      </a>
      {parentTree.parents?.map((pi) => {
        return (
          <div key={pi.url}>
            <a href={pi.url} target="_blank" rel="noreferrer" className={styles.wikiTreeItem}>
              {pi.name}
              ／
            </a>
          </div>
        );
      })}
      <a href={parentTree.folder.url} target="_blank" rel="noreferrer" className={styles.wikiTreeItem}>
        {parentTree.folder.name}
        ／
      </a>
    </div>
  )
}

export async function runDocs(id: string) {
  const isIframe = (window !== window.parent);

  // Users can add ?versions to the url params to deep-link to the versions page
  var urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('versions')) {
    log.debug('wait to click on versions link');
    const docsNotice = await waitFor(() => {
      const docsNotice = document.getElementById('docs-notice');
      if (!docsNotice || docsNotice.textContent === "" || docsNotice.getAttribute("aria-disabled") === "true") {
        throw new Error("No docs notice");
      }
      return docsNotice
    })
    if (docsNotice) {
      log.debug("found versions link, triggering click")
      triggerMouseEvent(docsNotice, "mousedown", {})
      setTimeout(function(){
        log.info("mouseup")
        triggerMouseEvent(docsNotice, "mouseup", {})
      }, 100)
    } else {
      log.debug("no docs version link found")
    }
  }

  /* TODO: this does not properly wait for the menu item to be clickable
  if (urlParams.has('suggesting')) {
    log.info('wait for suggesting dropdown');
    const dropdown = await waitFor(() => {
      const modeSwitch = document.getElementById('docs-toolbar-mode-switcher');
      if (!modeSwitch || modeSwitch.style.display === 'none') {
        throw new Error("No mode switcher");
      }
      const dropdown = modeSwitch.querySelector('.goog-toolbar-menu-button-dropdown')
      if (!dropdown || (dropdown as HTMLElement).style.display === 'none') {
        throw new Error("No mode switcher dropdown");
      }
      return dropdown
    })

    if (!dropdown) {
      log.info('no suggesting dropdown');
    } else {
      log.info('clicking on suggesting dropdown');
      triggerMouseEvent(dropdown, "mousedown", {})
      // TODO: actually select suggesting
    }
  }
  */

  // We assume an iframe means embedded inside gdocwiki.
  // TODO: if that is not the case, this code should be ran
  if (isIframe) {
    log.info('in Iframe, not loading all functionality');
  } else {
    const elements = await waitSelector('.docs-title-outer');
    const containerElement = elements[0] as HTMLDivElement;

    const appContainer = document.createElement('div');
    appContainer.classList.add(styles.container);
    containerElement.prepend(appContainer);
    ReactDOM.render(<App id={id} />, appContainer);
  }
}
