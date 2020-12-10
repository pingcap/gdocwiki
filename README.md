# gdocwiki

A wiki based on Google Doc / Drive.

## Getting Started

1. Install [Node.js](https://nodejs.org/en/download/package-manager/), [yarn](https://classic.yarnpkg.com/en/docs/install)

2. Install dependencies:

   ```shell
   yarn
   ```

3. Create `.env.local` file for configuration. See [Configuration](#configuration) section below.

4. Start a local development server:

   ```shell
   yarn start
   ```

5. Navigate to http://localhost:3000

## Configuration

You should set up a configuration for local development and building by creating a `.env.local` file. This file is not needed for deployment, since it is embedded into the artifact during the building process.

A sample `.env.local` file could be:

```plain
REACT_APP_GAPI_KEY=...
REACT_APP_GAPI_CLIENT_ID=...
REACT_APP_ROOT_ID=...
REACT_APP_ROOT_DRIVE_ID=...
```

- `REACT_APP_GAPI_KEY`: The Google API Key.

  Google API Key can be obtained by following the [Setting up API keys](https://support.google.com/googleapi/answer/6158862) documentation.

- `REACT_APP_GAPI_CLIENT_ID`: The Google API OAuth Client ID.

  The OAuth Client ID can be obtained by following the [Setting up OAuth 2.0](https://support.google.com/googleapi/answer/6158849) documentation.

  Steps in the "User consent" section in the documentaton above should be completed as well, with the following scopes added:

  - `auth/drive`
  - `auth/documents`

- `REACT_APP_ROOT_ID`: The ID of the Google drive folder that you want to display as the wiki root folder.

  ![](etc/root_folder.png)

  There may be hyphens in the ID. The wiki root folder is not limited to a sub-folder in the shared drive. It could be the shared drive root folder.

  **Note**: Only folders in the "[Shared drives](https://support.google.com/a/users/answer/9310351)" are supported. Folders in the "My Drive" are not supported.

- `REACT_APP_ROOT_DRIVE_ID`: The drive ID where your wiki root folder belongs.

  ![](etc/root_drive_1.png)

  ![](etc/root_drive_2.png)

## Roadmap

- [x] Sign In
  - [x] Homepage Sign In Notification
  - [x] Better Error Handling
- [x] Sign Out
  - [x] Better UI for Sign Out
- [x] Sidebar
  - [x] Expand All & Collapse All
  - [ ] Manage Folder Children Display in Sidebar or Not
  - [x] Activate and Expand Sidebar Item after Reload
  - [x] Load Multi-Page Tree Data
- [x] Render Doc
  - [x] Rewrite links in Doc to open in Wiki
  - [x] Support #xxx in the Doc
- [x] Render Spreadsheet
- [x] Render Folder
  - [x] Clickable Folder Item
  - [ ] Sortable Folder Item
  - [x] Render README in the Folder
  - [x] Support > 1000 Items
- [x] Render Shortcut
  - [x] File
  - [x] Folder
- [ ] Render Drive Root
- [x] Breadcrumb Navigation
- [x] Support external link in syntax `[xxx](https://yyy)`
  - [ ] Open Google Drive External Links in Wiki
- [x] Natural Sort
- [x] Create File in Current Directory
- [x] Open Current File in Google Doc
  - [x] Doc
  - [x] Spreadsheet
- [x] Open Current Directory in Google Drive
- [x] Update Title Dynamically
- [ ] Prettify
  - [x] Pretty font families
  - [x] Pretty monospace fonts
  - [ ] Adjust incorrect margins and paddings
- [ ] More File Operations
  - [ ] Rename
  - [ ] Trash
- [ ] Cache
  - [ ] Cache Preview when Doc is not mofieid
- [ ] Search
  - [ ] Full Text Search
  - [ ] File Name Search
- [ ] Helper Extension
  - [ ] A Chrome Extension for Checking Doc In Tree

## Note

This is not an official PingCAP product.
