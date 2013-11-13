LiveWidgets.addWidget({
	name: 'slider',
	model: {
		width: 0,
		position: 0,
		percent: 0
	},
	controller: {
		
		calculatePositionPercent: function () {
			this.model.percent = (this.model.position / this.model.width) * 100;
			this.reinit();
		},
		
		normalizePosition: function () {
			if (this.model.position > this.model.width - 12) {
				this.model.position = this.model.width - 12;
			}
			else if (this.model.position < 0) {
				this.model.position = 0;
			}
		},
		
		bindMouseMoveToDocument: function () {
			document.addEventListener('mousemove', this.controller.handleMouseMove, false);
		},
		
		bindClickToSliderBar: function () {
			this.element.childNodes[0].addEventListener('onclick', this.controller.handleClick, true);
		},
		
		bindMouseUpToDocument: function () {
			document.addEventListener('mouseup', this.controller.unbindDocumentEvents, true);
		},
		
		unbindDocumentEvents: function () {
			this.sendMessage(this.model.percent, this.model.channel);
			document.removeEventListener('mouseup', this.controller.unbindDocumentEvents);
			document.removeEventListener('mousemove', this.controller.handleMouseMove);
		},
		
		bindMousedownToSliderBar: function () {
			this.element.addEventListener('mousedown', this.controller.handleMouseDownOnSlider, true);
		},
		
		handleMouseDownOnSlider: function () {
			if (typeof event.pageX === 'undefined') {
				/* IE correction. */
				event.pageX = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			}
			this.controller.handleHandleDrag(event);
			this.controller.handleMouseDown();
		},
		
		handleMouseDown: function () {
			this.controller.bindMouseMoveToDocument();
			this.controller.bindMouseUpToDocument();
		},
		handleMouseMove: function (event) {
			if (typeof event.pageX === 'undefined') {
				/* IE correction. */
				event.pageX = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			}
			this.controller.handleHandleDrag(event);
		},
		
		handleHandleDrag: function (event) {
			this.model.position = event.pageX - this.model.sliderOffset;
			this.controller.normalizePosition();
			this.controller.calculatePositionPercent();
		}
	},
	constructor: function () {
		this.model.width = this.element.clientWidth;
		this.model.sliderOffset = this.element.offsetLeft;
		if (this.model.percent != 0) {
			this.model.position = Math.floor((this.model.percent / 100) * this.model.width);
		}
	},
	reinit: function () {
		this.controller.bindMousedownToSliderBar();
	},
	template: '<div style="width:<?=percent ?>%"><div></div></div>'
});