var ONE_SECOND = 1000;
var SAFE_FAST_FORWARD_VALUE = '-9999';
function isString(value) {
    return typeof value == "string";
}
function isObject(value) {
    // yes I know this sucks
    return !this.isString(value);
}
function parseMaxTime(str) {
    return str.split(/\s*,\s*/).reduce(function (max, value) {
        // it's always safe to consider only second values and omit `ms` values since
        // getComputedStyle will always handle the conversion for us
        if (value.charAt(value.length - 1) == 's') {
            value = value.substring(0, value.length - 1);
        }
        var intVal = parseFloat(value) || 0;
        intVal = max ? Math.max(intVal, max) : intVal;
        return intVal;
    }, 0);
}
function triggerReflow() {
    return document.body.clientWidth + 1;
}
function base16(dec) {
    var hex = dec.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function fetch(url) {
    return new Promise(function (resolve) {
        var request = new XMLHttpRequest();
        request.addEventListener("load", function () { return resolve(request.responseText); });
        request.open("GET", url);
        request.send(null);
    });
}
function normalizeStyleTarget(value, selectorRegistry) {
    var normalizedValue;
    if (isObject(value)) {
        normalizedValue = value;
    }
    else {
        normalizedValue = selectorRegistry.lookup(value);
    }
    return normalizedValue;
}
function prepareTestElement() {
    var elm = document.createElement('div');
    document.body.appendChild(elm);
    return elm;
}
function applyCssStyles(element, styles) {
    for (var prop in styles) {
        element.style.setProperty(prop, styles[prop]);
    }
}
function pickStyles(element) {
    var props = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        props[_i - 1] = arguments[_i];
    }
    var gcs = window.getComputedStyle(element);
    var data = {};
    props.forEach(function (prop) {
        data[prop] = gcs[prop];
    });
    return data;
}
var CssMap = (function () {
    function CssMap(_values) {
        this._values = _values;
    }
    CssMap.fromStylesheet = function (filePath) {
        return fetch(filePath).then(function (styles) {
            return CssMap.fromStyles(styles);
        });
    };
    CssMap.fromStyles = function (styles) {
        var styleTag = document.createElement('style');
        styleTag.setAttribute('type', 'text/css');
        styleTag.innerHTML = styles;
        document.body.appendChild(styleTag);
        var rules = styleTag['sheet']['rules'];
        var classMap = {};
        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            var selector = rule.selectorText;
            if (selector[0] == ".") {
                var stylesEntry = {};
                var properties = CssMap._parsePropertiesFromCss(rule.cssText);
                properties.forEach(function (property) {
                    stylesEntry[property] = rule.style[property];
                });
                classMap[selector] = stylesEntry;
            }
        }
        ;
        styleTag.remove();
        return new CssMap(classMap);
    };
    CssMap._parsePropertiesFromCss = function (rule) {
        var firstBrace = rule.indexOf('{');
        var inner = rule.substr(firstBrace);
        return inner.match(/\b\w+(?=:)/g);
    };
    CssMap.prototype.lookup = function (className) {
        var value = this._values[className];
        if (!value) {
            throw new Error("...");
        }
        return value;
    };
    return CssMap;
})();
exports.CssMap = CssMap;
var CssColor = (function () {
    function CssColor(colorStyle) {
        if (colorStyle[0] == '#') {
            this._hex = colorStyle;
        }
        else if (colorStyle.substring(0, 3).toLowerCase() == 'rgb') {
            this._rgb = this._parseRGBValue(colorStyle);
        }
        else {
            var temp = prepareTestElement();
            temp.style.setProperty('color', colorStyle);
            this._rgb = this._parseRGBValue(window.getComputedStyle(temp)['color']);
            temp.remove();
        }
    }
    CssColor.prototype._parseRGBValue = function (styleValue) {
        return styleValue.match(/rgba?\((.+?\))/)[1].split(',').map(function (val) {
            return parseInt(val);
        });
    };
    CssColor.equals = function (c1, c2) {
        return c1.hex == c2.hex;
    };
    CssColor.prototype.equals = function (color) {
        return CssColor.equals(this, color);
    };
    Object.defineProperty(CssColor.prototype, "rgb", {
        /*
        static related(c1, c2, tolerance) {
          
        }
        */
        get: function () {
            if (!this._rgb && this._hex) {
                var hex = this._hex;
                if (hex.length <= 4) {
                    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
                    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
                        return r + r + g + g + b + b;
                    });
                }
                var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                this._rgb = [
                    parseInt(result[1], 16),
                    parseInt(result[2], 16),
                    parseInt(result[3], 16)
                ];
            }
            return this._rgb;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CssColor.prototype, "hex", {
        get: function () {
            if (!this._hex) {
                var _a = this._rgb, r = _a[0], g = _a[1], b = _a[2];
                this._hex = '#' + base16(r) + base16(g) + base16(b);
            }
            return this._hex;
        },
        enumerable: true,
        configurable: true
    });
    CssColor.prototype.toString = function () {
        return this.hex;
    };
    return CssColor;
})();
var ElementCssInspector = (function () {
    function ElementCssInspector(_element) {
        this._element = _element;
        this._hasTransitionAnimation = null;
        this._hasKeyframeAnimation = null;
    }
    ElementCssInspector._prepValuesMap = function (start, end) {
        var i, valuesMap = {};
        for (i in start) {
            valuesMap[i] = start[i];
        }
        for (i in end) {
            valuesMap[i] = end[i];
        }
        return valuesMap;
    };
    ElementCssInspector.allValuesChanged = function (start, end, tolerance) {
        if (tolerance === void 0) { tolerance = 0; }
        var valuesMap = ElementCssInspector._prepValuesMap(start, end);
        for (var i in valuesMap) {
            var entry = valuesMap[i];
            if (entry.length < 2 || !this.valueChanged(i, entry[0], entry[1], tolerance)) {
                return false;
            }
        }
        return true;
    };
    ElementCssInspector.someValuesChanged = function (start, end, tolerance) {
        if (tolerance === void 0) { tolerance = 0; }
        var valuesMap = ElementCssInspector._prepValuesMap(start, end);
        for (var i in valuesMap) {
            var entry = valuesMap[i];
            if (entry.length == 2 && this.valueChanged(i, entry[0], entry[1], tolerance)) {
                return true;
            }
        }
        return false;
    };
    ElementCssInspector.valueChanged = function (property, v1, v2, tolerance) {
        if (tolerance === void 0) { tolerance = 0; }
        if ((v1 instanceof CssColor) && (v2 instanceof CssColor)) {
            return !v1.equals(v2);
        }
        return v1 != v2;
    };
    ElementCssInspector.prototype.containsTransitionAnimation = function () {
        if (!this._hasTransitionAnimation) {
            this._hasTransitionAnimation = this.getTransitionDuration() > 0;
        }
        return this._hasTransitionAnimation;
    };
    ElementCssInspector.prototype.containsKeyframeAnimation = function () {
        if (!this._hasKeyframeAnimation) {
            var prop1 = "animation-name";
            var prop2 = "-webkit-animation-name";
            var styles = pickStyles(this._element, prop1, prop2);
            this._hasKeyframeAnimation = (styles[prop1] || styles[prop2] || "").length > 0 &&
                this.getKeyframeAnimationDuration() > 0;
        }
        return this._hasKeyframeAnimation;
    };
    ElementCssInspector.prototype.getAnimationDuration = function () {
        return Math.max(this.getTransitionDuration(), this.getKeyframeAnimationDuration());
    };
    ElementCssInspector.prototype.getAnimationDelay = function () {
        return Math.max(this.getTransitionDelay(), this.getKeyframeAnimationDelay());
    };
    ElementCssInspector.prototype.getKeyframeAnimationDuration = function () {
        var prop1 = "animation-duration";
        var prop2 = "-webkit-animation-duration";
        var styles = pickStyles(this._element, prop1, prop2);
        return parseMaxTime(styles[prop1] || styles[prop2] || "0");
    };
    ElementCssInspector.prototype.getKeyframeAnimationDelay = function () {
        var prop1 = "animation-delay";
        var prop2 = "-webkit-animation-delay";
        var styles = pickStyles(this._element, prop1, prop2);
        return parseMaxTime(styles[prop1] || styles[prop2] || "0");
    };
    ElementCssInspector.prototype.getTransitionDuration = function () {
        var prop = "transition-duration";
        return parseMaxTime(pickStyles(this._element, prop)[prop]);
    };
    ElementCssInspector.prototype.getTransitionDelay = function () {
        var prop = "transition-delay";
        return parseMaxTime(pickStyles(this._element, prop)[prop]);
    };
    ElementCssInspector.prototype.setPosition = function (percentage) {
        var duration = this.getAnimationDuration();
        var position = percentage / duration;
        var positionValue = "-" + (position * ONE_SECOND) + "ms";
        if (this.containsKeyframeAnimation()) {
            this.setStyleValue("transition-delay", positionValue);
        }
        if (this.containsTransitionAnimation()) {
            this.setStyleValue("animation-delay", positionValue);
            this.setStyleValue("-webkit-animation-delay", positionValue);
        }
        triggerReflow();
    };
    ElementCssInspector.prototype.setStyleValue = function (property, value) {
        this._element.style.setProperty(property, value);
    };
    ElementCssInspector.prototype.getStyleValue = function (property) {
        return this._element.style.getPropertyValue(property);
    };
    ElementCssInspector.prototype.getStyleValues = function (properties) {
        var _this = this;
        return properties.map(function (property) { return _this.getStyleValue(property); });
    };
    ElementCssInspector.prototype.getStyles = function (properties) {
        var _this = this;
        var styles = {};
        properties.forEach(function (prop) {
            styles[prop] = _this.getStyleValue(prop);
        });
        return styles;
    };
    ElementCssInspector.prototype.getStyleColorValue = function (property) {
        return new CssColor(this.getStyleValue(property));
    };
    ElementCssInspector.prototype.applyStyles = function (styles) {
        applyCssStyles(this._element, styles);
        this._hasKeyframeAnimation = null;
        this._hasTransitionAnimation = null;
    };
    return ElementCssInspector;
})();
var MockedCssAnimation = (function () {
    function MockedCssAnimation(_element) {
        this._element = _element;
    }
    MockedCssAnimation.prototype.animatesAllProperties = function (properties) {
        var inspector = new ElementCssInspector(this._element);
        var initialValues = inspector.getStyles(properties);
        inspector.setPosition(1);
        var terminalValues = inspector.getStyles(properties);
        return ElementCssInspector.allValuesChanged(initialValues, terminalValues);
    };
    MockedCssAnimation.prototype.animatesProperties = function (properties) {
        var inspector = new ElementCssInspector(this._element);
        var initialValues = inspector.getStyles(properties);
        inspector.setPosition(1);
        var terminalValues = inspector.getStyles(properties);
        return ElementCssInspector.someValuesChanged(initialValues, terminalValues);
    };
    MockedCssAnimation.prototype.animatesAllFromTo = function (from, to) {
        applyCssStyles(this._element, from);
        var inspector = new ElementCssInspector(this._element);
        inspector.setPosition(1);
        var calculatedValues = inspector.getStyles(Object.keys(to));
        return ElementCssInspector.allValuesChanged(calculatedValues, to);
    };
    MockedCssAnimation.prototype.animatesFromTo = function (from, to) {
        applyCssStyles(this._element, from);
        var inspector = new ElementCssInspector(this._element);
        inspector.setPosition(1);
        var calculatedValues = inspector.getStyles(Object.keys(to));
        return ElementCssInspector.someValuesChanged(calculatedValues, to);
    };
    return MockedCssAnimation;
})();
var CssAnimationExpectation = (function () {
    function CssAnimationExpectation(_assertFn, _element, _registry, _target) {
        this._assertFn = _assertFn;
        this._element = _element;
        this._registry = _registry;
        this._target = _target;
    }
    CssAnimationExpectation.prototype.toAnimate = function () {
        var initialStyles = normalizeStyleTarget(this._target, this._registry);
        this._assertAnimatesTo(initialStyles, false);
    };
    CssAnimationExpectation.prototype.toAnimateProperties = function (styles) {
        this._assertAnimatesTo(styles, true);
    };
    CssAnimationExpectation.prototype.toAnimateTo = function (styleTarget) {
        this._assertAnimatesTo(normalizeStyleTarget(styleTarget, this._registry), false);
    };
    CssAnimationExpectation.prototype.toAnimateFullyTo = function (styleTarget) {
        this._assertAnimatesTo(normalizeStyleTarget(styleTarget, this._registry), true);
    };
    CssAnimationExpectation.prototype._assertAnimatesTo = function (terminalStyles, checkAllProperties) {
        if (checkAllProperties === void 0) { checkAllProperties = false; }
        var mock = new MockedCssAnimation(this._element);
        var initialStyles = normalizeStyleTarget(this._target, this._registry);
        var status = checkAllProperties
            ? mock.animatesAllFromTo(initialStyles, terminalStyles)
            : mock.animatesFromTo(initialStyles, terminalStyles);
        this._assertFn(status, true);
    };
    return CssAnimationExpectation;
})();
exports.CssAnimationExpectation = CssAnimationExpectation;
var CssAnimationMock = (function () {
    function CssAnimationMock(_registry, _a) {
        var _b = _a === void 0 ? null : _a, testElement = _b.testElement, assertFn = _b.assertFn;
        this._registry = _registry;
        this._element = testElement || prepareTestElement();
        this._assertFn = assertFn || function (a, b) {
            if (a !== b) {
                throw new Error("expected " + a + " to be " + b);
            }
        };
    }
    CssAnimationMock.fromStyles = function (styles) {
        var map = CssMap.fromStyles(styles);
        return new CssAnimationMock(map);
    };
    CssAnimationMock.prototype.expect = function (target) {
        return new CssAnimationExpectation(this._assertFn, this._element, this._registry, target);
    };
    return CssAnimationMock;
})();
exports.CssAnimationMock = CssAnimationMock;
//# sourceMappingURL=mock.js.map