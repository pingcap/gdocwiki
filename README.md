# gdocwiki

A wiki based on Google Doc / Drive.

## User Guide

gdocwiki combines a folder tree view in a sidebar with a document preview in the main panel.
This helps browse through content without opening lots of new tabs and also to understand the hierarchical relationship of content.

An outline of headers are shown in the sidebar. Clicking on them will navigate to the header of the document shown in gdocwiki.
The headers in the document preview are linked out to the Google doc at the location of the header. These can be clicked on to edit/suggest/comment on the doc.

The following file name conventions are used:

* a file named `readme` will be displayed automatically when navigating to a directory
* a file/folder begining with `.` will be displayed last in the listings

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
  - [x] Configure specific folder children to be displayed in sidebar or not
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
      - [x] Rewrite links to open in wiki directly
      - [x] Support #xxx anchors in the Google doc
      - [x] Comments
        - [ ] Reply
        - [x] Highlight quoted comment text
      - [x] Header-based document navigation 
      - [ ] Prettify
        - [x] Pretty font families
        - [x] Pretty monospace fonts
        - [ ] Adjust incorrect margins and paddings
  - [x] spreadsheet
  - [x] presentation, PDF, MS Word / Excel files
  - [x] Shortcut
    - [x] File
    - [x] Folder
  - [x] Folder
    - [x] Click folder item to jump
    - [ ] Sort folder items
    - [x] Display `README` in the folder inline
    - [x] Support > 1000 folder items
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
- [x] Natural sort
- [x] Update Title Dynamically
- [x] Tag
  - [x] View doc tags
  - [x] List all tags
  - [x] Set tags
  - [ ] Rename a tag
- [ ] Performance
  - [x] Optimistic render of doc for faster first load
  - [x] Utilize cache to load folder content
  - [ ] Update file and folder cache in background when accessing a folder or file
  - [ ] Watch changes from cached entities
- [x] Search
  - [x] Full text
  - [x] File name
  - [x] Search Tag
- [x] Mobile Support
  - [x] Responsive Sidebar
  - [ ] Responsive settings page
- [x] Chrome extension
  - [x] check whether the doc is in the tree: [`browser-extension`](./packages/browser-extension)
  - [x] deep link to the versions page by adding a ?versions param
  - [x] link to doc in the wiki
  - [ ] Firefox

## Note

This is not an official PingCAP product.
