import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FileWithIcon, Typography } from '../../components';
import styles from '../../pages/ContentPage/FolderPage.module.scss';
import { setDrive, selectDrives } from '../../reduxSlices/files';
import RightContainer from '../RightContainer';

export function AllDrivesList() {
  const driveFolders = useSelector(selectDrives);
  const dispatch = useDispatch();

  return (
    <div className={styles.content}>
      <ul>
        {driveFolders.map((file) => (
          <li key={file.id}>
            <Link to={`/view/${file.id}`} onClick={() => dispatch(setDrive(file))}>
              <FileWithIcon file={file} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Drives() {
  return (
    <RightContainer>
      <div style={{ paddingTop: '1em' }}>
        <Typography.Title>All Drives</Typography.Title>
      </div>
      <AllDrivesList />
    </RightContainer>
  );
}
