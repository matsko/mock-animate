var ONE_SECOND = 1000;
var SAFE_FAST_FORWARD_VALUE = '-9999';

import {CssColor} from "./css_color"; 
import {isString, isObject, base16, isArray, prepareTestElement} from "./helpers";

function parseMaxTime(str: string): number {
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

function triggerReflow(): number {
  return document.body.clientWidth + 1; 
}

function fetch(url: string): Promise<string> {
  return new Promise((resolve: Function) => {
    var request = new XMLHttpRequest();
    request.addEventListener("load", () => resolve(request.responseText));
    request.open("GET", url);
    request.send(null);
  });
}

function normalizeStyleTarget(value: string|{[key: string]: string}, selectorRegistry: CssMap): {[key: string]: string} { 
  var normalizedValue: {[key: string]: string};
  if (isObject(value)) {
    normalizedValue = <{[key: string]: string}>value;
  } else {
    normalizedValue = selectorRegistry.lookup(<string>value);
  }
  return normalizedValue;
}

function applyCssStyles(element: HTMLElement, styles: {[key: string]: string}): void {
  for (var prop in styles) {
    element.style.setProperty(prop, styles[prop]);
  }
}

function pickStyles(element: HTMLElement, ...props: string[]): {[key: string]: string} {
  var gcs = window.getComputedStyle(element);
  var data: {[key: string]: string} = {};
  props.forEach((prop: string) => {
    data[prop] = <string>gcs[prop];
  });
  return data;
}

export class CssMap {
  static fromStylesheet(filePath: string): Promise<CssMap> {
    return fetch(filePath).then((styles) => {
      return CssMap.fromStyles(styles);
    });
  }

  static fromStyles(styles: string): CssMap {
    var styleTag = document.createElement('style'); 
    styleTag.setAttribute('type','text/css');
    styleTag.innerHTML = styles;
    document.body.appendChild(styleTag);

    var rules: any[] = styleTag['sheet']['rules'];
    var classMap: {[key: string]: any} = {};

    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      var selector = rule.selectorText;
      if (selector[0] == ".") {
        var stylesEntry: {[key: string]: string} = {};
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
    var value = this._values[className];
    if (!value) {
      throw new Error("...");
    }
    return value;
  }
}

export class ElementCssInspector {
  private _hasTransitionAnimation: boolean = null;
  private _hasKeyframeAnimation: boolean = null;

  constructor(private _element: HTMLElement) {}

  static _prepValuesMap(start: {[key: string]: string}, end: {[key: string]: string}): {[key: string]: string[]} {
    // by building a two-value array for each style property we
    // can check to see the start and end values easily for each
    // style property
    var i: string, valuesMap: {[key: string]: string[]} = {};
    for (i in start) {
      valuesMap[i] = [start[i]];
    }

    for (i in end) {
      let value = end[i];
      if (!valuesMap[i]) {
        valuesMap[i] = [value];
      }
      valuesMap[i].push(value);
    }

    return valuesMap;
  }

  static allValuesChanged(start: {[key: string]: string}, end: {[key: string]: string}, tolerance: number = 0): boolean {
    var valuesMap = ElementCssInspector._prepValuesMap(start, end);
    for (var i in valuesMap) {
      let entry = valuesMap[i];
      if (entry.length < 2 || !this.valueChanged(i, entry[0], entry[1], tolerance)) {
        return false;
      }
    }
    return true;
  }

  static someValuesChanged(start: {[key: string]: string}, end: {[key: string]: string}, tolerance: number = 0): boolean {
    var valuesMap = ElementCssInspector._prepValuesMap(start, end);
    for (var i in valuesMap) {
      let entry = valuesMap[i];
      if (entry.length == 2 && this.valueChanged(i, entry[0], entry[1], tolerance)) {
        return true;
      }
    }
    return false;
  }

  static valueChanged(property: string, v1: string|CssColor, v2: string|CssColor, tolerance: number = 0): boolean {
    if ((v1 instanceof CssColor) && (v2 instanceof CssColor)) {
      return !v1.equals(v2);
    }
    return v1 != v2;
  }

  containsTransitionAnimation(): boolean {
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

  getKeyframeAnimationDuration(): number {
    var prop1 = "animation-duration";
    var prop2 = "-webkit-animation-duration";
    var styles = pickStyles(this._element, prop1, prop2);
    return parseMaxTime(styles[prop1] || styles[prop2] || "0");
  }

  getKeyframeAnimationDelay(): number {
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

  setPosition(percentage: number): void {
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

  setStyleValue(property: string, value: string): void {
    this._element.style.setProperty(property, value);
  }

  getStyleValue(property: string): string {
    return this._element.style.getPropertyValue(property);
  }

  getStyleValues(properties: string[]): string[] {
    return properties.map((property) => this.getStyleValue(property));
  }

  getStyles(properties: string[]): {[key: string]: string} {
    var styles: {[key: string]: string} = {};
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

export class CssAnimationExpectation {
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

  toAnimateTo(styleTarget: string): void {
    this._assertAnimatesTo(normalizeStyleTarget(styleTarget, this._registry), false);
  }

  toAnimateFullyTo(styleTarget: string): void {
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

export class CssAnimationMock {
  private _element: HTMLElement;
  private _assertFn: Function;

  static fromStyles(styles: string): CssAnimationMock {
    var map = CssMap.fromStyles(styles);
    return new CssAnimationMock(map);
  }

  constructor(private _registry: CssMap,
      { testElement, assertFn }:
      { testElement?: HTMLElement, assertFn?: Function } = {}) {

      this._element = testElement || prepareTestElement() ;
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
