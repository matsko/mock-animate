import {CssMap} from "../src/css_map";

describe("CssMap", () => {

  describe(".lookup()", () => {
    it("should create a map based on the provided prop:style map values", () => {
      var redStyles = { "background": "red", "color": "red" };
      var blueStyles = { "background": "blue", "color": "blue" };

      var values = {
        ".red": redStyles,
        ".blue": blueStyles
      };

      var map = new CssMap(values);
      expect(map.lookup(".red")).toEqual(redStyles);
      expect(map.lookup(".blue")).toEqual(blueStyles);
    });

    it("should throw an error when a selector isn't found", () => {
      var values = {};

      var map = new CssMap(values);
      var doLookup = () => {
        return map.lookup(".something");
      };

      expect(doLookup).toThrow();
    });

    it("should allow lookups based on an ID value", () => {
      var values = {
        "#my-id": { "height": "1000px" }
      };

      var map = new CssMap(values);
      expect(map.lookup("#my-id")).toEqual({"height":"1000px"});
    });
  });

  describe("#fromStyles()", () => {
    it("should create a map from a string of CSS styles", () => {
      var styles = `
        .red {
          background:red;
          color:red;
        }
        .tall {
          height:100px;
        }
      `;

      var map = CssMap.fromStyles(styles);

      expect(map.lookup(".red")).toEqual({ "background" : "red", "color" : "red" });
      expect(map.lookup(".tall")).toEqual({ "height": "100px" });
    });
  });

});
