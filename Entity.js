window.Entity = {};

Entity.Level = function(numMonsters) {
	return {
		NumberOfMonsters: numMonsters
	};
};

Entity.Base = function(self, type) {
	self.Components = [];
	self.Type = type;
	self.Id = Utility.NewGuid();

	self.AddEntity = function(entity) {
		Engine.Entities.push(entity);
	};

	self.AddComponent = function(component) {
		self.Components.push(component);
	};

	self.RemoveComponents = function() {
		var i = self.Components.length;
		while(i--) {
			self.Components[i].Unregister();
			self.Components.splice(i, 1);
		}
	};
};

Entity.Game = function(level) {
	var self = this;

	this.Level = level;

	this.Load = function() {
		Entity.Base(self, 'GAME');
		self.AddComponent(new Component.Display(self, 'Content/img/background.gif', 0, 0, 650, 480));

		self.AddEntity(new Entity.Wall(0, 0, 22, 480));
		self.AddEntity(new Entity.Wall(0, 0, 650, 22));
		self.AddEntity(new Entity.Wall(625, 0, 22, 480));
		self.AddEntity(new Entity.Wall(0, 458, 650, 22));

		self.AddEntity(new Entity.Hero());
		var i = level.NumberOfMonsters;
		while(i--) {
			self.AddEntity(new Entity.Monster());
		}
	};

	this.Load();
	return this;
};

Entity.Hero = function() {
	var self = this;

	this.Damage = 10;

	this.Load = function() {
		Entity.Base(self, 'HERO');

		var x = Engine.Canvas.width / 2;
		var y = Engine.Canvas.height / 2;
		self.AddComponent(new Component.Display(self, 'Content/img/hero_sprite.png', x, y, 26, 46, self.CreateSpriteSheet()));
		self.AddComponent(new Component.Shoot(self));
		self.AddComponent(new Component.UserMove(self, 0.1));
		self.AddComponent(new Component.Life(self));
		self.AddComponent(new Component.Collision(self, self.CollisionResponse));
	};

	this.CreateSpriteSheet = function() {
		var self = new Entity.SpriteSheet();
		self.Y0 = [
			new Entity.Sprite(0, 142),
			new Entity.Sprite(31, 142),
			new Entity.Sprite(64, 142),
			new Entity.Sprite(96, 142)
		];
		self.Y1 = [
			new Entity.Sprite(0, 1),
			new Entity.Sprite(31, 1),
			new Entity.Sprite(64, 1),
			new Entity.Sprite(96, 1)
		];
		self.X0 = [
			new Entity.Sprite(0, 49),
			new Entity.Sprite(31, 49),
			new Entity.Sprite(64, 49),
			new Entity.Sprite(96, 49)
		];
		self.X1 = [
			new Entity.Sprite(0, 97),
			new Entity.Sprite(31, 97),
			new Entity.Sprite(64, 97),
			new Entity.Sprite(96, 97)
		];
		self.Idle = [ new Entity.Sprite(0, 1) ];

		return self;
	};

	this.CollisionResponse = function(collider) {
		if(collider.Type !== 'MONSTER') return;
		self.TakeDamage(collider.Damage);
	};

	this.Load();
	return this;
};

Entity.Monster = function() {
	var self = this;

	this.Damage = 15;

	this.Load = function() {
		Entity.Base(self, 'MONSTER');

		var x = 32 + (Math.random() * (Engine.Canvas.width - 64));
		var y = 32 + (Math.random() * (Engine.Canvas.height - 64));
		self.AddComponent(new Component.Display(self, 'Content/img/villain_sprite.png', x, y, 44, 47, self.CreateSpriteSheet()));
		self.AddComponent(new Component.AutoMove(self, 1));
		self.AddComponent(new Component.Life(self));
		self.AddComponent(new Component.Collision(self, self.CollisionResponse));
	};

	this.CreateSpriteSheet = function() {
		var self = new Entity.SpriteSheet();
		self.Y0 = [
			new Entity.Sprite(0, 142),
			new Entity.Sprite(45, 142),
			new Entity.Sprite(89, 142),
			new Entity.Sprite(133, 142)
		];
		self.Y1 = [
			new Entity.Sprite(0, 0),
			new Entity.Sprite(45, 0),
			new Entity.Sprite(89, 0),
			new Entity.Sprite(133, 0)
		];
		self.X0 = [
			new Entity.Sprite(0, 48),
			new Entity.Sprite(45, 48),
			new Entity.Sprite(89, 48),
			new Entity.Sprite(133, 48)
		];
		self.X1 = [
			new Entity.Sprite(0, 95),
			new Entity.Sprite(45, 95),
			new Entity.Sprite(89, 95),
			new Entity.Sprite(133, 95)
		];
		self.Idle = [ new Entity.Sprite(0, 1) ];

		return self;
	};

	this.CollisionResponse = function(collider) {
		self.ChangeDirection();
		if(collider.Type !== 'MONSTER' && collider.Type !== 'WALL')
			self.TakeDamage(collider.Damage);
	};

	this.Load();
	return this;
};

Entity.Wall = function(x, y, width, height) {
	var self = this;

	this.Load = function() {
		Entity.Base(self, 'WALL');
		self.AddComponent(new Component.Shape(self, x, y, width, height));
		self.AddComponent(new Component.Collision(self, self.CollisionResponse));
	};

	this.CollisionResponse = function() {
		return;
	};

	this.Load();
	return this;
};

Entity.Projectile = function(x, y, direction) {
	var self = this;

	this.Damage = 10;

	this.Load = function() {
		Entity.Base(self, 'BULLET');

		self.AddComponent(new Component.Display(self, 'Content/img/bullet.png', x, y, 10, 10));
		self.AddComponent(new Component.AutoMove(self, 1.5, direction));
		self.AddComponent(new Component.Life(self));
		self.AddComponent(new Component.Collision(self, self.CollisionResponse));
	};	

	this.CollisionResponse = function(collider) {
		if(collider.Type !== 'MONSTER') return;
		self.Die();
	};

	this.Load();
	return this;
};

Entity.SpriteSheet = function() {
	this.X1 = [];
	this.X0 = [];
	this.Y1 = [];
	this.Y0 = [];
	this.Idle = [];
	return this;
};

Entity.Sprite = function(x, y) {
	this.X = x;
	this.Y = y;
	return this;
};


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
