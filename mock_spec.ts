describe("test", () => {

  it("should pull in styles from the provided CSS data", () => {
    var mock = CssAnimationMock.fromStyles(`
      .red { background: red; }
      .blue { background: blue; }
    `);

    mock.expect(".red").toAnimateTo(".blue");
  });
})
