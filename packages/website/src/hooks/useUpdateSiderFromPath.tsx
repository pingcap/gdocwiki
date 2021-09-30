import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { selectRootFolderId, setActiveFileId } from '../reduxSlices/files';
import { setActiveId } from '../reduxSlices/siderTree';

export default function useUpdateSiderFromPath(field: string) {
  const dispatch = useDispatch();
  const paramId = useParams<any>()[field];
  const rootId = useSelector(selectRootFolderId);
  const id = paramId ?? rootId;

  useEffect(() => {
    if (!id) {
      return;
    }
    // Update the ActiveId when it is changed.
    // Note: We will react with the ActiveId to expand nodes in Sider later.
    dispatch(setActiveId(id));
    dispatch(setActiveFileId(id));
  }, [id, dispatch]);

  return id;
}
