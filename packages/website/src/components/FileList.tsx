import { Maximize16 } from '@carbon/icons-react';
import { TooltipHost } from 'office-ui-fabric-react';
import { MouseEventHandler } from 'react';
import styles from '../pages/ContentPage/FolderPage.module.scss';
import { DriveFile } from '../utils';
import { FileWithIcon, FileLink } from './DriveFileName';

export interface IFolderFilesProps {
  files: DriveFile[];
}

export interface IFolderListProps extends IFolderFilesProps {
  openInNewWindow?: boolean;
  clickExpandToTable?: MouseEventHandler;
}

export function FolderChildrenList({
  files,
  openInNewWindow = false,
  clickExpandToTable,
}: IFolderListProps) {
  return (
    <div className={styles.content}>
      {clickExpandToTable && (
        <TooltipHost content="expand to table view" styles={{ root: { alignSelf: 'center' } }}>
          <a href="#" title="expand" onClick={clickExpandToTable} style={{ marginLeft: '0.3em' }}>
            <Maximize16 />
          </a>
        </TooltipHost>
      )}
      <ul>
        {files.map((file: gapi.client.drive.File) => {
          return (
            <li key={file.id}>
              <FileLink file={file} openInNewWindow={openInNewWindow}>
                <FileWithIcon file={file} />
              </FileLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}