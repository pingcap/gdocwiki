async function get(key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(key, function (value) {
        resolve(value[key]);
      });
    } catch (ex) {
      reject(ex);
    }
  });
}

async function set(key: string, value: Object): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set({ [key]: value }, function () {
        resolve();
      });
    } catch (ex) {
      reject(ex);
    }
  });
}

async function remove(keys: string | string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.remove(keys, function () {
        resolve();
      });
    } catch (ex) {
      reject(ex);
    }
  });
}

export const chromeStorage = {
  get,
  set,
  remove,
};
