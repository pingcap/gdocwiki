export const signIn = async (ev: any) => {
  ev?.preventDefault();
  await gapi.auth2.getAuthInstance().signIn();
  window.location.reload();
};

export const signOut = async (ev: any) => {
  ev?.preventDefault();
  await gapi.auth2.getAuthInstance().signOut();
  window.location.reload();
};
