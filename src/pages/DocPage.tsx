import { InlineLoading } from 'carbon-components-react';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

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

  if (isLoading) {
    return <InlineLoading description="Loading document content..." />;
  }

  return <div dangerouslySetInnerHTML={{ __html: docContent }}></div>;
}
