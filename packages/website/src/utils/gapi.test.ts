import { parseDriveLink } from './gapi';

describe('parseDriveLink', () => {
  it('empty string', () => {
    expect(parseDriveLink('')).toEqual(null);
  });

  const id = '1jK7lKUuJWxf0dV-Rd0d2Rb5SWHXveaevqzRKARkqLfo';
  const minimum = `https://docs.google.com/document/d/${id}`;
  it('minimum url', () => {
    expect(parseDriveLink(minimum)).toEqual(id);
  });

  it('url with slash', () => {
    const url = `${minimum}/`;
    expect(parseDriveLink(url)).toEqual(id);
  });

  it('url with edit', () => {
    const url = `${minimum}/edit`;
    expect(parseDriveLink(url)).toEqual(id);
  });

  it('url with preview', () => {
    const url = `${minimum}/preview`;
    expect(parseDriveLink(url)).toEqual(id);
  });

  it('url with unknown path piece', () => {
    const url = `${minimum}/foo`;
    expect(parseDriveLink(url)).toEqual(id);
  });

  it('url with sharing', () => {
    const url = `${minimum}?usp=sharing`;
    expect(parseDriveLink(url)).toEqual(id);
  });

  it('url with params', () => {
    const url = `${minimum}/edit?n=Permission_Isolation_on_TiDB-Dashboard#heading=h.i4kkwxhzx35g`;
    expect(parseDriveLink(url)).toEqual(id);
  });

  it('unrecognized domain', () => {
    const badDomain = 'https://google.com/document/d/1jK7lKUuJWxf0dV-Rd0d2Rb5SWHXveaevqzRKARkqLfo/'
    expect(parseDriveLink(badDomain)).toEqual(null);
  });

  it('folder sharing link', () => {
    const fid = '1FZChTmTr45truJqLbOwACWxnwQqEf0Fv';
    const folderUrl = `https://drive.google.com/drive/folders/${fid}?usp=sharing`;
    expect(parseDriveLink(folderUrl)).toEqual(fid);
  });
});

export {};
