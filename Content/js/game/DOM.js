function DOM() {
	var self = this;

	this.Elements = {
		Container: null,
		Canvas: null,
		CanvasContext: null,
		HUD: null,
		Splash: null,
		MessageCenter: null
	};

	this.LoadDOM = function() {
		self.Elements.Container = document.getElementById('Game');

		self.LoadHUD();

		self.Elements.Canvas = Utility.LoadDOMElement('canvas', null, self.Elements.Container);
		self.Elements.Canvas.width = 650;
		self.Elements.Canvas.height = 480;
		self.Elements.CanvasContext = self.Elements.Canvas.getContext('2d');

		self.Elements.MessageCenter = Utility.LoadDOMElement('div', 'MessageCenter', self.Elements.Container);
	};

	this.LoadSettingsScreen = function() {
		_loadSplashFromTemplate('Settings.html');
	};

	this.LoadTitleScreen = function() {
		_loadSplashFromTemplate('Title.html');
	};

	this.LoadGameOverScreen = function() {
		_loadSplashFromTemplate('GameOver.html');
	};

	this.LoadWinScreen = function() {
		_loadSplashFromTemplate('Win.html');
	};

	this.LoadHUD = function() {	
		self.Elements.HUD = Utility.LoadDOMElement('div', 'HUD', self.Elements.Container);
	};

	this.ClearCanvas = function() {
		var canvas = self.Elements.Canvas;
		self.Elements.CanvasContext.clearRect(0, 0, canvas.width, canvas.height);
	};

	this.RemoveSplash = function(){
		if(self.Elements.Splash !== null)
			Utility.RemoveDOMElement(self.Elements.Splash);
	};

	var _setBackground = function(src, callback) {
		var image = new Image();
		image.onload = function () {
			self.Elements.CanvasContext.drawImage(image, 0, 0);
			if(callback !== undefined)
				callback();
		};
		image.src = src;
	};

	var _loadSplashFromTemplate = function(template) {
		self.RemoveSplash();
		
		var backgroundCallback = function() {
			var templateCallback = function(html) {
				self.Elements.Splash = Utility.LoadDOMElement('div', 'Splash', self.Elements.Container, html);
			};
			Utility.Ajax.get('Content/js/template/' + template, templateCallback);
		};

		_setBackground('Content/img/background.gif', backgroundCallback);
	};

	this.LoadDOM();
}