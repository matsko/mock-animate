import {assertHasStyle} from "../src/test_util";
import {triggerReflow, applyCssStyles} from "../src/util";
import {ElementCssAnimationInspector} from "../src/element_css_animation_inspector";
import {CssColor} from "../src/css_color";

describe("ElementCssAnimationInspector", () => {

  describe("#valueChanged()", () => {
    it("should pass if the value has changed", () => {
      expect(ElementCssAnimationInspector.valueChanged("width", "10px", "100px")).toBe(true);
    });

    it("should fail if the value has not changed", () => {
      expect(ElementCssAnimationInspector.valueChanged("width", "100px", "100px")).toBe(false);
    });

    it("should pass if the color values have changed", () => {
      var c1 = new CssColor("#001122");
      var c2 = new CssColor("#002244");
      expect(ElementCssAnimationInspector.valueChanged("color", c1, c2)).toBe(true);
    });

    it("should fail if the color values have not changed", () => {
      var c1 = new CssColor("#555555");
      var c2 = new CssColor("#555555");
      expect(ElementCssAnimationInspector.valueChanged("color", c1, c2)).toBe(false);
    });

    it("should only consider color values if they are of the `CssColor` class type", () => {
      var c1 = new CssColor("#999999");
      var c2 = "#999999";
      expect(ElementCssAnimationInspector.valueChanged("color", c1, c2)).toBe(false);
    });
  });

  describe("#someValuesChanged()", () => {
    it("it should pass if all values have changed", () => {
      var status = ElementCssAnimationInspector.someValuesChanged(
        { background: "red" },
        { background: "blue" }
      );

      expect(status).toBe(true);
    });

    it("it should pass if some values have changed", () => {
      var status = ElementCssAnimationInspector.someValuesChanged(
        { background: "red", color: 'blue', width: '100px' },
        { background: "blue", color: 'blue', height: '200px' }
      );

      expect(status).toBe(true);
    });

    it("it should fail if no values have changed", () => {
      var status = ElementCssAnimationInspector.someValuesChanged(
        { background: "green" },
        { background: "green" }
      );

      expect(status).toBe(false);
    });
  });

  describe("#allValuesChanged()", () => {
    it("it should pass if all values have changed", () => {
      var status = ElementCssAnimationInspector.allValuesChanged(
        { background: "red", color: "blue" },
        { background: "blue", color: "orange" }
      );

      expect(status).toBe(true);
    });

    it("it should pass if some values have changed", () => {
      var status = ElementCssAnimationInspector.allValuesChanged(
        { background: "red", color: "orange" },
        { background: "blue", color: "orange" }
      );

      expect(status).toBe(false);
    });

    it("it should fail if no values have changed", () => {
      var status = ElementCssAnimationInspector.someValuesChanged(
        { background: "green" },
        { background: "green" }
      );

      expect(status).toBe(false);
    });
  });

  describe("when instantiated", () => {
    var element;

    beforeEach(() => {
      element = document.createElement('div');
      document.body.appendChild(element);
    });

    afterEach(() => {
      document.body.removeChild(element);
    });

    it("should create a clone of the element upon creation and place it as the next sibling", () => {
      element.setAttribute('id', 'matias');
      var inspector = new ElementCssAnimationInspector(element);
      expect(inspector.element).not.toBe(element);
      expect(inspector.element.getAttribute('id')).toBe('matias');
      expect(element.nextSibling).toBe(inspector.element);
    });

    describe("animation detection", () => {
      it("should be true if the element contains CSS transition animations", () => {
        var inspector = new ElementCssAnimationInspector(element);
        expect(inspector.containsTransitionAnimation()).toBe(false);
        expect(inspector.containsKeyframeAnimation()).toBe(false);

        element.style.transition = "1s linear all";
        var inspector2 = new ElementCssAnimationInspector(element);
        expect(inspector2.containsTransitionAnimation()).toBe(true);
        expect(inspector2.containsKeyframeAnimation()).toBe(false);
      });

      it("should be true if the element contains CSS keyframe animations", () => {
        var inspector = new ElementCssAnimationInspector(element);
        expect(inspector.containsTransitionAnimation()).toBe(false);
        expect(inspector.containsKeyframeAnimation()).toBe(false);

        element.style.animation = "1s my_keyframe";
        var inspector2 = new ElementCssAnimationInspector(element);
        expect(inspector2.containsTransitionAnimation()).toBe(false);
        expect(inspector2.containsKeyframeAnimation()).toBe(true);
      });

      it("should be true if the element contains any form of CSS animations", () => {
        var inspector = new ElementCssAnimationInspector(element);
        expect(inspector.containsAnimations()).toBe(false);

        element.style.animation = "1s my_keyframe";
        var inspector2 = new ElementCssAnimationInspector(element);
        expect(inspector2.containsAnimations()).toBe(true);
      });
    });

    describe("duration calculation", () => {
      it("should return `0` for an element that contains no trasitions nor keyframes", () => {
        var inspector = new ElementCssAnimationInspector(element);
        expect(inspector.getKeyframeAnimationDuration()).toBe(0);
        expect(inspector.getTransitionDuration()).toBe(0);
        expect(inspector.getAnimationDuration()).toBe(0);
      });

      it("should get ahold of the animation duration value", () => {
        element.style.animation = "5s my_keyframe";
        var inspector = new ElementCssAnimationInspector(element);
        expect(inspector.getKeyframeAnimationDuration()).toBe(5);
        expect(inspector.getAnimationDuration()).toBe(5);
      });

      it("should get ahold of the transition duration value", () => {
        element.style.transition = "2s linear all";
        var inspector = new ElementCssAnimationInspector(element);
        expect(inspector.getTransitionDuration()).toBe(2);
        expect(inspector.getAnimationDuration()).toBe(2);
      });

      it("should return the higher value of the transition and keyframe duration values", () => {
        element.style.transition = "2s linear all";
        element.style.animation = "9s my_keyframe";
        var inspector = new ElementCssAnimationInspector(element);
        expect(inspector.getAnimationDuration()).toBe(9);
      });
    });

    describe("delay calculation", () => {
      it("should return `0` for an element that contains no trasitions nor keyframes", () => {
        var inspector = new ElementCssAnimationInspector(element);
        expect(inspector.getKeyframeAnimationDelay()).toBe(0);
        expect(inspector.getTransitionDelay()).toBe(0);
        expect(inspector.getAnimationDelay()).toBe(0);
      });

      it("should get ahold of the animation delay value", () => {
        element.style.animation = "5s 2.5s my_keyframe";
        var inspector = new ElementCssAnimationInspector(element);
        expect(inspector.getKeyframeAnimationDelay()).toBe(2.5);
        expect(inspector.getAnimationDelay()).toBe(2.5);
      });

      it("should get ahold of the transition delay value", () => {
        element.style.transition = "2s 1.5s linear all";
        var inspector = new ElementCssAnimationInspector(element);
        expect(inspector.getTransitionDelay()).toBe(1.5);
        expect(inspector.getAnimationDelay()).toBe(1.5);
      });

      it("should return the higher value of the transition and keyframe delay values", () => {
        element.style.transition = "2s 99s linear all";
        element.style.animation = "9s 100ms my_keyframe";
        var inspector = new ElementCssAnimationInspector(element);
        expect(inspector.getAnimationDelay()).toBe(99);
      });
    });

    describe("positioning", () => {
      it("should jump to the provided position of both the transition and keyframe animation", () => {
        applyCssStyles(element, {
          transition: "2s linear all",
          animation: "3s my_keyframe"
        });

        assertHasStyle(element, 'transition-delay', false);
        assertHasStyle(element, 'animation-delay', false);
        
        var inspector = new ElementCssAnimationInspector(element, 0.5);

        assertHasStyle(element, 'transition-delay', '-1000ms');
        assertHasStyle(element, 'animation-delay', '-1500ms');
      });

      it("should throw an error if a position value is provided but the element contains no animations", () => {
        assertHasStyle(element, 'transition-delay', false);
        assertHasStyle(element, 'animation-delay', false);

        var doThrow = () => {
          var inspector = new ElementCssAnimationInspector(element, 0.5);
        };

        expect(doThrow).toThrow();
      });
    });

    describe("setting / getting styles", () => {
      it("should return the styles present on the element", () => {
        applyCssStyles(element, { width: "100px" });
        var inspector = new ElementCssAnimationInspector(element);
        expect(inspector.getStyleValue("width")).toBe("100px");
      });

      it("should return the styles present on the element at the given position", () => {
        applyCssStyles(element, { transition: "2s linear all", width: "0px" });
        var inspector = new ElementCssAnimationInspector(element, 0.5);
        applyCssStyles(inspector.element, { width: "100px" });
        expect(inspector.getStyleValue("width")).toBe("50px");
      });

      it("should complete off the animation fully when at 100%", () => {
        applyCssStyles(element, { transition: "2s linear all", width: "0px" });
        var inspector = new ElementCssAnimationInspector(element, 1);
        applyCssStyles(inspector.element, { width: "100px" });
        expect(inspector.getStyleValue("width")).toBe("100px");
      });
    });
  });
});
