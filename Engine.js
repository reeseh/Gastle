window.DependentScripts = ['Content/js/PubSub.js', 'Content/js/Game/Entity.js', 'Content/js/Game/Component.js'];

(function() {
	var self = this;

	this.Levels = [];
	this.CurrentLevelIndex = -1;

	this.Canvas = null;
	this.CanvasContext = null;
	this.HtmlContainer = null;
	this.MessageCenter = null;
	this.TitleBlock = null;

	this.Game = null;
	this.Loop = null;
	this.Bus = null;

	this.Entities = [];
	this.KeysDown = [];
	this.Delta = 0;
	this.LastFrameTime = new Date();
	this.FrameRate = 5000;	
	
	this.Start = function() {
		self.Entities = [];
		self.Game = new Entity.Game(self.Levels[++self.CurrentLevelIndex]);
		self.Bus.Publish(Engine.Event.LevelChanged, { LevelName : (self.CurrentLevelIndex + 1) });
	};

	this.Load = function() {
		self.Bus = new Bus();
		_setDOM();
		_bindEvents();
		self.Levels = GameLevels();

		var execDelay = self.FrameRate / 1000;
		self.Loop = setInterval(self.Main, execDelay);

		this.Start();
	};

	this.Main = function() {
		var now = Date.now();
		var delta = now - self.LastFrameTime;
		self.Delta = delta;
		self.Bus.Publish(Engine.Event.NewFrame, {});
		self.LastFrameTime = now;
	};

	//PRIVATE
	var _bindEvents = function() {
		self.Bus.Subscribe(Engine.Event.GameEvent, 'ENGINE', _writeEvent);
		self.Bus.Subscribe(Engine.Event.LevelComplete, 'ENGINE', self.Start);
		self.Bus.Subscribe(Engine.Event.LevelChanged, 'ENGINE', _writeTitleText);

		window.addEventListener('keydown', function(e) { window.Engine.Bus.Publish(Engine.Event.KeyDown, { KeyCode : e.keyCode }); }, false);
		window.addEventListener('keyup', function(e) { window.Engine.Bus.Publish(Engine.Event.KeyUp, { KeyCode : e.keyCode }); }, false);

		self.Bus.Subscribe(Engine.Event.KeyDown, 'ENGINE', _addKey);
		self.Bus.Subscribe(Engine.Event.KeyUp, 'ENGINE', _releaseKey);
		self.Bus.Subscribe(Engine.Event.LostFocus, 'ENGINE', _clearKeys);
	};

	var _setDOM = function() {
		self.HtmlContainer = document.getElementById('Game');
			
		var tb = document.createElement('p');
		tb.id = 'TitleBlock';
		self.HtmlContainer.appendChild(tb);
		self.TitleBlock = tb;

		var canvas = document.createElement('canvas');
		self.CanvasContext = canvas.getContext('2d');
		canvas.width = 650;
		canvas.height = 480;
		self.HtmlContainer.appendChild(canvas);
		self.Canvas = canvas;
		
		var mc = document.createElement('div');
		mc.id = 'MessageCenter';
		self.HtmlContainer.appendChild(mc);
		self.MessageCenter = mc;
	};

	var _writeEvent = function(data) {
		var mc = self.MessageCenter;
		mc.innerHTML += '<p>' + data.Text + '</p>';
		mc.scrollTop = mc.scrollHeight - 150;
	};

	var _writeTitleText = function(data) {
		var text = 'Level: ' + data.LevelName;
		self.TitleBlock.innerHTML = text;
	};

	var _addKey = function(data) {
		self.KeysDown[data.KeyCode] = true;
	};

	var _releaseKey = function(data) {
		self.KeysDown[data.KeyCode] = false;
	};

	var _clearKeys = function() {
		self.KeysDown = [];
	};

	window.Engine = this;
})();

Engine.Keys = {
	Up: 38,
	Down: 40,
	Left: 37,
	Right: 39,
	Shoot: 32,
	Enter: 13
};

Engine.Event = {
	NewFrame : 'NEWFRAME',
	KeyDown : 'KEYDOWN',
	KeyUp : 'KEYUP',
	LostFocus : 'LOSTFOCUS',
	GameEvent : 'EVENT',
	LevelComplete : 'LEVELCOMPLETE',
	LevelChanged : 'LEVELCHANGED'
};

var GameLevels = function() {
	return [
		new Entity.Level(1),
		new Entity.Level(2),
		new Entity.Level(3)
	];
};


window.Utility = {};

Utility.IsEmpty = function(obj) {
	return obj == undefined || obj == null || obj == '';
};

Utility.NewGuid = function() {
	var s4 = function() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1); }
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

require(window.DependentScripts, function() { window.Engine.Load(); });