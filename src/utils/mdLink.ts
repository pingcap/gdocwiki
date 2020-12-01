export type MarkdownLink = {
  url: string;
  title: string;
};

function parse(link?: string): MarkdownLink | null {
  if (!link) {
    return null;
  }
  const m = link.match(/^\[([\s\S]*?)\]\(([\s\S]*?)\)$/);
  if (!m) {
    return null;
  }
  return {
    title: m[1],
    url: m[2],
  };
}

const mdLink = {
  parse,
};

export default mdLink;
