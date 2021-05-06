/**
 * Open a new window via `chrome.windows.create` and return when window is closed.
 */
export async function popupChromeWindow(url: string, width: number, height: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let targetWindowId: number | null = null;

    function revokeListener() {
      chrome.windows.onRemoved.removeListener(handleWindowOnRemove);
    }

    function handleWindowOnRemove(windowId: number) {
      if (windowId === targetWindowId && targetWindowId !== null) {
        revokeListener();
        resolve();
      }
    }

    chrome.windows.onRemoved.addListener(handleWindowOnRemove);

    chrome.windows.getCurrent((win) => {
      var left = window.screen.width / 2 - width / 2 - (win.left ?? 0) / 2;
      var top = window.screen.height / 2 - height / 2 - (win.top ?? 0) / 2;
      chrome.windows.create(
        {
          url,
          width,
          height,
          top: Math.round(top),
          left: Math.round(left),
          type: 'popup',
        },
        (w) => {
          if (!w) {
            revokeListener();
            reject(new Error('Failed to create window'));
            return;
          }
          targetWindowId = w.id;
        }
      );
    });
  });
}
