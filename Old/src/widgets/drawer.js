LiveWidgets.addWidget({
	name: 'drawer',
	model: {
		
	},
	controller: {
		show: function () {
			this.element.style.display = "";
			clearInterval(this.model.interval);
			this.model.interval = setInterval((function (context) {
				return function () {
					context.controller.increaseHeight();
				}
			})(this), 33);
		},
		increaseHeight: function () {
			this.element.style.height = (this.element.style.height.replace('px', '')*1) + (this.model.height / 15) + 'px';
			if ((this.element.style.height.replace('px', '')*1) + (this.model.height / 15) > this.model.height) {
				this.element.style.height = this.model.height + 'px';
				clearInterval(this.model.interval);
				this.element.style.display = "";
				return false;
			}
			else {
				return true;
			}
		},
		decreaseHeight: function () {
			this.element.style.height = (this.element.style.height.replace('px', '')*1) - (this.model.height / 15) + 'px';
			if ((this.element.style.height.replace('px', '')*1) - (this.model.height / 15) < 0) {
				this.element.style.height = '0px';
				clearInterval(this.model.interval);
				this.element.style.display = "none";
				return false;
			}
			else {
				return true;
			}
		},
		hide: function () {
			clearInterval(this.model.interval);
			this.model.interval = setInterval((function (context) {
				return function () {
					context.controller.decreaseHeight();
				}
			})(this), 33);
		},
		toggle: function () {
			if (this.element.style.display == 'none') {
				this.controller.show();
			}
			else {
				this.controller.hide();
			}
		},
		handleMessage: function (message, channel) {
			if (channel == this.model.channel) {
				if (message == 'hide-drawer') {
					this.controller.hide();
				}
				if (message == 'show-drawer') {
					this.controller.show();
				}
				if (message == 'toggle-drawer') {
					this.controller.toggle();
				}
			}
		}
	},
	constructor: function () {
		this.model.height = this.element.clientHeight;
		this.element.style.height = '0px';
		this.element.style.display = 'none';
	}
});