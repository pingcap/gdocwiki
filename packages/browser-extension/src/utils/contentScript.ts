import { backOff } from 'exponential-backoff';

export async function waitSelector(selector: string): Promise<NodeListOf<Element>> {
  return waitFor(() => {
      const el = document.querySelectorAll(selector);
      if (el.length === 0) {
        throw new Error(`Wait selector ${selector} failed`);
      }
      return el;
    }
  )
}

export async function waitFor<T>(check: () => T): Promise<T> {
  return await backOff(
    async () => {
      return check()
    },
    {
      maxDelay: 5000,
      startingDelay: 100,
    }
  )
}

export function triggerMouseEvent(element: Element, eventName: string, userOptions: {[i:string]: any}) {
  const options : {[i:string]: any} = { // defaults
    clientX: 0, clientY: 0, button: 0,
    ctrlKey: false, altKey: false, shiftKey: false,
    metaKey: false, bubbles: true, cancelable: true
     // create event object:
  }
  const event = element.ownerDocument.createEvent("MouseEvents");

  if (!/^(?:click|mouse(?:down|up|over|move|out))$/.test(eventName)) {
    throw new Error("Only MouseEvents supported");
  }

  if (typeof userOptions != 'undefined'){ // set the userOptions
    for (var prop in userOptions) {
      if (userOptions.hasOwnProperty(prop))
        options[prop] = userOptions[prop];
    }
  }
  const view = element.ownerDocument.defaultView
  if (!view) {
    console.debug("element.ownerDocument.defaultView is null")
    return
  }

  // initialize the event object
  event.initMouseEvent(eventName, options.bubbles, options.cancelable,
                       view,  options.button,
                       options.clientX, options.clientY, options.clientX,
                       options.clientY, options.ctrlKey, options.altKey,
                       options.shiftKey, options.metaKey, options.button,
                       element);
  // dispatch!
  element.dispatchEvent(event);
}
