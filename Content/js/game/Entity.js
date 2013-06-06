window.Entity = {};

Entity.Func = {
	AddComponent : function(entity, component) {
		entity.Components.push(component);
	},
	RemoveComponents : function(entity) {
		var i = entity.Components.length;
		while(i--) {
			entity.Components[i].Unregister();
			entity.Components.splice(i, 1);
		}
	}
};

Entity.Base = function(entity, type, x, y, width, height) {
	entity.Id = null;
	entity.Type = type;
	entity.X = x;
	entity.Y = y;
	entity.Width = width;
	entity.Height = height;
	entity.Components = [];

	this.Init = function() {
		entity.Id = Utility.NewGuid();
	};
	this.Init();
};

Entity.Level = function(definition) {
	var _self = this;

	this.Definition = definition;

	this.Init = function() {
		Entity.Base(_self, 'LEVEL', 0, 0, 650, 480);
		
		Entity.Func.AddComponent(_self, new Component.Display(_self.Id, _self.Definition.Background));

		this.LoadEntities();
	};

	this.LoadEntities = function() {
		Gastle.AddEntity(new Entity.Hero(_self.Definition.HeroSpeed));

		var i = _self.Definition.NumberOfVillains;
		while(i--) { Gastle.AddEntity(new Entity.Villain(_self.Definition.VillainSpeed)); }

		var i = _self.Definition.Walls.length;
		while(i--) { 
			var wall = _self.Definition.Walls[i];
			Gastle.AddEntity(new Entity.Wall(wall.x, wall.y, wall.width, wall.height, wall.image)); 
		}
	};

	this.Init();
};

Entity.Hero = function(speed) {
	var _self = this;

	this.Init = function(speed) {
		var canvas = Gastle.DOM.Elements.Canvas;
		var x = canvas.width / 2;
		var y = canvas.height / 2;
		Entity.Base(_self, 'HERO', x, y, 26, 46);

		Entity.Func.AddComponent(_self, new Component.Display(_self.Id, 'Content/img/hero.png'));
		Entity.Func.AddComponent(_self, new Component.Move(_self.Id, speed));
		Entity.Func.AddComponent(_self, new Component.Collidable(_self, _self.X, _self.Y, _self.Width, _self.Height));
	};

	this.Init(speed);
};

Entity.Villain = function(speed) {
	var _self = this;

	this.Init = function(speed) {
		var canvas = Gastle.DOM.Elements.Canvas;
		var x = 32 + (Math.random() * (canvas.width - 64));
		var y = 32 + (Math.random() * (canvas.height - 64));
		Entity.Base(_self, 'VILLAIN', x, y, 26, 46);

		Entity.Func.AddComponent(_self, new Component.Display(_self.Id, 'Content/img/monster.png'));
		Entity.Func.AddComponent(_self, new Component.Collidable(_self, _self.X, _self.Y, _self.Width, _self.Height));
		Entity.Func.AddComponent(_self, new Component.AutoMove(_self.Id, speed));
	};

	this.Init(speed);
};

Entity.Wall = function(x, y, width, height, imgSrc) {
	var _self = this;

	this.Init = function(x, y, width, height, imgSrc) {
		Entity.Base(_self, 'WALL', x, y, width, height);

		Entity.Func.AddComponent(_self, new Component.Display(_self.Id, imgSrc));
		Entity.Func.AddComponent(_self, new Component.Collidable(_self, _self.X, _self.Y, _self.Width, _self.Height, function(e){}));
	};

	this.Init(x, y, width, height, imgSrc);
};

Entity.Projectile = function() {
	var _self = this;

	this.Init = function() {
		Entity.Base(_self, 'PROJECTILE');

		//Entity.Func.AddComponent(_self, new Component.Display(_self.Id, definition.Background));
	};

	this.Init();
};