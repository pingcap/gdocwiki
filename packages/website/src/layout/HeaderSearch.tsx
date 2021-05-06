import { useDebounceFn } from 'ahooks';
import { TextInput } from 'carbon-components-react';
import React, { ChangeEvent, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styles from './HeaderSearch.module.scss';

function HeaderSearch() {
  const location = useLocation();
  const { pathname } = location;
  const pathKey = '/search/keyword/';
  const initKeyword = pathname.includes(pathKey)
    ? pathname.substr(pathname.indexOf(pathKey) + pathKey.length)
    : '';

  const [keyword, setKeyword] = useState(initKeyword);
  const history = useHistory();

  const handleSearchThrottled = useDebounceFn(
    () => {
      if (!keyword || keyword === '') {
        history.replace('/');
      } else {
        history.replace(`${pathKey}${keyword}`);
      }
    },
    { wait: 500 }
  );

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setKeyword(value);
    handleSearchThrottled.run();
  };

  return (
    <div className={styles.HeaderSearch}>
      <TextInput
        id="search-input"
        invalidText="A valid value is required"
        labelText=""
        placeholder="Please input search keyword"
        size="sm"
        onChange={onChange}
        defaultValue={initKeyword}
      />
    </div>
  );
}

export default React.memo(HeaderSearch);
