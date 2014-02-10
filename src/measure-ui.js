(function (window, undefined) {
    "use strict";

    var List, ListElement, Search, ComboBox, ComboBoxElement, Panel, locale, ui;

    if (typeof window.ya === 'undefined')
        throw new Error("Measure UI require ya library");

    /**
     * @type {ya.Model}
     */
    locale = ya.Model.$create({ // Model with UI labels
        config: {
            namespace: 'locale',
            data: {
                search: 'Search',
                compare: 'Compare',
                modules: 'Modules',
                module: 'All'
            }
        }
    });

    //********** Search definition **********
    Search = ya.View.$extend({
        defaults: {
            tpl: ya.view.Template.$create({
                config: {
                    id: 'tpl-search',
                    tpl: [
                        '<div class="search input anim fast">',
                        '<button class="icon ui-search"></button>',
                        '<input placeholder="{{locale.search}}" type="text" />',
                        '<button class="modules anim fast">{{locale.modules}}</button>',
                        '</div>'
                    ]
                }
            })
        }
    });
    //********** Search definition end **********

    //********** ComboBox definition **********
    ComboBox = ya.View.$extend({
        defaults: {
            collection: null,
            tpl: ya.view.Template.$create({
                config: {
                    id: 'tpl-combobox',
                    tpl: [
                        '<div class="combobox input anim fast">',
                        '<input placeholder="{{locale.module}}" type="text" />',
                        '<b class="caret"></b>',
                        '<div class="container">',
                        '<ul class="list hidden">',
                        '</ul>',
                        '</div>',
                        '</div>'
                    ]
                }
            })
        },
        initConfig: function () {
            var me = this;

            Panel.Parent.initConfig.apply(me, arguments);

            me.prepareComboboxElements();
            me.bindEvents();

        },
        bindEvents: function () {
            var me = this;

            me.addEventListener('render', me.bindDOMEvents);
            me.getCollection().addEventListener('pushed', me.addListElement.bind(me));
            me.getCollection().addEventListener('afterFilter', me.refreshList.bind(me));

        },
        bindDOMEvents: function (view) {

            view.queryEl('.caret').addEventListener('click', view.onClick.bind(view), false);
            view.queryEl('input').addEventListener('keyup', view.onKeyUp.bind(view), false);

        },
        onKeyUp: function (e) {
            var me = this,
                el = e.target || e.srcElement;

            switch (e.keyCode) {
                case 13: // enter

                    me.onEnter(el, e);

                    break;
                case 27: // esc

                    me.onClick(el, e);

                    break;
                case 38: // up

                    break;
                case 40: // down

                    break;
                default :
                    me.defaultOnKeyUp(el, e);
            }
        },
        defaultOnKeyUp: function (el, e) {
            var me = this,
                list = me.queryEl('.list'),
                collection = me.getCollection();

            list.classList.remove('hidden');

            collection.suspendEvents();
            collection.clearFilters();
            collection.resumeEvents();
            collection.filter(function (r) {
                if (r.data('module').search(el.value) > -1) return true;
            });

            me.markElement();
        },
        onClick: function (el, e) {
            var me = this,
                list = me.queryEl('.list');

            list.classList.toggle('hidden');

        },
        onEnter: function (el, e) {
            var me = this,
                list = me.queryEl('.list'),
                focus;

            list.classList.add('hidden');

            if (el.value) {

                focus = me.queryEl('.hover');
                el.value = focus.innerText;

            }

        },
        addListElement: function (r) {
            var me = this;

            me.prepareComboboxElement(r).appendTo(me, '.list');

        },
        prepareComboboxElements: function () {
            var me = this,
                collection = me.getCollection(),
                children = me.getChildren() || [];


            collection.forEach(function (v, i, a) {
                children.push(
                    me.prepareComboboxElement(v)
                );
            });

            me.setChildren(children);
        },
        prepareComboboxElement: function (model) {
            return ComboBoxElement.$create({
                config: {
                    models: [
                        model,
                        locale
                    ]
                }
            });
        },
        refreshList: function () {
            var me = this,
                collection = me.getCollection(),
                children = me.getChildren(),
                len = children.length,
                searchFn,
                child;

            if (!me.isInDOM())
                return me;

            searchFn = function (r) {

                if (r.get('clientId') === child.getModel('combobox').get('clientId')) return true;

            };

            while (len--) {

                child = children[len];

                if (collection.findOneBy(searchFn) >= 0) {
                    child.show();
                } else {
                    child.hide();
                }
            }

            me.clearElements();
            me.markElement();

            return me;
        },
        clearElements: function () {
            var me = this,
                children = me.getChildren(),
                len = children.length;

            while (len--) {

                children[len].get('el').classList.remove('hover');

            }

        },
        markElement: function () {
            var me = this,
                collection = me.getCollection(),
                children = me.getChildren(),
                len = children.length,
                r = collection.getAt(0),
                child;

            while (len--) {

                child = children[len];

                if (r && r.get('clientId') === child.getModel('combobox').get('clientId')) {
                    child.get('el').classList.add('hover');
                }
            }

        }
    });
    //********** ComboBox definition end **********

    //********** ComboBox Element definition **********
    ComboBoxElement = ya.View.$extend({
        defaults: {
            tpl: ya.view.Template.$create({
                config: {
                    id: 'tpl-combobox-element',
                    tpl: [
                        '<li>',
                        '{{combobox.module}}',
                        '</li>'
                    ]
                }
            }),
            renderTo: '.list'
        },
        initConfig: function () {
            var me = this;

            Panel.Parent.initConfig.apply(me, arguments);

            me.bindEvents();

        },
        bindEvents: function () {
            var me = this;

            me.addEventListener('render', me.bindDOMEvents);

        },
        bindDOMEvents: function (view) {

            view.get('el').addEventListener('click', view.onClick.bind(view), false);
            view.get('el').addEventListener('mouseover', view.onMouseOver.bind(view), true);

        },
        onClick: function (e) {
            var me = this,
                parent = me.getParent(),
                list = parent.queryEl('.list'),
                input = parent.queryEl('input');

            list.classList.toggle('hidden');

            input.value = me.get('el').innerText;

        },
        onMouseOver: function (e) {
            var me = this;

            me.getParent().clearElements();
            me.get('el').classList.toggle('hover');

        }
    });
    //********** ComboBox definition end **********


    //********** List definition **********
    List = ya.View.$extend({
        defaults: {
            collection: null,
            tpl: ya.view.Template.$create({
                config: {
                    id: 'tpl-list',
                    tpl: [
                        '<ul class="list">',
                        '</ul>'
                    ]
                }
            })
        },
        bindEvents: function () {
            var me = this,
                collection = me.getCollection();

            collection.addEventListener('pushed', me.addListElement.bind(me));
            collection.addEventListener('afterFilter', me.refreshList.bind(me));

        },
        initConfig: function () {
            var me = this;

            Panel.Parent.initConfig.apply(me, arguments);

            me.bindEvents();
            me.prepareListElements();

        },
        addListElement: function (r) {
            var me = this;

            me.prepareListElement(r).appendTo(me, '.list');

        },
        prepareListElements: function () {
            var me = this,
                collection = me.getCollection(),
                children = me.getChildren() || [];


            collection.forEach(function (v, i, a) {
                children.push(
                    me.prepareListElement(v)
                );
            });

            me.setChildren(children);
        },
        prepareListElement: function (model) {
            var view;
            view = new ListElement({
                config: {
                    models: [
                        model,
                        locale
                    ]
                }
            });

            return view;
        },
        refreshList: function () {
            var me = this,
                collection = me.getCollection(),
                children = me.getChildren(),
                len = children.length,
                searchFn,
                child;

            if (!me.isInDOM())
                return me;

            searchFn = function (r) {

                if (r.get('clientId') === child.getModel('list').get('clientId')) return true;

            };

            while (len--) {

                child = children[len];

                if (collection.findOneBy(searchFn) >= 0) {
                    child.show();
                } else {
                    child.hide();
                }
            }

            return me;
        }
    });
    //********** List definition end **********

    //********** List Element definition **********
    ListElement = ya.View.$extend({
        defaults: {
            tpl: ya.view.Template.$create({
                config: {
                    id: 'tpl-list-element',
                    tpl: [
                        '<li class="element anim fast">',
                        '<table>',
                        '<tr>',
                        '<td>{{list.id}}</td>',
                        '<td>',
                        '<button class="anim fast">{{locale.compare}}</button>',
                        '</td>',
                        '</table>',
                        '</li>'
                    ]
                }
            }),
            renderTo: '.list'
        },
        initConfig: function () {
            var me = this;

            Panel.Parent.initConfig.apply(me, arguments);

            me.bindEvents();

        },
        bindEvents: function () {
            var me = this;

            me.addEventListener('render', me.bindDOMEvents);

        },
        bindDOMEvents: function (view) {

            view.get('el').addEventListener('click', view.onClick.bind(view), false);

        },
        /**
         * @abstract
         * @param e
         */
        onClick: function (e) {

        }
    });
    //********** List Element definition end **********

    //********** Panel definition **********
    Panel = ya.View.$extend({
        defaults: {
            fit: true,
            topBar: false,
            bottomBar: false,
            width: '100%',
            height: '100%',
            tpl: ya.view.Template.$create({
                config: {
                    id: 'tpl-search',
                    tpl: [
                        '<div class="panel">',
                        '<div class="bar top hidden">',
                        '</div>',
                        '<div class="content"></div>',
                        '<div class="bar bottom hidden"></div>',
                        '</div>'
                    ]
                }
            })
        },
        initConfig: function () {
            var me = this;

            Panel.Parent.initConfig.apply(me, arguments);

            me.bindEvents();

        },
        bindEvents: function () {
            var me = this;

            me.addEventListener('render', me.initProperties);
            me.addEventListener('render', me.calculateStyle);
            me.addEventListener('resize', me.calculateStyle);

        },
        calculateStyle: function (view) {
            var me = view || this,
                contentStyle,
                parent,
                paddingTop,
                width,
                height,
                tBar,
                bBar;

            if (me.getFit()) {

                parent = me.get('el');
                contentStyle = me.queryEl('.content').style;
                tBar = me.queryEl('.bar.top');
                bBar = me.queryEl('.bar.bottom');

                paddingTop = tBar.offsetHeight;
                width = parent.offsetWidth + 'px';
                height = (parent.offsetHeight - paddingTop - bBar.offsetHeight) + 'px';

                contentStyle.paddingTop = paddingTop;
                contentStyle.width = width;
                contentStyle.height = height;

            }

        },
        initProperties: function (view) {

            if (view.getTopBar()) {

                view.queryEl('.bar.top').classList.remove('hidden');

            } else {

                view.queryEl('.bar.top').classList.add('hidden');

            }

            if (view.getBottomBar()) {

                view.queryEl('.bar.bottom').classList.remove('hidden');

            } else {

                view.queryEl('.bar.bottom').classList.add('hidden');

            }


        }
    });
    //********** Panel definition end **********

    //**********   Panel instance   **********
    Panel.$create({
        config: {
            autoCreate: true,
            topBar: true,
            bottomBar: true,
            id: 'left-panel',
            width: '30%',
            renderTo: 'body',
            children: [
                Search.$create({
                    config: {
                        id: 'search',
                        renderTo: '.bar.top',
                        models: [
                            locale
                        ]
                    }
                }),
                ComboBox.$create({
                    config: {
                        hidden: true,
                        id: 'module-list',
                        renderTo: '.bar.top',
                        models: [
                            locale
                        ],
                        collection: ya.Collection.$create({
                            config: {
                                namespace: 'combobox',
                                model: ya.Model
                            }
                        })
                    }
                }),
                List.$create({
                    config: {
                        id: 'list',
                        renderTo: '.content',
                        collection: ya.Collection.$create({
                            config: {
                                namespace: 'list',
                                model: ya.Model
                            }
                        })
                    }
                })
            ]
        }
    });
    //********** Panel instance end **********

    //**********   Controller instance   **********
    ya.Controller.$create({
        config: {
            name: 'Main',
            views: {
                panel: ya.viewManager.get('left-panel')
            },
            events: {
                '.list .element button': {
                    click: function () {
                        alert('Compare!');
                    }
                },
                '.search input': {
                    keyup: function (view, e) {
                        var list = ya.viewManager.get('list'),
                            el = e.target || e.srcElement,
                            collection = list.getCollection();

                        collection.suspendEvents();
                        collection.clearFilter('id');
                        collection.resumeEvents();
                        collection.filter('id', function (r) {
                            if (r.data('id').search(el.value) > -1) return true;
                        });
                    }
                },
                '#module-list input': {
                    keyup: function (view, e) {
                        var list = ya.viewManager.get('list'),
                            combobox = ya.viewManager.get('module-list'),
                            el = e.target || e.srcElement,
                            collection = list.getCollection();

                        if (e.keyCode === 13) {

                            if (!el.value) {

                                collection.clearFilter('module');

                            } else {

                                el = combobox.queryEl('.hover');

                                collection.suspendEvents();
                                collection.clearFilter('module');
                                collection.resumeEvents();
                                collection.filter('module', function (r) {
                                    if (r.data('module').search(el.innerText) > -1) return true;
                                });

                            }
                        }
                    }
                },
                '#module-list li': {
                    click: function (view, e) {
                        var list = ya.viewManager.get('list'),
                            el = e.target || e.srcElement,
                            collection = list.getCollection();

                        collection.suspendEvents();
                        collection.clearFilter('module');
                        collection.resumeEvents();
                        collection.filter('module', function (r) {
                            if (r.data('module').search(el.innerText) > -1) return true;
                        });

                    }
                },
                '.search .modules': {
                    click: function (view, e) {
                        var modulesList = ya.viewManager.get('module-list');

                        modulesList.toggle();

                    }
                }
            },
            routes: {

            }
        }
    });
    //********** Controller instance end **********

    /**
     * @type {{add: Function}}
     */
    ui = {
        /**
         * @param test
         * @return ui
         */
        // Add function allow us to add another test suit to UI.
        add: function (test) {
            var modules = ya.viewManager.get('module-list').getCollection(),
                list = ya.viewManager.get('list').getCollection(),
                findFn;

            // But before we do that we need to check if module for suit already exist. If not
            // we need to add it firstly.
            findFn = function (r) {

                if (test.module === r.data('module')) return true;

            };

            if (modules.findOneBy(findFn) < 0) {

                modules.push(test);

            }

            list.push(test);

            return this;
        }
    };

    window.ui = ui;

}(window));