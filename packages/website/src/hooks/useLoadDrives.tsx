import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectDrives, setDrives } from '../reduxSlices/files';

export default function useLoadDrives(): gapi.client.drive.File[] {
  const dispatch = useDispatch();
  const driveFolders = useSelector(selectDrives);

  useEffect(
    function doGetDrives() {
      async function getDrives() {
        try {
          const rsp = await gapi.client.drive.drives.list({
            pageSize: 100,
          });
          dispatch(setDrives(rsp.result.drives ?? []));
        } catch (e) {
          console.error('getDrives', e);
        }
      }
      getDrives();
    },
    [dispatch]
  );

  return driveFolders;
}
