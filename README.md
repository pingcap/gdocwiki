# gdocwiki

A wiki based on Google Doc / Drive.

## Getting Started

1. Install [Node.js](https://nodejs.org/en/download/package-manager/), [yarn](https://classic.yarnpkg.com/en/docs/install)

2. Install dependencies:

   ```shell
   yarn
   ```

3. Create `.env.local` file for configuration:

   ```plain
   REACT_APP_GAPI_KEY=(Google API Key, apply at https://console.developers.google.com/apis/credentials)
   REACT_APP_GAPI_CLIENT_ID=(Google API OAuth Client ID, apply at https://console.developers.google.com/apis/credentials)
   REACT_APP_ROOT_DRIVE_ID=(The root folder that you want this wiki to display)
   REACT_APP_ROOT_ID=(The drive ID of the root folder, used to retrieve hierarchy efficiently)
   ```

4. Start a local development server:

   ```shell
   yarn start
   ```

5. Navigate to http://localhost:3000

## Roadmap

- [x] Sign In
  - [x] Homepage Sign In Notification
  - [ ] Better Error Handling
- [x] Sign Out
  - [ ] Better UI for Sign Out
- [x] Sidebar
  - [x] Expand All & Collapse All
  - [ ] Manage Folder Children Display in Sidebar or Not
  - [x] Activate and Expand Sidebar Item after Reload
  - [x] Load Multi-Page Tree Data
- [x] Render Doc
  - [ ] Rewrite links in Doc to open in Wiki
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
  - [ ] Pretty monospace fonts
  - [ ] Adjust incorrect margins and paddings
- [ ] Search
  - [ ] Full Text Search
  - [ ] File Name Search
- [ ] Helper Extension
  - [ ] A Chrome Extension for Checking Doc In Tree
