import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { getConfig } from '../config';
import { selectDriveId } from '../reduxSlices/files';
import { setActiveId } from '../reduxSlices/siderTree';

export default function useUpdateSiderFromPath(field: string) {
  const dispatch = useDispatch();
  const paramId = useParams<any>()[field];
  const driveId = useSelector(selectDriveId);
  const id = paramId ?? driveId ?? getConfig().REACT_APP_ROOT_ID;

  useEffect(() => {
    // Update the ActiveId when it is changed.
    // Note: We will react with the ActiveId to expand nodes in Sider later.
    dispatch(setActiveId(id));
  }, [id, dispatch]);

  return id;
}
