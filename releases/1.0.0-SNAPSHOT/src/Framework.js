com.scottbyrns.LiveWidgets.Framework({
	setup: function () {
		
	},
	
	constructor: function () {

	},
	
	prototype: {
		
	}
	
});


(function (DOMWindow, DOMDocument) {

	if (!DOMWindow.LiveWidgets) {
		var TemplateEngine = function () {
			/* Create the cache object */
			var cache = {},
			_template;
			/* Define the alias for the tmpl method and define the tmpl method */
			_template = function tmpl(template, data){
				/* Figure out if we're getting a template, or if we need to
				 load the template - and be sure to cache the result. */
				var fn = !/\W/.test(template) ? cache[template] = cache[template] || _template(template) :
				/* Generate a reusable function that will serve as a template
				 generator (and which will be cached). */
				new Function("obj",
				"var p=[],print=function(){p.push.apply(p,arguments);};" +
				/* Introduce the data as local variables using with(){} */
				"with(obj){p.push('" +
				/*  Convert the template into pure JavaScript */
				template.replace(/[\r\t\n]/g, " ").split("<?").join("\t").replace(/((^|\?>)[^\t]*)'/g, "$1\r").replace(/\t=(.*?)\?>/g, "',$1,'").split("\t").join("');").split("?>").join("p.push('").split("\r").join("\\'") + "');}return p.join('');");
				/* Provide some basic currying to the user */
				return data ? fn( data ) : fn;
			};
			return _template;
		}();
		/**
		 * Class to manage and coordinate the communication between a pool of registered listeners.
		 * @returns undefined
		 */
		var MessageController = function () {
			this.listenerPool = {};
		};
		/**
		 * Register a new listener
		 * @param {String} key Group key name
		 * @param {String|Number} UID Unique value to register a callback
		 * @param {Function} callback Method to be called with a message.
		 * @returns undefined
		 */
		MessageController.prototype.registerListener = function (key, UID, callback) {
			if (!this.listenerPool[key]) {
				this.listenerPool[key] = {};
			}
			this.listenerPool[key][UID] = callback;
		};
		/**
		 * Send a message to a listener pool
		 * @param {String} targetListener Group key name to send the message to.
		 * @param {Any} message Message to send to the target group.
		 * @returns undefined
		 */
		MessageController.prototype.sendMessage = function (targetListener, message) {
			try {
				var target = this.listenerPool[targetListener];
				for (callback in target) {
					if (target.hasOwnProperty(callback)) {
						target[callback](message);
					}
				}
			}
			catch (e) {
		
			}
		};

		MessageController = new MessageController();

		var Helpers = {
			/**
			 * Bind an execution context to a method and return it
			 * @param {Function} method Method to bind an execution context to.
			 * @param {Context} context Execution context to bind to method.
			 * @TODO Bind the context with a prototype like bind technique
			 */
			bind: function (method, context) {
				return function () {
					method.apply(context, arguments);
				};
			},
			/**
			 * Clone an object so that all properties are new instances of the objects
			 * rather than pointers to the original.
			 * @param {Object} from Object to clone
			 * @param {Context} scope Execution context to bind to all methods found
			 * in the object being cloned.
			 * @TODO Consider removing the execution context binding and creating a
			 * helper to do it. It falls out of the scope of "deep clone"ing but saves
			 * on lines of code. Is the trade off worth the unusal behavior?
			 */
			deepClone: function (from, scope) {
				var to = {};
				for (var i in from) {
					if (from.hasOwnProperty(i)) {
						if (typeof from[i] === 'object') {
							if (from[i] instanceof Array) {
								to[i] = [];
								for (var val in from[i]) {
									if (from[i].hasOwnProperty(val)) {
										to[i][val] = from[i][val];
									}
								}
							}
							else {
								to[i] = deepClone(from[i], scope);
							}
						}
						else if (typeof from[i] === 'function' && scope) {
							to[i] = Helpers.bind(from[i], scope);
						}
						else {
							to[i] = from[i];
						}
					}
				}
				return to;
			},
			/**
			 * Check to make sure the controller does not have have any properties that will conflict with
			 * the widgets properties and method.
			 * @param {Object} controller Controller provided in an addWidget call.
			 * @returns {Boolean} True if the controller is fine, false if it will conflict with the widget.
			 */
			validateController: function (controller) {
				if (controller.reinit || controller.sendMessage || controller.model || controller.controller || controller.element) {
					return false;
				}
				else {
					return true;
				}
			},
			/**
			 * Check for missing properties on a widget and add them.
			 * @param {Object} widget Widget to clean up.
			 * @returns {Object} a clean version of the widget
			 */
			cleanWidget: function (widget) {
				widget.constructor = widget.constructor || function () {};
				widget.reinit = widget.reinit || function () {};

				widget.model = widget.model || {};
				widget.controller = widget.controller || {};
				return widget;
			},
			/**
			 * Create the widget constructor. We capture the model in the scope of the
			 * constroctur, add the element property, controller methods with scope
			 * correction, call the widget constructor in the scope of this constructor,
			 * register a listener for grouped widgets, and call reinit.
			 * @param {Object} widget Our widget we are creating a class for.
			 * @returns undefined
			 */
			buildWidgetConstructor: function (widget) {
				return function (element) {
					this.model = Helpers.deepClone(widget.model, this);
					for (var i = 0, len = element.attributes.length; i < len; i += 1) {
						var name = element.attributes[i].name;
						if (name.indexOf('data-') > -1 && name !== 'data-widget-id' && name !== 'data-widget' && name !== 'data-template') {
							this.model[name.replace('data-', '')] = element.getAttribute(name);
						}
					}
					this.element = element;
					this.controller = Helpers.deepClone(widget.controller, this);
					widget.constructor.call(this);
			
					if (this.model.group) {
						MessageController.registerListener(this.model.group, Math.floor(Math.random() * new Date()), Helpers.bind(function (messageObject) {
							this.handleMessage(messageObject.message, messageObject.channel);
						}, this));
					}
			
					this.reinit();
				};
			}
		};

		var Augments = {
			/**
			 * Method to send a message to a registered listener pool.
			 * @param {All} message Message to be sent to registered listeners, this can be any type of object.
			 * @param {String} channel Channel that can be used to filter messages for requests.
			 */
			sendMessage: function (message, channel) {
				MessageController.sendMessage(this.model.group, {
					message: message,
					channel: channel
				});
			},
			/**
			 * Replace the innerHTML of the widget element with a rendered template
			 * @returns undefined
			 */
			renderTemplate: function () {
				this.element.innerHTML = TemplateEngine(this.template, this.model);
			}
		};
		/**
		 * LiveWidgets
		 * @param {window} DOMWindow window global reference
		 * @param {document} DOMDOcument DOM Document
		 */
		var LiveWidgets = function (DOMWindow, DOMDocument) {
			this.widgets = {};
			this.widgetInstances = {};
		};
		/**
		 * Add a new widget module to the widgets object.
		 * @param {Object} widgetModule Object containing the widget description.
		 */
		LiveWidgets.prototype.addWidget = function (widgetModule) {
	
			widgetModule = Helpers.cleanWidget(widgetModule);
	
			if (!widgetModule.name) {
				return false;
			}
	
			if (!Helpers.validateController(widgetModule.controller)) {
				return false;
			}
	
			this.widgets[widgetModule.name] = Helpers.buildWidgetConstructor(widgetModule);
	
			this.widgets[widgetModule.name].prototype.handleMessage = widgetModule.controller.handleMessage || function () {};
	
			this.widgets[widgetModule.name].prototype.template = widgetModule.template || false;
			this.widgets[widgetModule.name].prototype.sendMessage = Augments.sendMessage;
			this.widgets[widgetModule.name].prototype.reinit = (function (reinit) {
				return function () {
					if (this.template) {
						this.renderTemplate();
					}
					reinit.call(this);
				};
			})(widgetModule.reinit);
	
			this.widgets[widgetModule.name].prototype.renderTemplate = Augments.renderTemplate;
		};
		/**
		 * Extend an existing widget.
		 * @param {String} widgetName Existing widget to be extended
		 * @param {Object} extention Widget object to extend the existing widget with.
		 */
		LiveWidgets.prototype.extendWidget = function (widgetName, extention) {
	
			if (!extention.reinit) {
				extention.reinit = this.widgets[widgetName].prototype.reinit;
			}
	
			extention = Helpers.cleanWidget(extention);
	
			if (!extention.name) {
				return false;
			}
	
			if (!Helpers.validateController(extention.controller)) {
				return false;
			}
	
			this.widgets[extention.name] = function (element) {
				this.widgets[widgetName].call(this, element);
				extention.constructor.call(this, element);
			};
	
			this.widgets[extention.name].prototype = this.widgets[widgetName].prototype;
	
			this.widgets[extention.name].prototype.handleMessage = extention.controller.handleMessage || this.widgets[widgetName].prototype.handleMessage;
			this.widgets[extention.name].prototype.reinit = (function (reinit) {
				return function () {
					if (this.template) {
						this.renderTemplate();
					}
					reinit.call(this);
				};
			})(extention.reinit);
		};
		/**
		 * Set every thing up to prepare to create an instance of the widget.
		 * @param {DOM} element DOM element that a widget will be deployed for.
		 */
		LiveWidgets.prototype.initializeWidget = function (element) {
			if (!this.widgets[element.getAttribute('data-widget')]) {
				return false;
			}
			var UID = Math.floor(new Date()*Math.random());
			element.setAttribute('data-widget-id', UID);
			this.widgetInstances[UID] = this.instantiateWidget(element, element.getAttribute('data-widget'));
		};
		/**
		 * Return a new isntance of a widget by name attached to the specified element.
		 * @param {DOM} element DOM element to attach the widget to.
		 * @param {String} name Name of the widget class that will be instantiated
		 */
		LiveWidgets.prototype.instantiateWidget = function (element, name) {
			try {
				return new this.widgets[name](element);
			}
			catch (e) {
				/* Defer widget here */
			}
		}

		LiveWidgets = new LiveWidgets(DOMWindow, DOMDocument);
		/**
		 * Class for managing the scanning of the DOM document.
		 * @param {Number} interval Interval length in MS to time successive
		 * scans of the document.
		 */
		var Monitor = function (interval) {
			this.interval = interval;
			this.monitor = {};
			this.domSize = 0;
		};
		/**
		 * Search the document for elements with the data-widget attribute that do
		 * not also have the data-widget-id attribute. Call LiveWidgets.initializeWidget
		 * with a DOM element that matches the above noted conditions.
		 * @returns undefined
		 */
		Monitor.prototype.searchForElements = function () {
			var domElements = DOMDocument.getElementsByTagName('*');
			if (domElements.length == this.domSize) {
				return false;
			}
			this.domSize = domElements.length;
			for (var el = 0, len = domElements.length; el < len; el += 1) {
				if (domElements[el].getAttribute('data-widget') && !domElements[el].getAttribute('data-widget-id')) {
					LiveWidgets.initializeWidget(domElements[el]);
				}
			}
		};
		/**
		 * Start scanning the document for widgets.
		 * @returns undefined
		 */
		Monitor.prototype.startScanning = function () {
			try {
				document.addEventListener('DOMNodeInsertedIntoDocument', Helpers.bind(this.searchForElements), true);
			}
			catch (e) {
				clearInterval(this.monitor);
				this.monitor = setInterval(Helpers.bind(this.searchForElements, this), this.interval);
			}
		};
		/**
		 * Stop scanning the document for widgets.
		 * @returns undefined
		 */
		Monitor.prototype.stopScanning = function () {
			clearInterval(this.monitor);
		};

		Monitor = new Monitor(33);
		Monitor.startScanning();

		DOMWindow.LiveWidgets = {
			addWidget: Helpers.bind(LiveWidgets.addWidget, LiveWidgets),
			extendWidget: Helpers.bind(LiveWidgets.extendWidget, LiveWidgets),
			stopScanning: Helpers.bind(Monitor.stopScanning, Monitor),
			startScanning: Helpers.bind(Monitor.startScanning, Monitor)
		};

	}

})(window, document);