export var ONE_SECOND = 1000;
export var ONE_HUNDRED_PERCENT = 1;
export var SAFE_FAST_FORWARD_VALUE = '-9999';


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

export function fetch(url: string): Promise<string> {
  return new Promise((resolve: Function) => {
    var request = new XMLHttpRequest();
    request.addEventListener("load", () => resolve(request.responseText));
    request.open("GET", url);
    request.send(null);
  });
}

export function applyCssStyles(element: HTMLElement, styles: {[key: string]: string}): void {
  for (var prop in styles) {
    element.style.setProperty(prop, styles[prop]);
  }
}

export function pickStyles(element: HTMLElement, props: string[]): {[key: string]: string} {
  var gcs = window.getComputedStyle(element);
  var data: {[key: string]: string} = {};
  props.forEach((prop: string) => {
    data[prop] = <string>gcs[prop];
  });
  return data;
}

export function triggerReflow(elm: HTMLElement = null): number {
  return (elm || document.body).clientWidth + 1; 
}

export function parseMaxTime(str: string): number {
  return str.split(/\s*,\s*/).reduce((max, value) => {
    // it's always safe to consider only second values and omit `ms` values since
    // getComputedStyle will always handle the conversion for us
    if (value.charAt(value.length - 1) == 's') {
      value = value.substring(0, value.length - 1);
    }
    var intVal: number = parseFloat(value) || 0;
    intVal = max ? Math.max(intVal, max) : intVal;
    return intVal;
  }, 0);
}

export function insertAfter(newNode: HTMLElement, refNode: HTMLElement): void {
  var parent = refNode.parentNode;
  if (parent.childNodes.length > 1) {
    parent.insertBefore(newNode, refNode.nextSibling);
  } else {
    parent.appendChild(newNode); 
  }
}

export function isNotAnimationProp(prop: string): boolean {
  return !isAnimationProp(prop);
}

export function isAnimationProp(prop: string): boolean {
  return /animation|transition/.test(prop);
}
