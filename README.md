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
  - [ ] Expand All & Collapse All
  - [ ] Manage Folder Children Display in Sidebar or Not
  - [ ] Activate and Expand Sidebar Item after Reload
- [x] Render Doc
  - [ ] Rewrite links in Doc to open in Wiki
- [ ] Render Spreadsheet
- [x] Render Folder
  - [ ] Clickable Folder Item
  - [ ] Sortable Folder Item
- [ ] Render File Shortcut
- [ ] Render Folder Shortcut
- [x] Render Drive Root
- [x] Breadcrumb Navigation
- [x] Support external link in syntax `[xxx](https://yyy)`
- [ ] Customize Menu Item Sort Order
- [ ] Create File in Current Directory
- [ ] Open Current File in Google Doc
- [ ] Open Current Directory in Google Drive
