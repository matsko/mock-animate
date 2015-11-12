import {CssColor, ElementCssInspector, CssAnimationMock} from "../src/module";

describe("ElementCssInspector", () => {
  describe("valueChanged()", () => {
    it("should pass if the value has changed", () => {
      expect(ElementCssInspector.valueChanged("width", "10px", "100px")).toBe(true);
    });

    it("should fail if the value has not changed", () => {
      expect(ElementCssInspector.valueChanged("width", "100px", "100px")).toBe(false);
    });

    it("should pass if the color values have changed", () => {
      var c1 = new CssColor("#001122");
      var c2 = new CssColor("#002244");
      expect(ElementCssInspector.valueChanged("color", c1, c2)).toBe(true);
    });

    it("should fail if the color values have not changed", () => {
      var c1 = new CssColor("#555555");
      var c2 = new CssColor("#555555");
      expect(ElementCssInspector.valueChanged("color", c1, c2)).toBe(false);
    });

    it("should only consider color values if they are of the `CssColor` class type", () => {
      var c1 = new CssColor("#999999");
      var c2 = "#999999";
      expect(ElementCssInspector.valueChanged("color", c1, c2)).toBe(false);
    });
  });

  describe("someValuesChanged()", () => {
    it("it should pass if all values have changed", () => {
      var status = ElementCssInspector.someValuesChanged(
        { background: "red" },
        { background: "blue" }
      );

      expect(status).toBe(true);
    });

    it("it should pass if some values have changed", () => {
      var status = ElementCssInspector.someValuesChanged(
        { background: "red", color: 'blue', width: '100px' },
        { background: "blue", color: 'blue', height: '200px' }
      );

      expect(status).toBe(true);
    });

    it("it should fail if no values have changed", () => {
      var status = ElementCssInspector.someValuesChanged(
        { background: "green" },
        { background: "green" }
      );

      expect(status).toBe(false);
    });
  });

  describe("allValuesChanged()", () => {
    it("it should pass if all values have changed", () => {
      var status = ElementCssInspector.allValuesChanged(
        { background: "red", color: "blue" },
        { background: "blue", color: "orange" }
      );

      expect(status).toBe(true);
    });

    it("it should pass if some values have changed", () => {
      var status = ElementCssInspector.allValuesChanged(
        { background: "red", color: "orange" },
        { background: "blue", color: "orange" }
      );

      expect(status).toBe(false);
    });

    it("it should fail if no values have changed", () => {
      var status = ElementCssInspector.someValuesChanged(
        { background: "green" },
        { background: "green" }
      );

      expect(status).toBe(false);
    });
  });
});

describe("CssAnimationMock", () => {
  xit("should pull in styles from the provided CSS data", () => {
    var mock = CssAnimationMock.fromStyles(`
      .red { background: red; }
      .blue { background: blue; }
    `);

    mock.expect(".red").toAnimateTo(".blue");
  });
})
