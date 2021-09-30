import { MakeRequestQueue } from './requestQueue';

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('requestQueue', () => {
  it('await requests', async () => {
    let requestRan = 0;
    async function request() {
      requestRan += 1;
      await timeout(1);
      return;
    }
    const enq = MakeRequestQueue();
    enq(request);
    expect(requestRan).toEqual(1);
    enq(request);
    expect(requestRan).toEqual(2);
    enq(request);
    expect(requestRan).toEqual(3);
    enq(request);
    expect(requestRan).toEqual(3);
  });

  it('enque requests', async () => {
    let requestRan = 0;
    async function request() {
      requestRan += 1;
      await timeout(5);
      return;
    }
    const enc = MakeRequestQueue();
    enc(request);
    expect(requestRan).toEqual(1);
    enc(request);
    expect(requestRan).toEqual(2);
    enc(request);
    expect(requestRan).toEqual(3);
    enc(request);
    expect(requestRan).toEqual(3);
    enc(request);
    expect(requestRan).toEqual(3);
    enc(request);
    expect(requestRan).toEqual(3);
    enc(request);
    expect(requestRan).toEqual(3);
    enc(request);
    expect(requestRan).toEqual(3);
    enc(request);
    expect(requestRan).toEqual(3);
  });
});