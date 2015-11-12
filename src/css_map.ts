import {fetch, prepareTestElement} from "./util";

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
    return inner.match(/\b[\w-]+(?=:)/g);
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
