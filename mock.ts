var ONE_SECOND = 1000;
var SAFE_FAST_FORWARD_VALUE = '-9999';

function triggerReflow(): int {
  return document.body.clientWidth + 1; 
}

function normalizeStyleTarget(value, selectorRegistry) {
  if (isObject(value)) return value;
  return selectorRegistry[value] || {};
}

function prepareTestElement() {
  var elm = document.createElement('div');
  document.body.appendChild(elm);
  return elm;
}

function applyCssStyles(element, styles) {
  for (var prop in styles) {
    element.style.setProperty(prop, styles[prop]);
  }
}

function pickStyles(element) {
  var gcs = window.getComputedStyle(element);
  var data = {};
  for (var i = 1; i < arguments.length; i++) {
    let prop = arguments[i];
    data[prop] = gcs[prop];
  }
  return data;
}

class CssColor {
  constructor(private _colorStyle) {}

  get rgb() {
  }

  get hex() {
  }
}

class ElementCssInspector {
  private _hasTransitionAnimation: boolean = null;
  private _hasKeyframeAnimation: boolean = null;

  constructor(private _element) {}

  _prepValuesMap(start, end) {
    var i, valuesMap = {};
    for (i in start) {
      valuesMap[i] = [start[i]];
    }
    for (i in end) {
      valuesMap[i].push(end[i]);
    }
    return valuesMap;
  }

  allValuesChanged(start, end, tolerance: float): boolean {
    var valuesMap = this._prepValuesMap(start, end);
    for (var i in valuesMap) {
      let entry = valuesMap[i];
      if (entry.length < 2 || !this.valueChanged(i, entry[0], entry[1], tolerance)) {
        return false;
      }
    }
    return true;
  }

  someValuesChanged(start, end, tolerance: float): boolean {
    var valuesMap = this._prepValuesMap(start, end);
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

  getAnimationDuration(): int {
    return Math.max(this.getTransitionDuration(), this.getKeyframeAnimationDuration());
  }

  getAnimationDelay(): int {
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

  getTransitionDuration(): int {
    var prop = "transition-duration";
    return parseMaxTime(pickStyles(this._element, prop)[prop]);
  }

  getTransitionDelay(): int {
    var prop = "transition-delay";
    return parseMaxTime(pickStyles(this._element, prop)[prop]);
  }

  setPosition(percentage): void {
    var duration = this.getAnimationDuration();
    var position = percentage / duration;
    var positionValue = "-" + (position * ONE_SECOND) "ms";

    if (this.containsKeyframeAnimation()) {
      this.setStyleValue("transition-delay", positionValue);
    }

    if (this.containsTransitionAnimation()) {
      this.setStyleValue("animation-delay", positionValue);
      this.setStyleValue("-webkit-animation-delay", positionValue);
    }

    triggerReflow();
  }

  setStyleValue(property, value): string {
    return this._element.style.setProperty(property, value);
  }

  getStyleValue(property): string {
    return this._element.style.getPropertyValue(property);
  }

  getStyleColorValue(property): CssColor {
    return new CssColor(this.getStyleValue(property));
  }

  applyStyles(styles): void {
    applyCssStyles(this._element, fromStyles);
    this._hasKeyframeAnimation = null;
    this._hasTransitionAnimation = null;
  }
}

class MockedCssAnimation {
  constructor(private _element) {
  }

  animatesAllProperties(styles): boolean {
    var properties = Object.keys(styles);
    var inspector = new ElementCssInspector(this._element);
    var initialValues = inspector.getStyles(properties);
    inspector.goTo(1);
    var terminalValues = inspector.getStyles(properties);
    return ElementCssInspector.allValuesChanged(initialValues, terminalValues);
  }

  animatesProperties(styles): boolean {
    var properties = Object.keys(styles);
    var inspector = new ElementCssInspector(this._element);
    var initialValues = inspector.getStyles(properties);
    inspector.goTo(1);
    var terminalValues = inspector.getStyles(properties);
    return ElementCssInspector.someValuesChanged(initialValues, terminalValues);
  }
}

class CssAnimationExpectation {
  constructor(private _assertFn: Function,
              private _element,
              private _registry: CssMap,
              private _target) {
  }

  toAnimate(): void {
    var initialStyles = Object.keys(normalizeStyleTarget(this._target, this._registry));
    this._assertAnimatesTo(initialStyles, false);
  }

  toAnimateProperties(styles): void {
    this._assertAnimatesTo(styles, true);
  }

  toAnimateTo(styleTarget): void {
    this._assertAnimatesTo(normalizeStyleTarget(styleTarget, this._registry), false);
  }

  toAnimateFullyTo(styleTarget): void {
    this._assertAnimatesTo(normalizeStyleTarget(styleTarget, this._registry), true);
  }

  private _assertAnimatesTo(terminalStyles, checkAllProperties: boolean = false): void {
    var mock = new MockedCssAnimation(this._element);
    var initialStyles = normalizeStyleTarget(this._target, this._registry);

    var status = checkAllProperties
        ? mock.animatesAllProperties(initialStyles,terminalStyles)
        : mock.animatesProperties(initialStyles,terminalStyles);

    this._assertFn(status, true);
  }
}

class CssAnimationMock {
  private _registry;
  private _element;

  constructor(styles, options = {}) {
    this._registry = CssMap.from(styles);
    this._element = testElement || prepareTestElement();
  }

  expect(target) {
    return new CssAnimationExpectation(this._element, this._registry, target);
  }
}
