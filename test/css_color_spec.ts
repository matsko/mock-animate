import {CssColor} from "../src/module";

describe("CssColor", () => {
  describe(".hex", () => {
    it("should return a hex value when constructed with a hex value", () => {
      var c = new CssColor("#224466");
      expect(c.hex).toBe("#224466");
    });

    it("should return an expanded hex value when constructed with a shorthand hex value", () => {
      var c = new CssColor("#123");
      expect(c.hex).toBe("#112233");
    });

    it("should return a hex value when constructed from a RBG value", () => {
      var c = new CssColor("rgb(255, 0, 0)");
      expect(c.hex).toBe("#FF0000");
    });

    it("should return a hex value when constructed from a standard color value", () => {
      var c = new CssColor("blue");
      expect(c.hex).toBe("#0000FF");
    });

    it("should always return hex values in uppercase format", () => {
      var c = new CssColor("#abcdef");
      expect(c.hex).toBe("#ABCDEF");

      c = new CssColor("#abc");
      expect(c.hex).toBe("#AABBCC");
    });
  });

  describe(".rgb", () => {
    it("should return a hex value when constructed with a rgb value", () => {
      var c = new CssColor("rgb(0, 255, 0)");
      expect(c.rgb).toEqual([0, 255, 0]);
    });

    it("should return a hex value when constructed with a rgba value and ignore the opacity", () => {
      var c = new CssColor("rgba(0, 255, 0, 0)");
      expect(c.rgb).toEqual([0, 255, 0]);
    });

    it("should return a rgb value when constructed from a hex value", () => {
      var c = new CssColor("#646464");
      expect(c.rgb).toEqual([100, 100, 100]);
    });

    it("should return a hex value when constructed from a standard color value", () => {
      var c = new CssColor("white");
      expect(c.rgb).toEqual([255, 255, 255]);
    });
  });

  describe(".equals", () => {
    it("should return true when the colors are exactly the same", () => {
      var c1 = new CssColor("#00FF00");
      var c2 = new CssColor("rgb(0, 255, 0)");
      expect(c1.equals(c2)).toBe(true);
    });

    it("should return false when the colors are not the same", () => {
      var c1 = new CssColor("#002200");
      var c2 = new CssColor("green");
      expect(c1.equals(c2)).toBe(false);
    });
  });

  describe(".closeTo", () => {
    it("should return true when the colors are related", () => {
      var c1 = new CssColor("#111");
      var c2 = new CssColor("#222");
      expect(c1.closeTo(c2)).toBe(true);
    });

    it("should return true when the colors are related by tolerance", () => {
      var c1 = new CssColor("rgb(123, 123, 123)"); // half of 255
      var c2 = new CssColor("rgb(0,0,0)");
      var c3 = new CssColor("rgb(255,255,255)");

      // the precision tends to mess up the amount
      // so having 55% is close enough to go from
      // start to finish
      var HALF = 0.55;

      expect(c1.closeTo(c2, HALF)).toBe(true);
      expect(c1.closeTo(c3, HALF)).toBe(true);
    });
  });
});
