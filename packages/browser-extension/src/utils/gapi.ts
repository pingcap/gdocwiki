import { Singleflight } from '@zcong/singleflight';
import axios, { AxiosInstance } from 'axios';
import type { Token } from 'client-oauth2';
import { log } from './log';

export type DriveFile = gapi.client.drive.File;

export type GapiUserInfo = {
  email: string;
  family_name: string;
  given_name: string;
  hd: string;
  id: string;
  locale: string;
  name: string;
  picture: string;
  verified_email: boolean;
};

export class GapiClient {
  authToken: Token;
  client: AxiosInstance;
  sf: Singleflight;

  constructor(authToken: Token) {
    this.authToken = authToken;
    this.client = axios.create({
      timeout: 20000,
      headers: { Authorization: `Bearer ${authToken.accessToken}` },
    });
    this.sf = new Singleflight();
  }

  async getUserInfoProfile(): Promise<GapiUserInfo> {
    try {
      const r = await this.client.get('https://www.googleapis.com/oauth2/v1/userinfo');
      return r.data as GapiUserInfo;
    } catch (e) {
      throw new Error(`Failed to read user profile: ${e.message}`);
    }
  }

  async addComment(
    fileId: string,
    content: string,
  ): Promise<null> {
    try {
      await this.client.post(`https://www.googleapis.com/drive/v3/files/${fileId}/comments?fields=*`, {
          content,
      });
      return null;
    } catch (e) {
      throw new Error(`Failed to post user comment: ${e.message}`);
    }
  }

  async getDriveFile(
    fileId: string,
    params: {
      /** Whether the user is acknowledging the risk of downloading known malware or other abusive files. This is only applicable when alt=media. */
      acknowledgeAbuse?: boolean;
      /** Selector specifying which fields to include in a partial response. */
      fields?: string;
      /** Specifies which additional view's permissions to include in the response. Only 'published' is supported. */
      includePermissionsForView?: string;
      /** Whether the requesting application supports both My Drives and shared drives. */
      supportsAllDrives?: boolean;
      /** Deprecated use supportsAllDrives instead. */
      supportsTeamDrives?: boolean;
    }
  ): Promise<DriveFile> {
    const fn = async () => {
      try {
        const r = await this.client.get(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
          params,
        });
        return r.data as DriveFile;
      } catch (e) {
        log.error(e);
        throw new Error(`Failed to get drive file: ${e.message}`);
      }
    };
    return this.sf.do(fileId, fn);
  }
}
