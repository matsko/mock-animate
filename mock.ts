var ONE_SECOND = 1000;
var SAFE_FAST_FORWARD_VALUE = '-9999';

function parseMaxTime(str: string): number {
  var maxValue = 0;
  var values = str.split(/\s*,\s*/);
  forEach(values, function(value) {
    // it's always safe to consider only second values and omit `ms` values since
    // getComputedStyle will always handle the conversion for us
    if (value.charAt(value.length - 1) == 's') {
      value = value.substring(0, value.length - 1);
    }
    value = parseFloat(value) || 0;
    maxValue = maxValue ? Math.max(value, maxValue) : value;
  });
  return maxValue;
}

function triggerReflow(): number {
  return document.body.clientWidth + 1; 
}

function base16(dec: number) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function fetch(url: string): Promise {
  return new Promise((resolve) => {
    var request = new XMLHttpRequest();
    request.addEventListener("load", () => resolve(request.responseText));
    request.open("GET", url);
    request.send(null);
  });
}

function normalizeStyleTarget(value, selectorRegistry: CssMap): {[key: string]: string} { 
  if (isObject(value)) return value;
  return selectorRegistry.lookup(value);
}

function prepareTestElement(): HTMLElement {
  var elm = document.createElement('div');
  document.body.appendChild(elm);
  return elm;
}

function applyCssStyles(element: HTMLElement, styles: {[key: string]: string}): void {
  for (var prop in styles) {
    element.style.setProperty(prop, styles[prop]);
  }
}

function pickStyles(element: HTMLElement): {[key: string]: string} {
  var gcs = window.getComputedStyle(element);
  var data = {};
  for (var i = 1; i < arguments.length; i++) {
    let prop = arguments[i];
    data[prop] = gcs[prop];
  }
  return data;
}

class CssMap {
  static fromStylesheet(filePath: string): Promise<CssMap> {
    return fetch(filePath).then((styles) => {
      return CssMap.fromStyles(styles);
    });
  }

  static fromStyles(styles: [key: string]: string): CssMap {
    var styleTag = document.createElement('style'); 
    styleTag.setAttribute('type','text/css');
    styleTag.innerHTML = styles;
    document.body.append(styleTag);

    var rules = styleTag['sheet']['rules'];
    var classMap = {};

    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      var selector = rule.selectorText;
      if (selector[0] == ".") {
        var stylesEntry = {};
        var properties = CssMap._parsePropertiesFromCss(rule.cssText);
        properties.forEach((property) => {
          stylesEntry[property] = rule.style[property];
        });
        classMap[selector] = stylesEntry;
      }
    };

    styleTag.remove();
    return new CssMap(classMap);
  }

  static _parsePropertiesFromCss(rule: string): any[] {
    var firstBrace = rule.indexOf('{');
    var inner = rule.substr(firstBrace);
    return inner.match(/\b\w+(?=:)/g);
  }

  constructor(private _values: any) {}

  lookup(className: string): {[key: string]: string} {
    var value = this._values[string];
    if (!value) {
      throw new Error("...");
    }
    return value;
  }
}

class CssColor {
  private _rgb: number[];
  private _hex: string;

  constructor(_colorStyle: string) {
    if (_colorStyle[0] == '#') {
      this._hex = colorStyle;
    } else if (_colorStyle.substring(0,3).toLowerCase() == 'rgb') {
      this._rgb = this._parseRGBValue(_colorStyle);
    } else {
      var temp = prepareTestElement();
      temp.style.setProperty('color', _colorStyle);
      this._rgb = this._parseRGBValue(window.getComputedStyle(temp).color);
      temp.remove();
    }
  }

  _parseRGBValue(styleValue: string): string[] {
    return styleValue.match(/rgba?\((.+?\))/)[1].split(',');
  }

  static equals(c1: CssColor, c2: CssColor): boolean {
    return c1.hex == c2.hex;
  }

  /*
  static related(c1, c2, tolerance) {
    
  }
  */

  get rgb(): number[] {
    if (!this._rgb && this._hex) {
      var hex = this._hex;
      if (hex.length <= 4) {
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });
      }

      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      this._rgb = [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ];
    }
    return this._rgb;
  }

  get hex(): string {
    if (!this._hex) {
      var [r,g,b] = this._rgb;
      this._hex = '#' + base16(r) + base16(g) + base16(b);
    }
    return this._hex;
  }

  toString(): string {
    return this.hex;
  }
}

class ElementCssInspector {
  private _hasTransitionAnimation: boolean = null;
  private _hasKeyframeAnimation: boolean = null;

  constructor(private _element: HTMLElement) {}

  static _prepValuesMap(start: {[key: string]: string}, end: {[key: string]: string}) {
    var i, valuesMap = {};
    for (i in start) {
      valuesMap[i] = [start[i]];
    }
    for (i in end) {
      valuesMap[i].push(end[i]);
    }
    return valuesMap;
  }

  static allValuesChanged(start: {[key: string]: string}, end: {[key: string]: string}, tolerance: float = 0): boolean {
    var valuesMap = ElementCssInspector._prepValuesMap(start, end);
    for (var i in valuesMap) {
      let entry = valuesMap[i];
      if (entry.length < 2 || !this.valueChanged(i, entry[0], entry[1], tolerance)) {
        return false;
      }
    }
    return true;
  }

  static someValuesChanged(start: {[key: string]: string}, end: {[key: string]: string}, tolerance: float = 0): boolean {
    var valuesMap = ElementCssInspector._prepValuesMap(start, end);
    for (var i in valuesMap) {
      let entry = valuesMap[i];
      if (entry.length == 2 && this.valueChanged(i, entry[0], entry[1], tolerance)) {
        return true;
      }
    }
    return false;
  }

  valueChanged(property, v1, v2, tolerance): boolean {
    if ((v1 instanceof CssColor) && (v2 instanceof CssColor)) {
      return !v1.equals(v2);
    }
    return v1 != v2;
  }

  containsTransition(): boolean {
    if (!this._hasTransitionAnimation) {
      this._hasTransitionAnimation = this.getTransitionDuration() > 0;
    }
    return this._hasTransitionAnimation;
  }
  
  containsKeyframeAnimation(): boolean {
    if (!this._hasKeyframeAnimation) {
      var prop1 = "animation-name";
      var prop2 = "-webkit-animation-name";
      var styles = pickStyles(this._element, prop1, prop2);
      this._hasKeyframeAnimation = (styles[prop1] || styles[prop2] || "").length > 0 &&
                                   this.getKeyframeAnimationDuration() > 0;
    }
    return this._hasKeyframeAnimation;
  }

  getAnimationDuration(): number {
    return Math.max(this.getTransitionDuration(), this.getKeyframeAnimationDuration());
  }

  getAnimationDelay(): number {
    return Math.max(this.getTransitionDelay(), this.getKeyframeAnimationDelay());
  }

  getKeyframeAnimationDuration(): int {
    var prop1 = "animation-duration";
    var prop2 = "-webkit-animation-duration";
    var styles = pickStyles(this._element, prop1, prop2);
    return parseMaxTime(styles[prop1] || styles[prop2] || "0");
  }

  getKeyframeAnimationDelay(): int {
    var prop1 = "animation-delay";
    var prop2 = "-webkit-animation-delay";
    var styles = pickStyles(this._element, prop1, prop2);
    return parseMaxTime(styles[prop1] || styles[prop2] || "0");
  }

  getTransitionDuration(): number {
    var prop = "transition-duration";
    return parseMaxTime(pickStyles(this._element, prop)[prop]);
  }

  getTransitionDelay(): number {
    var prop = "transition-delay";
    return parseMaxTime(pickStyles(this._element, prop)[prop]);
  }

  setPosition(percentage: float): void {
    var duration = this.getAnimationDuration();
    var position = percentage / duration;
    var positionValue = "-" + (position * ONE_SECOND) + "ms";

    if (this.containsKeyframeAnimation()) {
      this.setStyleValue("transition-delay", positionValue);
    }

    if (this.containsTransitionAnimation()) {
      this.setStyleValue("animation-delay", positionValue);
      this.setStyleValue("-webkit-animation-delay", positionValue);
    }

    triggerReflow();
  }

  setStyleValue(property: string, value: string): string {
    return this._element.style.setProperty(property, value);
  }

  getStyleValue(property: string): string {
    return this._element.style.getPropertyValue(property);
  }

  getStyleValues(properties: string[]): string[] {
    return properties.map((property) => this.getStyleValue(property));
  }

  getStyles(properties: string[]): {[key: string]: string} {
    var styles = {};
    properties.forEach((prop) => {
      styles[prop] = this.getStyleValue(prop);
    }); 
    return styles;
  }

  getStyleColorValue(property: string): CssColor {
    return new CssColor(this.getStyleValue(property));
  }

  applyStyles(styles: {[key: string]: string}): void {
    applyCssStyles(this._element, styles);
    this._hasKeyframeAnimation = null;
    this._hasTransitionAnimation = null;
  }
}

class MockedCssAnimation {
  constructor(private _element: HTMLElement) {
  }

  animatesAllProperties(properties: string[]): boolean {
    var inspector = new ElementCssInspector(this._element);
    var initialValues = inspector.getStyles(properties);
    inspector.setPosition(1);
    var terminalValues = inspector.getStyles(properties);
    return ElementCssInspector.allValuesChanged(initialValues, terminalValues);
  }

  animatesProperties(properties: string[]): boolean {
    var inspector = new ElementCssInspector(this._element);
    var initialValues = inspector.getStyles(properties);
    inspector.setPosition(1);
    var terminalValues = inspector.getStyles(properties);
    return ElementCssInspector.someValuesChanged(initialValues, terminalValues);
  }

  animatesAllFromTo(from: {[key: string]: string}, to: {[key: string]: string}): boolean {
    applyCssStyles(this._element, from);
    var inspector = new ElementCssInspector(this._element);
    inspector.setPosition(1);
    var calculatedValues = inspector.getStyles(Object.keys(to));
    return ElementCssInspector.allValuesChanged(calculatedValues, to);
  }

  animatesFromTo(from: {[key: string]: string}, to: {[key: string]: string}): boolean {
    applyCssStyles(this._element, from);
    var inspector = new ElementCssInspector(this._element);
    inspector.setPosition(1);
    var calculatedValues = inspector.getStyles(Object.keys(to));
    return ElementCssInspector.someValuesChanged(calculatedValues, to);
  }
}

class CssAnimationExpectation {
  constructor(private _assertFn: Function,
              private _element: HTMLElement,
              private _registry: CssMap,
              private _target: any) {}

  toAnimate(): void {
    var initialStyles = normalizeStyleTarget(this._target, this._registry);
    this._assertAnimatesTo(initialStyles, false);
  }

  toAnimateProperties(styles: {[key: string]: string}): void {
    this._assertAnimatesTo(styles, true);
  }

  toAnimateTo(styleTarget: string|HTMLElement): void {
    this._assertAnimatesTo(normalizeStyleTarget(styleTarget, this._registry), false);
  }

  toAnimateFullyTo(styleTarget: string|HTMLElement): void {
    this._assertAnimatesTo(normalizeStyleTarget(styleTarget, this._registry), true);
  }

  private _assertAnimatesTo(terminalStyles: {[key: string]: string}, checkAllProperties: boolean = false): void {
    var mock = new MockedCssAnimation(this._element);
    var initialStyles = normalizeStyleTarget(this._target, this._registry);

    var status = checkAllProperties
        ? mock.animatesAllFromTo(initialStyles, terminalStyles)
        : mock.animatesFromTo(initialStyles, terminalStyles);

    this._assertFn(status, true);
  }
}

class CssAnimationMock {
  private _element: HTMLElement;
  private _assertFn: Function;

  static fromStyles(styles: {[key: string]: string}) {
    var map = CssMap.fromStyles(styles);
    return new CssAnimationMock(map);
  }

  constructor(private _registry: CssMap,
      { testElement, assertFn }:
      { testElement?: HTMLElement, assertFn?: Function }) {
    this._element = testElement || prepareTestElement();
    this._assertFn = assertFn || function(a: any, b: any) {
      if (a !== b) {
        throw new Error("expected " + a + " to be " + b); 
      }
    };
  }

  expect(target: string|HTMLElement) {
    return new CssAnimationExpectation(this._assertFn, this._element, this._registry, target);
  }
}
