/*! YAMVC v0.1.12 - 2014-02-07 
 *  License:  */
(function (window, undefined) {
    "use strict";
    var yamvc = window.yamvc || {},
        mixins = yamvc.mixins || {},
        GetSet;

    GetSet = {
        /**
         *
         * @param property
         * @param value
         * @returns {this}
         *
         */
        set: function (property, value) {
            var p = "_" + property,
                oldVal = this[p];
            if (value !== oldVal) {
                this[p] = value;
                this.fireEvent(property + 'Change', this, value, oldVal);
            }
            return this;
        },
        /**
         *
         * @param property
         * @returns {*}
         *
         */
        get: function (property) {
            return this["_" + property];
        }
    };

    mixins.GetSet = GetSet;
    window.yamvc = yamvc;
    window.yamvc.mixins = mixins;
}(window));

(function (window, undefined) {
    "use strict";
    var yamvc = window.yamvc || {},
        mixins = yamvc.mixins || {},
        Observable;

    Observable = {
        init: function () {
            this.set('listeners', {});
            this.set('suspendEvents', false);
        },
        /**
         * fire event
         * @returns {boolean}
         *
         */
        fireEvent: function (/** param1, ... */) {
            if (this._suspendEvents)
                return true;
            var ret = true,
                shift = Array.prototype.shift,
                evName = shift.call(arguments),
                scope;

            scope = shift.call(arguments);
            for (var i = 0, li = this._listeners[evName] || [], len = li.length; i < len; i++) {
                if (ret) {
                    ret = li[i].apply(scope, arguments);
                    ret = typeof ret === 'undefined' ? true : ret;
                }
            }
            return ret;
        },

        /**
         * fire event
         * @version 0.1.12
         * @param evName
         * @param callback
         * @returns {this}
         *
         */
        addEventListener: function (evName, callback) {
            var listeners = this._listeners[evName] || [];
            listeners.push(callback);
            this._listeners[evName] = listeners;
            return this;
        },

        /**
         * fire event
         * @version 0.1.12
         * @param evName
         * @param callback
         * @returns {this}
         *
         */
        removeEventListener: function (evName, callback) {
            var listeners = this._listeners[evName] || [],
                index;
            if (listeners) {
                if (callback) {
                    if (typeof callback === "function") {
                        for (var i = 0, len = listeners.length; i < len; i++) {
                            if (listeners[i] === callback) {
                                index = i;
                            }
                        }
                    } else {
                        index = callback;
                    }
                    listeners.splice(index, 1);
                } else {
                    this._listeners[evName] = [];
                }
            }
            return this;
        },

        /**
         * suspend all events
         */
        suspendEvents: function () {
            this.set('suspendEvents', true);
            return this;
        },
        /**
         * resume all events
         */
        resumeEvents: function () {
            this.set('suspendEvents', false);
            return this;
        }
    };

    mixins.Observable = Observable;
    window.yamvc = yamvc;
    window.yamvc.mixins = mixins;
}(window));

(function (window, undefined) {
    "use strict";

    var yamvc = window.yamvc || {},
        Core,
        onReadyCallbacks = [],
        readyStateCheckInterval;

    // Run all method when ready
    function run() {
        for (var i = 0, l = onReadyCallbacks.length; i < l; i++) {
            onReadyCallbacks[i]();
        }
    }

    // Provide way to execute all necessary code after DOM is ready.
    /**
     * @param callback
     */
    yamvc.$onReady = function (callback) {
        onReadyCallbacks.push(callback);
        if (!readyStateCheckInterval && document.readyState !== "complete") {
            readyStateCheckInterval = setInterval(function () {
                if (document.readyState === "complete") {
                    clearInterval(readyStateCheckInterval);
                    run();
                }
            }, 10);
        }
    };

    // Merge two objects.
    /**
     * @param obj1
     * @param obj2
     * @returns {*}
     */
    yamvc.$merge = function (obj1, obj2) {
        var nObj = {},
            property;

        for (property in obj1) {
            if (obj1.hasOwnProperty(property)) {
                nObj[property] = obj1[property];
            }
        }

        for (property in obj2) {
            if (obj2.hasOwnProperty(property)) {
                nObj[property] = obj2[property];
            }
        }

        return nObj;
    };

    //
    yamvc.$clone = function (obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    // Definition of Core object.
    Core = yamvc.Core || (function () {

        /**
         *
         * @constructor
         *
         */
        function Core() {
            this.set('listeners', {});
            this.bindMethods.apply(this, arguments);
            this.init.apply(this, arguments);
        }

        /**
         * @abstract
         */
        Core.prototype.init = function () {
        };

        /**
         *
         */
        Core.prototype.initConfig = function () {
            var me = this,
                config = me.get('config'),
                getter,
                setter,
                property,
                init = function (property) {
                    getter = "get" + property.charAt(0).toUpperCase() + property.slice(1);
                    setter = "set" + property.charAt(0).toUpperCase() + property.slice(1);
                    me[getter] = function () {
                        return me.get('config')[property];
                    };
                    me[setter] = function (value) {
                        var oldVal = me.get('config')[property];
                        if (value !== oldVal) {
                            me.get('config')[property] = value;
                            me.fireEvent(property + 'Change', this, value, oldVal);
                        }
                    };
                };
            for (property in config) {
                if (config.hasOwnProperty(property)) {
                    init(property);
                }
            }
        };

        // Binds custom methods from config object to class instance.
        /**
         * @param initOpts
         */
        Core.prototype.bindMethods = function (initOpts) {
            for (var property in initOpts) {
                if (initOpts.hasOwnProperty(property) && typeof initOpts[property] === 'function') {
                    this[property] = initOpts[property].bind(this);
                    delete initOpts[property];
                }
            }
        };

        // Add callback to property change event.
        /**
         * @param property
         * @param callback
         * @returns {this}
         */
        Core.prototype.onChange = function (property, callback) {
            this.addEventListener(property + 'Change', callback);
            return this;
        };

        // Unbind callback.
        /**
         * @param property
         * @param callback
         * @returns {this}
         */
        Core.prototype.unbindOnChange = function (property, callback) {
            var listeners = this._listeners[property + 'Change'] || [];
            for (var i = 0, len = listeners.length; i < len; i++) {
                if (listeners[i] === callback) {
                    listeners.splice(i, 1);
                }
            }
            this._listeners[property + 'Change'] = listeners;
            return this;
        };

        Core.$create = function (opts) {
            var Obj = this;
            return new Obj(opts);
        };

        // Add mixin to object definition.
        /**
         * @static
         * @param obj
         * @param {*} mixin
         */
        Core.$mixin = function (obj, mixin) {
            var prototype,
                property;

            if (mixin) {
                prototype = typeof obj === 'function' ? obj.prototype : obj;
            } else {
                mixin = typeof obj === 'function' ? obj.prototype : obj;
                prototype = this.prototype;

            }

            for (property in mixin) {
                if (mixin.hasOwnProperty(property)) {
                    prototype[property] = mixin[property];
                }
            }
        };

        // Stores all mixins initializing functions.
        /**
         * @type {Array}
         * @private
         */
        Core.__mixins__ = [];

        // Stores all defaults.
        /**
         * @type {Object}
         * @private
         */
        Core.__defaults__ = {};

        // Extend object definition using passed options.
        /**
         * @static
         * @param opts Object
         * @returns {Function}
         */
        Core.$extend = function (opts) {
            opts = opts || {};
            var Parent = this,
                Class = function () {
                    var key;
                    //
                    this._config = {};

                    // Initialize defaults.
                    for (key in defaults) {
                        if (__hasProp.call(defaults, key)) this._config[key] = defaults[key];
                    }
                    Core.apply(this, arguments);
                },
                defaults = yamvc.$merge(Parent.__defaults__ || {}, opts.defaults),
                mixins = opts.mixins || [],
                statics = opts.static || {},
                __hasProp = {}.hasOwnProperty,
                __extends = function (child, parent) {
                    // inherited
                    for (var key in parent) {
                        if (__hasProp.call(parent, key)) child[key] = parent[key];
                    }
                    function Instance() {
                        this.constructor = child;
                    }

                    Instance.prototype = parent.prototype;
                    child.Parent = parent.prototype;
                    child.prototype = new Instance();
                    child.$extend = Core.$extend;
                    child.$mixin = Core.$mixin;
                    child.$create = Core.$create;
                    child.__mixins__ = [];
                    child.__defaults__ = defaults;

                    // Add methods to object definition.
                    for (var method in opts) {
                        if (
                            __hasProp.call(opts, method) &&
                                typeof opts[method] === 'function'
                            ) {
                            child.prototype[method] = opts[method];
                        }
                    }

                    // Add external mixins.
                    while (mixins.length) {
                        child.mixin(mixins.pop());
                    }

                    // Make method static.
                    for (var stat in statics) {
                        if (__hasProp.call(statics, stat)) {
                            child['$' + stat] = statics[stat];
                        }
                    }

                    return child;
                };

            __extends(Class, Parent);

            return Class;
        };

        // Add Getters and Setters.
        Core.$mixin(yamvc.mixins.GetSet);

        // Add observable methods.
        Core.$mixin(yamvc.mixins.Observable);

        return Core;
    }());

    yamvc.Core = Core;
    window.yamvc = yamvc;
}(window));
(function (window, undefined) {
    "use strict";
    var yamvc = window.yamvc || {},
        Collection;

    Collection = yamvc.Core.$extend({
        defaults: {
            namespace: null,
            proxy: null
        },
        /**
         * initialize collection
         * @param opts
         */
        init: function (opts) {

            Collection.Parent.init.apply(this, arguments);

            var me = this, config;

            opts = opts || {};
            config = yamvc.$merge(me._config, opts.config);

            me.set('initOpts', opts);
            me.set('config', config);
            me.set('set', []);
            me.set('cache', []);
            me.set('removed', []);
            me.set('filters', []);

            me.initConfig();
            me.initData();

            return me;
        },
        /**
         * initialize data
         */
        initData: function () {
            var me = this,
                data = me.getData() || [];

            me.set('raw', data);
            me.prepareData(data);

            return me;
        },
        forEach: function (fn) {
            var me = this,
                records = me._set,
                t, len;

            t = Object(records);
            len = t.length >>> 0;
            if (typeof fn !== "function")
                throw new TypeError();

            for (var i = 0; i < len; i++) {
                if (i in t)
                    fn.call(me, t[i], i, t);
            }
        },
        push: function (records) {
            var me = this,
                record,
                ModelDefinition = me.getModel(),
                namespace = me.getNamespace();

            if (!Array.isArray(records)) {
                records = [records];
            }

            while (records.length) {

                record = records.pop();
                record = new ModelDefinition(
                    {
                        config: {
                            namespace: namespace,
                            data: record
                        }
                    }
                );

                me._cache.push(record);
                me.fireEvent('cacheChanged');

            }

            me.filter();

            return me;
        },
        // return number of records in collection
        /**
         * @returns {Number}
         */
        count: function () {
            return this._set.length;
        },
        clear: function () {
            var me = this;

            me.set('set', []);
            me.set('cache', []);
            me.set('removed', []);

            return me;
        },
        clearFilters: function () {
            var me = this;

            //TODO: clear by multiple filters id
            me.set('filters', []);
            me.filter();

            return me;
        },
        clearFilter: function (id) {
            var me = this,
                filters = me._filters,
                filLength,
                filter;

            filLength = filters.length;
            while (filLength--) {

                filter = filters[filLength];
                if (typeof filter !== 'function' && filter.id === id) {

                    filters.splice(filLength, 1);

                    break;

                }

            }

            me.filter();

            return me;
        },
        filter: function (fn) {
            var me = this,
                filters = me._filters,
                filterFn,
                passed = true,
                filtered = [],
                records = me._cache,
                filLength = 0,
                id = null;

            if (arguments.length > 1) {
                id = arguments[0];
                fn = arguments[1];
            }


            if (typeof fn === 'function') {

                if (id) {

                    filters.push({
                        id: id,
                        fn: fn
                    });

                } else {

                    filters.push(fn);

                }

                me.fireEvent('beforeFilter', me, filters);

            }

            for (var i = 0, l = records.length; i < l; i++) {

                passed = true;
                filLength = filters.length;
                while (filLength--) {

                    filterFn = typeof filters[filLength] === 'function' ? filters[filLength] : filters[filLength].fn;
                    passed = passed && filterFn(records[i]);

                }

                if (passed) {

                    filtered.push(records[i]);

                }

            }

            me.set('set', filtered);
            me.fireEvent('afterFilter', me, filters);

            return me;
        },
        /**
         * get record at
         * @param index
         * @returns {yamvc.Model}
         */
        getAt: function (index) { // Return record by index.
            return this._set[index];
        },
        /**
         *
         * @param fn
         * @returns {Array}
         */
        getBy: function (fn) { // Return all matched record.
            var me = this,
                records = me._set,
                filtered = [];

            for (var i = 0, l = records.length; i < l; i++) {

                if (fn(records[i])) {

                    filtered.push(records[i]);

                }

            }
            return filtered;
        },
        /**
         * @param fn
         * @returns {}
         */
        findOneBy: function (fn) { // Return index of first matched record.
            var me = this,
                records = me._set,
                len = records.length;

            while (len--) {

                if (fn(records[len])) break;

            }

            return len;
        },
        /**
         * @param fn
         * @returns {Array}
         */
        getOneBy: function (fn) { // Return first matched record.
            var me = this,
                records = me._set,
                record,
                len = records.length;

            while (len--) {

                if (fn(records[len])) {
                    record = records[len];
                    break;

                }

            }

            return record;
        },
        /**
         * return real number of records
         * @returns {Number}
         */
        getTotal: function () {
            return this._total;
        },
        /**
         * load data
         * proxy need to be set
         * @param params
         */
        load: function (params) {
            var me = this,
                data = me.get('data'),
                idProperty = me.get('idProperty'),
                deferred = yamvc.Promise.$deferred(),
                namespace = me.getNamespace(),
                action = new yamvc.data.Action(),
                callback,
                key, i = 0;

            for (key in params) i++;

            if (
                i === 0
                )
                throw new Error('You need to pass at least one condition to load model collection');

            if (!me.getProxy())
                throw new Error('To load collection you need to set proxy');


            callback = function () {

                if (me.getProxy().getStatus() === 'success') {

                    me.fireEvent('loaded', me, action.getResponse(), 'read');

                } else {

                    me.fireEvent('error', me, 'read');

                }
            };

            action
                .setOptions({
                    callback: callback,
                    params: params,
                    namespace: namespace
                });

            me.getProxy().read(action);

            return deferred.promise;
        },
        save: function () {
            var me = this,
                deferred = yamvc.Promise.$deferred(),
                action,
                toCreate = [],
                toUpdate = [],
                toRemove = me._removed,
                records = me._cache,
                namespace = me.getNamespace(),
                proxy = me.getProxy(),
                toFinish = 0,
                exceptions = [],
                callback,
                record,
                byIdFn;

            for (var i = 0, l = records.length; i < l; i++) {

                record = records[i];
                if (record._isDirty) {

                    if (record.hasId()) {

                        toUpdate.push(record._data);

                    } else {

                        record._data.__clientId__ = record.get('clientId');
                        toCreate.push(record._data);

                    }
                }

            }

            byIdFn = function (record) {
                return function (_record) {
                    return record.__clientId__ ?
                        _record.data('__clientId__') === record.__clientId__ :
                        _record.data('id') === record.id;
                };
            };

            callback = function (proxy, action) {

                toFinish--;

                if (action.getStatus() === yamvc.data.Action.Status.SUCCESS) {

                    var response = action.getResponse(),
                        data = response.result,
                        len;

                    record = data[0];
                    len = data.length;

                    // If record has __clientId__ property it's create process
                    // or if it has id it's update.
                    if (record && (record.__clientId__ || record.id)) {

                        while (len--) {

                            record = me.getOneBy(byIdFn(data[len]));
                            record.setDirty(false);

                            delete record._data.__clientId__;

                        }

                    } else { // Else it's remove process.

                        me.set('removed', []);

                    }

                } else {

                    exceptions.push(action.getResponse().error);

                }

                if (toFinish === 0) {

                    if (exceptions.length) {

                        me.fireEvent('error', me, exceptions);

                        deferred.reject({
                            errors: exceptions
                        });

                    } else {

                        me.fireEvent('success', me);

                        deferred.resolve({scope: me});

                    }

                }

            };

            if (toCreate.length) {

                toFinish++;

                action = new yamvc.data.Action();

                action
                    .setOptions({
                        namespace: namespace,
                        callback: callback
                    })
                    .setData(toCreate);

                proxy.create(action);

            }

            if (toUpdate.length) {

                toFinish++;

                action = new yamvc.data.Action();

                action
                    .setOptions({
                        namespace: namespace,
                        callback: callback
                    })
                    .setData(toUpdate);

                proxy.update(action);
            }

            if (toRemove.length) {

                toFinish++;

                action = new yamvc.data.Action();

                action
                    .setOptions({
                        namespace: namespace,
                        callback: callback
                    })
                    .setData(toRemove);

                proxy.destroy(action);
            }

            return deferred.promise;
        },
        /**
         * Prepare data
         * @private
         * @param data
         * @param {Number||null} total
         * @returns {Collection}
         */
        prepareData: function (data, total) {
            var me = this,
                ModelInstance = me.getModel(),
                modelConfig = { namespace: me.getNamespace()},
                l = data.length,
                models = [];

            total = total || l;
            for (var i = 0; i < l; i++) {

                modelConfig.data = data[i];
                models.push(new ModelInstance({
                    config: modelConfig
                }));

            }

            me.set('cache', models);
            me.set('total', total);

            me.filter();

            return me;
        },
        setData: function () {
            var me = this;

            me.setRawData(data);
            me.prepareData(data);

            return me;
        },
        getData: function () {
            return this._set;
        },
        getRawData: function () {
            return this._raw;
        },
        setRawData: function (data) {

            this.set('raw', data);

            return this;
        },
        isDirty: function () {
            var records = this._cache,
                len = records.length,
                isDirty = false;

            while (len--) {
                if (records[len]._isDirty) {
                    isDirty = true;
                }
            }

            if (this._remove) {
                isDirty = true;
            }

            return isDirty;
        }
    });

    window.yamvc = yamvc;
    window.yamvc.Collection = Collection;
}(window));

/**
 * ## Basic controller usage
 *
 *     @example
 *     var ctl = new Controller({
 *         config: {
 *             name: 'Main',
 *             views: {
 *                 layout: ViewManager.get('view-0')
 *             },
 *             routes: {
 *                 "page/{\\d+}": 'changePage'
 *             },
 *         },
 *         bindElements : function (){
 *             var me = this;
 *             me.set('$arrowRight', document.querySelector('#arrow-right'));
 *             me.set('$arrowLeft', document.querySelector('#arrow-left'));
 *         },
 *         bindEvents: function () {
 *             var me = this;
 *             me.get('$arrowRight').addEventListener('click', this.nextPage.bind(this));
 *             me.get('$arrowLeft').addEventListener('click', this.prevPage.bind(this));
 *         },
 *         changePage: function (id) {
 *             // changing page mechanism
 *         },
 *         nextPage: function () {
 *             // changing page mechanism
 *         },
 *         prevPage: function () {
 *             // changing page mechanism
 *         }
 *     });
 *
 * ## Configuration properties
 *
 * @cfg config.name {String} Name of the controller
 * @cfg config.routes {Object} Object with defined routes and callbacks
 * @cfg config.views {Object} List of views connected with controller
 *
 */
(function (window, undefined) {
    "use strict";

    var yamvc = window.yamvc || {},
        Controller,
        router;

    /**
     *
     * @type {*}
     */
    Controller = yamvc.Core.$extend({
        init: function (opts) {
            var config,
                me = this;

            opts = opts || {};
            config = opts.config || {};
            router = router || new yamvc.Router();

            me.set('initOpts', opts);
            me.set('config', config);
            me.set('routes', config.routes || {});
            me.set('events', config.events || {});
            me.set('views', config.views || {});

            me.initConfig();
            me.renderViews();
            me.restoreRouter();

            return me;
        },
        initConfig: function () {
            yamvc.Core.prototype.initConfig.apply(this);
            var me = this,
                routes = me.get('routes'),
                events = me.get('events'),
                views = me.get('views'),
                query,
                rx = /(^\$|,$)/,
                view;

            if (routes) {
                for (var k in routes) {
                    if (routes.hasOwnProperty(k)) {
                        var callback = me[routes[k]].bind(me);
                        router.when(k, callback);
                    }
                }
            }

            if (events && views) {
                for (view in views) {
                    if (views.hasOwnProperty(view)) {
                        views[view].addEventListener('render', me.resolveEvents.bind(me));
                    }
                }

                for (query in events) {

                    if (events.hasOwnProperty(query)) {

                        if (rx.test(query)) {

                            view = views[query.substr(1)];

                            if (view) {

                                for (var event in events[query]) {

                                    if (events[query].hasOwnProperty(event)) {
                                        view.addEventListener(event, events[query][event].bind(me, view));
                                    }

                                }

                            }

                            delete events[query];
                        }
                    }

                }

            }
            return this;
        },
        renderViews: function () {
            var me = this,
                views = me.get('views');

            for (var view in views) {

                if (views.hasOwnProperty(view)) {

                    if (views[view].getAutoCreate && views[view].getAutoCreate()) {

                        views[view].render();

                    }
                }

            }

        },
        resolveEvents: function (view) {
            var events = this.get('events'),
                viewEvents,
                newScope = function (func, scope, arg) {
                    return func.bind(scope, arg);
                },
                elements,
                scope;

            for (var query in events) {

                if (events.hasOwnProperty(query)) {

                    viewEvents = events[query];
                    elements = view.get('el').querySelectorAll(query);
                    for (var i = 0, l = elements.length; i < l; i++) {

                        for (var event in viewEvents) {

                            if (viewEvents.hasOwnProperty(event)) {

                                scope = newScope(viewEvents[event], this, view);

                                elements[i].addEventListener(event, scope);

                            }

                        }

                    }

                }

            }

        },
        getRouter: function () {
            return router;
        },
        restoreRouter: function () {
            var me = this;

            me.getRouter().restore();

            return me;
        },
        redirectTo: function (path) {

            window.location.hash = path;

            return this;
        }
    });

    window.yamvc.Controller = Controller;
}(window));
(function (window, undefined) {
    "use strict";
    var yamvc = window.yamvc || {},
        Action,
        Status;

    Status = {
        PENDING: 0,
        SUCCESS: 1,
        FAIL: 2
    };

    Action = yamvc.Core.$extend({
        init: function (opts) {
            var me = this, config;

            Action.Parent.init.apply(this, arguments);

            opts = opts || {};
            config = yamvc.$merge(me._config, opts.config);

            me.set('initOpts', opts);
            me.set('config', config);
            me.set('response', {});
            me.set('status', Status.PENDING);

            me.initConfig();
        },
        setData : function (data) {
            this.set('data', data);
            return this;
        },
        getData : function () {
            return this._data;
        },
        setOptions: function (opts) {
            this.set('options', opts);
            return this;
        },
        getOptions: function () {
            return this._options;
        },
        getOption: function (name) {
            return this._options[name];
        },
        setResponse: function (response) {
            return this.set('response', response);
        },
        getResponse: function () {
            return this.get('response');
        },
        setStatus: function (status) {
            var check = false, st;

            for (st in Status) {
                if (Status.hasOwnProperty(st) && Status[st] === status)
                    check = true;
            }

            if (!check)
                throw new Error('yamvc.data.Action: Wrong status');

            return this.set('status', status);
        },
        getStatus: function () {
            return this.get('status');
        }
    });

    // statics
    Action.Status = Status;

    window.yamvc = yamvc;
    window.yamvc.data = window.yamvc.data || {};
    window.yamvc.data.Action = Action;
}(window));

(function (window, undefined) {
    "use strict";
    var yamvc = window.yamvc || {},
        Proxy;

    Proxy = yamvc.Core.$extend({
        init: function (opts) {
            var me = this, config;

            Proxy.Parent.init.apply(this, arguments);

            opts = opts || {};
            config = yamvc.$merge(me._config, opts.config);

            me.set('initOpts', opts);
            me.set('config', config);

            me.initConfig();

        },
        read: function (action) {
            var me = this,
                opts,
                id;

            if (!(action instanceof yamvc.data.Action))
                throw new Error('yamvc.data.Proxy: read argument action should be instance of yamvc.data.Action');

            opts = action.getOptions();
            id = opts.params && opts.params.id;

            if (!action.getOption('namespace'))
                throw new Error('yamvc.data.Proxy: namespace should be set');

            if (typeof id === 'undefined') {
                me.readBy(action);
            } else {
                me.readById(action);
            }

            return me;
        },
        create: function (action) {
            var me = this;

            if (!(action instanceof yamvc.data.Action))
                throw new Error('yamvc.data.Proxy: create argument action should be instance of yamvc.data.Action');

            if (!action.getOption('namespace'))
                throw new Error('yamvc.data.Proxy: namespace should be set');

            if (!action.getData() || typeof action.getData() !== 'object')
                throw new Error('yamvc.data.Proxy: Data should be object');

            return me;
        },
        update: function (action) {
            var me = this;

            if (!(action instanceof yamvc.data.Action))
                throw new Error('yamvc.data.Proxy: update argument action should be instance of yamvc.data.Action');

            if (!action.getOption('namespace'))
                throw new Error('yamvc.data.Proxy: namespace should be set');

            if (!action.getData() || typeof action.getData() !== 'object')
                throw new Error('yamvc.data.Proxy: Data should be object');

            return me;
        },
        destroy: function (action) {
            var me = this;

            if (!(action instanceof yamvc.data.Action))
                throw new Error('yamvc.data.Proxy: destroy argument action should be instance of yamvc.data.Action');

            if (!action.getOption('namespace'))
                throw new Error('yamvc.data.Proxy: namespace should be set');

            if (!action.getData() || typeof action.getData() !== 'object')
                throw new Error('Data should be pass as object');

            return me;
        }
    });

    window.yamvc = yamvc;
    window.yamvc.data = window.yamvc.data || {};
    window.yamvc.data.Proxy = Proxy;
}(window));

(function (window, undefined) {
    "use strict";
    var yamvc = window.yamvc || {},
        Localstorage,
        Proxy = yamvc.data.Proxy,
        Action = yamvc.data.Action;

    /**
     * Extend Proxy class
     *
     * @type {*}
     */
    Localstorage = Proxy.$extend({
        static: {
            /**
             *
             * @param tables
             */
            clear: function (tables) {
                var len = 0, table;
                if (!tables) {
                    for (var store in localStorage) {
                        delete localStorage[store];
                        delete localStorage[store + '$Sequence'];
                    }
                } else {
                    if (!Array.isArray(tables)) {
                        tables = [tables];
                    }
                    len = tables.length;
                    while (len--) {
                        table = tables[len];
                        delete localStorage[table];
                        delete localStorage[table + '$Sequence'];
                    }
                }
            }
        },
        /**
         * @param action
         * @returns {Localstorage}
         */
        readBy: function (action) {
            var me = this,
                opts = action.getOptions(),
                namespace = opts.namespace,
                callback = opts.callback,
                limit = opts.limit || null,
                offset = opts.offset || 0,
                filters = opts.filters || [],
                sorters = opts.sorters || [],
                response = {},
                filtered = [],
                records = [],
                meet = true,
                total = 0,
                async,
                operator,
                property,
                sorter,
                sorterFn,
                order,
                len;

            sorterFn = function (a, b) {
                var va = "" + a[property],
                    vb = "" + b[property],
                    alc = va.toLowerCase(), blc = vb.toLowerCase();
                return (alc > blc ? 1 : alc < blc ? -1 : va > vb ? 1 : va < vb ? -1 : 0) * (order.toLowerCase() === 'desc' ? -1 : 1);
            };

            async = function () {

                if (localStorage[namespace]) {
                    records = JSON.parse(localStorage[namespace]);

                    // firstly we need to filter records
                    for (var i = 0, l = records.length; i < l; i++) {
                        meet = true;
                        len = filters.length;
                        while (len--) {
                            if (filters[len].length > 3) {
                                operator = filters[len][0];
                            } else {
                                operator = '&&';
                            }
                            if (operator === '&&') {
                                meet = me.executeCondition(records[i], filters[len]) && meet;
                            } else if (operator === '||') {
                                meet = me.executeCondition(records[i], filters[len]) || meet;
                            }
                        }

                        if (meet) {
                            filtered.push(records[i]);
                        }

                    }

                    records = filtered;
                    total = filtered.length;

                    // next we do sorting
                    len = sorters.length;
                    while (len--) {
                        sorter = sorters[len];
                        property = sorter[0];
                        order = sorter[1] || 'ASC';
                        records.sort(sorterFn);
                    }
                    // and take care about offset and limit
                    if (!limit) {
                        limit = records.length - offset;
                    }

                    if (offset > 0 || limit) {
                        records = records.splice(offset, limit);
                    }
                }

                response.total = total;
                response.result = records;

                action
                    .setStatus(yamvc.data.Action.Status.SUCCESS)
                    .setResponse(response);

                callback(me, action);

            };

            setTimeout(function () {

                try {

                    async();

                } catch (e) {

                    response.error = e;
                    callback(me, action);

                }
            }, 0);

            return me;
        },
        /**
         *
         * @param action
         * @returns {Localstorage}
         */
        readById: function (action) {
            var me = this,
                opts = action.getOptions(),
                params = opts.params,
                namespace = opts.namespace,
                callback = opts.callback,
                id = params.id,
                records = [],
                result = {},
                response = {},
                async;

            async = function () {

                if (localStorage[namespace]) {

                    records = JSON.parse(localStorage[namespace]);
                    for (var i = 0, l = records.length; i < l; i++) {

                        if (records[i].id === id) {
                            result = records[i];
                        }

                    }

                    if (typeof result.id !== 'undefined') {

                        response.total = 1;
                        response.result = result;

                        action
                            .setStatus(yamvc.data.Action.Status.SUCCESS)
                            .setResponse(response);

                        callback(me, action);

                        return me;
                    }
                }

                me.setStatus(yamvc.data.Action.Status.FAIL);
                response.error = new Error("Not found");
                callback(me, action);
            };

            setTimeout(async, 0);

            return me;
        },
        /**
         *
         * @param record
         * @param filter
         * @returns {boolean}
         */
        executeCondition: function (record, filter) {
            var result = false, condition, property, value, regex;
            if (filter.length > 3) {
                property = filter[1];
                condition = filter[2];
                value = filter[3];
            } else {
                property = filter[0];
                condition = filter[1];
                value = filter[2];
            }
            switch (condition) {
                case '>' :
                    if (record[property] > value) {
                        result = true;
                    }
                    break;
                case '<' :
                    if (record[property] < value) {
                        result = true;
                    }
                    break;
                case '>=' :
                    if (record[property] >= value) {
                        result = true;
                    }
                    break;
                case '<=' :
                    if (record[property] <= value) {
                        result = true;
                    }
                    break;
                case 'like' :
                    if (value.charAt(0) !== '%') {
                        value = "^" + value;
                    }
                    if (value.charAt(value.length - 1) !== '%') {
                        value = value + "$";
                    }
                    value = value.replace(/%/g, "");
                    regex = new RegExp(value);
                    if (regex.test(record[property])) {
                        result = true;
                    }
                    break;
            }
            return result;
        },
        /**
         * @param action
         * @returns {Localstorage}
         */
        create: function (action) {
            var me = this,
                data = action.getData(),
                namespace = action.getOption('namespace'),
                callback = action.getOption('callback'),
                records = [],
                sequence = 1,
                response = {},
                result,
                async;

            Localstorage.Parent.create.apply(this, arguments);

            if (localStorage[namespace]) {

                records = JSON.parse(localStorage[namespace]);
                sequence = localStorage[namespace + "$Sequence"];

            }

            if (Array.isArray(data)) {

                result = [];
                for (var i = 0, l = data.length; i < l; i++) {

                    // Add id to the new record,
                    data[i].id = sequence++;

                    // remove client id,
                    delete data[i].__clientId__;

                    // push to records
                    records.push(data[i]);

                    // and to return array.
                    result.push(data[i]);
                }

            } else {

                data.id = sequence++;

                delete data.__clientId__;

                records.push(data);

                result = data;

            }

            async = function () {
                try {

                    localStorage[namespace] = JSON.stringify(records);
                    localStorage[namespace + "$Sequence"] = sequence;

                    response.result = result;

                    action
                        .setStatus(Action.Status.SUCCESS)
                        .setResponse(response);

                } catch (e) {

                    response.error = e;

                    action
                        .setStatus(Action.Status.FAIL)
                        .setResponse(response);

                }

                callback(me, action);
            };

            setTimeout(async, 0);

            return me;
        },
        /**
         * @param action
         * @returns {Localstorage}
         */
        update: function (action) { //
            var me = this,
                data = action.getData(),
                namespace = action.getOption('namespace'),
                callback = action.getOption('callback'),
                records = [],
                result,
                response = {},
                id, l, l2, async;

            async = function () { // update record asynchronously
                if (localStorage[namespace]) { // but only if namespace for saving object exist

                    records = JSON.parse(localStorage[namespace]);

                    if (Array.isArray(data)) {

                        result = [];
                        l = data.length;
                        while (l--) {
                            l2 = records.length;
                            id = data[l].id;
                            while (l2--) {
                                if (records[l2].id === id) {
                                    records[l2] = data[l];
                                    result.splice(0,0, data[l]);
                                }
                            }
                        }

                    } else {
                        l = records.length;
                        id = data.id;
                        while (l--) {
                            if (records[l].id === id) {
                                result = records[l] = data;
                            }
                        }

                    }

                    try {

                        localStorage[namespace] = JSON.stringify(records);
                        response.success = true;
                        response.result = result;

                        action
                            .setStatus(Action.Status.SUCCESS)
                            .setResponse(response);

                    } catch (e) {

                        response.success = false;
                        response.error = e;

                        action
                            .setStatus(Action.Status.FAIL)
                            .setResponse(response);

                    }

                    callback(me, action);

                    return me;
                }

                response.success = false;
                response.error = new Error("Not found");

                action
                    .setStatus(Action.Status.FAIL)
                    .setResponse(response);

                callback(me, action);
            };

            setTimeout(async, 0);
            return me;
        },
        /**
         *
         * @param action
         * @returns {Localstorage}
         */
        destroy: function (action) {
            var me = this,
                data = action.getData(),
                namespace = action.getOption('namespace'),
                callback = action.getOption('callback'),
                records = [],
                response = {},
                id, l, l2, async;

            async = function () {

                if (localStorage[namespace]) {

                    records = JSON.parse(localStorage[namespace]);

                    if (Array.isArray(data)) {

                        l = data.length;
                        while (l--) {
                            l2 = records.length;
                            id = data[l].id;
                            while (l2--) {
                                if (records[l2].id === id) {
                                    records.splice(l2, 1);
                                }
                            }
                        }

                    } else {

                        l = records.length;
                        id = data.id;
                        while (l--) {
                            if (records[l].id === id) {
                                records.splice(l, 1);
                            }
                        }

                    }

                    try {

                        localStorage[namespace] = JSON.stringify(records);
                        response.success = true;

                        action
                            .setStatus(Action.Status.SUCCESS)
                            .setResponse(response);

                    } catch (e) {

                        response.success = false;
                        response.error = e;

                        action
                            .setStatus(Action.Status.FAIL)
                            .setResponse(response);

                    }
                    callback(me, action);
                    return me;
                }

                response.success = false;
                response.error = new Error("Not found");

                action
                    .setStatus(Action.Status.FAIL)
                    .setResponse(response);

                callback(me, action);

            };

            setTimeout(async, 0);

            return me;
        }
    });

    window.yamvc = yamvc;
    window.yamvc.data = window.yamvc.data || {};
    window.yamvc.data.proxy = window.yamvc.data.proxy || {};
    window.yamvc.data.proxy.Localstorage = Localstorage;
}(window));

(function (window, undefined) {
    "use strict";
    var yamvc = window.yamvc || {},
        Model,
        config,
        id = 0;

    Model = yamvc.Core.$extend({
        /**
         * @defaults
         */
        defaults: {
            idProperty: 'id',
            proxy: null
        },
        /**
         *
         * @param opts
         */
        init: function (opts) {
            yamvc.Core.prototype.init.apply(this, arguments);
            var me = this, config;
            opts = opts || {};
            config = yamvc.$merge(me._config, opts.config);
            me.set('initOpts', opts);
            me.set('config', config);
            me.set('isDirty', true);
            me.initConfig();
            me.initData();
        },
        /**
         *
         * @returns {Model}
         */
        initConfig: function () {
            var me = this,
                config = me._config;

            if (!config.namespace)
                throw new Error("Model need to have namespace");

            if (!config.data)
                config.data = {};

            me.set('clientId', config.namespace + '-' + id++);

            Model.Parent.initConfig.apply(this);

            return me;
        },
        /**
         *
         */
        initData: function () {
            var me = this;

            me.set('data', me.getData() || {});

            return me;
        },
        /**
         *
         * @param property
         * @param value
         */
        setDataProperty: function (property, value) {
            var me = this,
                data = me._data,
                oldVal = data[property];
            if (value !== oldVal) {
                data[property] = value;
                me.set('isDirty', true);
                me.fireEvent('data' + property.charAt(0).toUpperCase() + property.slice(1) + 'Change', me, value, oldVal);
            }
        },
        /**
         *
         * @param property
         * @returns {*}
         */
        getDataProperty: function (property) {
            return this.get('data')[property];
        },
        // alias for set and get data property
        // if two arguments are passed data will be set
        // in other case data will be returned
        /**
         * @param property name of property in data
         * @param data Optional | if passed data will be set
         * @returns {*}
         *
         */
        data: function (property, data) {
            var me = this,
                len = arguments.length,
                key;

            if (len > 1) {

                this.setDataProperty.apply(this, arguments);

            } else {

                if (typeof property === 'object') {

                    for (key in property) {

                        if (property.hasOwnProperty(key)) {

                            me.setDataProperty(key, property[key]);

                        }

                    }

                } else {
                    return this.getDataProperty.apply(this, arguments);
                }

            }

            return me;
        },
        /**
         *
         */
        clear: function () {
            var me = this,
                data = me.get('data'),
                key;

            for (key in data) {
                if (data.hasOwnProperty(key)) {
                    me.data(key, null);
                }
            }
            me.set('data', {});
            me.fireEvent('dataChange', me, data);
        },
        /**
         *
         * @param params
         */
        load: function (params) {
            var me = this,
                data = me.get('data'),
                idProperty = me.getIdProperty(),
                deferred = yamvc.Promise.$deferred(),
                action = new yamvc.data.Action(),
                opts = {},
                response;

            if (
                typeof params[idProperty] === 'undefined' && typeof data[idProperty] === 'undefined'
                )
                throw new Error('You need to pass id to load model');

            params[idProperty] = data[idProperty];

            opts.namespace = me.getNamespace();
            opts.params = params;
            opts.callback = function () {

                response = me.getProxy().getResponse();

                if (me.getProxy().getStatus() === 'success') {

                    me.set('isDirty', false);
                    me.set('data', response);

                    deferred.resolve({scope: me, response: response, action: 'read'});
                    me.fireEvent('loaded', me, response, 'read');

                } else {

                    deferred.reject({scope: me, response: response, action: 'read'});
                    me.fireEvent('error', me, response, 'read');

                }

            };

            action.setOptions(opts);

            me.getProxy().read(action);

            return deferred.promise;
        },
        /**
         *
         * @returns {boolean}
         */
        save: function () {
            var me = this,
                data = me.get('data'),
                idProperty = me.getIdProperty(),
                deferred = yamvc.Promise.$deferred(),
                action = new yamvc.data.Action(),
                proxy = me.getProxy(),
                opts = {},
                response,
                type;

            if (me.get('isProcessing') || !me.get('isDirty')) {
                return false;
            }

            me.set('isProcessing', true);

            opts.namespace = me.getNamespace();
            opts.callback = function (proxy, action) {

                response = action.getResponse();

                me.set('isProcessing', false);
                if (action.getStatus() === yamvc.data.Action.Status.SUCCESS) {

                    me.set('isDirty', false);
                    me.set('data', response.result);

                    deferred.resolve({scope: me, action: action, type: type});
                    me.fireEvent('saved', me, action, type);

                } else {

                    deferred.reject({scope: me, action: action, type: type});
                    me.fireEvent('error', me, action, type);

                }

            };

            action
                .setOptions(opts)
                .setData(data);


            if (typeof data[idProperty] === 'undefined') {

                type = 'create';
                proxy.create(action);

            } else {

                type = 'update';
                proxy.update(action);

            }

            return deferred.promise;
        },
        /**
         *
         */
        remove: function () {
            var me = this,
                data = me.get('data'),
                idProperty = me.getIdProperty(),
                deferred = yamvc.Promise.$deferred(),
                action = new yamvc.data.Action(),
                proxy = me.getProxy(),
                opts = {},
                response;

            if (typeof data[idProperty] === 'undefined')
                throw new Error('Can not remove empty model');

            opts.namespace = me.getNamespace();
            opts.callback = function (proxy, action) {

                response = action.getResponse();

                if (action.getStatus() === yamvc.data.Action.Status.SUCCESS) {

                    me.set('isDirty', false);
                    me.set('data', {});

                    deferred.resolve({scope: me, action: action, type: 'remove'});
                    me.fireEvent('removed', me, 'remove');

                } else {

                    deferred.reject({scope: me, action: action, type: 'remove'});
                    me.fireEvent('error', me, 'remove');

                }

            };

            action
                .setOptions(opts)
                .setData(data);

            proxy.destroy(action);
            proxy.destroy(action);

            return deferred.promise;
        },
        hasId: function () {
            return !!this._data[this._config.idProperty];
        },
        setDirty: function (dirty) {
            this.set('isDirty', !!dirty);
            return this;
        },
        isDirty: function () {
            return this._isDirty;
        }
    });

    window.yamvc = yamvc;
    window.yamvc.Model = Model;
}(window));

/*
 * classList.js: Cross-browser full element.classList implementation.
 * 2014-01-07
 *
 * By Eli Grey, http://eligrey.com
 * Public Domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js*/

if ("document" in self && !("classList" in document.createElement("_"))) {

    (function (view) {

        "use strict";

        if (!('Element' in view)) return;

        var
            classListProp = "classList",
            protoProp = "prototype",
            elemCtrProto = view.Element[protoProp],
            objCtr = Object,
            strTrim = String[protoProp].trim || function () {
                return this.replace(/^\s+|\s+$/g, "");
            },
            arrIndexOf = Array[protoProp].indexOf || function (item) {
                var
                    i = 0,
                    len = this.length;

                for (; i < len; i++) {
                    if (i in this && this[i] === item) {
                        return i;
                    }
                }
                return -1;
            },
        // Vendors: please allow content code to instantiate DOMExceptions

            DOMEx = function (type, message) {
                this.name = type;
                this.code = DOMException[type];
                this.message = message;
            },
            checkTokenAndGetIndex = function (classList, token) {
                if (token === "") {
                    throw new DOMEx(
                        "SYNTAX_ERR",
                        "An invalid or illegal string was specified"
                    );
                }
                if (/\s/.test(token)) {
                    throw new DOMEx(
                        "INVALID_CHARACTER_ERR",
                        "String contains an invalid character"
                    );
                }
                return arrIndexOf.call(classList, token);
            },
            ClassList = function (elem) {
                var
                    trimmedClasses = strTrim.call(elem.getAttribute("class") || ""),
                    classes = trimmedClasses ? trimmedClasses.split(/\s+/) : [],
                    i = 0,
                    len = classes.length;

                for (; i < len; i++) {
                    this.push(classes[i]);
                }

                this._updateClassName = function () {
                    elem.setAttribute("class", this.toString());
                };
            },
            classListProto = ClassList[protoProp] = [],
            classListGetter = function () {
                return new ClassList(this);
            };
// Most DOMException implementations don't allow calling DOMException's toString()
// on non-DOMExceptions. Error's toString() is sufficient here.
        DOMEx[protoProp] = Error[protoProp];
        classListProto.item = function (i) {
            return this[i] || null;
        };
        classListProto.contains = function (token) {
            token += "";
            return checkTokenAndGetIndex(this, token) !== -1;
        };
        classListProto.add = function () {
            var
                tokens = arguments, i = 0, l = tokens.length, token, updated = false;
            do {
                token = tokens[i] + "";
                if (checkTokenAndGetIndex(this, token) === -1) {
                    this.push(token);
                    updated = true;
                }
            }
            while (++i < l);

            if (updated) {
                this._updateClassName();
            }
        };
        classListProto.remove = function () {
            var
                tokens = arguments, i = 0, l = tokens.length, token, updated = false;

            do {
                token = tokens[i] + "";
                var index = checkTokenAndGetIndex(this, token);
                if (index !== -1) {
                    this.splice(index, 1);
                    updated = true;
                }
            }
            while (++i < l);

            if (updated) {
                this._updateClassName();
            }
        };
        classListProto.toggle = function (token, forse) {
            token += "";

            var
                result = this.contains(token),
                method = result ?
                    forse !== true && "remove"
                    :
                    forse !== false && "add"
                ;

            if (method) {
                this[method](token);
            }

            return !result;
        };
        classListProto.toString = function () {
            return this.join(" ");
        };

        if (objCtr.defineProperty) {
            var classListPropDesc = {
                get: classListGetter, enumerable: true, configurable: true
            };
            try {
                objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
            } catch (ex) { // IE 8 doesn't support enumerable:true
                if (ex.number === -0x7FF5EC54) {
                    classListPropDesc.enumerable = false;
                    objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
                }
            }
        } else if (objCtr[protoProp].__defineGetter__) {
            elemCtrProto.__defineGetter__(classListProp, classListGetter);
        }

    }(self));

}
/**
 * @author rhysbrettbowen
 * @contributed mkalafior
 */
(function (window, undefined) {
    "use strict";

    var yamvc = window.yamvc || {},
        Promise,
        State,
        resolve;


    /**
     * @type {{PENDING: number, FULFILLED: number, REJECTED: number}}
     */
    State = { // Promise has 3 state, pending when initialized, fulfilled and rejected in case of result.
        PENDING: 0,
        FULFILLED: 1,
        REJECTED: 2
    };

    /**
     * @param fn
     * @constructor
     */
    Promise = function (fn) {
        var me = this,
            onResolve,
            onReject;

        me._state = State.PENDING;
        me._queue = [];

        onResolve = function (value) {
            resolve(me, value);
        };

        onReject = function (reason) {
            me.transition(State.REJECTED, reason);
        };

        if (fn) fn(onResolve, onReject);
    };

    /**
     * @param state
     * @param value
     * @returns {boolean}
     */
    Promise.prototype.transition = function (state, value) {
        var me = this;

        if (me._state == state ||          // must change the state
            me._state !== State.PENDING || // can only change from pending
            (state != State.FULFILLED &&    // can only change to fulfill or reject
                state != State.REJECTED) ||
            arguments.length < 2) {         // must provide value/reason
            return false;
        }

        me._state = state;                 // change state
        me._value = value;
        me.run();
    };


    Promise.prototype.run = function () {
        var me = this,
            value,
            fulfill,
            reject;

        fulfill = function (x) {
            return x;
        };

        reject = function (x) {
            throw x;
        };

        if (me._state == State.PENDING) return;
        setTimeout(function () {
            while (me._queue.length) {
                var obj = me._queue.shift();
                try {
                    // resolve returned promise based on return
                    value = (me._state == State.FULFILLED ?
                        (obj.fulfill || fulfill) :
                        (obj.reject || reject))
                        (me._value);
                } catch (e) {
                    // reject if an error is thrown
                    obj.promise.transition(State.REJECTED, e);
                    continue;
                }
                resolve(obj.promise, value);
            }
        }, 0);
    };

    /**
     * @param onFulfilled
     * @param onRejected
     * @returns {Promise}
     */
    Promise.prototype.then = function (onFulfilled, onRejected) {
        // need to return a promise
        var me = this,
            promise = new Promise();

        me._queue.push({
            fulfill: typeof onFulfilled == 'function' && onFulfilled,
            reject: typeof onRejected == 'function' && onRejected,
            promise: promise
        });
        me.run();

        return promise;
    };

    /**
     * @param promise
     * @param x
     */
    Promise.prototype.resolve = function (promise, x) {
        if (promise === x) {
            promise.transition(State.REJECTED, new TypeError());
        } else if (x && x.constructor == Promise) { // must know it’s implementation
            if (x.state == State.PENDING) { // 2.3.2.1
                x.then(function (value) {
                    resolve(promise, value);
                }, function (reason) {
                    promise.transition(State.REJECTED, reason);
                });
            } else {
                promise.transition(x.state, x.value);
            }
        } else if ((typeof x == 'object' || typeof x == 'function') && x !== null) {
            var called = false;
            try {
                var then = x.then;
                if (typeof then == 'function') {
                    then.call(x, function (y) {
                        if (!called) {
                            resolve(promise, y);
                            called = true;
                        }
                    }, function (r) {
                        if (!called) {
                            promise.transition(State.REJECTED, r);
                            called = true;
                        }
                    });
                } else {
                    promise.transition(State.FULFILLED, x);
                }
            } catch (e) {
                if (!called) {
                    promise.transition(State.REJECTED, e);
                }
            }
        } else {
            promise.transition(State.FULFILLED, x);
        }
    };

    /**
     * @returns {number}
     */
    Promise.prototype.getState = function () {
        return this._state;
    };

    resolve = Promise.prototype.resolve;

    // static
    Promise.State = State;

    Promise.$create = function (opts) {
        var Obj = this;
        return new Obj(opts);
    };

    /**
     * @param value
     * @returns {Promise}
     */
    Promise.$resolved = function (value) {
        return new Promise(function (res) {
            res(value);
        });
    };

    /**
     * @param reason
     * @returns {Promise}
     */
    Promise.$rejected = function (reason) {
        return new Promise(function (res, rej) {
            rej(reason);
        });
    };

    /**
     * @returns {{promise: Promise, resolve: (Function|resolve|resolve), reject: (*|Function|reject|reject|reject|reject)}}
     */
    Promise.$deferred = function () {
        var resolve, reject;
        return {
            promise: Promise.$create(function (res, rej) {
                resolve = res;
                reject = rej;
            }),
            resolve: resolve,
            reject: reject
        };
    };

    yamvc.Promise = Promise;
    window.yamvc = yamvc;
}(window));
/**
 *
 * ## Router
 * Router is used internally in controller, so don't instantiated it again.
 */
(function (window, undefined) {
    "use strict";

    var yamvc = window.yamvc || {},
        Router;
    /**
     * @constructor
     * @type {function}
     */
    Router = yamvc.Core.$extend({
        init: function () {
            this.set('routing', {});
            this.bindEvents();
        },
        bindEvents: function () {
            window.onhashchange = this.onHashChange.bind(this);
            return this;
        },
        onHashChange: function () {
            var routing = this.get('routing'),
                hash = window.location.hash.substr(1),
                paths = hash.split("/"),
                action = paths.shift();

            if (routing[action]) {
                var args = [];
                if (routing[action].params) {
                    for (var i = 0, len = routing[action].params.length; i < len; i++) {
                        var param = routing[action].params[i],
                            hashParam = paths[i],
                            regEx = new RegExp(param.substr(1, param.length - 2));
                        args.push(hashParam.match(regEx).input);
                    }
                }
                routing[action].callback.apply(null, args);
            }
            return this;
        },
        restore: function () {
            this.onHashChange();
            return this;
        },
        when: function (path, callback) {
            var routing = this.get('routing'),
                paths = path.split("/"),
                action = paths.shift();
            routing[action] = {
                callback: callback,
                params: paths
            };
            this.set('routing', routing);
            return this;
        }
    });

    window.yamvc.Router = Router;
}(window));
/**
 *
 * ## View Manager usage
 * View Manager is singleton object and helps to get proper view instance Cored on passed id
 *
 *      @example
 *      VM
 *          .get('layout')
 *          .render();
 *
 * ## Basic view
 * Views are an excellent way to bind template with the data from proper models.
 *
 *     @example
 *     var view = new View({
 *         config: {
 *             id: 'users',
 *             tpl: 'user-lists',
 *             models : window.users
 *             renderTo: '#body'
 *         }
 *     });
 *
 * ## Configuration properties
 *
 * @cfg config.id {String} Unique id of the view. If not passed id will be assigned automatically
 * @cfg config.tpl {String} Id of the template
 * @cfg config.models {String} Simple object storing appropriate data
 * @cfg config.renderTo {String} Selector to which view should be rendered
 *
 * ## Extending views
 * Views are easily expendable, so you can fell free to add more awesome functionality to it.
 *
 *     @example
 *     window.OverlayView = View.$extend({
 *
 *     });
 *
 *
 */
(function (window, undefined) {
    "use strict";

    var yamvc = window.yamvc || {},
        style = document.createElement('style'),
        VM,
        VTM,
        View,
        renderId = 0,
        fillAttrs,
        resize = 0,
        iv = 0;

    function makeMap(str) {
        // Make object map from string.
        var obj = {}, items = str.split(",");
        for (var i = 0; i < items.length; i++)
            obj[ items[i] ] = true;
        return obj;
    }

    function onWindowResize(e) {
        // When resize event occur wait 32 miliseconds
        // to not firing it to often.

        if (resize === 0) {
            iv = setInterval(fireResizeEvent, 32);
        }

        resize = +new Date();
    }

    function fireResizeEvent() {
        // Fire yamvc resize event only on components
        // which need to be fitted to their parents.
        var views,
            l,
            i,
            now = +new Date();

        if (now - resize >= 32) {

            clearInterval(iv);

            resize = 0;
            views = VM.views;
            l = views.length;
            i = 0;

            while (i < l) {

                if (views[i].getFit()) {
                    views[i].fireEvent('resize', views[i]);
                }

                i++;
            }
        }
    }

    // Make object with attributes that not need any value.
    fillAttrs = makeMap("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected");

    // Append some basic css to document.
    style.innerHTML = ".yamvc.inline {display:inline;} .yamvc.hidden {display: none !important;}";
    style.setAttribute('type', 'text/css');

    document.body.appendChild(style);
    window.addEventListener('resize', onWindowResize);


    /**
     * @type {{views: [], i: number, add: Function, get: Function}}
     */
        // `yamvc.ViewManager` stores all created views and allow as to
        // use `get` method (with id as argument) to return requested view.
    VM = {
        views: [],
        i: 0,
        // Add view to manager
        /**
         * @param id
         * @param view
         */
        add: function (id, view) {
            this.views.push(view);
            this.i++;
        },
        // Get view by its id
        /**
         * @param id
         * @returns {View}
         */
        get: function (id) {
            var len = this.views.length;

            while (len--) {

                if (this.views[len].getId() === id) break;

            }

            return this.views[len];
        }
    };

    /**
     * @type {{tpl: {}, add: Function, get: Function}}
     */
        // `VTM` is a private object that stores all templates used
        // in application.
    VTM = {
        tpl: {},
        add: function (id, view) {
            this.tpl[id] = view;
        },
        get: function (id) {
            return this.tpl[id];
        }
    };
    /**
     * @constructor
     * @params opts Object with configuration properties
     * @type {function}
     */
    View = yamvc.Core.$extend({
        // `yamvc.View` accept few configuration properties:
        // * `parent` - pointer to parent view
        // * `fit` - if true, component will fire resize event when size
        // of window was changed
        // * `hidden` - if true, component will be hidden after render
        defaults: {
            parent: null,
            fit: false,
            hidden: false,
            models: null
        },
        // Initializing function in which we call parent method, merge previous
        // configuration with new one, set id of component, initialize config
        // and save reference to component in View Manager.
        /**
         *
         * @param opts
         * @returns {View}
         */
        init: function (opts) {

            yamvc.Core.prototype.init.apply(this);

            var me = this, config, id;

            opts = opts || {};
            config = yamvc.$merge(me._config, opts.config);
            config.id = id = config.id || 'view-' + VM.i;
            config.children = config.children || [];

            me.set('initOpts', opts);
            me.set('config', config);

            me.initConfig();
            VM.add(id, me);

            return me;
        },
        /**
         * @returns {View}
         */
        initConfig: function () {

            yamvc.Core.prototype.initConfig.apply(this);

            this.initTemplate();
            this.initModels();

            return this;
        },
        /**
         * @returns {View}
         */
        initTemplate: function () {
            var me = this,
                config = me.get('config'),
                div = document.createElement('div'),
                _tpl;

            if (!config.tpl) {

                throw new Error(config.id + ': no tpl set');

            }

            if (config.tpl instanceof yamvc.view.Template) {

                div.innerHTML = config.tpl.getHtml().innerHTML;

            } else if (VTM.get(config.tpl)) {

                div.innerHTML = VTM.get(config.tpl).innerHTML;

            } else {

                _tpl = document.getElementById(config.tpl);

                if (!_tpl)
                    throw new Error('no tpl ' + config.tpl + ' found');

                VTM.add(config.tpl, _tpl.parentNode.removeChild(_tpl));
                div.innerHTML = VTM.get(config.tpl).innerHTML;

            }

            me.set('tpl', div);

            return me;
        },
        /**
         * @returns {View}
         */
        initModels: function () {
            var me = this;

            return me;
        },
        /**
         * @returns {View}
         */
        setModel: function (namespace, model) {
            var me = this,
                models = me.getModels();

            models.push(model);
            me.setModels(models);
            me.resolveModelBindings(model);

            return me;
        },
        /**
         * @param namespace
         * @returns {yamvc.Model}
         */
        getModel: function (namespace) {
            var me = this,
                models = me.getModels(),
                model = null,
                l;

            l = models.length;
            while (l--) {
                if (models[l].getNamespace() === namespace) {
                    model = models[l];
                    break;
                }
            }

            return model;
        },
        /**
         * @version 0.1.11
         * @param {Boolean} force
         * @returns {Node}
         */
        render: function () {
            var me = this,
                tpl = me._tpl,
                config = me._config,
                id = config.renderTo,
                parent = config.parent,
                parentView = config.parent,
                bindings = [],
                headers = [],
                results,
                result,
                header,
                ret,
                value,
                parsedTpl,
                walker,
                node,
                el,
                i = 0,
                l = 0,
                j = 0,
                len = 0,
                attrs = [],
                attr;

            if (me.isInDOM()) {

                me.removeRendered();

            }

            if (parent) {// If parent is set,

                if (id && parent.queryEl(id)) { // search for element to which we will append component.
                    parent = parent.queryEl(id);
                } else {// If not found, append to parent root element.
                    parent = parent._el;
                }

            } else {// If parent not set,

                if (id) { // but we have an id of element to which we want render new one,
                    parent = document.querySelector(id);// we search for it in the whole document.
                }

            }

            parsedTpl = tpl.cloneNode(true); // Next, clone template.

            walker = document.createTreeWalker( // Create walker object and
                parsedTpl,
                NodeFilter.SHOW_ALL,
                null,
                false
            );

            node = walker.nextNode();
            while (node) { // walk through all nodes.

                if (node.nodeType === 3) { // If our element is text node
                    results = node.data.match(/\{\{(.*?)\}\}/gi);// we searching for mustached text inside it
                    if (results) { // and if we have positive match
                        var text = node.value || node.data,
                            doc = document.createElement('span'),// we create new span element
                            rId = "v-r-b-" + renderId++;

                        i = 0;
                        len = results.length;
                        headers = [];

                        doc.setAttribute('id', rId); // and add generated id.

                        // In the end we replace all match via data.
                        while (i < len) {

                            result = results[i++];
                            header = result.substr(2, (result.length - 4)).split('.');

                            if (me.getModel(header[0])) {
                                ret = me.getModel(header[0]).data(header[1]);
                                if (ret === undefined) {
                                    ret = "";
                                }
                            } else {
                                ret = "";
                            }

                            text = text.replace(result, ret);
                            headers.push(header);

                        }

                        doc.appendChild(
                            document.createTextNode(text)
                        );

                        // We also keep founded bindings.
                        bindings.push({
                            original: node.value || node.data,
                            headers: headers,
                            type: 3,
                            pointer: doc,
                            oldDOM: node
                        });

                    }
                    /*node.value = node.value.replace(bindRegEx, function (match) {
                     return replaceFn(match, 1, node);
                     });*/
                }
                else {

                    attrs = node.attributes;
                    l = attrs.length;

                    while (l--) {

                        attr = attrs.item(l);
                        results = attr.value && attr.value.match(/\{\{(.*?)\}\}/gi);

                        if (results) {
                            var original = attr.value,
                                fillAttr = fillAttrs[attr.nodeName];

                            i = 0;
                            len = results.length;
                            headers = [];

                            ret = fillAttr ? true : "";

                            while (i < len) {

                                result = results[i++];
                                header = result.substr(2, (result.length - 4)).split('.');

                                if (!fillAttr) {

                                    if (me.getModel(header[0])) {
                                        ret = me.getModel(header[0]).data(header[1]) || "";
                                    }

                                    attr.value = attr.value.replace(result, ret);

                                } else {

                                    ret = ret && me.getModel(header[0]).data(header[1]);

                                }

                                headers.push(header);

                            }

                            if (fillAttr) {

                                if (!ret) {

                                    node.removeAttribute(attr.nodeName);

                                } else {

                                    node.setAttribute(attr.nodeName, ret);

                                }

                            } else {

                                if (attr.nodeName === 'css') {

                                    value = attr.value;

                                    attr = document.createAttribute("style");

                                    attr.value = value;

                                    node.removeAttribute('css');

                                    attrs.setNamedItem(attr);

                                }

                            }

                            bindings.push({
                                original: original,
                                headers: headers,
                                fillAttr: fillAttr || false,
                                type: 2,
                                attrName: attr.nodeName,
                                pointer: node
                            });

                        } else {

                            if (attr.nodeName === 'css') {

                                value = attr.value;

                                attr = document.createAttribute("style");

                                attr.value = value;

                                node.removeAttribute('css');

                                attrs.setNamedItem(attr);

                            }

                        }

                        /*attrs.item(l).value = attrs[l].value.replace(bindRegEx, function (match) {
                         return replaceFn(match, 0, attrs[l]);
                         });*/
                    }
                }

                node = walker.nextNode();

            }

            if (parsedTpl.childNodes.length === 1 && parsedTpl.childNodes.item(0).nodeType === 1) {
                el = parsedTpl.childNodes.item(0);
            } else {
                el = parsedTpl;
                el.classList.add('inline');
            }

            el.setAttribute('id', config.id);
            el.classList.add('yamvc');

            me.set('el', el);
            me.set('bindings', bindings);

            me.resolveBindings();

            if (me.getHidden())
                me.hide();

            if (parent) {

                parent.appendChild(el);

                if (parentView) {

                    if (parentView.findChild(me.getId()) < 0) {

                        parentView.getChildren().push(me);

                    }

                }

                me.set('isInDOM', true);
                me.reAppendChildren();
                me.fireEvent('render', null, me);
            }

            return el;
        },
        /**
         * @version 0.1.12
         */
        resolveModelBindings: function (model) {
            var me = this,
                bindings = me._bindings,
                bindFnFactory,
                headers,
                header,
                binding,
                eventName,
                lenM = 0,
                len = 0;

            bindFnFactory = function (binding) {
                return function () {
                    me.partialRender(binding);
                };
            };

            len = bindings.length;
            while (len--) {

                binding = bindings[len];
                headers = binding.headers;
                lenM = headers.length;
                while (lenM--) {

                    if (model.getNamespace() === headers[lenM][0]) {

                        header = headers[lenM][1];
                        eventName = 'data' + header.charAt(0).toUpperCase() + header.slice(1) + 'Change';
                        binding.fn = bindFnFactory(binding);

                        model.addEventListener(eventName, binding.fn);

                        binding.fn();

                    }

                }
            }
        },
        /**
         * @version 0.1.12
         */
        resolveBindings: function () {
            var me = this,
                bindings = me._bindings,
                bindFnFactory,
                model,
                headers,
                header,
                binding,
                eventName,
                lenM = 0,
                len = 0;

            bindFnFactory = function (binding) {
                return function () {
                    me.partialRender(binding);
                };
            };

            len = bindings.length;
            while (len--) {

                binding = bindings[len];
                headers = binding.headers;

                if (binding.type === 3 && binding.oldDOM) {
                    binding.oldDOM.parentNode.replaceChild(binding.pointer, binding.oldDOM);
                    delete binding.oldDOM;
                }

                lenM = headers.length;
                while (lenM--) {

                    model = me.getModel(headers[lenM][0]);
                    header = headers[lenM][1];

                    if (model) {

                        binding.fn = bindFnFactory(binding);
                        eventName = 'data' + header.charAt(0).toUpperCase() + header.slice(1) + 'Change';

                        model.addEventListener(eventName, binding.fn);

                    }

                }
            }
        },
        /**
         * @version 0.1.11
         * @param binding
         */
        partialRender: function (binding) {
            var me = this,
                element = binding.type === 3,
                org = element ? binding.original : (binding.fillAttr ? true : binding.original),
                headers = binding.headers,
                len = headers.length,
                header;

            while (len--) {

                header = headers[len];

                if (element || !binding.fillAttr) {

                    org = org.replace("{{" + header.join(".") + "}}", me.getModel(header[0]).data(header[1]));

                } else {

                    org = org && me.getModel(header[0]).data(header[1]);

                }
            }

            if (element) {

                binding.pointer.textContent = org;


            } else {

                if (binding.fillAttr && !org) {

                    binding.pointer.removeAttribute(binding.attrName);

                } else {

                    binding.pointer.setAttribute(binding.attrName, org);

                }

            }

            return me;
        },
        /**
         * @version 0.1.12
         */
        removeBindings: function () {
            var me = this,
                bindings = me._bindings,
                l = bindings.length,
                binding,
                model,
                header,
                l2,
                eventName;

            while (l--) {

                binding = bindings[l];
                l2 = binding.headers.length;
                while (l2--) {

                    header = binding.headers[l2];
                    model = me.getModel(header[0]);
                    eventName = 'data' + header[1].charAt(0).toUpperCase() + header[1].slice(1) + 'Change';

                    model.removeEventListener(eventName, binding.fn);

                }

            }

            return me;
        },
        /**
         * @version 0.1.12
         */
        removeRendered: function () {
            var me = this;

            me._el.parentNode.removeChild(me._el);
            me.removeBindings();
            me.set('el', null);
            me.set('isInDOM', false);

            return me;
        },
        /**
         * @param selector
         * @returns {Node}
         */
        queryEl: function (selector) {
            return this.get('el').querySelector(selector);
        },
        /**
         * @param selector
         * @returns {NodeList}
         */
        queryEls: function (selector) {
            return this.get('el').querySelectorAll(selector);
        },
        /**
         * @param view
         * @param selector
         * @returns {View}
         */
        addChild: function (view, selector) {
            var me = this;
            view.appendTo(me, selector);
            me.fireEvent('elementAdded', me, view);
            return me;
        },
        /**
         * @param id
         * @returns {View||Boolean}
         */
        getChild: function (id) {
            var me = this;

            if (me.findChild(id) < 0)
                return false;

            return me.findChild(id);
        },
        findChild: function (id) {
            var views = this.getChildren(),
                l = views.length;

            while (l--) {
                if (views[l].getId() === id)
                    break;
            }

            return l;
        },
        removeChild: function (id) {
            var views = this.getChildren(),
                l = views.length,
                view = [];

            while (l--) {
                if (views[l].getId() === id) {

                    view = views.splice(l, 1);
                    view[0].clear();

                }
            }

            return view[0] || null;
        },
        /**
         * @returns {Array}
         */
        removeChildren: function () {
            var views = this.getChildren(),
                l = views.length,
                removed = [];

            while (l--) {
                removed.push(views[l].clear());
            }


            return removed;
        },
        /**
         * @returns {View}
         */
        clear: function () {
            var me = this,
                el = me._el;

            if (me.isInDOM()) {
                el.parentNode.removeChild(el);
                me.set('isInDOM', false);
            }

            return me;
        },
        /**
         * @returns {Boolean}
         */
        isInDOM: function () {
            return this._isInDOM;
        },
        /**
         * @param parent
         * @param selector
         * @returns {View}
         */
        appendTo: function (parent, selector) {
            var me = this,
                config = me.get('config'),
                id = me.getId(),
                views = parent.getChildren(),
                oldParent = config.parent,
                parentEl = selector ? parent._el.querySelector(selector) : parent._el;

            if (selector) {

                config.renderTo = selector;

            }

            if (!oldParent) {

                config.parent = parent;

            }
            else if (oldParent && oldParent.getId() !== parent.getId()) {

                if (oldParent.findChild(id) > -1) {

                    oldParent
                        .getChildren()
                        .splice(
                            oldParent.findChild(id), 1
                        );

                }

            }

            if (!me.isInDOM() && parent.isInDOM()) {

                if (!me._el) {

                    me.render();

                } else {

                    parentEl.appendChild(me._el);
                    me.set('isInDOM', true);
                    me.reAppendChildren();
                    me.fireEvent('render', null, me);

                }

            }


            views.push(me);

            config.parent = parent;
            return me;
        },
        /**
         * @returns {View}
         */
        reAppendChildren: function () {
            var views = this.getChildren(),
                l = views.length,
                i = 0;

            for (; i < l; i++) {
                views[i].appendTo(this);
            }

            return this;
        },
        /**
         * @returns {View}
         */
        show: function () {
            var me = this;

            if (!me._el)
                return me;

            me._el.classList.remove('hidden');

            me.set('visible', true);
            me.fireEvent('show', me);

            return me;
        },
        /**
         * @returns {View}
         */
        hide: function () {
            var me = this;

            if (!me._el)
                return me;


            me._el.classList.add('hidden');

            me.set('visible', false);
            me.fireEvent('hide', me);

            return me;
        },
        toggle: function () {
            var me = this;

            if(me._visible){

                me.hide();

            }else{

                me.show();

            }

        },
        /**
         * @returns {Boolean}
         */
        isVisible: function () {
            return this.get('visible') && this.isInDOM();
        }
    });


    yamvc.ViewManager = VM;
    window.yamvc = yamvc;
    window.yamvc.View = View;
}(window));
(function (window, undefined) {
    "use strict";

    var yamvc = window.yamvc || {},
        Template;

    Template = yamvc.Core.$extend({
        init: function (opts) {
            var me = this, config;

            Template.Parent.init.apply(this, arguments);

            opts = opts || {};
            config = yamvc.$merge(me._config, opts.config);

            me.set('initOpts', opts);
            me.set('config', config);

            me.initConfig();
            me.initTpl();

        },
        initConfig: function () {
            var me = this,
                config = me.get('config');

            Template.Parent.initConfig.apply(this);

            if (!config.id)
                throw new Error("yamvc.data.Template: Template need to have id");

            return me;
        },
        initTpl: function () {
            var me = this,
                html = me.getTpl(),
                tpl = document.createElement('div');

            if (Array.isArray(html)) {
                html = html.join("");
            }

            tpl.innerHTML = html;

            me.set('html', tpl);
        },
        getHtml : function () {
            return this._html;
        }
    });

    window.yamvc = yamvc;
    window.yamvc.view = window.yamvc.view || {};
    window.yamvc.view.Template = Template;
}(window));
