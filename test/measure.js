module('Core');
test("initialize", function () {
    var core;

    core = new yamvc.Core();

    ok(core instanceof  yamvc.Core);
});