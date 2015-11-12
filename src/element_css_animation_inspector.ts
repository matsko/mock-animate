import {
  isString,
  applyCssStyles,
  pickStyles,
  triggerReflow,
  parseMaxTime,
  insertAfter,
  isAnimationProp,
  ONE_SECOND
} from "./util";
import {CssMap} from "./css_map";
import {CssColor} from "./css_color";

var SUPER_LONG_TRANSITION_DURATION = 1000;

function isColorProperty(prop: string): boolean {
  return ['color', 'background-color', 'background', 'border-color'].indexOf(prop) >= 0;
}

export class ElementCssAnimationInspector {
  private _hasTransitionAnimation: boolean = null;
  private _hasKeyframeAnimation: boolean = null;

  public element;

  constructor(element: HTMLElement, position: number = 0) {
    if (!element.parentNode) {
      throw new Error("The provided element object must be attached to a parent DOM node");
    }

    this.element = element.cloneNode();
    insertAfter(this.element, element);

    if (position > 0) {
      if (!this.containsAnimations()) {
        throw new Error("The element contains no animation code");
      }

      if (this.containsTransitionAnimation()) {
        this._setSuperLongTransition();
      }

      this._setPosition(position);
    }
  }

  static _prepValuesMap(start: {[key: string]: string|CssColor},
                        end: {[key: string]: string|CssColor}): {[key: string]: any[]} {
    // by building a two-value array for each style property we
    // can check to see the start and end values easily for each
    // style property
    var i: string, valuesMap: {[key: string]: any[]} = {};
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

  static allValuesChanged(start: {[key: string]: string|CssColor},
                          end: {[key: string]: string|CssColor},
                          tolerance: number = 0): boolean {
    var valuesMap = ElementCssAnimationInspector._prepValuesMap(start, end);
    for (var i in valuesMap) {
      let entry = valuesMap[i];
      if (entry.length < 2 || !this.valueChanged(i, entry[0], entry[1], tolerance)) {
        return false;
      }
    }
    return true;
  }

  static someValuesChanged(start: {[key: string]: string|CssColor},
                           end: {[key: string]: string|CssColor},
                           tolerance: number = 0): boolean {
    var valuesMap = ElementCssAnimationInspector._prepValuesMap(start, end);
    for (var i in valuesMap) {
      if (isAnimationProp(i)) continue;
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

  private _setSuperLongTransition() {
    this.setStyleValue("transition-duration", SUPER_LONG_TRANSITION_DURATION + 's');
    this._clearCache();
  }

  containsAnimations(): boolean {
    return this.containsTransitionAnimation() || this.containsKeyframeAnimation();
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
      var styles = pickStyles(this.element, [prop1, prop2]);
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
    var styles = pickStyles(this.element, [prop1, prop2]);
    return parseMaxTime(styles[prop1] || styles[prop2] || "0");
  }

  getKeyframeAnimationDelay(): number {
    var prop1 = "animation-delay";
    var prop2 = "-webkit-animation-delay";
    var styles = pickStyles(this.element, [prop1, prop2]);
    return parseMaxTime(styles[prop1] || styles[prop2] || "0");
  }

  getTransitionDuration(): number {
    var prop = "transition-duration";
    return parseMaxTime(pickStyles(this.element, [prop])[prop]);
  }

  getTransitionDelay(): number {
    var prop = "transition-delay";
    return parseMaxTime(pickStyles(this.element, [prop])[prop]);
  }

  private _setPosition(percentage: number): void {
    var makePositionStyle = function(position, percentage) {
      return "-" + (position * ONE_SECOND) + "ms";
    };

    if (this.containsTransitionAnimation()) {
      var transitionPosition = percentage * this.getTransitionDuration();
      this.setStyleValue("transition-delay", makePositionStyle(transitionPosition, percentage));
    }

    if (this.containsKeyframeAnimation()) {
      var keyframeAnimationPosition = percentage * this.getKeyframeAnimationDuration();
      var keyframeAnimationPositionStyle = makePositionStyle(keyframeAnimationPosition, percentage);
      this.setStyleValue("animation-delay", keyframeAnimationPositionStyle);
      this.setStyleValue("-webkit-animation-delay", keyframeAnimationPositionStyle);
    }

    triggerReflow(this.element);
  }

  setStyleValue(property: string, value: string): void {
    this.element.style.setProperty(property, value);
    if (/animation|transition/.test(property)) {
      this._clearCache();
    }
  }

  getStyleValue(property: string): string {
    return pickStyles(this.element, [property])[property];
  }

  getStyleValues(properties: string[]): string[] {
    return properties.map((property) => this.getStyleValue(property));
  }

  getStyles(properties: string[]): {[key: string]: string|CssColor} {
    var styles = pickStyles(this.element, properties);
    var newStyles: {[key: string]: string|CssColor} = {};
    for (var prop in styles) {
      let value = styles[prop];
      newStyles[prop] = isColorProperty(prop) 
          ? new CssColor(value)
          : value;
    }
    return newStyles;
  }

  getStyleColorValue(property: string): CssColor {
    return new CssColor(this.getStyleValue(property));
  }

  applyStyles(styles: {[key: string]: string}): void {
    applyCssStyles(this.element, styles);
    var props = Object.keys(styles);
    var someAnimationStyleChanged = props.some((prop) => /animation|transition/.test(prop));
    if (someAnimationStyleChanged) {
      this._clearCache();
    }
  }

  private _clearCache() {
    this._hasKeyframeAnimation = null;
    this._hasTransitionAnimation = null;
  }
}

