import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import React, { useEffect, useState } from 'react';
import Avatar from 'react-avatar';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import { MultiLineSkeleton } from '../components';

dayjs.extend(relativeTime);

export interface IDocPageProps {
  file: gapi.client.drive.File;
}

export default function DocPage({ file }: IDocPageProps) {
  const [docContent, setDocContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPreview() {
      setIsLoading(true);
      setDocContent('');

      try {
        const resp = await gapi.client.drive.files.export({
          fileId: file.id!,
          mimeType: 'text/html',
        });
        console.log('files.export', file.id, resp);

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
    loadPreview();
  }, [file.id]);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <Stack tokens={{ childrenGap: 16 }}>
          {/* <h1>{file.name}</h1> */}
          <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 16 }}>
            <Avatar
              name={file.lastModifyingUser?.displayName}
              src={file.lastModifyingUser?.photoLink}
              size="20"
              round
            />
            <span>
              Last modified by {file.lastModifyingUser?.displayName}{' '}
              {dayjs(file.modifiedTime).fromNow()}
            </span>
          </Stack>
        </Stack>
      </div>
      {isLoading && <MultiLineSkeleton />}
      {!isLoading && <div dangerouslySetInnerHTML={{ __html: docContent }}></div>}
    </div>
  );
}
