
  var mock = new AnimateMock("stylesheet.css", element);
  
  mock.expect(".red").toAnimate();
  mock.expect(".red").toAnimateTo(".blue");

  mock.expect(".red").toAnimateTo(".blue");

t   mock.expect(".red").toAnimateProperties(".blue");

  mock.expect(".red").toAnimateFullyTo(".blue");
