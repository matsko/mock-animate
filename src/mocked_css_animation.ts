import {ElementCssAnimationInspector} from "./element_css_animation_inspector";
import {
  pickStyles,
  applyCssStyles,
  triggerReflow,
  ONE_HUNDRED_PERCENT
} from "./util";

export class MockedCssAnimation {
  constructor(private _element: HTMLElement) {}

  animatesAllProperties(properties: string[]): boolean {
    return this._animatesProperties(properties, true);
  }

  animatesProperties(properties: string[]): boolean {
    return this._animatesProperties(properties, false);
  }

  private _animatesProperties(properties: string[], all: boolean): boolean {
    var initialValues = pickStyles(this._element, properties);
    var inspector = new ElementCssAnimationInspector(this._element, ONE_HUNDRED_PERCENT);
    var terminalValues = inspector.getStyles(properties);

    return all
        ? ElementCssAnimationInspector.allValuesChanged(initialValues, terminalValues)
        : ElementCssAnimationInspector.someValuesChanged(initialValues, terminalValues);
  }

  animatesAllFromTo(from: {[key: string]: string}, to: {[key: string]: string}, applyTransition: boolean = false): boolean {
    return this._animatesFromTo(from, to, true, applyTransition);
  }

  animatesFromTo(from: {[key: string]: string}, to: {[key: string]: string}, applyTransition: boolean = false): boolean {
    return this._animatesFromTo(from, to, false, applyTransition);
  }

  private _animatesFromTo(from: {[key: string]: string},
                          to: {[key: string]: string},
                          all: boolean,
                          applyTransition: boolean): boolean {
    var properties = Object.keys(from);
    Object.keys(to).forEach((prop) => {
      if (properties.indexOf(prop) == -1) {
        properties.push(prop);
      }
    });

    applyCssStyles(this._element, from);
    var initialInspector = new ElementCssAnimationInspector(this._element, 0);
    var initialValues = initialInspector.getStyles(properties);

    triggerReflow();

    if (applyTransition) {
      applyCssStyles(this._element, { transition: "1s linear all" });
    }

    applyCssStyles(this._element, to);
    var terminalInspector = new ElementCssAnimationInspector(this._element, ONE_HUNDRED_PERCENT);
    var terminalValues = terminalInspector.getStyles(properties);

    return all
        ? ElementCssAnimationInspector.allValuesChanged(initialValues, terminalValues)
        : ElementCssAnimationInspector.someValuesChanged(initialValues, terminalValues);
  }
}
