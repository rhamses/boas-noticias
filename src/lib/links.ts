/** http(s) href, or undefined when the value is not a web URL. */
export function externalHref(value: string): string | undefined {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
  return url.href;
}
