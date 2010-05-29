LiveWidgets.addWidget({
	name: 'event-trigger',
	model: {
		event: ''
	},
	controller: {
		dispatchMessageToGroupedWidgets: function (event) {
			event.stopPropagation();
			this.sendMessage(this.model.message, this.model.channel);
		}
	},
	reinit: function () {
		this.element.removeEventListener(this.model.event, this.controller.dispatchMessageToGroupedWidgets);
		this.element.addEventListener(this.model.event, this.controller.dispatchMessageToGroupedWidgets, true);
	}
});