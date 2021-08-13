import cx from 'classnames';
import isArray from 'lodash/isArray';
import { Stack } from 'office-ui-fabric-react';
import openColor from 'open-color/open-color.json';
import React, { useMemo } from 'react';
import { Link, useHistory } from 'react-router-dom';
import seedrandom from 'seedrandom';
import { extractTags, DriveFile } from '../utils';
import styles from './Tag.module.scss';

const tagColors: string[] = [];
const foreColors: string[] = [];
for (const colorName in openColor) {
  const c = openColor[colorName];
  if (isArray(c)) {
    tagColors.push(c[2], c[5], c[8]);
    // Contrast color based on luminance doesn't work well.. So fore colors are given manually.
    foreColors.push('#000', '#fff', '#fff');
  }
}

export interface ITagProps {
  text: string;
  onClick?: () => void;
}

function stringToColor(s: string): [string, string] {
  const rng = seedrandom(s.slice(0, Math.min(s.length, 3)));
  const pos = Math.floor(rng() * tagColors.length);
  return [tagColors[pos], foreColors[pos]];
}

export function Tag({ text, onClick }: ITagProps) {
  const bgAndFore = useMemo(() => stringToColor(text), [text]);
  return (
    <span
      className={cx([styles.tag], { [styles.isClickable]: !!onClick })}
      style={{
        backgroundColor: bgAndFore[0],
        color: bgAndFore[1],
      }}
      onClick={onClick}
    >
      {text}
    </span>
  );
}

function LinkTag({ text }: ITagProps) {
  const history = useHistory();
  return (
    <Tag text={text} onClick={() => history.push(`/search/tag/${encodeURIComponent(text)}`)} />
  );
}

Tag.Link = React.memo(LinkTag);

export function Tags({ file, style, add = false }: { file: DriveFile, add?: boolean, style?: React.CSSProperties }) {
  const tags = useMemo(() => extractTags(file), [file]);

  if (tags.length === 0) {
    return null;
  }

  return (
    <Stack horizontal>
      <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 4 }} style={style}>
        {tags.map((tag) => (
          <Tag.Link key={tag} text={tag} />
        ))}
      </Stack>
      {add && (
        <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 4 }} style={style}>
          <Link to={`/view/${file.id}/settings`}>Add Tag</Link>
        </Stack>
      )}
    </Stack>
  );
}