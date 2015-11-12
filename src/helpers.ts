export function isArray(value: any): boolean {
  return Array.isArray(value);
}

export function prepareTestElement(): HTMLElement {
  var elm = document.createElement('div');
  document.body.appendChild(elm);
  return elm;
}

export function base16(dec: number): string {
  var hex = dec.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

export function isString(value: any): boolean {
  return typeof value == "string";
}

export function isObject(value: any): boolean {
  // yes I know this sucks
  return !isString(value);
}
