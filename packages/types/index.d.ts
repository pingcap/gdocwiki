declare namespace GdocWiki {
  declare namespace APIPortal {
    export type Methods = {
      setManifestProbeUrl(url: string);
      getManifestProbeUrl(): string | null;
      probeExtensionInfo(): Promise<Extension.DetectInstallResponse | null>;
    };
  }

  declare namespace Extension {
    export type DetectInstallRequest = {
      event: 'detectInstall';
    };

    export type DetectInstallResponse = {
      event: 'detectInstallResponse';
      version: string;
    };

    export type Requests = DetectInstallRequest;

    export type Responses = DetectInstallResponse;
  }
}
