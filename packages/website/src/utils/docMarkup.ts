import { canEdit, parseDriveLink, DriveFile } from './gapi';
import { removeLinkStyling, fontFamilyEquals, isTouchScreen } from './html';

const timing = false;
function timed(msg: string, cb: () => void) {
  if (!timing) {
    cb();
    return;
  }
  const t0 = performance.now();
  cb();
  const t1 = performance.now();
  console.log(msg + ' took ' + (t1 - t0) + ' milliseconds.');
}

const monoFF = ['source code', 'courier', 'mono', 'consolas', 'inconsolata'];

function removeUnsupportedFonts(el: HTMLElement) {
  const ff = el.style.fontFamily;
  if (ff) {
    const fonts = (document as any).fonts;
    const fs = el.style.fontSize || '11pt';
    var font = `${fs} ${ff}`;
    if (fonts && fonts.check && !fonts.check(font)) {
      // console.log('removing unsupported font', font, el, el.textContent);
      el.style.fontFamily = '';
    }
  }
}

// Remove all font families, except for some monospace fonts.
function monoFontsOnly(el: HTMLElement) {
  const ff = el.style.fontFamily.toLowerCase();
  let isMonoFont = false;
  for (const f of monoFF) {
    if (ff.indexOf(f) > -1) {
      isMonoFont = true;
      break;
    }
  }

  el.style.fontFamily = '';
  if (isMonoFont) {
    el.classList.add('__gdoc_monospace');
  }
}

const bgColors = {
  white: 'white',
  '#ffffff': 'white',
  'rgb(255, 255, 255)': 'white',
  'rgb(255,255,255)': 'white',
};

function cleanElem(el: HTMLElement, inherit: AncestorContext): void {
  if (inherit.inTable && !inherit.inList) {
    monoFontsOnly(el);
  }
  removeUnsupportedFonts(el);
  // Remove unnecessary background colors.
  // These can cause text above/below to be cutoff (vertically).
  // This has been seen after running Chrome's tranlsate
  const elBgColor = el.style.backgroundColor;
  const lookupParent =
    (inherit.parentBgColor && bgColors[inherit.parentBgColor]) ?? inherit.parentBgColor;
  const lookupEl = (elBgColor && bgColors[elBgColor]) ?? elBgColor;
  if (inherit.parentBgColor === elBgColor || lookupParent === lookupEl) {
    el.style.backgroundColor = '';
  }
}

type AncestorContext = {
  inTable: boolean;
  inList: boolean;
  parentBgColor: string;
};

// For modifiers that want to forward properties of the ancestors
function modifyDescendants(el: HTMLElement, inherit: AncestorContext) {
  const current = {
    parentBgColor: inherit.parentBgColor,
    inTable: inherit.inTable || el.nodeName === 'TABLE',
    inList: inherit.inList || el.nodeName === 'LI',
  };
  cleanElem(el, current);
  current.parentBgColor = el.style.backgroundColor;

  const childEl = el.firstElementChild as HTMLElement | null;
  if (childEl) {
    modifyDescendants(childEl, current);
  }

  const sibling = el.nextElementSibling as HTMLElement | null;
  if (sibling) {
    modifyDescendants(sibling, inherit);
  }
}

export const gdocIdAttr = '__gdoc_id';
export const origHrefAttr = 'orig_href';

export function rewriteLink(el: HTMLAnchorElement, styles: any) {
  // Rewrite `https://www.google.com/url?q=`
  if (el.href.indexOf('https://www.google.com/url') === 0) {
    const url = new URL(el.href);
    const newHref = url.searchParams.get('q');
    if (newHref) {
      el.href = newHref;
    }
  }

  // Open Google Doc and Google Drive link inline, for other links open in new window.
  const href = el.href;
  const id = parseDriveLink(href);
  if (id) {
    const wikiHref = `/view/${id}`;
    el.href = wikiHref;
    el.dataset[gdocIdAttr] = id;
    el.dataset[origHrefAttr] = href;
    el.classList.add(styles.gdocLink);
  }

  if ((el.getAttribute('href') ?? '').indexOf('#') !== 0) {
    el.target = '_blank';
    el.classList.add('__gdoc_external_link');
  }
}

export function prettify(baseEl: HTMLElement, styles: any, file?: DriveFile) {
  timed('padding fixes', () => {
    for (const li of baseEl.querySelectorAll('li')) {
      fixPaddingLi(li as HTMLLIElement);
    }
  });

  timed('modify descendants', () => {
    // The HTML export will not change the background color even if it is changed in the doc
    let parentBgColor = 'white';
    // The HTML export has only html elements
    modifyDescendants(baseEl, { inList: false, inTable: false, parentBgColor });
  });

  timed('comments', () => {
    for (const sup of baseEl.querySelectorAll('sup')) {
      highlightAndLinkComment(sup);
    }
  });

  timed('link rewrite', () => {
    const elements = baseEl.getElementsByTagName('a');
    for (const el of elements) {
      rewriteLink(el, styles);
    }
  });

  if (file) {
    timed('externally link headers', () => {
      externallyLinkHeaders(baseEl, file);
    });
  }
}

const sourceSansPro = '"Source Sans Pro"';

// In some specific cases enormous padding gets added to both the top and bottom of a list
// In other specific cases some spacing is missing
// Do a lot of specific checks to avoid altering other docs where this is not a problem
function fixPaddingLi(li: HTMLLIElement): boolean {
  // The indent of the second line of the bullet point
  // should match the first
  li.style.textIndent = '-1em';
  li.style.listStylePosition = 'inside';

  const child = li.firstElementChild as HTMLElement | null;
  if (!child || child.nodeName !== 'SPAN') {
    return false;
  }

  // There is not much logic here.
  // This works well based on testing specific examples.
  const isArial = fontFamilyEquals('Arial', li.style.fontFamily);
  const arialChildPro = fontFamilyEquals(sourceSansPro, child.style.fontFamily) && isArial;
  const hasPadding = li.style.paddingTop && li.style.paddingBottom;
  let shouldAddSpace =
    hasPadding && (fontFamilyEquals(sourceSansPro, li.style.fontFamily) || arialChildPro);

  if (!shouldAddSpace && isArial) {
    const grandChild = child.firstElementChild;
    // Add a little spacing to links with underlines
    if (grandChild && grandChild.nodeName === 'A') {
      if ((grandChild as HTMLAnchorElement).style.textDecoration === 'inherit') {
        if (parseInt(li.style.lineHeight) === 1) {
          li.style.lineHeight = '1.3';
          return true;
        }
      }
    }
  }

  if (!shouldAddSpace) {
    return false;
  }

  // Although there is too much padding, there is not enough line spacing
  // 1.5 is already recommended for accessibility
  if (parseInt(li.style.lineHeight) < 1.5) {
    li.style.lineHeight = '1.5';
  }
  if (parseInt(li.style.fontSize) > parseInt(child.style.fontSize)) {
    child.style.fontSize = '';
  }
  if (hasPadding) {
    if (arialChildPro || li.parentElement?.nodeName === 'OL') {
      li.style.paddingTop = '0pt';
      li.style.paddingBottom = '0pt';
    } else {
      li.style.paddingTop = '4pt';
      li.style.paddingBottom = '5pt';
    }
  }
  return true;
}

// Highlight commented text just as in Google Docs.
// Link to the comment text at the bottom of the doc.
function highlightAndLinkComment(sup: HTMLElement){
  const supLink = sup.children?.[0];
  if (supLink?.id.startsWith('cmnt_')) {
    const span = sup.previousElementSibling as HTMLElement;
    if (!span || span.nodeName !== 'SPAN') {
      if (span && span.id.startsWith('cmnt_')) {
        // There are multiple sups next to eachother for replies
        // This removes the replies
        sup.remove();
      }
      return;
    }

    const link = document.createElement('a');
    const href = supLink.getAttribute('href');
    if (!href) {
      console.error('no href for a link');
      return;
    }
    link.setAttribute('href', href);
    for (const name of span.getAttributeNames()) {
      link.setAttribute(name, span.getAttribute(name) ?? '');
    }
    let style = span.getAttribute('style') || '';
    // The linked text should not be styled like a link.
    // The highlight already indicates it is a link like in Google Docs.
    link.setAttribute('style', removeLinkStyling(style));
    if (!link.style.backgroundColor) {
      link.style.backgroundColor = 'rgb(255, 222, 173)';
    }
    // The highlight can obscure other content
    // inline-block fixes this.
    // We apply a textIndent fix to bulleted lists elsewhere
    // This does not play nicely with inline-block. so skip those
    // TODO: we could try increasing the line-height
    if (!link.style.display && !span.parentElement?.style.textIndent) {
      link.style.display = 'inline-block';
    }
    link.innerHTML = span.innerHTML;
    link.id = supLink.id;
    link.dataset['gdocwiki_comment_id'] = href.slice(1);
    sup.remove();
    span.replaceWith(link);
  }
}

function externallyLinkHeaders(baseEl: HTMLElement, file: DriveFile) {
  const fileId = file.id!;
  const editable = canEdit(file);
  function headerLink(headerId: string): HTMLAnchorElement {
    let link = document.createElement('a');
    const path = editable ? 'edit' : 'preview';
    const base = isTouchScreen ? 'https://docs.google.com/document/d' : '/view';
    const href = `${base}/${fileId}/${path}#heading=${headerId}`;
    link.href = href;
    link.dataset[gdocIdAttr] = fileId;
    return link;
  }

  function childrenArray(el: HTMLElement) {
    return Array.from(el.childNodes) as HTMLElement[];
  }
  function everyNodeNamed(els: HTMLElement[], nodeName: string) {
    return els.every((n) => n.nodeName === nodeName);
  }

  // Link from headers into the GDoc
  const headers = Array.from(
    baseEl.querySelectorAll('h1, h2, h3, h4, h5, h6')
  ) as HTMLHeadingElement[];
  for (const el of headers) {
    let children = childrenArray(el);

    // If a header is all links or spans with links, it is already a link, ignore it
    if (
      children.every(
        (n) =>
          n.nodeName === 'A' ||
          (n.nodeName === 'SPAN' && everyNodeNamed(childrenArray(n as HTMLElement), 'A'))
      )
    ) {
      continue;
    }

    if (children.every((n) => n.nodeName === 'SPAN')) {
      let style: string | null = null;
      for (const inner of children) {
        if (!style) {
          style = (inner as HTMLElement).getAttribute('style');
        }
        let link = headerLink(el.id);
        link.innerHTML = (inner as HTMLElement).innerHTML;
        for (const a of (inner as HTMLElement).attributes) {
          link.setAttribute(a.name, a.value);
        }
        if (!link.style.textDecoration) {
          link.style.textDecoration = 'none';
        }
        if (!link.style.color) {
          link.style.color = 'rgb(0, 0, 0)';
        }
        el.appendChild(link);
        el.removeChild(inner);
      }
      // Fix a Google Docs export bug
      // Sometimes when there are multiple spans in the header
      // Some of the span are missing the header styling
      if (style) {
        for (const child of el.childNodes) {
          if (!(child as HTMLElement).getAttribute('style')) {
            (child as HTMLElement).setAttribute('style', style);
          }
        }
      }
    } else {
      const link = headerLink(el.id);
      el.appendChild(link);
      for (const inner of children) {
        link.appendChild(inner);
      }
    }
  }
}
