import { createSlice } from '@reduxjs/toolkit';
import { DriveFile, MimeTypePreferredDisplay } from '../utils';
import { DocHeader, TreeHeading } from '../utils/docHeaders';
import { MimeTypes } from '../utils/gapi';

export interface DriveLink {
  driveLink: string;
  linkText: string;
  wikiLink: string;
  id: string;
  file?: DriveFile;
}

export interface ExternalLink {
  href: string;
  linkText: string | null;
}

export interface DocState {
  file: DriveFile | null;
  modes: MimeTypePreferredDisplay;
  headers?: (TreeHeading | DocHeader)[];
  comments: gapi.client.drive.Comment[];
  driveLinks: { [fileId: string]: DriveLink };
  externalLinks: { [fileId: string]: ExternalLink };
}

let mimeTypePreferredDisplay: MimeTypePreferredDisplay = {};
mimeTypePreferredDisplay[MimeTypes.GoogleDocument] = 'view';
mimeTypePreferredDisplay[MimeTypes.GoogleSpreadsheet] = 'preview';

const initialStateDoc: DocState = {
  modes: mimeTypePreferredDisplay,
  file: null,
  headers: [],
  comments: [],
  driveLinks: {},
  externalLinks: {},
};

export const slice = createSlice({
  name: 'doc',
  initialState: initialStateDoc,
  reducers: {
    setDocMode: (state, { payload }: { payload: MimeTypePreferredDisplay }) => {
      state.modes = Object.assign(state.modes, payload);
    },
    resetDocMode: (state, { payload }: { payload: string }) => {
      const newModes = {};
      newModes[payload] = mimeTypePreferredDisplay[payload];
      state.modes = Object.assign(state.modes, newModes);
    },
    setFile: (state, { payload }: { payload: DriveFile }) => {
      state.file = payload;
    },
    setNoFile: (state, { payload }: { payload: undefined }) => {
      state.file = null;
    },
    setHeaders: (state, { payload }: { payload: (TreeHeading | DocHeader)[] }) => {
      state.headers = payload;
    },
    setComments: (state, { payload }: { payload: gapi.client.drive.Comment[] }) => {
      state.comments = payload;
    },
    addDriveLinks: (state, { payload }: { payload: DriveLink[] }) => {
      const newLinks = {};
      for (const link of payload) {
        newLinks[link.id] = link;
      }
      state.driveLinks = Object.assign({}, newLinks, state.driveLinks);
    },
    setDriveLinks: (state, { payload }: { payload: DriveLink[] }) => {
      const newLinks = {};
      for (const link of payload) {
        newLinks[link.id] = link;
      }
      state.driveLinks = newLinks;
    },
    addExternalLinks: (state, { payload }: { payload: ExternalLink[] }) => {
      const newLinks = {};
      for (const link of payload) {
        newLinks[link.href] = link;
      }
      state.externalLinks = Object.assign({}, newLinks, state.externalLinks);
    },
    setExternalLinks: (state, { payload }: { payload: ExternalLink[] }) => {
      const newLinks = {};
      for (const link of payload) {
        newLinks[link.href] = link;
      }
      state.externalLinks = newLinks;
    },
  },
});

export const {
  setDocMode,
  resetDocMode,
  setFile,
  setNoFile,
  setHeaders,
  setComments,
  addDriveLinks,
  setDriveLinks,
  addExternalLinks,
  setExternalLinks,
} = slice.actions;

export const selectHeaders = (state: { doc: DocState }) => state.doc.headers;
export const selectComments = (state: { doc: DocState }) => state.doc.comments;
export const selectDriveFile = (state: { doc: DocState }) => state.doc.file;
export const selectDocMode = (mimeType: string) => {
  return (state: { doc: DocState }) => {
    return state.doc.modes[mimeType];
  };
};
export const selectDriveLinks = (state: { doc: DocState }) => {
  return Object.values(state.doc.driveLinks);
};
export const selectExternalLinks = (state: { doc: DocState }) => {
  return Object.values(state.doc.externalLinks);
};
export const selectDriveLinksLookup = (state: { doc: DocState }) => state.doc.driveLinks;

export default slice.reducer;
