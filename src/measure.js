(function (window, undefined) {
    "use strict";

    var elements = {},// Cache pointers to html elements.
        measurements = {},// Store measurement results.
        tests = {},// Cache tests.
        startTime = 0,// Using for polifill performance.now
        currentModule,
        i = 0;

    startTime = (new Date()).getTime();
    window.performance = window.performance || {};
    window.performance.now = window.performance.now || function () {
        return (new Date()).getTime() - startTime;
    };

    function bindElements() {
        elements.body = document.querySelector('body');
    }

    function createElements() {
    }


    /**
     * @param id
     */
    function recalculate(id) { // Calculate and return average result for execution time
        var start, stop, loops, l, result = 0;

        start = measurements[id].start;
        stop = measurements[id].stop;
        loops = l = start.length;

        while (l--) {
            result += stop[l] - start[l];
        }

        measurements[id].duration = result / loops;

    }

    window.Measure = {
        init: function () {
            bindElements();
            createElements();
        },
        start: function (id, description) {

            // When starting our first measurement we need to prepare object in which we will store all data.
            measurements[id] = measurements[id] || {}; // After that, under it, we create empty object
            measurements[id].start = measurements[id].start || []; // in which we will store start value
            measurements[id].stop = measurements[id].stop || []; // and stop value for each of measurements.
            measurements[id].loops = measurements[id].loops || 1; // We will also store number of loops which need to run.
            measurements[id].description = description || "";

            measurements[id].start.push(performance.now());

            return id;
        },
        stop: function (id) {
            var returned, loops, start, stop;

            if (id) {

                loops = measurements[id].loops;
                stop = measurements[id].stop;

                stop.push(performance.now()); // Push result when finished.

                if (loops === stop.length) {
                    recalculate(id);
                } else if (stop.length < loops) {

                    start = function () {
                        Measure.start(id);
                    };
                    stop = function () {
                        Measure.stop(id);
                    };
                    loops = function (loops) {
                    };

                    tests[id](start, stop, loops);
                }

                returned = measurements[id];

            }
            return returned;
        },
        loops: function (id, loops) {

            measurements[id] = measurements[id] || {};
            measurements[id].loops = loops;

        },
        suit: function (id, callback) {
            var start = function () { // Run performance measurement, passed as argument to our suit.
                    Measure.start(id);
                },
                stop = function () { // Stops performance measurement, passed as argument to our suit.
                    Measure.stop(id);
                },
                loops = function (loops) { // Specify number of reps of current test, passed as argument to our suit.
                    Measure.loops(id, loops);
                };

            id = id || 'measure-' + i++; // Before we start, if not passed, we need to create unique id for our test.

            tests[id] = callback; // Cache our tests.

            callback(start, stop, loops); // Start first loop automatically.

        },
        getMeasurements: function () {
            return measurements;
        },
        module: function (module) {
            currentModule = module;
        },
        log: function (text) {
            console.log(text);
        }
    };
}(window));