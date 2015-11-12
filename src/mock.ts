import {
  isString,
  isObject,
  base16,
  isArray,
  prepareTestElement,
  pickStyles,
  applyCssStyles,
  isNotAnimationProp,
  isAnimationProp
} from "./util";

import {CssColor} from "./css_color"; 
import {CssMap} from "./css_map"; 
import {ElementCssAnimationInspector} from "./element_css_animation_inspector"; 
import {MockedCssAnimation} from "./mocked_css_animation";

function normalizeStyleTarget(value: string|{[key: string]: string}, selectorRegistry: CssMap): {[key: string]: string} { 
  var normalizedValue: {[key: string]: string};
  if (isObject(value)) {
    normalizedValue = <{[key: string]: string}>value;
  } else {
    normalizedValue = selectorRegistry.lookup(<string>value);
  }
  return normalizedValue;
}

export class CssAnimationExpectation {
  constructor(private _assertFn: Function,
              private _element: HTMLElement,
              private _registry: CssMap,
              private _target: any) {}

  get not(): CssAnimationExpectation {
    return new CssAnimationExpectation((actual, target) => {
      return this._assertFn(actual, !target);
    }, this._element, this._registry, this._target);
  }

  toAnimate(): void {
    var terminalStyles = normalizeStyleTarget(this._target, this._registry);
    var properties = Object.keys(terminalStyles).filter(isNotAnimationProp);
    var initialStyles = pickStyles(this._element, properties);

    var mock = new MockedCssAnimation(this._element);
    var status = mock.animatesFromTo(initialStyles, terminalStyles);
    this._assertFn(status, true);
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

  static fromStyles(styles: string, options: any = {}): CssAnimationMock {
    var map = CssMap.fromStyles(styles);
    return new CssAnimationMock(map, options);
  }

  constructor(private _registry: CssMap,
      { testElement, assertFn }:
      { testElement?: HTMLElement, assertFn?: Function } = {}) {

    this._element = testElement || prepareTestElement() ;
    this._assertFn = assertFn || function(a: any, b: any): void {
      if (a !== b) {
        throw new Error("expected " + a + " to be " + b); 
      }
    };
  }

  expect(target: string|HTMLElement): CssAnimationExpectation {
    return new CssAnimationExpectation(this._assertFn, this._element, this._registry, target);
  }
}
