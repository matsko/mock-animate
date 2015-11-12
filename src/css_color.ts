import {isString, base16, prepareTestElement} from "./helpers";

function percentage(value) {
  if (value <= 1) {
    value = Math.round(value * 100);
  }
  return value;
}

export class CssColor {
  private _rgb: number[];
  private _hex: string;

  constructor(colorStyle: string) {
    if (colorStyle[0] == '#') {
      this._hex = this._parseHexValue(colorStyle);
    } else if (colorStyle.substring(0,3).toLowerCase() == 'rgb') {
      this._rgb = this._parseRGBValue(colorStyle);
    } else {
      var temp = prepareTestElement();
      temp.style.setProperty('color', colorStyle);
      this._rgb = this._parseRGBValue(window.getComputedStyle(temp)['color']);
      temp.remove();
    }
  }

  _parseHexValue(hexValue: string): string {
    if (hexValue.length <= 4) {
      var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      hexValue = '#' + hexValue.replace(shorthandRegex, function(m, r, g, b) {
          return r + r + g + g + b + b;
      });
    }
    return hexValue.toUpperCase();
  }

  _parseRGBValue(styleValue: string): number[] {
    var rgb = [];
    var matches = styleValue.match(/rgba?\((.+?\))/)[1].split(',');

    // we use `3` here to avoid rgba values
    for (var i = 0; i < 3; i++) {
      rgb[i] = parseInt(matches[i], 10);
    }
    return rgb;
  }

  static equals(c1: CssColor, c2: CssColor): boolean {
    return c1.hex == c2.hex;
  }

  static related(c1: CssColor, c2: CssColor, tolerance: number = 0.1): boolean {
    var rgb1 = c1.rgb;
    var rgb2 = c2.rgb;

    var magnitude = Math.pow(rgb2[0] - rgb1[0], 2) +
                    Math.pow(rgb2[1] - rgb1[1], 2) +
                    Math.pow(rgb2[2] - rgb1[2], 2);

    var twoBytes = 255 * 255;
    var colorMask = twoBytes + twoBytes + twoBytes;
    var difference = Math.sqrt(magnitude) / Math.sqrt(colorMask);

    return percentage(difference) <= percentage(tolerance);
  }

  /*
  function tolerate(minValues, maxValues, expectedValue, targetValue, tolerance) {
    expectedValue = isArray(expectedValue) ? expectedValue : [expectedValue];
    targetValue = isArray(targetValue) ? targetValue : [targetValue];
    minValues = isArray(minValues) ? minValues : [minValues];
    maxValues = isArray(maxValues) ? maxValues : [maxValues];
    for (var i = 0; i < expectedValue.length; i++) {
      var e = expectedValue[i];
      var t = targetValue[i];
      var low = minValues[i];
      var high = maxValues[i];
      var range = high - low;
      var spot = Math.abs(expectValue / range);
      var lowP = spot - tolerance;
      var highP = spot + tolerance;
      var lowValue = lowP * e;
      var highValue = highP * e;
      if (t < lowValue || t > highValue) {
        return false;
      }
    }
    return true;
  }
  */

  equals(color: CssColor): boolean {
    return CssColor.equals(this, color);
  }

  relativeTo(color: CssColor, tolerance?: number): boolean {
    return CssColor.related(this, color, tolerance);
  }

  get rgb(): number[] {
    if (!this._rgb && this._hex) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(this._hex);
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
      this._hex = ('#' + base16(r) + base16(g) + base16(b)).toUpperCase();
    }
    return this._hex;
  }

  toString(): string {
    return this.hex;
  }
}

