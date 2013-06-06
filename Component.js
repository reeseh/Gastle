var Component = {};

Component.Base = function(component, id) {
	component.EntityId = id;
	component.Event = function(topic) {
		this.Subscribe = function(callback) {
			window.Engine.Bus.Subscribe(topic, component.EntityId, callback);
		};

		this.Unsubscribe = function(callback) {
			window.Engine.Bus.Unsubscribe(topic, component.EntityId, callback);
		};
		return this;
	};
	component.WriteGameEvent = function(text) {
		window.Engine.Bus.Publish(window.Engine.Event.GameEvent, { Text : text });
	};
};

Component.Display = function(entity, src, x, y, width, height, spriteSheet) {
	var self = this;
	this.ImageSrc = src;
	this.Ready = false;
	this.Image = null;
	this.LastSpriteChange = new Date();
	this.SpritThrottle = 200;//ms between shots

	this.SpriteSheet = spriteSheet;
	this.SpriteIndex = 0;

	entity.X = x;
	entity.Y = y;
	entity.Width = width;
	entity.Height = height;

	this.SetImage = function() {
        var image = new Image();
        image.onload = function () { 
            self.Ready = true;
        };
        image.src = self.ImageSrc;
        self.Image = image;
	};

	entity.Render = function() {
		if(Utility.IsEmpty(self.SpriteSheet))
			self.RenderImage();
		else
			self.RenderSprite();

		Engine.CanvasContext.beginPath();
		Engine.CanvasContext.rect(entity.X, entity.Y, entity.Width, entity.Height);
		Engine.CanvasContext.stroke();
	};

	this.RenderImage = function() {
        window.Engine.CanvasContext.drawImage(self.Image, entity.X, entity.Y);
	};

	this.RenderSprite = function() {
		var spriteAry = null;
		switch(true) {
			case entity.XDirection == 1:
				spriteAry = self.SpriteSheet.X1;
			break;
			case entity.XDirection == -1:
				spriteAry = self.SpriteSheet.X0;
			break;
			case entity.YDirection == 1:
				spriteAry = self.SpriteSheet.Y1;
			break;
			case entity.YDirection == -1:
				spriteAry = self.SpriteSheet.Y0;
			break;
			default:
				spriteAry = self.SpriteSheet.Idle;
			break;
		}

		if((new Date()) - self.LastSpriteChange > self.SpritThrottle)
		{
			self.SpriteIndex += 1;
			self.LastSpriteChange = new Date();
		}

		if(Utility.IsEmpty(spriteAry[self.SpriteIndex]))
			self.SpriteIndex = 0;

		var sprite = spriteAry[self.SpriteIndex];
		window.Engine.CanvasContext.drawImage(self.Image, sprite.X, sprite.Y, entity.Width, entity.Height, entity.X, entity.Y, entity.Width, entity.Height);
	};

	this.Register = function() {
		self.SetImage();
		Component.Base(self, entity.Id);
		self.Event(Engine.Event.NewFrame).Subscribe(entity.Render);
	};

	this.Unregister = function() {
		self.Event(Engine.Event.NewFrame).Unsubscribe(entity.Render);
	};

	this.Register();
	return this;
};

Component.UserMove = function(entity, speed) {
	var self = this;
	
	entity.Speed = speed;
	entity.XDirection = 0;
	entity.YDirection = 0;

	entity.Move = function() {
		var down = Engine.KeysDown;
		var modifier = Engine.Delta;

		switch(true) {
			case down[Engine.Keys.Up] === true: 
				entity.YDirection = -1;
				entity.Y -= entity.Speed * modifier;
			break;
			case down[Engine.Keys.Down] === true:
				entity.YDirection = 1;
				entity.Y += entity.Speed * modifier;
			break;
			default:
				entity.YDirection = 0;
			break;
		}

		switch(true) {
			case down[Engine.Keys.Left] === true: 
				entity.XDirection = -1;
				entity.X -= entity.Speed * modifier;
			break;
			case down[Engine.Keys.Right] === true:
				entity.XDirection = 1;
				entity.X += entity.Speed * modifier;
			break;
			default:
				entity.XDirection = 0;
			break;
		}

		entity.Render();
	};

	this.Register = function() {
		Component.Base(self, entity.Id);
		self.Event(Engine.Event.NewFrame).Subscribe(entity.Move);
	};

	this.Unregister = function() {
		self.Event(Engine.Event.NewFrame).Unsubscribe(entity.Move);
	};

	this.Register();
	return this;
};

Component.AutoMove = function(entity, speed, direction) {
	var self = this;
	entity.Direction = direction;
	entity.XDirection = 1 * speed;
	entity.YDirection = -1 * speed;

    entity.MoveAround = function() {
     //    if(entity.XSpeed > 0 || entity.XSpeed < 0)
    	// {
     //        entity.XSpeed = entity.XSpeed * -1;
     //        entity.XDirection = entity.XSpeed > 0 ? 1 : -1;
     //    }

     //    if(entity.YSpeed < 0 || entity.YSpeed > 0)
     //    {
     //        entity.YSpeed = entity.YSpeed * -1;
     //        entity.YDirection = entity.YSpeed > 0 ? 1 : -1;
     //    }

        entity.X += entity.XDirection;
        entity.Y += entity.YDirection;
    };

    entity.MoveDirection = function() {	
		switch(entity.Direction) {
			case Entity.Direction.Up:
				entity.Y -= entity.YDirection;
			break;
			case Entity.Direction.Down:
				entity.Y += entity.YDirection;
			break;
			case Entity.Direction.Left:
				entity.X -= entity.XDirection;
			break;
			case Entity.Direction.Right:
				entity.X += entity.XDirection;
			break;
		}

		entity.Render();
    };

    entity.ChangeDirection = function() {
		entity.XDirection = entity.XDirection * -1;
		entity.YDirection = entity.YDirection * -1;
    };

	this.Register = function() {
		Component.Base(self, entity.Id);

		if(Utility.IsEmpty(entity.Direction))
			self.Event(Engine.Event.NewFrame).Subscribe(entity.MoveAround);
		else
			self.Event(Engine.Event.NewFrame).Subscribe(entity.MoveDirection);
	};

	this.Unregister = function() {
		self.Event(Engine.Event.NewFrame).Unsubscribe(entity.Move);
		self.Event(Engine.Event.NewFrame).Unsubscribe(entity.MoveDirection);
	};

	this.Register();
	return this;
};

Component.Shoot = function(entity){
	var self = this;

	this.LastShot = new Date();
	this.ShotThrottle = 300;//ms between shots

	entity.Fire = function() {

		if(Engine.KeysDown[Engine.Keys.Shoot] !== true) return;
		if((new Date()) - self.LastShot < self.ShotThrottle) return;

		//var diff = self.Width / 2 + 1;
		//var x = self.Direction === Model.Direction.Left ? self.X - diff : self.Direction === Model.Direction.Right ? self.X + diff : self.X;
		//var y = self.Direction === Model.Direction.Up ? self.Y - diff : self.Direction === Model.Direction.Down ? self.Y + diff : self.Y;
		//var x = self.X;
		var x = entity.X;
		var y = entity.Y;
		Engine.Entities.push(new Entity.Projectile(x, y, entity.Direction));
		self.LastShot = new Date();
	};


	this.Register = function() {
		Component.Base(self, entity.Id);
		self.Event(Engine.Event.NewFrame).Subscribe(entity.Fire);
	};

	this.Unregister = function() {
		self.Event(Engine.Event.NewFrame).Unsubscribe(entity.Fire);
	};

	this.Register();
	return this;
};

Component.Life = function(entity) {
	var self = this;

	entity.Health = 100;
	
	entity.TakeDamage = function(damage) {
		var health = entity.Health - damage;

		self.WriteGameEvent(entity.Type + ' takes damage of ' + damage + '.');

		if(health <= 0) {
			self.WriteGameEvent(entity.Type + ' dies.');
			entity.Die();
			return;
		}

		entity.Health = health;
	};

	entity.Die = function() {
		entity.RemoveComponents();

		var idx = window.Engine.Entities.indexOf(entity);
		if(idx > -1)
			window.Engine.Entities.splice(0, 1);
	};

	this.Register = function() {
		Component.Base(self, entity.Id);
	};

	this.Unregister = function() { };

	this.Register();
	return this;
};

Component.Shape = function(entity, x, y, width, height) {
	var self = this;

	entity.X = x;
	entity.Y = y;
	entity.Width = width;
	entity.Height = height;

	this.Render = function() {
		Engine.CanvasContext.beginPath();
		Engine.CanvasContext.rect(entity.X, entity.Y, entity.Width, entity.Height);
		Engine.CanvasContext.strokeStyle="red";
		Engine.CanvasContext.stroke();
	};

	this.Register = function() {
		Component.Base(self, entity.Id);
		self.Event(Engine.Event.NewFrame).Subscribe(self.Render);
	};

	this.Unregister = function() { 
		self.Event(Engine.Event.NewFrame).Unsubscribe(self.Render);
	};

	this.Register();
	return this;
};

// Component.AABB = function(entity, x, y, width, height) {
// 	var self = this;

// 	this.X = x || 0;
// 	this.Y = y || 0;
// 	this.W = width || 0;
// 	this.H = height || 0;

// 	entity.GetCenter = function() {
// 		return {
// 		  X: self.X + entity.Width / 2,
// 		  Y: self.Y + entity.Height / 2
// 		};
// 	};

// 	entity.Intersects = function(box) {
// 		var c0 = entity.GetCenter();
// 		var c1 = box.GetCenter();

// 		if (Math.abs(c0.X - c1.X) > (self.W / 2 + box.W / 2)) return false;
// 		if (Math.abs(c0.Y - c1.Y) > (self.H / 2 + box.H / 2)) return false;

// 		return true;
// 	};

// 	this.MinimumTranslationVector = function(box) {
// 		var left = box.X - (this.X + this.W);
// 		var right = (box.X + box.W) - this.X;
// 		var top = box.Y - (this.Y + this.H);
// 		var bottom = (box.Y + box.H) - this.Y;

// 		var mtd = {
// 			x: 0,
// 			y: 0
// 		};

// 		if (left > 0 || right < 0) return mtd;
// 		if (top > 0 || bottom < 0) return mtd;

// 		if (Math.abs(left) < right) 
// 			mtd.x = left;
// 		else 
// 			mtd.x = right;

// 		if (Math.abs(top) < bottom) 
// 			mtd.y = top;
// 		else
// 			mtd.y = bottom;

// 		if (Math.abs(mtd.x) < Math.abs(mtd.y))
// 			mtd.y = 0;
// 		else
// 			mtd.x = 0;

// 		return mtd;
// 	};
// };

Component.Collision = function(entity, collisionCallback) {
	var self = this;

	entity.Collidable = true;
	this.CollisionResponse = null;

	this.CheckCollisions = function() {
		var i = window.Engine.Entities.length;
		var e = null;
		while(i--) {
			e = window.Engine.Entities[i];
			if(Utility.IsEmpty(e) || entity == e || e.Collidable !== true) 
				continue;

			if(self.HasCollision(e) === true) {
				if(!Utility.IsEmpty(self.CollisionResponse)) 
					self.CollisionResponse(e);
			}
		}

	};

	this.HasCollision = function(obj) {
		return (entity.X < obj.X + obj.Width && entity.X + entity.Width > obj.X && entity.Y < obj.Y + obj.Height && entity.Y + entity.Height > obj.Y);
	};

	this.Register = function(callback) {
		Component.Base(self, entity.Id);
		self.CollisionResponse = callback;
		self.Event(Engine.Event.NewFrame).Subscribe(self.CheckCollisions);
	};

	this.Unregister = function() {
		self.Event(Engine.Event.NewFrame).Unsubscribe(self.CheckCollisions);
	};

	this.Register(collisionCallback);
	return this;
};

// es.systems.debugCollision = {
// components: ['collision'],

// update: function(e) {
// var bounds = e.collision.bounds;
// es.canvasContext.beginPath();
// es.canvasContext.rect(bounds.x, bounds.y, bounds.w, bounds.h);
// es.canvasContext.stroke();
// }
// };



  // 2: {
  //   name: 'leftWall',
  //   solid: true,
  //   collision: {
  //     bounds: new es.AABB(4, 45, 25, 478)
  //   }
  // },

  // 3: {
  //   name: 'bottomWall',
  //   solid: true,
  //   collision: {
  //     bounds: new es.AABB(31, 492, 450, 30)
  //   }
  // },

  // 4: {
  //   name: 'rightWall',
  //   solid: true,
  //   collision: {
  //     bounds: new es.AABB(483, 45, 25, 478)
  //   }
  // },

  // 5: {
  //   name: 'topWall',
  //   solid: true,
  //   collision: {
  //     bounds: new es.AABB(31, 45, 450, 30)
  //   }
  // }, 
