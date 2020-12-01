export const signIn = async () => {
  await gapi.auth2.getAuthInstance().signIn();
  window.location.reload();
};

export const signOut = async () => {
  await gapi.auth2.getAuthInstance().signOut();
  window.location.reload();
};
