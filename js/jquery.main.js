// page init
jQuery(function() {
	initZoomImage();
});

// init zoom image
function initZoomImage() {
	jQuery('.zoom-image').zoomImage();
}

/*
 *  jQuery zoom image plugin
 */
;(function($) {
	'use strict';

	var win = $(window),
		doc = $(document),
		isTouchDevice = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,
		isWinPhoneDevice = /Windows Phone/.test(navigator.userAgent);

	var ZoomImage = function(options) {
		this.options = $.extend({}, ZoomImage.DEFAULTS, options);
		this.init();
	};

	// default options
	ZoomImage.DEFAULTS = {
		image: 'img[src]',
		zoomPosition: 'right', // left
		loadingClass: 'loading'
	};

	ZoomImage.prototype = {
		init: function() {
			if (this.options.holder) {
				this.initStructure();
				this.makeCallback('onInit', this);
			}
		},
		initStructure: function() {
			this.page = $('body');
			this.holder = $(this.options.holder);
			this.image = this.holder.find(this.options.image);
			this.imageSRC = this.image.data('zoomImage') !== undefined ? this.image.data('zoomImage') : this.image.attr('src');
			this.createZoomHandler();
			this.attachEvents();
		},
		attachEvents: function() {
			var self = this;

			this.onStartZoom = function(event) {
				self.startZoom(event);
			};

			this.onMoveZoom = function(event) {
				self.moveZoom(event);
			};

			this.onEndZoom = function(event) {
				self.endZoom(event);
			};

			this.onWindowResize = function() {
				self.windowResize();
			};

			this.getEventHandlers();
			this.windowResize();
			this.zoomLens.on(this.eventDown, this.onStartZoom);
			isWinPhoneDevice || isTouchDevice ? doc.on(this.eventUp, this.onEndZoom) : this.zoomLens.on(this.eventUp, this.onEndZoom);
			win.on('resize orientationchange', this.onWindowResize);
		},
		startZoom: function(event) {
			var posX, posY;
			posX = this.getEvent(event).pageX - this.data.holderOffsetLeft;
			posY = this.getEvent(event).pageY - this.data.holderOffsetTop;

			this.createZoomContainer();
			this.recalculateData();
			this.setZoomPosition();
			this.factor = this.data.zoomWidth / this.zoomHandler.width();

			this.zoomFakeImage.css({
				height: 'auto',
				width: this.holder.outerWidth() * this.data.zoomWidth / this.zoomHandler.width()
			});

			this.moveZoomHandler(posX, posY);
			this.moveFakeImage();

			event.preventDefault();
			doc.on(this.eventMove, this.onMoveZoom);
		},
		moveZoom: function(event) {
			var posX = this.getEvent(event).pageX - this.data.holderOffsetLeft,
				posY = this.getEvent(event).pageY - this.data.holderOffsetTop,
				rangeX = this.getEvent(event).pageX > this.data.holderOffsetLeft && this.getEvent(event).pageX < this.data.holderOffsetLeft + this.data.holderWidth,
				rangeY = this.getEvent(event).pageY > this.data.holderOffsetTop && this.getEvent(event).pageY < this.data.holderOffsetTop + this.data.holderHeight;

			if (rangeX || rangeY) {
				// set position X
				if (posX < this.zoomHandlerFactor) {
					posX = this.zoomHandlerFactor;
				} else if (posX > this.data.holderWidth - this.zoomHandlerFactor) {
					posX = this.data.holderWidth - this.zoomHandlerFactor;
				}

				// set position Y
				if (posY < this.zoomHandlerFactor) {
					posY = this.zoomHandlerFactor;
				} else if (posY > this.data.holderHeight - this.zoomHandlerFactor) {
					posY = this.data.holderHeight - this.zoomHandlerFactor;
				}

				this.moveZoomHandler(posX, posY);
				this.moveFakeImage();
			}

			event.preventDefault();
		},
		endZoom: function(event) {
			event.preventDefault();
			this.zoomHandler.hide().css({ left: '', top: '' });
			this.removeZoomContainer();
			doc.off(this.eventMove, this.onMoveZoom);
		},
		moveZoomHandler: function(posX, posY) {
			// change position overlay
			this.zoomHandler.css({
				left: posX - this.zoomHandlerFactor,
				top:  posY - this.zoomHandlerFactor
			}).show();
		},
		moveFakeImage: function() {
			// change position fake image
			this.zoomFakeImage.css({
				left: -parseFloat(this.zoomHandler.css('left')) * this.factor,
				top:  -parseFloat(this.zoomHandler.css('top'))  * this.factor
			});
		},
		createZoomHandler: function() {
			this.zoomLens = $('<div class="zoom-lens"></div>').insertAfter(this.image);
			this.zoomHandler = $('<div class="zoom-handler"></div>').insertAfter(this.image).hide();
			this.zoomHandlerFactor = this.zoomHandler.outerWidth() / 2;
		},
		createZoomContainer: function() {
			var self = this;
			var loadFakeImage = function() {
				self.zoomFakeImage.off('load error', loadFakeImage);
				self.zoomContainer.removeClass(self.options.loadingClass);
				self.zoonPreloader.remove();
			};

			this.zoomContainer = $('<div class="zoom-container"></div>').appendTo(this.page).show();
			this.zoonPreloader = $('<div class="zoom-loader"><span class="loader"></span></div>').prependTo(this.zoomContainer);
			this.zoomFakeImage = $('<img />').appendTo(this.zoomContainer);
			this.zoomFakeImage.on('load error', loadFakeImage).attr('src', this.imageSRC);
		},
		setZoomPosition: function() {
			var coords;

			switch (this.options.zoomPosition) {
				case 'right':
					coords = {
						left: this.data.holderOffsetLeft + this.data.holderWidth,
						top:  this.data.holderOffsetTop
					};
					break;
				case 'left':
					coords = {
						left: this.data.holderOffsetLeft - this.data.zoomWidth,
						top:  this.data.holderOffsetTop
					};
					break;
				default: false;
			}

			this.zoomContainer.css(coords);
		},
		recalculateData: function() {
			this.data = {
				// positions
				holderOffsetLeft: this.holder.offset().left,
				holderOffsetTop:  this.holder.offset().top,

				// dimensions holder
				holderHeight: this.holder.outerHeight(),
				holderWidth:  this.holder.outerWidth(),

				// dimensions zoom container
				zoomHeight: this.zoomContainer ? this.zoomContainer.outerHeight() : null,
				zoomWidth:  this.zoomContainer ? this.zoomContainer.outerWidth()  : null
			};
		},
		removeZoomContainer: function() {
			if (this.zoomContainer) {
				this.zoomContainer.remove();
			}
		},
		getEventHandlers: function() {
			if (isWinPhoneDevice) {
				this.eventDown = navigator.pointerEnabled ? 'pointerdown' : 'MSPointerDown';
				this.eventMove = navigator.pointerEnabled ? 'pointermove' : 'MSPointerMove';
				this.eventUp   = navigator.pointerEnabled ? 'pointerup'   : 'MSPointerUp';
			} else {
				this.eventDown = isTouchDevice ? 'touchstart' : 'mouseenter';
				this.eventMove = isTouchDevice ? 'touchmove'  : 'mousemove';
				this.eventUp   = isTouchDevice ? 'touchend'   : 'mouseleave';
			}
		},
		getEvent: function(event) {
			if (event.originalEvent.changedTouches) {
				return event.originalEvent.changedTouches[0];
			} else if (typeof event.originalEvent.pageX === 'number') {
				return event.originalEvent;
			} else {
				return event;
			}
		},
		windowResize: function() {
			this.recalculateData();
		},
		destroy: function() {
			this.zoomLens.remove();
			this.zoomHandler.remove();
			this.removeZoomContainer();
			this.zoomLens.off(this.eventDown, this.onStartZoom);
			isWinPhoneDevice || isTouchDevice ? doc.off(this.eventUp, this.onEndZoom) : this.zoomLens.off(this.eventUp, this.onEndZoom);
			doc.off(this.eventMove, this.onMoveZoom);
			win.off('resize orientationchange', this.onWindowResize);
		},
		makeCallback: function(name) {
			if (typeof this.options[name] === 'function') {
				var args = Array.prototype.slice.call(arguments);
				args.shift();
				this.options[name].apply(this, args);
			}
		}
	};

	// jQuery plugin interface
	$.fn.zoomImage = function(options) {
		return this.each(function() {
			var params = $.extend({}, options, { holder: this }),
				instance = new ZoomImage(params);
			$.data(this, 'ZoomImage', instance);
		});
	};
}(jQuery));
