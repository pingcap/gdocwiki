import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { getConfig } from '../config';
import { setDriveId, setRootFolderId, selectRootFolderId  } from '../reduxSlices/files';
import { setActiveId } from '../reduxSlices/siderTree';

export default function useUpdateSiderFromPath(field: string) {
  const dispatch = useDispatch();
  const paramId = useParams<any>()[field];
  const rootId = useSelector(selectRootFolderId);
  const id = paramId ?? rootId;

  useEffect(() => {
    // Update the ActiveId when it is changed.
    // Note: We will react with the ActiveId to expand nodes in Sider later.
    dispatch(setActiveId(id));

    // probably only do this once though
    if (!id) {
      const conf = getConfig();
      if (conf.REACT_APP_ROOT_DRIVE_ID) {
        dispatch(setDriveId(conf.REACT_APP_ROOT_DRIVE_ID));
      }
      if (conf.REACT_APP_ROOT_ID) {
        dispatch(setRootFolderId(conf.REACT_APP_ROOT_ID));
      }
    }
  }, [id, dispatch]);

  return id;
}
