import { chromeStorage } from "./storage";

export type ManifestDrive = {
  workspace: string;
  driveId: string;
  rootId: string;
};

export type ManifestData = {
  gapiClientSecret: string;
  gapiClientID: string;
  gapiHostedDomain: string;
  drives: Record<string, ManifestDrive>;
};

export type StoredManifestInfo = {
  uri: string;
  data: ManifestData;
};

export const StoreManifestInfo = "manifestInfo";

export function castManifestData(data: any): ManifestData {
  if (typeof data !== "object") {
    throw new Error("Expect manifest object");
  }
  if (typeof data.gapiClientSecret !== "string") {
    throw new Error("Expect gapiClientSecret string field");
  }
  if (typeof data.gapiClientID !== "string") {
    throw new Error("Expect gapiClientID string field");
  }
  if (typeof data.gapiHostedDomain !== "string") {
    throw new Error("Expect gapiHostedDomain string field");
  }
  if (typeof data.drives !== "object") {
    throw new Error("Expect drives object field");
  }
  for (const key in data.drives) {
    const value = data.drives[key];
    if (typeof value.workspace !== "string") {
      throw new Error(`Expect ${key}.workspace string field`);
    }
    if (typeof value.driveId !== "string") {
      throw new Error(`Expect ${key}.driveId string field`);
    }
    if (typeof value.rootId !== "string") {
      throw new Error(`Expect ${key}.rootId string field`);
    }
  }
  return data as ManifestData;
}

export async function clearManifestInfo() {
  await chromeStorage.remove(StoreManifestInfo);
}

export async function storeManifestInfo(
  workspaceUri: string,
  data: ManifestData
) {
  const info: StoredManifestInfo = {
    uri: workspaceUri,
    data,
  };
  await chromeStorage.set(StoreManifestInfo, info);
}

export async function getManifestInfo(): Promise<
  StoredManifestInfo | undefined
> {
  const info: StoredManifestInfo | undefined = await chromeStorage.get(
    StoreManifestInfo
  );
  return info;
}

export async function mustGetManifestInfo(): Promise<StoredManifestInfo> {
  const manifest = await getManifestInfo();
  if (!manifest) {
    throw new Error("Workspace is not set in the extension option page");
  }
  return manifest;
}
