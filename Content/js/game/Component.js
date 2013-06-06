window.Component = {};

Component.Base = function(component, entityId) {
	component.EntityId = entityId;
	component.GlobalEvent = function(topic) {
		return {
			Subscribe : function(callback) {
				Gastle.Bus.Global().Subscribe(topic, component.EntityId, callback);
			},
			Unsubscribe : function(callback) {
				Gastle.Bus.Global().Unsubscribe(topic, component.EntityId, callback);
			}
		};
	};
	component.EntityEvent = function(topic) {
		return {
			Subscribe : function(callback) {
				Gastle.Bus.Entity(component.EntityId).Subscribe(topic, component.EntityId, callback);
			},
			Unsubscribe : function(callback) {
				Gastle.Bus.Entity(component.EntityId).Unsubscribe(topic, component.EntityId, callback);
			}
		};
	};
	component.WriteGameEvent = function(text) {
		Gastle.Bus.Global().Publish(Gastle.GameEvent, { Text: text });
	};
};

Component.Display = function(entityId, imgSrc) {
	var _self = this;

	this.Image = null;
	this.Ready = false;
	
	this.Init = function(entityId, imgSrc) {
		Component.Base(_self, entityId);
		_self.LoadImage(imgSrc);
		_self.GlobalEvent(Gastle.Event.NewFrame).Subscribe(_self.RenderImage);
	};

	this.LoadImage = function(src) {
		var image = new Image();
		image.onload = function () { _self.Ready = true; };
		image.src = src;
		this.Image = image;
	};

	this.RenderImage = function() {
		var entity = Gastle.Entities[_self.EntityId];
		Gastle.CanvasContext().drawImage(_self.Image, entity.X, entity.Y);
	};

	this.Unregister = function() {
		_self.GlobalEvent(Gastle.Event.NewFrame).Unsubscribe(_self.RenderImage);
	};

	this.Init(entityId, imgSrc);
};

Component.Move = function(entityId, speed) {
	var _self = this;

	this.Speed = speed;
	this.XDirection = 0;
	this.YDirection = 0;

	this.Init = function(entityId) {
		Component.Base(_self, entityId);

		_self.GlobalEvent(Gastle.Event.NewFrame).Subscribe(_self.Move);
	};

	this.Move = function() {
		var entity = Gastle.Entities[_self.EntityId];
		var down = Gastle.KeysDown;
		var modifier = Gastle.Delta;

		switch(true) {
			case down[Gastle.Key.Up] === true: 
				_self.YDirection = -1;
				entity.Y -= _self.Speed * modifier;
			break;
			case down[Gastle.Key.Down] === true:
				_self.YDirection = 1;
				entity.Y += _self.Speed * modifier;
			break;
			default:
				_self.YDirection = 0;
			break;
		}

		switch(true) {
			case down[Gastle.Key.Left] === true: 
				_self.XDirection = -1;
				entity.X -= _self.Speed * modifier;
			break;
			case down[Gastle.Key.Right] === true:
				_self.XDirection = 1;
				entity.X += _self.Speed * modifier;
			break;
			default:
				_self.XDirection = 0;
			break;
		}
	};

	this.Unregister = function() {
		_self.GlobalEvent(Gastle.Event.NewFrame).Unsubscribe(_self.Move);
	};

	this.Init(entityId);
};

Component.AutoMove = function(entityId, speed) {
	var _self = this;

	this.XDirection = 1 * speed;
	this.YDirection = -1 * speed;

    this.Move = function() {
		var entity = Gastle.Entities[_self.EntityId];
        entity.X += _self.XDirection;
        entity.Y += _self.YDirection;
    };

    this.ChangeDirection = function() {
		_self.XDirection *= -1;
		_self.YDirection *= -1;
    };

	this.Init = function(entityId) {
		Component.Base(_self, entityId);
		_self.GlobalEvent(Gastle.Event.NewFrame).Subscribe(_self.Move);
		_self.EntityEvent(Gastle.Event.Collision).Subscribe(_self.ChangeDirection);
	};

	this.Unregister = function() {
		_self.GlobalEvent(Engine.Event.NewFrame).Unsubscribe(_self.Move);
	};

	this.Init(entityId);
};

Component.Collidable = function(entity, x, y, width, height) {
	var _self = this;

	this.XDiff = 0;
	this.YDiff = 0;

	this.Init = function(entity) {
		Component.Base(_self, entity.Id);

		this.XDiff = entity.X - entity.AABB.X;
		this.YDiff = entity.Y - entity.AABB.Y;

		_self.GlobalEvent(Gastle.Event.NewFrame).Subscribe(_self.CheckCollisions);
	};

	this.CheckCollisions = function() {
		var entities = Gastle.Entities;
		var entity = entities[_self.EntityId];
		if(entity.Type == 'WALL') return;
		_self.UpdateBox(entity);

		var e2 = null;
		for(var id in entities) {
			if(id == _self.EntityId) continue;
			e2 = entities[id];

			if(e2.Collidable !== true) continue;

			var isCollision = _self.HasCollision(entity.AABB, entities[id].AABB);
			if(!isCollision) continue;

			Gastle.Bus.Entity(_self.EntityId).Publish(Gastle.Event.Collision, { e : e2 });
		}
	};

	this.UpdateBox = function(entity) {
		entity.AABB.X = entity.X + _self.XDiff;
		entity.AABB.Y = entity.Y + _self.YDiff;

		if(Gastle.Debug !== true) return;

		var ctx = Gastle.CanvasContext();
		ctx.beginPath();
		ctx.fillStyle = "rgb(255,50,50)";
		ctx.rect(entity.AABB.X, entity.AABB.Y, entity.AABB.Width, entity.AABB.Height);
		ctx.stroke();
	};

	this.Unregister = function() {
		_self.GlobalEvent(Gastle.Event.NewFrame).Unsubscribe(_self.RenderBox);
	};

	entity.Collidable = true;
	entity.AABB = new AABB(x, y, width, height);

	this.HasCollision = function(box1, box2) {
		var box1C = box1.GetCenter();
		var box2C = box2.GetCenter();

		if (Math.abs(box1C.X - box2C.X) > (box1.Width / 2 + box2.Width / 2)) return false;
		if (Math.abs(box1C.Y - box2C.Y) > (box1.Height / 2 + box2.Height / 2)) return false;

		return true;
	};

	this.Init(entity);
};

// Component.Stun = function(entityId) {
// 	this.Init = function(entityId) {
// 		Component.Base(_self, entityId);

// 		_self.EntityEvent(Gastle.Event.NewFrame).Subscribe(_self.CheckCollisions);
// 	};

// 	this.Init(entityId);
// };

//Component.Stun
//Gastle.Bus.Entity(_self.EntityId).Publish(Gastle.Event.Collision

var AABB = function(x, y, width, height) {
	var _self = this;

	this.X = x;
	this.Y = y;
	this.Width = width;
	this.Height = height;

	this.GetCenter = function() {
		return {
			X: _self.X + _self.Width / 2,
			Y: _self.Y + _self.Height / 2
		};
	};
};