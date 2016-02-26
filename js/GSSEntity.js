GSSBaseUpdateFunctions = {
	updatePlayer: function(entity){
		
		var
		// Control flags
		left = false,
		right = false,
		up = false,
		down = false,
		fire = false,
		
		// Linear movement
		x = 0,
		y = 0,
		x_force,
		y_force,
		move_angle = 0,
		
		// Angle movement
		move_mouse_x = -(GSS.mouse_info.x-GSS.canvas.clientWidth/2)/GSS.PTM,
		move_mouse_y = (GSS.mouse_info.y-GSS.canvas.clientHeight/2)/GSS.PTM,
		offset_mouse_x = (GSS.mouse_info.x-GSS.canvas.clientWidth/2+GSS.camera.position.x)/GSS.PTM,
		offset_mouse_y = -(GSS.mouse_info.y-GSS.canvas.clientHeight/2-GSS.camera.position.y)/GSS.PTM,
		angle_current = entity.body.GetAngle(),
		angle_target = entity.getAngleToPosition(offset_mouse_x, offset_mouse_y),
		move_target = Math.atan2(move_mouse_y, move_mouse_x),
		angle_delta,
		dir,
		angular_acceleration_needed,
		torque,
		deceleration_thrust = false;
		
		entity.angular_velocity_current = entity.body.GetAngularVelocity();
		entity.velocity_current = entity.body.GetLinearVelocity();
		
		// BEGIN: Linear Movement
		// Up/Down
		if(GSS.keys[87] === true) // Down
			up = true;
		else if(GSS.keys[83] === true) // Up
			down = true;
		
		// Left/Right
		if(GSS.keys[65] === true) // Left
			left = true;
		else if(GSS.keys[68] === true) // Right
			right = true;
		
		entity.firing = GSS.keys[32];
		
		if(up)
		{
			if(left)
				move_angle = entity.movement_relative_to_screen ? 135*DEGTORAD : angle_target-135*DEGTORAD;
			else if(right)
				move_angle = entity.movement_relative_to_screen ? 45*DEGTORAD : angle_target+135*DEGTORAD;
			else 
				move_angle = entity.movement_relative_to_screen ? 90*DEGTORAD : angle_target+180*DEGTORAD;
		}
		else if(down)
		{
			if(left)
				move_angle = entity.movement_relative_to_screen ? 225*DEGTORAD : angle_target-45*DEGTORAD;
			else if(right)
				move_angle = entity.movement_relative_to_screen ? 315*DEGTORAD : angle_target+45*DEGTORAD;
			else
				move_angle = entity.movement_relative_to_screen ? 270*DEGTORAD : angle_target;
		} 
		else
		{
			if(left)
				move_angle = entity.movement_relative_to_screen ? 180*DEGTORAD : angle_target-90*DEGTORAD;
			else if(right)
				move_angle = entity.movement_relative_to_screen ? 0*DEGTORAD : angle_target+90*DEGTORAD;
		}
		
		if(entity.firing)
			entity.fireWeapons();
		
		//move_angle = angle_current-move_angle*DEGTORAD;
		//console.log(move_angle*RADTODEG);
		x = (up || down || left || right)*entity.thrust_acceleration*Math.cos(move_angle)/GSS.FPS;
		y = (up || down || left || right)*entity.thrust_acceleration*Math.sin(move_angle)/GSS.FPS;
		
		// Apply thrust any controls
		if(up || down || left || right)
			entity.body.ApplyForceToCenter(new b2Vec2(x, y), true);
		
		// Set to max velocity if applied force exceeds max velocity
		if(Math.abs(entity.velocity_current.Length()) >= entity.velocity_magnitude_max)
		{
			var new_vec = new b2Vec2(0, 0);
			b2Vec2.Normalize(new_vec, entity.body.GetLinearVelocity());
			b2Vec2.MulScalar(new_vec, new_vec, entity.velocity_magnitude_max);
			entity.body.SetLinearVelocity(new_vec);
		}
		
		//console.log(entity.velocity_current.Length(), x, y);
		
		deceleration_thrust = new b2Vec2(0,0);
		b2Vec2.Sub(deceleration_thrust, entity.body.GetLinearVelocity(), new b2Vec2(x, y));
		x_force = entity.body.GetMass()*deceleration_thrust.x;
		y_force = entity.body.GetMass()*deceleration_thrust.y;
		x_force = Math.abs(x_force) >= entity.thrust_deceleration ? entity.thrust_deceleration*(x_force > 0 ? -1 : 1): -x_force;
		y_force = Math.abs(y_force) >= entity.thrust_deceleration ? entity.thrust_deceleration*(y_force > 0 ? -1 : 1): -y_force;
		entity.body.ApplyForceToCenter(new b2Vec2(x_force, y_force), true);
		
		// END: Linear Movement
		
		// BEGIN: Angular Movement (Mouse Tracking)
		// See: http://www.iforce2d.net/b2dtut/rotate-to-angle
		// See: http://www.dummies.com/how-to/content/how-to-calculate-the-torque-needed-to-accelerate-a.html
		if(!entity.lock_rotation)
		{			
			if(entity.follow_mouse)
			{
				entity.body.SetTransform(entity.body.GetPosition(), angle_target);
			}
			else
			{
				entity.lookAtPosition(offset_mouse_x, offset_mouse_y);
			}
			entity.angle_current = angle_current;
		}
		else
		{
			entity.body.SetTransform(entity.body.GetPosition(), entity.angle_current);
		}
		// END: Angular Movement (Mouse Tracking)
	},
	updateStatic: function(entity){
		var deceleration_thrust,
		x_force,
		y_force,
		angular_acceleration_needed,
		torque;
		
		deceleration_thrust = new b2Vec2(0,0);
		b2Vec2.Sub(deceleration_thrust, entity.body.GetLinearVelocity(), new b2Vec2(0, 0));
		x_force = entity.body.GetMass()*deceleration_thrust.x;
		y_force = entity.body.GetMass()*deceleration_thrust.y;
		x_force = Math.abs(x_force) >= entity.thrust_deceleration ? entity.thrust_deceleration*(x_force > 0 ? -1 : 1): -x_force;
		y_force = Math.abs(y_force) >= entity.thrust_deceleration ? entity.thrust_deceleration*(y_force > 0 ? -1 : 1): -y_force;
		entity.body.ApplyForceToCenter(new b2Vec2(x_force, y_force), true);
		
		angular_acceleration_needed = (-entity.angular_velocity_current/entity.angular_acceleration/GSS.FPS).clamp(-entity.angular_acceleration, entity.angular_acceleration);
		torque = entity.body.GetInertia()*angular_acceleration_needed;
				entity.body.ApplyTorque(torque);
				
		// Cap angular velocity
		entity.angular_velocity_current = entity.body.GetAngularVelocity();
		if(Math.abs(entity.angular_velocity_current) > entity.angular_velocity_max)
			entity.body.SetAngularVelocity(entity.angular_velocity_current/entity.angular_velocity_current*entity.angular_velocity_max);
	},
	updateStaticLookAtAggressive: function(entity){
		var target = GSS.player,
		target_position,
		angle_current = entity.body.GetAngle(),
		angle_target,
		deceleration_thrust,
		x_force,
		y_force,
		angular_acceleration_needed,
		torque,
		targets = GSS.queryAABB(entity.body.position.x-100, entity.body.position.y-100, entity.body.position.x+100, entity.body.position.y+100);
		
		deceleration_thrust = new b2Vec2(0,0);
		b2Vec2.Sub(deceleration_thrust, entity.body.GetLinearVelocity(), new b2Vec2(0, 0));
		x_force = entity.body.GetMass()*deceleration_thrust.x;
		y_force = entity.body.GetMass()*deceleration_thrust.y;
		x_force = Math.abs(x_force) >= entity.thrust_deceleration ? entity.thrust_deceleration*(x_force > 0 ? -1 : 1): -x_force;
		y_force = Math.abs(y_force) >= entity.thrust_deceleration ? entity.thrust_deceleration*(y_force > 0 ? -1 : 1): -y_force;
		entity.body.ApplyForceToCenter(new b2Vec2(x_force, y_force), true);
		
		if(targets.length !== 0)
		{
			var closest_target = false,
			distance = 0,
			current_distance;
			for(var i = 0; i < targets.length; i++)
			{
				if(targets[i].GSSData === undefined)
				{
					targets.splice(i--, 1);
					continue;
				}
				else if(targets[i].GSSData !== undefined && target.GSSData.obj == entity)
					continue;
				
				target = targets[i].GSSData.obj;
				
				current_distance = Math.sqrt(Math.pow(entity.position.x-target.position.x, 2) + Math.pow(entity.position.y-target.position.y, 2));
				if(closest_target == false)
					closest_target = target;
				else if(distance > current_distance)
					closest_target = target;
			}
			/*
			position = target.body.GetPosition();
			angle_target = entity.getAngleToPosition(position.x, position.y);
			
			entity.lookAtPosition(position.x, position.y);
			*/
		}	
	}
}

GSSEntity.defaults = {
	x: 0,
	y: 0,
	angle: 0,
	is_player: false,
	faction_id: -1,
	
	/* Image handling */
	image_index: 0,
	image_frames: 1,
	image_frame_rate: 0,
	animate_on_fire: false,
	body_image_data: false,
	image_data: false,
	
	/* Life and death */
	invincible: false,
	hp_max: 100, 
	shield_max: 100,
	shield_regen_rate: 1000,
	shield_regen_amount: 1,
	shield_regen_delay: 1000,
	death_sound_index: -1,
	death_effect_data: false,
	onDeathCallback: false,
	
	// Weapons data
	/*
	Example: {x: 0, y: 0, weapon: <GSSWeapon>, group: 0} and so on
	*/
	weapons: [],
	power_max: 100,
	power_regen: 10,
	
	triangles: [],
	
	// Linear Movement
	thrust_acceleration: 50,
	thrust_deceleration: 10,
	velocity_magnitude_max: 10,
	movement_relative_to_screen: false, 
	
	// Angular Movement (Entered as degrees, converted to radians)
	angular_acceleration: 1,
	angular_velocity_max: 360,
	lock_rotation: false,
	follow_mouse: false,  // No acceleration 1:1 mouse tracking
	
	updateFunction: false
	
	
}

GSSEntity.id = 0;

/**
Argument setup:
image object required
polygons array used to build body (in PX)
bool if controlled by player (controls override)
*/
function GSSEntity(index, options) {
	if(GSS.world === undefined || GSS.renderer === undefined)
		return;
	
	options = extend(GSSEntity.defaults, options);
	
	// BEGIN: GSSEntity Data
	this.body_image_data = options.image_data;
	this.frame_current = 0;
	this.frame_next = Date.now()+this.body_image_data.frame_rate;
	
	this.polygons;
	this.id = index;
	this.is_player = options.is_player;
	this.faction = options.faction_id;
	this.mark_for_delete = false;
	
	// Health and shields
	// Shields regenerate health doesn't
	this.invincible = options.invincible;
	this.hp_max = options.hp_max;
	this.hp = this.hp_max;
	this.shield_max = options.shield_max;
	this.shield = this.shield_max;
	this.shield_depleted = false;
	
	this.shield_regen_rate = options.shield_regen_rate;
	this.shield_regen_next = Date.now();
	this.shield_regen_amount = options.shield_regen_amount;
	this.shield_regen_delay = options.shield_regen_delay; // Should only apply when shields are depleted 
	this.shield_regen_delay_next = Date.now();
	
	this.death_effect_data = options.death_effect_data;
	
	// Weapons handling
	this.weapons = [];
	for(var i = 0; i < options.weapons.length; i++)
	{
		this.weapons.push(clone(options.weapons[i]));
	}

	for(var w = 0; w < this.weapons.length; w++)
	{
		var weapon_data = clone(GSS.weapon_data[this.weapons[w].weapon_id]);
			weapon_data.x = this.weapons[w].x;
			weapon_data.y = this.weapons[w].y;
			weapon_data.faction_id = this.faction;
			this.weapons[w].weapon = new GSSWeapon(this, weapon_data);
	}

	this.firing = false;
	this.power_max = options.power_max;
	this.power_current = this.power_max;
	this.power_regen = options.power_regen;
	this.movement_relative_to_screen = options.movement_relative_to_screen;
	this.targets = [];
	// END: GSSEntity Data
	
	// BEGIN: Movement stats
	// Thrust in Newtons
	this.thrust_acceleration = options.thrust_acceleration;
	this.thrust_deceleration = options.thrust_deceleration;
	
	// m/s
	this.velocity_magnitude_max = options.velocity_magnitude_max;
	this.velocity_current = new b2Vec2(0,0);
	
	// rad/sec
	this.angular_velocity_max = options.angular_velocity_max*DEGTORAD;
	this.angular_acceleration = options.angular_acceleration*DEGTORAD;
	this.angular_velocity_current = 0;
	
	this.angle_current = options.angle*DEGTORAD;
	
	this.lock_rotation = options.lock_rotation;
	this.follow_mouse = options.follow_mouse;
	// END: Movement stats
	
	// BEGIN: THREE.js
	this.three_data = GSS.image_data[this.body_image_data.image_index];
	this.texture = this.three_data.texture.clone();
	this.texture.needsUpdate = true;
	this.material = new THREE.MeshBasicMaterial({map: this.texture, wireframe: false, transparent: true});
	this.material.side = THREE.DoubleSide;
	this.material.shading = THREE.FlatShading;
	this.mesh_plane = new THREE.Mesh(new THREE.PlaneGeometry(this.three_data.width/this.body_image_data.frames, this.three_data.height), this.material);
	GSS.scene.add(this.mesh_plane);
	
	this.damage_delay = 50;
	this.damage_next = Date.now();
	this.damage_effect = false;
	this.damage_scale = 2;
	this.damage_color = 0xff0000;
	
	this.display_hp = false;
	this.display_shield = false;
	this.display_hp_mesh = new THREE.Mesh(new THREE.PlaneGeometry(50, 5), GSS.hp_bar_texture);
	this.display_shield_mesh = new THREE.Mesh(new THREE.PlaneGeometry(50, 5), GSS.shield_bar_texture);
	this.display_hp_mesh.position.x = this.mesh_plane.position.x+this.three_data.width + 2;
	this.display_hp_mesh.position.y = this.mesh_plane.position.y;
	this.display_shield_mesh.position.x = this.mesh_plane.position.x+this.three_data.width + 2;
	this.display_shield_mesh.position.y = this.mesh_plane.position.y-15;
	
	GSS.scene.add(this.display_hp_mesh);
	GSS.scene.add(this.display_shield_mesh);
	// END: THREE.js
	
	// BEGIN: liquidfun
	var body_def = new b2BodyDef();
	body_def.type = b2_dynamicBody;
	body_def.angle = options.angle*DEGTORAD;
	body_def.position = new b2Vec2(options.x/GSS.PTM, options.y/GSS.PTM);
	body_def.fixedRotation = this.lock_rotation;
	
	
	// Todo: Create Polygons for each fixture
	var body_fixture = new b2FixtureDef();	
	body_fixture.density = 1;
	body_fixture.friction = 1;
	body_fixture.restitution = 0;
	body_fixture.filter.groupIndex = -GSS.faction_data[options.faction_id].category; // Same faction does not collide with each other
	body_fixture.shape = new b2PolygonShape();
	body_fixture.shape.SetAsBoxXY(this.three_data.width/this.body_image_data.frames/2/GSS.PTM, this.three_data.height/2/GSS.PTM);
	
	this.body = GSS.world.CreateBody(body_def);
	this.body.CreateFixtureFromDef(body_fixture);
	this.body.GSSData = {type: 'GSSEntity', obj: this};
	console.log('this', -GSS.faction_data[options.faction_id].category);
	// END: liquidfun
	
	this.updateFunction = options.updateFunction;
	
	this.id = GSSEntity.id++;
	return this;
}

GSSEntity.prototype = {
	getBody: function(){
		return this.body;
	},
	fireWeapons: function(){
		var current_weapon_group;
		// Fires all weapon groups at once, depending on enabled or disabled
		for(var w = 0; w < this.weapons.length; w++)
		{
			this.weapons[w].weapon.fire();
		}
	},
	setAngle: function(new_angle){			
		this.angle_current = new_angle*DEGTORAD;
		this.body.SetTransform(this.body.GetPosition(), this.angle_current);
	},
	getAngleToPosition: function(x, y)
	{
		var angle = -1,
		position = this.body.GetPosition(),
		x = position.x - x,
		y = position.y - y,
		angle = Math.atan2(y, x);
		
		angle = angle < 0 ? angle+(2*Math.PI) : angle;
		
		return angle;
	},
	/* Call this in the update function of the GSS entity */
	lookAtPosition: function(x, y)
	{
		var
		angle_current = this.body.GetAngle(),
		angle_target = this.getAngleToPosition(x, y),
		dir = 0, 
		angle_delta = 0,
		angular_acceleration_needed = 0,
		torque = 0;
		
		// Constrain body's current angle to 0 - 360
		if(angle_current > 2*Math.PI)
			this.body.SetTransform(this.body.GetPosition(), angle_current-2*Math.PI);
		
		// Get direction rotation is going to happen
		dir = Math.cos(angle_current)*Math.sin(angle_target)-Math.sin(angle_current)*Math.cos(angle_target) > 0 ? 1 : -1;
		
		// Offset angle target to match direction i.e. if the direction is possitive and the current angle is 360, the destination is 360 plus
		angle_target = dir > 0 && angle_target < angle_current ? angle_target+=2*Math.PI : angle_target;
		
		// Find amount of rotation
		angle_delta = angle_target-angle_current;
		
		// Find shortest angle to rotate to 
		while(angle_delta < -Math.PI) { angle_delta += 360*Math.PI/180; }
		while(angle_delta > Math.PI) { angle_delta -= 360*Math.PI/180; }
		
		// Find acceleration for a step needed to move angle_delta
		angular_acceleration_needed = ((angle_delta-this.angular_velocity_current)/GSS.FPS).clamp(-this.angular_acceleration, this.angular_acceleration);

		torque = this.body.GetInertia()*angular_acceleration_needed;
		this.body.ApplyTorque(torque);
		
		// Cap angular velocity
		this.angular_velocity_current = this.body.GetAngularVelocity();
		if(Math.abs(this.angular_velocity_current) > this.angular_velocity_max)
			this.body.SetAngularVelocity(dir*this.angular_velocity_max);
	},
	damage: function(damage){
		if(damage === undefined || !damage || damage <= 0 || this.invincible)
			return;
		
	
		console.log('hit1', this.hp, damage, this.shield);
		
		if(this.shield > 0)
		{
			this.shield-=damage;
			this.shield = this.shield < 0 ? 0 : this.shield;
		}
		else if(this.shield === 0)
		{
			this.shield_depleted = true;
			this.shield_regen_delay_next = Date.now()+this.shield_regen_delay;
			
			this.hp-=damage;
			this.hp = this.hp < 0 ? 0 : this.hp;
		}
		
		if(this.hp === 0)
		{
			console.log('hit');
			this.destroy(true);
		}
		
		console.log('result', this.shield, this.hp);
		
		if(this.damage_effect)
			return;
		
		this.damage_effect = true;
		this.damage_next = this.damage_delay+Date.now();
		this.material.color = new THREE.Color("hsl(0, 100%, 80%)");
		this.mesh_plane.scale.x = this.damage_scale;
		this.mesh_plane.scale.y = this.damage_scale;
		
	},
	destroy: function(with_effect){
		if(this.mark_for_delete)
			return;
		console.log('hello');
		this.mark_for_delete = true;
		
		GSS.scene.remove(this.mesh_plane);
		GSS.scene.remove(this.display_hp_mesh);
		GSS.scene.remove(this.display_shield_mesh);
		GSS.world.DestroyBody(this.body);
		GSS.entities_to_remove.push(this);
		if(with_effect !== undefined && with_effect)
		{
			console.log('asdf hai', this.death_effect_data);
			if(this.death_sound_index != -1)
				GSS.playSound(this.death_sound_index, this.body.GetPosition().x, this.body.GetPosition().y);
			if(this.death_effect_data)
				GSS.addEffect(this.death_effect_data, this.body.GetPosition().x*GSS.PTM, this.body.GetPosition().y*GSS.PTM);
		}
		
	},
	update: function(){
		if(this.mark_for_delete)
		{	
			// Prevent any LiquidFun interactions
			this.body.SetLinearVelocity(new b2Vec2(0,0));
			for(var i = 0; i < this.body.fixtures.length; i++)
			{
				var fixture = this.body.fixtures[i];
				this.body.DestroyFixture(fixture);
			}
			return;
		}
		
		// Put movement callback here
		if(this.is_player)
			GSSBaseUpdateFunctions.updatePlayer(this);
		else if(this.updateFunction != false)
			this.updateFunction(this);
		else
			GSSBaseUpdateFunctions.updateStatic(this);
			
		/*
		var
		// Control flags
		left = false,
		right = false,
		up = false,
		down = false,
		fire = false,
		
		// Linear movement
		x = 0,
		y = 0,
		x_force,
		y_force,
		move_angle = 0,
		
		// Angle movement
		move_mouse_x = -(GSS.mouse_info.x-GSS.canvas.clientWidth/2)/GSS.PTM,
		move_mouse_y = (GSS.mouse_info.y-GSS.canvas.clientHeight/2)/GSS.PTM,
		offset_mouse_x = (GSS.mouse_info.x-GSS.canvas.clientWidth/2+GSS.camera.position.x)/GSS.PTM,
		offset_mouse_y = -(GSS.mouse_info.y-GSS.canvas.clientHeight/2-GSS.camera.position.y)/GSS.PTM,
		angle_current = this.body.GetAngle(),
		angle_target = this.getAngleToPosition(offset_mouse_x, offset_mouse_y),
		move_target = Math.atan2(move_mouse_y, move_mouse_x),
		angle_delta,
		dir,
		angular_acceleration_needed,
		torque,
		deceleration_thrust = false;
		
		this.angular_velocity_current = this.body.GetAngularVelocity();
		this.velocity_current = this.body.GetLinearVelocity();
		
		if(this.is_player)
		{	
			// BEGIN: Linear Movement
			// Up/Down
			if(GSS.keys[87] === true) // Down
				up = true;
			else if(GSS.keys[83] === true) // Up
				down = true;
			
			// Left/Right
			if(GSS.keys[65] === true) // Left
				left = true;
			else if(GSS.keys[68] === true) // Right
				right = true;
			
			if(GSS.keys[32] === true)
				fire = true;
			
			if(up)
			{
				if(left)
					move_angle = this.movement_relative_to_screen ? 135*DEGTORAD : angle_target-135*DEGTORAD;
				else if(right)
					move_angle = this.movement_relative_to_screen ? 45*DEGTORAD : angle_target+135*DEGTORAD;
				else 
					move_angle = this.movement_relative_to_screen ? 90*DEGTORAD : angle_target+180*DEGTORAD;
			}
			else if(down)
			{
				if(left)
					move_angle = this.movement_relative_to_screen ? 225*DEGTORAD : angle_target-45*DEGTORAD;
				else if(right)
					move_angle = this.movement_relative_to_screen ? 315*DEGTORAD : angle_target+45*DEGTORAD;
				else
					move_angle = this.movement_relative_to_screen ? 270*DEGTORAD : angle_target;
			} 
			else
			{
				if(left)
					move_angle = this.movement_relative_to_screen ? 180*DEGTORAD : angle_target-90*DEGTORAD;
				else if(right)
					move_angle = this.movement_relative_to_screen ? 0*DEGTORAD : angle_target+90*DEGTORAD;
			}
			
			if(fire)
				this.fireWeapons();
			
			//move_angle = angle_current-move_angle*DEGTORAD;
			//console.log(move_angle*RADTODEG);
			x = (up || down || left || right)*this.thrust_acceleration*Math.cos(move_angle)/GSS.FPS;
			y = (up || down || left || right)*this.thrust_acceleration*Math.sin(move_angle)/GSS.FPS;
			
			// Apply thrust any controls
			if(up || down || left || right)
				this.body.ApplyForceToCenter(new b2Vec2(x, y), true);
			
			// Set to max velocity if applied force exceeds max velocity
			if(Math.abs(this.velocity_current.Length()) >= this.velocity_magnitude_max)
			{
				var new_vec = new b2Vec2(0, 0);
				b2Vec2.Normalize(new_vec, this.body.GetLinearVelocity());
				b2Vec2.MulScalar(new_vec, new_vec, this.velocity_magnitude_max);
				this.body.SetLinearVelocity(new_vec);
			}
			
			//console.log(this.velocity_current.Length(), x, y);
			
			deceleration_thrust = new b2Vec2(0,0);
			b2Vec2.Sub(deceleration_thrust, this.body.GetLinearVelocity(), new b2Vec2(x, y));
			x_force = this.body.GetMass()*deceleration_thrust.x;
			y_force = this.body.GetMass()*deceleration_thrust.y;
			x_force = Math.abs(x_force) >= this.thrust_deceleration ? this.thrust_deceleration*(x_force > 0 ? -1 : 1): -x_force;
			y_force = Math.abs(y_force) >= this.thrust_deceleration ? this.thrust_deceleration*(y_force > 0 ? -1 : 1): -y_force;
			this.body.ApplyForceToCenter(new b2Vec2(x_force, y_force), true);
			
			// END: Linear Movement
			
			// BEGIN: Angular Movement (Mouse Tracking)
			// See: http://www.iforce2d.net/b2dtut/rotate-to-angle
			// See: http://www.dummies.com/how-to/content/how-to-calculate-the-torque-needed-to-accelerate-a.html
			if(!this.lock_rotation)
			{			
				if(this.follow_mouse)
				{
					this.body.SetTransform(this.body.GetPosition(), angle_target);
				}
				else
				{
					// Constrain body's current angle to 0 - 360
					if(angle_current > 2*Math.PI)
						this.body.SetTransform(this.body.GetPosition(), angle_current-2*Math.PI);
					
					// Get direction rotation is going to happen
					dir = Math.cos(angle_current)*Math.sin(angle_target)-Math.sin(angle_current)*Math.cos(angle_target) > 0 ? 1 : -1;
					
					// Offset angle target to match direction i.e. if the direction is possitive and the current angle is 360, the destination is 360 plus
					angle_target = dir > 0 && angle_target < angle_current ? angle_target+=2*Math.PI : angle_target;
					
					// Find amount of rotation
					angle_delta = angle_target-angle_current;
					
					// Find shortest angle to rotate to 
					while(angle_delta < -Math.PI) { angle_delta += 360*Math.PI/180; }
					while(angle_delta > Math.PI) { angle_delta -= 360*Math.PI/180; }
					
					// Find acceleration for a step needed to move angle_delta
					angular_acceleration_needed = ((angle_delta-this.angular_velocity_current)/GSS.FPS).clamp(-this.angular_acceleration, this.angular_acceleration);

					torque = this.body.GetInertia()*angular_acceleration_needed;
					this.body.ApplyTorque(torque);
					
					// Cap angular velocity
					this.angular_velocity_current = this.body.GetAngularVelocity();
					if(Math.abs(this.angular_velocity_current) > this.angular_velocity_max)
						this.body.SetAngularVelocity(dir*this.angular_velocity_max);
				}
				this.angle_current = angle_current;
			}
			else
			{
				this.body.SetTransform(this.body.GetPosition(), this.angle_current);
			}
			// END: Angular Movement (Mouse Tracking)
		}
		// No AI controlling this
		else
		{
			deceleration_thrust = new b2Vec2(0,0);
			b2Vec2.Sub(deceleration_thrust, this.body.GetLinearVelocity(), new b2Vec2(x, y));
			x_force = this.body.GetMass()*deceleration_thrust.x;
			y_force = this.body.GetMass()*deceleration_thrust.y;
			x_force = Math.abs(x_force) >= this.thrust_deceleration ? this.thrust_deceleration*(x_force > 0 ? -1 : 1): -x_force;
			y_force = Math.abs(y_force) >= this.thrust_deceleration ? this.thrust_deceleration*(y_force > 0 ? -1 : 1): -y_force;
			this.body.ApplyForceToCenter(new b2Vec2(x_force, y_force), true);
			
			angular_acceleration_needed = (-this.angular_velocity_current/this.angular_acceleration/GSS.FPS).clamp(-this.angular_acceleration, this.angular_acceleration);
			torque = this.body.GetInertia()*angular_acceleration_needed;
					this.body.ApplyTorque(torque);
					
			// Cap angular velocity
			this.angular_velocity_current = this.body.GetAngularVelocity();
			if(Math.abs(this.angular_velocity_current) > this.angular_velocity_max)
				this.body.SetAngularVelocity(this.angular_velocity_current/this.angular_velocity_current*this.angular_velocity_max);
				
		}
		*/
		// Shield regeneration
		if(this.shield < this.shield_max && !this.shield_depleted && Date.now() >= this.shield_regen_next)
		{
			this.shield+=this.shield_regen_amount;
			this.shield = this.shield > this.shield_max ? this.shield_max : this.shield;
			
			this.shield_regen_next = Date.now()+this.shield_regen_rate;
		}
		else if(this.shield_depleted && Date.now() >= this.shield_regen_delay_next)
			this.shield_depleted = false;
		
		this.display_hp_mesh.scale.x = this.hp/this.hp_max;
		this.display_shield_mesh.scale.x = this.shield/this.shield_max;
		
		this.display_hp_mesh.position.x = this.mesh_plane.position.x+this.three_data.width/2 + 2+(25*this.display_hp_mesh.scale.x-25);
		this.display_hp_mesh.position.y = this.mesh_plane.position.y;
		this.display_shield_mesh.position.x = this.mesh_plane.position.x+this.three_data.width/2 + 2+(25*this.display_shield_mesh.scale.x-25);
		this.display_shield_mesh.position.y = this.mesh_plane.position.y-15;
		
		
		
		// Animation
		if(Date.now() >= this.frame_next && !this.body_image_data.animate_on_fire)
		{
			
			this.frame_current  = this.frame_current == this.body_image_data.frames-1 ? 0 : this.frame_current+1;
			this.mesh_plane.material.map.offset.x = this.frame_current/this.body_image_data.frames;
			this.frame_next = Date.now()+this.body_image_data.frame_rate;
		}
		else if(Date.now() >= this.frame_next && this.body_image_data.animate_on_fire && this.firing)
		{
			this.frame_current  = this.frame_current == this.body_image_data.frames-1 ? 0 : this.frame_current+1;
			this.mesh_plane.material.map.offset.x = this.frame_current/this.body_image_data.frames;
			this.frame_next = Date.now()+this.body_image_data.frame_rate;
		}
		else if(this.body_image_data.animate_on_fire && !this.firing)
		{
			this.frame_current = 0;
			this.mesh_plane.material.map.offset.x = 1-(this.three_data.width*(1/(0+1)))/this.three_data.width;
		}

		// Damage effect "recovery"
		if(this.material.color.getHex() != 0xffffff && Date.now() > this.damage_next)
		{
			this.material.color = new THREE.Color("rgb(255, 255, 255)");
			this.damage_effect = false;
		}
		
		this.mesh_plane.scale.x = this.mesh_plane.scale.x > 1 ? this.mesh_plane.scale.x-0.10 : 1;
		this.mesh_plane.scale.y = this.mesh_plane.scale.y > 1 ? this.mesh_plane.scale.y-0.10 : 1;
		
		this.mesh_plane.position.x = this.body.GetPosition().x*GSS.PTM;
		this.mesh_plane.position.y = this.body.GetPosition().y*GSS.PTM; 
		this.mesh_plane.rotation.z = this.body.GetAngle();
	}
}