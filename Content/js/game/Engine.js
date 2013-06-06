window.DependentScripts = ['Content/js/lib/pubsub.js', 'Content/js/game/DOM.js', 'Content/js/game/Utility.js', 'Content/js/Game/Entity.js', 'Content/js/Game/Component.js'];

(function() {
	var _self = this;

	this.Debug = true;

	this.CurrentLevelIndex = -1;
	this.Levels = [];
	this.DOM = null;
	this.Bus = null;

	this.Entities = [];
	this.KeysDown = [];
	this.FrameRate = 100;
	this.LastFrameTime = null;
	this.Delta = 0;
	this.Loop = null;

	this.Load = function() {
		_self.DOM = new DOM();
		_self.Bus = new Bus();
		_loadLevels();
		_bindEvents();

		_self.DOM.LoadTitleScreen();
	};

	this.NextLevel = function() {
		_self.Pause();
		_self.DOM.RemoveSplash();
		_clearEntities();
		var level = _self.Levels[++_self.CurrentLevelIndex];
		if(!Utility.IsEmpty(level))
		{
			Gastle.AddEntity(new Entity.Level(level));
			_self.Start();
			return;
		}
		_self.DOM.LoadWinScreen();
	};

	this.GameOver = function() {
		_self.DOM.LoadGameOverScreen();
	};

	this.Pause = function() {
		_unbindEvents();
		clearInterval(_self.Loop);
	};

	this.Start = function() {
		_bindEvents();
		_self.LastFrameTime = new Date();
		var execDelay = _self.FrameRate / 1000;
		_self.Loop = setInterval(_newFrame, execDelay);
	};

	this.AddEntity = function(entity) { _self.Entities[entity.Id] = entity; };

	this.CanvasContext = function() { return _self.DOM.Elements.CanvasContext; };

	var _newFrame = function() {
		_self.DOM.ClearCanvas();
		var now = Date.now();
		_self.Delta = now - _self.LastFrameTime;
		_self.Bus.Global().Publish(Gastle.Event.NewFrame, {});
		_self.LastFrameTime = now;
	};

	var _bindEvents = function() {
		_self.Bus.Global().Subscribe(Gastle.Event.GameEvent, 'ENGINE', _writeEvent);

		window.addEventListener('keydown', _keyDown, false);
		window.addEventListener('keyup', _keyUp, false);
	};

	var _unbindEvents = function() {
		_self.Bus.Global().Unsubscribe(Gastle.Event.GameEvent, 'ENGINE', _writeEvent);

		window.removeEventListener('keydown', _keyDown, false);
		window.removeEventListener('keyup', _keyUp, false);
	};

	var _writeEvent = function(data) {
		var mc = _self.DOM.Elements.MessageCenter;
		Utility.LoadDOMElement('p', null, mc, data.Text);
		mc.scrollTop = mc.scrollHeight - 150;
	};

	var _clearEntities = function() {
		var entities = _self.Entities;
		var i = entities.length;
		while(i--) { entities[i].RemoveComponents(); }
		_self.Entities = [];
	};

	var _loadLevels = function() {
		var callback = function(data) {
			_self.Levels = JSON.parse(data);
		};

		Utility.Ajax.get('Content/js/game/Levels.js', callback);
	};

	var _keyDown = function(e) { 
		_self.KeysDown[e.keyCode] = true;
		_self.Bus.Global().Publish(Gastle.Event.KeyDown, { KeyCode : e.keyCode }); 
	};

	var _keyUp = function(e) { 
		_self.KeysDown[e.keyCode] = false;
		_self.Bus.Global().Publish(Gastle.Event.KeyUp, { KeyCode : e.keyCode }); 
	};

	window.Gastle = this;
})();

Gastle.Event = {
	NewFrame : 'NEWFRAME',
	KeyDown : 'KEYDOWN',
	KeyUp : 'KEYUP',
	LostFocus : 'LOSTFOCUS',
	GameEvent : 'GAMEEVENT',
	Collision : 'COLLISION'
};

Gastle.Key = {
	Up: 38,
	Down: 40,
	Left: 37,
	Right: 39,
	Shoot: 32,
	Enter: 13
};

require(window.DependentScripts, function() { window.Gastle.Load(); });