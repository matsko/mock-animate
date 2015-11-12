export class MockStyleSheet {
  private _sheet: any;
  private _node: HTMLElement;
  private _head: HTMLElement;
  private _text: string = "";

  constructor() {
    this._node = document.createElement('style');
    this._head = document.getElementsByTagName('head')[0];
    this._head.appendChild(this._node);
    this._sheet = document.styleSheets[document.styleSheets.length - 1];
  }

  addRule(selector: string, stylesText: string): void {
    var wrappedText = selector + '{ ' + stylesText + '}';
    try {
      this._sheet.insertRule(wrappedText, 0);
    }
    catch (e) {
      try {
        this._sheet.addRule(selector, stylesText);
      }
      catch (e2) {}
    }
    this._text += wrappedText + "\n";
  }

  destroy(): void {
    this._head.removeChild(this._node);
  }

  get cssText() {
    return this._text;
  }
}
