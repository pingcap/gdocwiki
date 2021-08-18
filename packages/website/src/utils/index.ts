export * from './auth';
export * from './extensionApi';
export * from './gapi';
export * from './history';
export * from './icons';
export * from './mdLink';
export * from './showModal';
export * from './store';
export * from './doc';
export * from './file';
export * from './requestQueue';

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
