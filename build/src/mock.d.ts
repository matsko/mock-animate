export declare class CssMap {
    private _values;
    static fromStylesheet(filePath: string): Promise<CssMap>;
    static fromStyles(styles: string): CssMap;
    static _parsePropertiesFromCss(rule: string): any[];
    constructor(_values: any);
    lookup(className: string): {
        [key: string]: string;
    };
}
export declare class CssAnimationExpectation {
    private _assertFn;
    private _element;
    private _registry;
    private _target;
    constructor(_assertFn: Function, _element: HTMLElement, _registry: CssMap, _target: any);
    toAnimate(): void;
    toAnimateProperties(styles: {
        [key: string]: string;
    }): void;
    toAnimateTo(styleTarget: string): void;
    toAnimateFullyTo(styleTarget: string): void;
    private _assertAnimatesTo(terminalStyles, checkAllProperties?);
}
export declare class CssAnimationMock {
    private _registry;
    private _element;
    private _assertFn;
    static fromStyles(styles: string): CssAnimationMock;
    constructor(_registry: CssMap, {testElement, assertFn}?: {
        testElement?: HTMLElement;
        assertFn?: Function;
    });
    expect(target: string | HTMLElement): CssAnimationExpectation;
}
