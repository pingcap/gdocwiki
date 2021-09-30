import { inlineEditable, previewable, viewable } from "./gapi";
export type DocMode = 'view' | 'preview' | 'edit';

export type MimeTypePreferredDisplay = { [mimeType: string]: DocMode };

export function docModes(mimeType: string): DocMode[] {
  const nullableModes = [
    viewable(mimeType) ? ('view' as DocMode) : null,
    previewable(mimeType) ? ('preview' as DocMode) : null,
    inlineEditable(mimeType) ? ('edit' as DocMode) : null,
  ];
  return nullableModes.filter((dm) => dm !== null) as DocMode[];
}
