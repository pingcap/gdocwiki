import { InlineLoading, SkeletonText } from 'carbon-components-react';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import styles from './DocPage.module.scss';

export default function DocPage() {
  const { id } = useParams();
  const [docContent, setDocContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function x() {
      setIsLoading(true);
      try {
        const resp = await gapi.client.drive.files.export({
          fileId: id,
          mimeType: 'text/html',
        });
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(resp.body, 'text/html');
        const bodyEl = htmlDoc.querySelector('body');
        if (bodyEl) {
          const styleEls = htmlDoc.querySelectorAll('style');
          styleEls.forEach((el) => bodyEl.appendChild(el));
          setDocContent(bodyEl.innerHTML);
        } else {
          setDocContent('Error?');
        }
      } finally {
        setIsLoading(false);
      }
    }
    x();
  }, [id]);

  return (
    <div className={styles.contentContainer}>
      {isLoading && (
        <div>
          <SkeletonText heading />
          <SkeletonText paragraph lineCount={10} />
        </div>
      )}
      {!isLoading && <div dangerouslySetInnerHTML={{ __html: docContent }}></div>}
    </div>
  );
}
