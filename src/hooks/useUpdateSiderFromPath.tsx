import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { getConfig } from '../config';
import { updateActiveId } from '../reduxSlices/siderTree';

export default function useUpdateSiderFromPath(field: string) {
  const dispatch = useDispatch();
  const paramId = useParams<any>()[field];
  const id = paramId ?? getConfig().REACT_APP_ROOT_ID;

  useEffect(() => {
    // Update the ActiveId when it is changed.
    dispatch(updateActiveId(id));
  }, [id, dispatch]);

  return id;
}
