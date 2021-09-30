function detectTouchscreen() {
  if (window.PointerEvent && 'maxTouchPoints' in navigator) {
    // if Pointer Events are supported, just check maxTouchPoints
    if (navigator.maxTouchPoints > 0) {
      return true;
    }
  } else {
    // no Pointer Events...
    if (window.matchMedia && window.matchMedia('(any-pointer:coarse)').matches) {
      // check for any-pointer:coarse which mostly means touchscreen
      return true;
    } else if (window.TouchEvent || 'ontouchstart' in window) {
      // last resort - check for exposed touch events API / event handler
      return true;
    }
  }
  return false;
}

export const isTouchScreen = detectTouchscreen();

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

export function removeLinkStyling(style: string): string {
  if (!style.includes('text-decoration')) {
    style = style + ';text-decoration: none';
  }
  if (!style.match(/(^|[; ])color:/)) {
    style = style + ';color: rgb(0, 0, 0);';
  }
  return style;
}

export function fontFamilyEquals(fontFamily, fontFamily2) {
  if (fontFamily[0] !== '"') {
    fontFamily = '"' + fontFamily + '"';
  }
  if (fontFamily2[0] !== '"') {
    fontFamily2 = '"' + fontFamily2 + '"';
  }
  return fontFamily === fontFamily2;
}
