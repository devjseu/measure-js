measurejs.module('Functions');

/**
 * test 1
 */

measurejs.suit('Define object using prototype and initialize it.', function (start, stop) {
    // make some preparation before tests

    var Test1 = function () {

    };

    Test1.prototype.method1 = function () {

    };

    Test1.prototype.method2 = function () {

    };

    Test1.prototype.method3 = function () {

    };

    Test1.prototype.method4 = function () {

    };

    Test1.prototype.method5 = function () {

    };

    // start test
    start();

    /* save 10000 records */
    for (var i = 0; i < 10000; i++) {
        new Test1();
    }

    // finish test
    stop();
});

measurejs.suit('Define object without using prototype and initialize it.', function (start, stop) {
    // make some preparation before tests

    var Test1 = function () {
        this.method1 = function () {

        };
        this.method2 = function () {

        };
        this.method3 = function () {

        };
        this.method4 = function () {

        };
        this.method5 = function () {

        };
    };

    // start test
    start();

    /* save 10000 records */
    for (var i = 0; i < 10000; i++) {
        new Test1();
    }

    // finish test
    stop();
});
