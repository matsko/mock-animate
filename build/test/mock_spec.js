var mock_1 = require("../src/mock");
describe("test", function () {
    it("should pull in styles from the provided CSS data", function () {
        var mock = mock_1.CssAnimationMock.fromStyles("\n      .red { background: red; }\n      .blue { background: blue; }\n    ");
        mock.expect(".red").toAnimateTo(".blue");
    });
});
//# sourceMappingURL=mock_spec.js.map