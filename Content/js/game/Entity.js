window.Entity = {};

Entity.Func = {
	AddComponent : function(entity, component) {
		entity.Components[component.Name] = component;
	},
	RemoveComponents : function(entity) {
		for(var name in entity.Components)
		{
			entity.Components[name].Unregister();
			delete entity.Components[name];
		}
	},
	HasFlag: function(entity, flag) {
		return entity.Flags.indexOf(flag) > -1;
	},
	AddFlag: function(entity, flag) {
		entity.Flags.push(flag);
	},
	RemoveFlag: function(entity, flag) {
		var idx = entity.Flags.indexOf(flag);
		if(idx > -1)
			entity.Flags.splice(idx, 1);
	},
	RemoveSelf: function(entity) {
		// var idx = Gastle.Entities.indexOf(entity.Id);
		// Gastle.Entities.splice(idx, 1);
		delete Gastle.Entities[entity.Id];
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
	entity.Flags = [];

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
		Entity.Func.AddComponent(_self, new Component.Life(_self));
		Entity.Func.AddComponent(_self, new Component.Move(_self.Id, speed));
		Entity.Func.AddComponent(_self, new Component.Collidable(_self, _self.X, _self.Y, _self.Width, _self.Height));
		Entity.Func.AddComponent(_self, new Component.Stun(_self.Id));
		Entity.Func.AddComponent(_self, new Component.Attack(_self, 5, 0));
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
		Entity.Func.AddComponent(_self, new Component.Life(_self));
		Entity.Func.AddComponent(_self, new Component.AutoMove(_self.Id, speed));
		Entity.Func.AddComponent(_self, new Component.Collidable(_self, _self.X, _self.Y, _self.Width, _self.Height));
		Entity.Func.AddComponent(_self, new Component.Attack(_self, 50, 5));
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