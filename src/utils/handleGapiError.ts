export default function handleGapiError(e: any): Error {
  if (e?.result?.error) {
    return e.result.error;
  } else if (e.message) {
    return e;
  } else {
    return new Error('Unknown error');
  }
}
