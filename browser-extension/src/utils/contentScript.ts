import { backOff } from "exponential-backoff";

export async function waitSelector(
  selector: string
): Promise<NodeListOf<Element>> {
  const el = await backOff(
    async () => {
      const el = document.querySelectorAll(selector);
      if (el.length === 0) {
        throw new Error(`Wait selector ${selector} failed`);
      }
      return el;
    },
    {
      maxDelay: 5000,
      startingDelay: 100,
    }
  );
  return el;
}
