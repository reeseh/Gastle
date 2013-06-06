window.Bus = function() {
	var _store = null;

	//BUS._STORE.ENTITY[ID][TOPIC][1].CALLBACK();
	//BUS._STORE.GLOBAL[TOPIC][1].CALLBACK();

	this.Entity = function(entityId) {
		var _self = this;

		this.EntityId = entityId;

		var _index = function(topic) {
			return topic + '_ID' + _self.EntityId;
		};

		var _getIndex = function(topic) {
			var idx = _index(topic);
			if(!_store.Entity[idx])
				_store.Entity[idx] = [];
			return idx;
		};

		this.Subscribe = function(topic, context, callback) {
			var idx = _getIndex(topic);
			_store.Entity[idx].push({ Context: context, Callback: callback });
		};

		this.Unsubscribe = function(topic, context, callback) {
			var idx = _getIndex(topic);
			var subscribers = _store.Entity[idx];
			var i = subscribers.length;
			while(i--) { 
				if(subscribers[i].Context !== context || subscribers[i].Callback !== callback) { continue; }
				_store.Entity[idx].splice(i, 1);
			}
		};

		this.Publish = function(topic, data) {
			var idx = _getIndex(topic);			
			var subscribers = _store.Entity[idx];
			var l = subscribers.length;
			for(var i = 0; i < l; i++) {
				if(subscribers[i] == undefined || subscribers[i].Callback == undefined) continue;
			 	subscribers[i].Callback(data); 
			}
		};
		return this;
	};

	this.Global = function() {
		var _exists = function(topic) {
			if(!_store.Global[topic])
				_store.Global[topic] = [];
		};

		this.Subscribe = function(topic, context, callback) {
			_exists(topic);
			_store.Global[topic].push({ Context: context, Callback: callback });
		};

		this.Unsubscribe = function(topic, context, callback) {
			var subscribers = _store.Global[topic];
			var i = subscribers.length;
			while(i--) { 
				if(subscribers[i].Context !== context || subscribers[i].Callback !== callback) { continue; }
				_store.Global[topic].splice(i, 1);
			}
		};
		
		this.Publish = function(topic, data) {
			_exists(topic);

			var subscribers = _store.Global[topic];
			var l = subscribers.length;
			for(var i = 0; i < l; i++) {
				if(subscribers[i] == undefined || subscribers[i].Callback == undefined) continue;
			 	subscribers[i].Callback(data); 
			}
		};
		return this;
	};

	this.Clear = function() {
		_store = {
			Entity: [],
			Global: []
		};
	};
	this.Clear();
};