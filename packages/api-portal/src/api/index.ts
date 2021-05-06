import { connectToParent } from 'penpal';

const methods: GdocWiki.APIPortal.Methods = {
  setManifestProbeUrl(url: string) {
    if (url) {
      localStorage.setItem('manifestUrl', url);
    }
  },
  getManifestProbeUrl(): string | null {
    return localStorage.getItem('manifestUrl');
  },
  probeExtensionInfo(): Promise<GdocWiki.Extension.DetectInstallResponse | null> {
    return new Promise((resolve) => {
      let resolved = false;

      setTimeout(() => {
        if (!resolved) {
          resolve(null);
        }
      }, 500);

      if (chrome && chrome.runtime) {
        const payload: GdocWiki.Extension.DetectInstallRequest = { event: 'detectInstall' };
        chrome.runtime.sendMessage(
          'pcnhielddaaanlfkifllbjahdbndndea',
          payload,
          (response: GdocWiki.Extension.DetectInstallResponse) => {
            console.log('Received response from extension', response);
            resolve(response);
            resolved = true;
          }
        );
      } else {
        resolve(null);
        resolved = true;
      }
    });
  },
};

connectToParent({
  debug: true,
  methods,
});
