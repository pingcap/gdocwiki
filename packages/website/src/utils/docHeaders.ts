export interface DocLink {
  text: string;
  id: string;
}

interface DocHeading {
  level: number;
}

export type DocHeader = DocLink & DocHeading;

export function fromHTML(heading: Element): DocHeader {
  const level = parseInt(heading.nodeName.match(/\d/)?.[0] ?? '0');
  let alteredText = '';
  let needsAlteration = false;
  // remove comment
  for (const node of heading.children) {
    if (node.nodeName === 'SUP') {
      const supLink = node.children?.[0];
      if (supLink.id.startsWith('cmnt_')) {
        needsAlteration = true;
        continue;
      }
    }
    alteredText = alteredText + node.textContent ?? '';
  }

  return {
    text: needsAlteration ? alteredText : heading.textContent ?? '',
    id: heading.id,
    level,
  };
}

export function treeHeading(
  heading: DocHeader | TreeHeading,
  entries: (TreeHeading | DocHeader)[]
): TreeHeading {
  if (isTreeHeading(heading)) {
    heading.entries.push(...entries);
    return heading;
  } else {
    return { ...heading, entries };
  }
}

export interface TreeHeading extends DocHeader {
  entries: (TreeHeading | DocHeader)[];
}

export function isTreeHeading(entry: TreeHeading | DocHeader): entry is TreeHeading {
  return 'entries' in entry;
}

export function MakeTree(headings: DocHeader[]): (TreeHeading | DocHeader)[] {
  return makeTree([], headings);

  function makeTree(
    nodes: (TreeHeading | DocHeader)[],
    headings: DocHeader[]
  ): (TreeHeading | DocHeader)[] {
    const heading = headings.shift();
    if (typeof heading === 'undefined') {
      return nodes;
    }

    let node = nodes[nodes.length - 1];
    if (typeof node === 'undefined') {
      return makeTree([heading], headings);
    } else {
      if (node.level === heading.level) {
        nodes.push(heading);
      } else if (node.level < heading.level) {
        if (!isTreeHeading(node)) {
          nodes[nodes.length - 1] = treeHeading(node, [heading]);
        } else {
          makeTree(node.entries, [heading]);
        }
      } else {
        nodes.push(heading);
      }
      return makeTree(nodes, headings);
    }
  }
}
