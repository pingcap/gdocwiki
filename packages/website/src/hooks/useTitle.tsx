import { usePersistFn } from 'ahooks';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getConfig } from '../config';
import { selectDriveId, selectMapIdToFile, selectRootFolderId } from '../reduxSlices/files';

export default function useTitle<T>(titleBuilder: (T) => string | undefined, dep: T) {
  const memoTitleBuilder = usePersistFn(titleBuilder);
  const mapIdToFile = useSelector(selectMapIdToFile);
  const rootId = useSelector(selectRootFolderId);
  const driveId = useSelector(selectDriveId);

  useEffect(() => {
    const conf = getConfig();
    const driveName = !rootId ? '' : mapIdToFile?.[rootId]?.name ?? '';
     const isMyDrive = rootId === 'root' || driveName === 'My Drive';
    const appName = conf.APP_NAME || 'Gdoc Wiki';
    const confDriveId = conf.REACT_APP_ROOT_DRIVE_ID;
    const locationName =
      (confDriveId && confDriveId === driveId && conf.REACT_APP_NAME) ||
      (!driveName || isMyDrive ? '' : driveName);
    const suffix = locationName + appName;
    const prefix = memoTitleBuilder(dep);
    if (!prefix) {
      document.title = suffix;
    } else {
      document.title = `${prefix} - ${suffix}`;
    }
  }, [memoTitleBuilder, mapIdToFile, dep, rootId, driveId]);
}
