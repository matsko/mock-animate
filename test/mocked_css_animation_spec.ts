import {MockedCssAnimation} from "../src/mocked_css_animation";
import {triggerReflow} from "../src/util";

describe("MockedCssAnimation", () => {
  var element;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  describe(".animatesAllProperties()", () => {
    it("should return true if all properties are animated", () => {
      element.style.color = "blue";
      triggerReflow();
      element.style.transition = "1s linear all";
      element.style.color = "red";
      var mock = new MockedCssAnimation(element);
      var status = mock.animatesAllProperties(["color"])
      expect(status).toBe(true);
    });

    it("should return false if not all properties are animated", () => {
      element.style.color = "blue";
      element.style.width = "100px";
      triggerReflow();
      element.style.transition = "1s linear all";
      element.style.color = "red";

      var mock = new MockedCssAnimation(element);
      var status = mock.animatesAllProperties(["color", "width"])
      expect(status).toBe(false);
    });
  });

  describe(".animatesProperties()", () => {
    it("should return true if all properties are animated", () => {
      element.style.color = "blue";
      element.style.width = "100px";
      triggerReflow();
      element.style.transition = "1s linear all";
      element.style.color = "red";
      var mock = new MockedCssAnimation(element);
      var status = mock.animatesProperties(["color", "width"])
      expect(status).toBe(true);
    });
  });

  describe(".animatesAllFromTo()", () => {
    it("should return true if all the provided styles animate from start to end", () => {
      var mock = new MockedCssAnimation(element);
      var status = mock.animatesAllFromTo(
        { color: "red" },
        { color: "blue" },
        true);
      expect(status).toBe(true);
    });

    it("should return false if not all the provided styles animate from start to end", () => {
      var mock = new MockedCssAnimation(element);
      var status = mock.animatesAllFromTo(
        { color: "red", width: '100px' },
        { color: "blue" },
        true);
      expect(status).toBe(false);
    });

    it("should animate all the provided styles from start to end", () => {
      var mock = new MockedCssAnimation(element);
      var status = mock.animatesAllFromTo(
        { color: "red" },
        { color: "rgb(255,0,0)" },
        true);
      expect(status).toBe(false);
    });
  });

  describe(".animatesFromTo()", () => {
    it("should return true if all the provided styles animate from start to end", () => {
      var mock = new MockedCssAnimation(element);
      var status = mock.animatesFromTo(
        { color: "red" },
        { color: "blue" },
        true);
      expect(status).toBe(true);
    });

    it("should return false if not all the provided styles animate from start to end", () => {
      var mock = new MockedCssAnimation(element);
      var status = mock.animatesFromTo(
        { color: "red", width: '100px' },
        { color: "blue" },
        true);
      expect(status).toBe(true);
    });

    it("should animate all the provided styles from start to end", () => {
      var mock = new MockedCssAnimation(element);
      var status = mock.animatesFromTo(
        { color: "red" },
        { color: "rgb(255,0,0)" },
        true);
      expect(status).toBe(false);
    });
  });

});
