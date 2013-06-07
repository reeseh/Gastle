window.Component = {};

Component.Base = function(component, name, entityId) {
	component.EntityId = entityId;
	component.Name = name;
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
		Gastle.Bus.Global().Publish(Gastle.Event.GameEvent, { Text: text });
	};
};

Component.Display = function(entityId, imgSrc) {
	var _self = this;

	this.Image = null;
	this.Ready = false;
	this.StunAlpha = 0.3;
	
	this.Init = function(entityId, imgSrc) {
		Component.Base(_self, 'DISPLAY', entityId);
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
		var ctx = Gastle.CanvasContext();

		ctx.save();
		if(Entity.Func.HasFlag(entity, Gastle.Flag.Stun))
			ctx.globalAlpha = _self.StunAlpha;

		ctx.drawImage(_self.Image, entity.X, entity.Y);
		ctx.restore();
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
		Component.Base(_self, 'DISPLAY', entityId);

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

    this.ChangeDirection = function(data) {
		_self.XDirection *= -1;
		_self.YDirection *= -1;
    };

	this.Init = function(entityId) {
		Component.Base(_self, 'AUTOMOVE', entityId);
		_self.GlobalEvent(Gastle.Event.NewFrame).Subscribe(_self.Move);
		_self.EntityEvent(Gastle.Event.Collision).Subscribe(_self.ChangeDirection);
	};

	this.Unregister = function() {
		_self.GlobalEvent(Engine.Event.NewFrame).Unsubscribe(_self.Move);
	};

	this.Init(entityId);
};

Component.Stun = function(entityId) {
	var _self = this;

	this.StunInterval = null;

	this.Init = function(entityId) {
		Component.Base(_self, 'STUN', entityId);

		_self.EntityEvent(Gastle.Event.Collision).Subscribe(_self.Stun);
	};

	this.Stun = function(data) {
		var entity = Gastle.Entities[_self.EntityId];
		var flag = Gastle.Flag.Stun;

		var interval = function() {
			if(Entity.Func.HasFlag(entity, Gastle.Flag.Stun))
				Entity.Func.RemoveFlag(entity, flag);
			else
				Entity.Func.AddFlag(entity, flag);
		};

		if(_self.StunInterval != null) 
			clearInterval(_self.StunInterval);

		_self.StunInterval = setInterval(interval, 100);

		setTimeout(function() { 
			clearInterval(_self.StunInterval);
			Entity.Func.RemoveFlag(entity, flag);
		}, 3000);
	};

	this.Unregister = function() {
		_self.EntityEvent(Gastle.Event.Collision).Unsubscribe(_self.Stun);
	};

	this.Init(entityId);
};

Component.Collidable = function(entity, x, y, width, height) {
	var _self = this;

	this.XDiff = 0;
	this.YDiff = 0;

	this.Init = function(entity) {
		Component.Base(_self, 'COLLIDABLE', entity.Id);

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

			var mtv = _self.MinimumTranslationVector(entity.AABB, entities[id].AABB);
			entity.X += mtv.X;
			entity.Y += mtv.Y;

			var bounceBack = e2.BounceBack;

			if (mtd.x < 0) e.position.x += mtd.x - bounceBack;
			else if (mtd.x > 0) e.position.x += mtd.x + bounceBack;
			else if (mtd.y < 0) e.position.y += mtd.y - bounceBack;
			else if (mtd.y > 0) e.position.y += mtd.y + bounceBack;

			Gastle.Bus.Entity(_self.EntityId).Publish(Gastle.Event.Collision, { Entity: e2 });
		}
	};

	this.MinimumTranslationVector = function(box1, box2) {
		var left = box2.X - (box1.X + box1.Width);
		var right = (box2.X + box2.Width) - box1.X;
		var top = box2.Y - (box1.Y + box1.Height);
		var bottom = (box2.Y + box2.Height) - box1.Y;

		var mtd = { X: 0, Y: 0 };

		if ((left > 0 || right < 0) || (top > 0 || bottom < 0)) return mtd;

		if (Math.abs(left) < right) 
			mtd.X = left;
		else 
			mtd.X = right;

		if (Math.abs(top) < bottom) 
			mtd.Y = top;
		else
			mtd.Y = bottom;

		_self.WriteGameEvent('X: ' + mtd.X + '; Y: ' + mtd.Y);


		if (Math.abs(mtd.X) < Math.abs(mtd.Y))
			mtd.Y = 0;
		else
			mtd.X = 0;


		return mtd;
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
		var entity = entities[_self.EntityId];

		entity.Collidable = undefined;
		entity.AABB = undefined;

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

Component.Life = function(entity) {
	var _self = this;

	entity.Health = 100;

	this.Init = function(entityId) {
		Component.Base(_self, 'LIFE', entityId);
		_self.EntityEvent(Gastle.Event.Collision).Subscribe(_self.TakeDamage);
	};

	this.TakeDamage = function(data) {
		if(Utility.IsEmpty(data.Entity.Damage)) return; //entity does not deal damage

		var entity = Gastle.Entities[_self.EntityId];
		entity.Health -= data.Entity.Damage;
		_self.WriteGameEvent(entity.Type + ' takes damage of ' + data.Entity.Damage);

		if(entity.Health <= 0)
			_self.Die(entity);
	};

	this.Die = function() {
		Entity.Func.RemoveComponents(entity);
		_self.WriteGameEvent(entity.Type + ' died');

		if(entity.Type == 'HERO')
			_self.Global().Publish(Gastle.Event.HeroDied, {});
	};

	this.Unregister = function() {
		var entity = Gastle.Entities[_self.EntityId];
		entity.Health = undefined;

		_self.EntityEvent(Engine.Event.Collision).Unsubscribe(_self.TakeDamage);
	};

	this.Init(entity.Id);
};

Component.Attack = function(entity, damage, bounceBack) {
	entity.Damage = damage;
	entity.BounceBack = bounceBack;

	this.Init = function() {
		Component.Base(_self, 'ATTACK', entityId);
	};

	this.Unregister = function() {
		var entity = Gastle.Entities[_self.EntityId];
		entity.Damage = undefined;
	};

	this.Init(entity.Id);
};

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