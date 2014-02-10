(function (window, undefined) {
    "use strict";

    var measurements = {},// Store measurement results.
        tests = {},// Cache tests.
        startTime = 0,// Using for polifill performance.now
        currentModule = 'Default',
        i = 0,
        onReadyCallbacks = [],
        readyStateCheckInterval,
        measurejs;

    //Polyfill for performance now.
    if (!window.performance) {
        startTime = (new Date()).getTime();
        window.performance = window.performance || {};
        window.performance.now = window.performance.now || function () {
            return (new Date()).getTime() - startTime;
        };
    }


    function run() {

        for (var i = 0, l = onReadyCallbacks.length; i < l; i++) {

            onReadyCallbacks[i]();

        }

    }

    //
    if (!readyStateCheckInterval && document.readyState !== "complete") {
        readyStateCheckInterval = setInterval(function () {

            if (document.readyState === "complete") {

                clearInterval(readyStateCheckInterval);
                run();

            }

        }, 10);
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

    measurejs = {
        ui: false, // Inform if UI components were detected
        init: function () {

            if (window.ui) {

                measurejs.ui = window.ui;

            }

        },
        /**
         * @param id Unique test id (can be name)
         * @param description Description of test
         * @returns {*}
         */
        start: function (id) {

            measurements[id].start.push(performance.now());

            return id;
        },
        /**
         * @param id
         * @returns {*}
         */
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
                        measurejs.start(id);
                    };

                    stop = function () {
                        measurejs.stop(id);
                    };

                    loops = function (loops) {
                    };

                    tests[id](start, stop, loops);
                }

                returned = measurements[id];

            }
            return returned;
        },
        /**
         * @param id
         * @param loops
         */
        loops: function (id, loops) {

            measurements[id] = measurements[id] || {};
            measurements[id].loops = loops;

        },
        /**
         * @param id
         * @param callback
         */
        suit: function (id, callback) {
            var start = function () { // Run performance measurement, passed as argument to our suit.
                    measurejs.start(id);
                },
                stop = function () { // Stops performance measurement, passed as argument to our suit.
                    measurejs.stop(id);
                },
                loops = function (loops) { // Specify number of reps of current test, passed as argument to our suit.
                    measurejs.loops(id, loops);
                },
                measurement = {};

            id = id || 'measure-' + i++; // Before we start, if not passed, we need to create unique id for our test.

            tests[id] = callback; // Next we need to save it in object with all tests.

            // Before starting our first measurement we need to prepare object in which we will store all data.
            measurement = {}; // After that, under it, we create empty object
            measurement.module = currentModule; // After that, under it, we create empty object
            measurement.id = id;
            measurement.start = []; // in which we will store start value
            measurement.stop = []; // and stop value for each of measurements.
            measurement.loops = 1; // We will also store number of loops which need to run.

            onReadyCallbacks.push(function () {

                if (measurejs.ui) {

                    measurejs.ui.add(measurement);

                } else {

                    callback(start, stop, loops);

                }

            });

            measurements[id] = measurement;

        },
        /**
         * @returns {{}}
         */
        getMeasurements: function () {
            return measurements;
        },
        /**
         * @param module
         */
        module: function (module) {
            currentModule = module;
        },
        /**
         * @param text
         */
        log: function (text) {
            console.log(text);
        }
    };

    onReadyCallbacks.push(measurejs.init);

    window.measurejs = measurejs;
}(window));