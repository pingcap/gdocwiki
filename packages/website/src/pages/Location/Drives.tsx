import { Stack } from 'office-ui-fabric-react';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { FileWithIcon, Typography } from '../../components';
import { setDrive } from '../../reduxSlices/files';
import { driveToFolder } from '../../utils';
import RightContainer from '../RightContainer';

export function AllDrivesList() {
  const dispatch = useDispatch();
  const [driveFolders, setDriveFolders] = useState([] as gapi.client.drive.File[]);

  useEffect(
    function doGetDrives() {
      async function getDrives() {
        try {
          const rsp = await gapi.client.drive.drives.list({
            pageSize: 100,
          });
          setDriveFolders((rsp.result.drives ?? []).map(driveToFolder));
        } catch (e) {
          console.error('getDrives', e);
        }
      }
      getDrives();
    },
    [setDriveFolders]
  );

  return (
    <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 4 }}>
      <ul>
        {driveFolders.map((file) => (
          <li key={file.id}>
            <Link to={`/view/${file.id}`} onClick={() => dispatch(setDrive(file))}>
              <FileWithIcon file={file} />
            </Link>
          </li>
        ))}
      </ul>
    </Stack>
  );
}

export default function Drives() {
  return (
    <RightContainer>
      <Typography.Title>All Drives</Typography.Title>
      <AllDrivesList />
    </RightContainer>
  );
}