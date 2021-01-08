import cx from 'classnames';
import isArray from 'lodash/isArray';
import openColor from 'open-color/open-color.json';
import { useMemo } from 'react';
import seedrandom from 'seedrandom';
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

export default function Tag({ text, onClick }: ITagProps) {
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
