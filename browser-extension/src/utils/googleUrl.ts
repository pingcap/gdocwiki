export function parseDriveLink(url: string) {
  let m = url.match(
    /^https:\/\/docs\.google\.com\/[^/]+(\/u\/\d+)?\/d\/([^/]+)\/edit/
  );
  if (!m) {
    m = url.match(
      /^https:\/\/drive\.google\.com\/[^/]+(\/u\/\d+)?\/[^/]+\/([^/]+)$/
    );
  }
  if (m) {
    return m[2];
  } else {
    return null;
  }
}
