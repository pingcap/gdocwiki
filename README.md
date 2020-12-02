# gdocwiki

A wiki based on Google Doc / Drive.

## Getting Started

1. Install [Node.js](https://nodejs.org/en/download/package-manager/), [yarn](https://classic.yarnpkg.com/en/docs/install)

2. Install dependencies:

   ```shell
   yarn
   ```

3. Start a local development server:

   ```shell
   yarn start
   ```

4. Navigate to http://localhost:3000

## Roadmap

- [x] Sign In
  - [ ] Homepage Sign In Notification
  - [ ] Better Error Handling
- [x] Sign Out
  - [ ] Better UI for Sign Out
- [x] Sidebar
  - [x] Expand All & Collapse All
  - [ ] Manage Folder Children Display in Sidebar or Not
  - [ ] Activate and Expand Sidebar Item after Reload
  - [ ] Load Multi-Page Tree Data
- [x] Render Doc
  - [ ] Rewrite links in Doc to open in Wiki
- [x] Render Spreadsheet
- [x] Render Folder
  - [ ] Clickable Folder Item
  - [ ] Sortable Folder Item
  - [x] Render README in the Folder
  - [ ] Support > 1000 Items
- [x] Render Shortcut
  - [x] File
  - [x] Folder
- [ ] Render Drive Root
- [x] Breadcrumb Navigation
- [x] Support external link in syntax `[xxx](https://yyy)`
  - [ ] Open Google Drive External Links in Wiki
- [ ] Customize Menu Item Sort Order
- [ ] Create File in Current Directory
- [x] Open Current File in Google Doc
  - [x] Doc
  - [x] Spreadsheet
- [x] Open Current Directory in Google Drive
- [ ] Update Title Dynamically
