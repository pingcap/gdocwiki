# gdocwiki

A wiki based on Google Doc / Drive.

## User Guide

Gdocwiki combines a folder tree view in a sidebar (equivalent to drive.google.com) with a document viewer in the main panel (equivalent to docs.google.com, etc). Documents can be browsed and edited without opening (lots of) new tabs. This helps the user stay in flow and understand the folder hierarchy.

Gdocwiki also helps with understanding lots of documents. README files in a folder are automatically rendered to give an overview of a directory. Tags and folder hierarchy are shown wherever docs are shown.

Gdocwiki defaults to a mobile-friendly HTML preview with comments. Switch to edit mode to start writing. On mobile this will link out to the Google Docs mobile app.


## Getting Started

1. Install [Node.js](https://nodejs.org/en/download/package-manager/), [yarn](https://classic.yarnpkg.com/en/docs/install)

2. Install dependencies:

   ```shell
   cd packages/website
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
REACT_APP_GAPI_KEY=xxxxxxx
REACT_APP_GAPI_CLIENT_ID=xxxxxxx
REACT_APP_ROOT_ID=xxxxxxx
REACT_APP_ROOT_DRIVE_ID=xxxxxxx
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

## Features

- [x] User
  - [x] Sign in
    - [x] Notify for sign in
    - [x] Error handling for unprivilege errors
  - [x] Sign out
- [x] Sidebar
  - [x] Expand/Collapse all
  - [x] Configure specific folder children to be displayed in sidebar
    - [x] Activate nearest displayed parent
  - [x] Activate and expand sidebar item according to current page
  - [x] Support >500 pages in the sidebar
  - [x] Support external link in syntax `[xxx](https://yyy)`
    - [x] Open Google drive external links in wiki directly
- [x] Content Preview
  - [x] Google doc
    - [x] Show revision history
    - [x] View as html or in iframe as /preview or /edit
    - [x] HTML view
      - [x] Header-based outline and editing links
      - [x] Links
        - [x] Rewrite links to open in wiki directly
        - [x] Thumbnail preview
      - [x] Comments
        - [x] Highlight quoted comment text
        - [ ] Reply
      - [x] Prettify
        - [x] Remove missing font families
        - [x] Pretty monospace fonts
  - [x] spreadsheet
    - [x] Inline editing
  - [x] presentation, PDF, MS Word / Excel files
  - [x] Shortcut
    - [x] File
    - [x] Folder
  - [x] Folder
    - [x] Display `README` in the folder inline
    - [x] Support > 1000 folder items
    - [ ] Sort folder items
    - [x] Display as list
      - [ ] Display multi-level children as list
  - [x] Drive Root
- [x] Breadcrumb Navigation
  - [x] Create file in current folder
  - [x] Open current file in Google Doc / Google Drive
    - [x] Google Doc
    - [x] Google Spreadsheet
  - [x] Open current folder in Google Drive
  - [x] Rename
    - [ ] Rename a link
  - [x] Trash
    - [ ] Trash a link
  - [x] Move in a file
    - [x] Notification when the file cannot be moved out again
    - [x] Move using shortcut
  - [x] Move in a folder (a shortcut will be always created for now?)
  - [ ] Move to another tree location
- [x] Update page title dynamically
- [x] Tag Files
  - [x] View/Set file tags
  - [x] List all tags
  - [ ] Rename a tag
- [x] Performance
  - [x] Optimistic render of doc for faster first doc load
  - [x] Utilize cache for folder content and file data
- [x] Search
  - [x] Full text
  - [x] File name
  - [x] Search Tag
- [x] Mobile Support
  - [x] Responsive Sidebar
  - [x] Link to Google Docs app
- [x] Chrome extension
  - [x] check whether the doc is in the tree: [`browser-extension`](./packages/browser-extension)
  - [x] deep link to the versions page by adding a ?versions param
  - [x] link to doc in the wiki
  - [ ] Firefox

## Note

This is not an official PingCAP product.
