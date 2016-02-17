/*
Notes: Projectiles can either be a regular moving body or a line, but for the purposes of this stage of development, regular moving body
*/

GSSProjectile.id = 0;

GSSProjectile.defaults = {
	angle: 0, 
	x: 0, 
	y: 0, 
	thrust_acceleration: -1,
	thrust_deceleration: -1,
	velocity_max: 50,
	velocity_initial: 50,
	velocity_inherit: true,
	homing: false, 
	homing_radius: 0, 
	lifetime: 1000,
	hit_effect_data: false,
	hit_sound_index: false,
	image_frames : 1,
	image_frame_rate: 100,
	image_data: false,
	damage: 1
};


/** 
* Requires image, parent gss entity, body def
*/
function GSSProjectile(GSSEntity_parent, options) {
	options = extend(GSSProjectile.defaults, options);
	
	this.parent = GSSEntity_parent;
	
	this.lifetime_end = Date.now()+options.lifetime;
	this.mark_for_delete = false;

	this.hit_effect_data = options.hit_effect_data;
	this.hit_sound_index = options.hit_sound_index;
	
	this.homing = options.homing;
	this.homing_radius = options.homing_radius;
	
	this.thrust_acceleration = options.thrust_acceleration;
	this.thrust_deceleration = options.thrust_deceleration;
	this.velocity_max = options.velocity_max;
	this.velocity_inherit = options.velocity_inherit;
	
	// Important look at this later.
	
	this.velocity_initial = new b2Vec2(-options.velocity_initial*Math.cos(options.angle), -options.velocity_initial*Math.sin(options.angle));
	var offset_velocity = this.parent.entity_body.GetLinearVelocity();
	//b2Vec2.Add(offset_velocity, this.velocity_initial, (this.velocity_inherit ? this.parent.entity_body.GetLinearVelocity() : new b2Vec2(0, 0)));
	var scalar = (this.velocity_initial.x*offset_velocity.x+this.velocity_initial.y*offset_velocity.y)/Math.pow(this.velocity_initial.Length(), 2);
	b2Vec2.MulScalar(offset_velocity, this.velocity_initial, scalar < 0 ? 0 : scalar);
	
	b2Vec2.Add(offset_velocity, offset_velocity, this.velocity_initial);

	
	// Immediately set velocity if thrust.acceleration is -1
	if(this.thrust_acceleration == -1)
		this.velocity = offset_velocity;
	
	
	this.id = GSSProjectile.id;
	GSSProjectile.id++;
	
	this.destroyed = false;
	
	// BEGIN: THREE.js
	this.mesh_data = GSS.image_data[options.image_data.image_index];
	this.image_frames = options.image_frames;
	this.image_frame_rate = options.image_frame_rate;
	this.image_frame_current = 0;
	
	this.texture = this.mesh_data.texture.clone();
	this.texture.needsUpdate = true;
	this.material = new THREE.MeshBasicMaterial({map: this.texture, wireframe: false, transparent: true});
	this.material.side = THREE.DoubleSide;
	
	this.mesh_plane = new THREE.Mesh(new THREE.PlaneGeometry(this.mesh_data.width, this.mesh_data.height), this.material);
	GSS.scene.add(this.mesh_plane);
	// END: THREE.js
	
	// BEGIN: LiquidFun
	this.projectile_body_def = new b2BodyDef();
	this.projectile_body_def.type = b2_dynamicBody;
	this.projectile_body_def.bullet = true;
	this.projectile_body_def.position = new b2Vec2(options.x, options.y);
	this.projectile_body_def.angle = options.angle;
	
	this.projectile_fixture_def = new b2FixtureDef();
	this.projectile_fixture_def.shape = new b2PolygonShape();
	this.projectile_fixture_def.shape.SetAsBoxXY(this.mesh_data.width/2/GSS.PTM, this.mesh_data.height/2/GSS.PTM);
	this.projectile_fixture_def.density = 1;
	this.projectile_fixture_def.friction = 1;
	this.projectile_fixture_def.restitution = 0; // Bounce yes
	this.projectile_fixture_def.filter.groupIndex = -GSS.faction_data[GSSEntity_parent.faction].category;

	this.projectile_body = GSS.world.CreateBody(this.projectile_body_def);
	this.projectile_body.CreateFixtureFromDef(this.projectile_fixture_def);
	this.projectile_body.GSS_parent = GSSEntity_parent;
	this.projectile_body.GSSData = {type: 'GSSProjectile', obj: this};
	// END: LiquidFun
	
	return this;
}

GSSProjectile.prototype = {
	update: function(){
		if(this.mark_for_delete)
		{	
			// Prevent any LiquidFun interactions
			this.projectile_body.SetLinearVelocity(new b2Vec2(0,0));
			for(var i = 0; i < this.projectile_body.fixtures.length; i++)
			{
				var fixture = this.projectile_body.fixtures[i];
				this.projectile_body.DestroyFixture(fixture);
			}
			return;
		}
		var velocity_current = this.projectile_body.GetLinearVelocity(),
		angle_current = this.projectile_body.GetAngle(),
		x_force = -this.thrust_acceleration*Math.cos(angle_current)/GSS.FPS,
		y_force = -this.thrust_acceleration*Math.sin(angle_current)/GSS.FPS;
		//console.log(velocity_current.length, this.homing, x_force, y_force);
		window.velocity = velocity_current;
		if(!this.homing)
		{
			if(this.thrust_acceleration != -1 && velocity_current.Length() < this.velocity_max)
			{
				console.log(x_force, y_force);
				this.projectile_body.ApplyForceToCenter(new b2Vec2(x_force, y_force), true);
			}
			else
				this.projectile_body.SetLinearVelocity(this.velocity);
		}
		
		
		// Update mesh position
		this.mesh_plane.position.x = this.projectile_body.GetPosition().x*GSS.PTM;
		this.mesh_plane.position.y = this.projectile_body.GetPosition().y*GSS.PTM;
		this.mesh_plane.rotation.z = this.projectile_body.GetAngle();
		
		if(this.lifetime_end <= Date.now())
			this.destroy();
	},
	redraw: function(){
		var angle = this.projectile_body.GetAngle(),
		x = this.projectile_body.GetPosition().x*GSS.PTM,
		y = this.projectile_body.GetPosition().y*GSS.PTM; 
		
		if(x-this.image.width/2 < 0 || y-this.image.height/2 < 0 || x-this.image.width/2 > GSS.context.canvas.width || y-this.image.height/2 > GSS.context.canvas.height)
			return;
		
		GSS.context.translate(x, y);
		GSS.context.rotate(angle);
		GSS.context.drawImage(this.image, -this.image.width/2, -this.image.height/2);
		GSS.context.rotate(-angle);
		GSS.context.translate(-x, -y);
	},
	/* Remove projectile eligibility from rendering and simulation */
	destroy: function(with_effect){
		if(this.mark_for_delete)
			return; 
			
		this.mark_for_delete = true;
		GSS.scene.remove(this.mesh_plane);
		
		GSS.world.DestroyBody(this.projectile_body);
		GSS.projectiles_to_remove.push(this);
		
		if(with_effect !== undefined && with_effect)
		{
			GSS.playSound(this.hit_sound_index, this.projectile_body.GetPosition().x, this.projectile_body.GetPosition().y);
			if(this.hit_effect_data)
				GSS.addEffect(this.hit_effect_data, this.projectile_body.GetPosition().x*GSS.PTM, this.projectile_body.GetPosition().y*GSS.PTM);	
		}
	}
}

GSSWeapon.defaults = {
	// Position relative to GSSEntity parent
	x: 0,
	y: 0,
	
	// Weapon fire image and sounds
	fire_image_index: 0,
	fire_sound_index: 0,
	
	// Weapon fire data
	power_cost: 0,
	firerate: 20,
	faction_id: -1,
	spread_oscilliate: false,
	spread_oscilliate_reverse: true,
	spread_oscilliate_reverse_on_complete: true,
	spread: 0,
	spread_fixed: false, // Fixed weapon spread flag, random spread otherwise
	projectiles_per_shot: 1,
	flipped: false,
	
	// Projectile data
	damage: 1,
	velocity: 20,
	lifetime: 1000,
	
	projectile_data: false
}

/**
* GSSWeapon
* Creates GSSProjectiles
*/
function GSSWeapon(GSSEntity_parent, options){
	console.log('parent', GSSEntity_parent);
	if(GSSEntity_parent === undefined || GSS.world === undefined)
		return;
		
	options = extend(GSSWeapon.defaults, options);
	// Projectile Image
	this.image = GSS.image_data[options.projectile_image_index];
	this.hit_image = GSS.image_data[options.projectile_hit_image_index];
	
	// Audio
	this.fire_sound_index = options.fire_sound_index;
	
	this.last_fired = 0;
	this.fire_rate = 1000/options.firerate;
	
	// Position relative to parent image
	this.x = options.x/GSS.PTM;
	this.y = options.y/GSS.PTM;
	
	this.power_cost = options.power_cost;
	
	// Firing methods
	this.spread = options.spread*DEGTORAD;
	this.spread_fixed = options.spread_fixed;
	this.projectiles_per_shot = options.projectiles_per_shot;
	this.increment = this.projectiles_per_shot-1 !== 0 ? this.spread/(this.projectiles_per_shot-1) : 1;
	this.increment_max = this.spread/this.increment;
	this.increment_current = options.spread_oscilliate_reverse ? this.increment_max : 0;
	
	this.spread_oscilliate = options.spread_oscilliate;
	this.spread_oscilliate_reverse = options.spread_oscilliate_reverse;
	this.spread_oscilliate_reverse_on_complete = options.spread_oscilliate_reverse_on_complete;
	
	this.damage = options.damage;
	this.velocity = options.velocity;
	this.parent = GSSEntity_parent;
	this.projectile_data = options.projectile_data;
	console.log(this.parent);
}

GSSWeapon.prototype = {
	/*
	See: http://stackoverflow.com/questions/12161277/how-to-rotate-a-vertex-around-a-certain-point
	*/
	fire: function() {
		var time_current = Date.now();
		if(this.last_fired == 0 || this.last_fired+this.fire_rate-time_current < 0)
		{
			var parent_body = this.parent.getBody(),
			parent_position = parent_body.GetPosition(),
			parent_angle = parent_body.GetAngle(),
			target_angle,
			new_x = (this.x)*Math.cos(parent_angle) - (this.y)*Math.sin(parent_angle),
			new_y = (this.x)*Math.sin(parent_angle) + (this.y)*Math.cos(parent_angle);
			/*
			audio = new Audio();
			audio.src = this.audio.url;
			audio.play();
			*/
	
			if(this.spread_oscilliate && this.projectiles_per_shot > 1)
			{
				target_angle =  parent_angle+this.increment_current*this.increment-this.spread/2;
				var new_data = clone(this.projectile_data);
					new_data.angle = target_angle;
					new_data.velocity_magnitude = this.velocity;
					new_data.x =  new_x+parent_position.x;//-1/2/GSS.PTM*Math.cos(target_angle), 
					new_data.y =  new_y+parent_position.y;//-1/2/GSS.PTM*Math.sin(target_angle),
					GSS.projectiles.push(new GSSProjectile(this.parent, new_data));
				
				// Oscillation handling
				if(this.spread_oscilliate_reverse)
					this.increment_current--;
				else
					this.increment_current++;
					
				if(this.increment_current > this.increment_max)
				{
					if(this.spread_oscilliate_reverse_on_complete)
					{
						this.increment_current = this.increment_max;
						this.spread_oscilliate_reverse = true;
					}
					else
						this.increment_current = 0;
				}
				else if(this.increment_current < 0)
				{
					if(this.spread_oscilliate_reverse_on_complete)
					{
						this.increment_current = 0;
						this.spread_oscilliate_reverse = false;
					}
					else
						this.increment_current = this.increment_max;
				}
			}
			else
			{
				target_angle =  parent_angle+(this.spread_fixed ? this.increment*i-this.spread/2*(this.projectiles_per_shot != 1) : (this.spread*Math.random()-this.spread/2));
				for(var i = 0; i < this.projectiles_per_shot; i++)
				{
					var new_data = clone(this.projectile_data);
					new_data.angle = target_angle;
					new_data.velocity_magnitude = this.velocity;
					new_data.x =  new_x+parent_position.x;//-1/2/GSS.PTM*Math.cos(target_angle), 
					new_data.y =  new_y+parent_position.y;//-1/2/GSS.PTM*Math.sin(target_angle),
					GSS.projectiles.push(new GSSProjectile(this.parent, new_data));
				}
			}
			
			GSS.playSound(this.fire_sound_index, new_x+parent_position.x, new_y+parent_position.y);
			this.last_fired = time_current;
		}
	}
}

