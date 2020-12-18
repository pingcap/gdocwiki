import ReactDOM from 'react-dom';
import React from 'react';

import config from '../src/config';
// import {google} from 'googleapis'

// ReactDOM.render(
//   <React.StrictMode>
//     <p id="react">HHHH</p>
//   </React.StrictMode>,
//   document.getElementById('root')
// );

const showPickFile = () => {
  gapi.load('picker', () => {
    const myDocsView = new google.picker.DocsView()
      .setParent('root')
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true);
    myDocsView['setLabel']('My drive'); // Undocumented

    const sharedDocsView = new google.picker.DocsView()
      .setParent('sharedWithMe')
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true);
    sharedDocsView['setLabel']('Shared with me'); // Undocumented

    const teamDocsView = new google.picker.DocsView()
      .setIncludeFolders(true)
      .setEnableTeamDrives(true)
      .setSelectFolderEnabled(true);

    const picker = new google.picker.PickerBuilder()
      .addView(myDocsView)
      .addView(sharedDocsView)
      .addView(teamDocsView)
      .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
      .enableFeature(google.picker.Feature.SUPPORT_TEAM_DRIVES)
      .setOAuthToken(gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token)
      .setDeveloperKey(config.REACT_APP_GAPI_KEY)
      .setCallback(async (data) => {
        if (data.action === google.picker.Action.PICKED && (data?.docs?.length ?? 0) > 0) {
          console.log(`pick ${data.docs}`);
        }
        if (
          data.action === google.picker.Action.CANCEL ||
          data.action === google.picker.Action.PICKED
        ) {
          picker.dispose();
        }
      })
      .build();

    picker.setVisible(true);
  });
};

(async () => {
  if (gapi.auth2.getAuthInstance() === null) {
    await gapi.auth2.init({ client_id: config.REACT_APP_GAPI_CLIENT_ID }).signIn();
  }
  showPickFile();
})();
