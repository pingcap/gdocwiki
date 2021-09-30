// Only allow 3 simultaneous ongoing requests at the same time
export function MakeRequestQueue(): (cb: () => Promise<void>) => void {
  const queue = [] as (() => Promise<void>)[];
  let active = 0;
  async function enqueueRequest(cb: () => Promise<void>): Promise<void> {
    queue.push(cb);
    return runQueue();
  }

  async function runQueue() {
    if (active > 2) {
      return;
    }
    const cb = queue.shift();
    if (!cb) {
      return;
    }
    active += 1;
    cb().finally(() => {
      active -= 1;
      runQueue();
    });
  }

  return enqueueRequest;
}
