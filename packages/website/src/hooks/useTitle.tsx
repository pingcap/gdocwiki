import { usePersistFn } from 'ahooks';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getConfig } from '../config';
import { selectMapIdToFile } from '../reduxSlices/files';
import { selectRootFolderId } from '../reduxSlices/files';

export default function useTitle<T>(titleBuilder: (T) => string | undefined, dep: T) {
  const memoTitleBuilder = usePersistFn(titleBuilder);
  const mapIdToFile = useSelector(selectMapIdToFile);
  const rootId = useSelector(selectRootFolderId);

  useEffect(() => {
    let suffix = 'Gdoc Wiki';
    if (getConfig().REACT_APP_NAME) {
      suffix = `${getConfig().REACT_APP_NAME} Wiki`;
    } else {
      const s = mapIdToFile?.[rootId ?? '']?.name;
      if (s) {
        suffix = `${s} Wiki`;
      }
    }
    const prefix = memoTitleBuilder(dep);
    if (!prefix) {
      document.title = suffix;
    } else {
      document.title = `${prefix} - ${suffix}`;
    }
  }, [memoTitleBuilder, mapIdToFile, dep, rootId]);
}
