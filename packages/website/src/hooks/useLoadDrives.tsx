import { useEffect, useState } from 'react';
import { driveToFolder } from '../utils';

export default function useLoadDrives(): gapi.client.drive.File[] {
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

  return driveFolders;
}
