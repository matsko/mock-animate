import {CssMap, CssColor, ElementCssAnimationInspector, CssAnimationMock} from "../src/module";
import {ASSERT_FUNCTION} from "../src/test_util";
import {triggerReflow} from "../src/util";
import {MockStyleSheet} from "../src/mock-stylesheet"

describe("CssAnimationMock", () => {
  var element, sheet;

  beforeEach(() => {
    sheet = new MockStyleSheet();
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    sheet.destroy();
    document.body.removeChild(element);
  });

  it("should assert animations between CSS classes", () => {
    var mock = CssAnimationMock.fromStyles(`
      .red { background: red; }
      .blue { background: blue; transition:0.5s linear all; }
    `);

    mock.expect(".red").toAnimateTo(".blue");
  });

  it("should assert that an animation actually animates", () => {
    var mock = CssAnimationMock.fromStyles(`
      .red { background: red; transition:1s linear all; }
    `);

    mock.expect(".red").toAnimate();
  });

  it("should throw an error when a non-existing class is asserted", () => {
    var mock = CssAnimationMock.fromStyles('');
    var doThrow = () => {
      mock.expect(".i-dont-exist").toAnimate();
    };
    expect(doThrow).toThrow();
  });

  it("should assert that an animation animates to the provided class", () => {
    sheet.addRule(".start", "background-color: blue;");
    sheet.addRule(".red", "background-color: red; transition:1s linear all;");

    element.classList.add('start');
    triggerReflow(element);

    var mock = CssAnimationMock.fromStyles(sheet.cssText, {
      testElement: element
    });

    mock.expect(".red").toAnimate();
  });

  it("should falsely assert that an animation does not animate", () => {
    sheet.addRule(".start", "background-color: red;");
    sheet.addRule(".red", "background-color: red; transition:1s linear all;");

    element.classList.add('start');
    triggerReflow(element);

    var mock = CssAnimationMock.fromStyles(sheet.cssText, {
      testElement: element
    });

    mock.expect(".red").not.toAnimate();
  });
})
