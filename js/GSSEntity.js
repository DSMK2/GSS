GSSEntity.defaults = {
	x: 0,
	y: 0,
	angle: 0,
	is_player: false,
	faction_id: -1,
	hp: 100, 
	shield: 100,
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
	angular_acceleration: 180,
	angular_velocity_max: 360,
	lock_rotation: false,
	follow_mouse: false,  // No acceleration 1:1 mouse tracking
	image_index: 0,
	image_frames: 1,
	image_frame_rate: 0,
	animate_on_fire: false,
	body_image_data: false,
	image_data: false
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
	this.hp = options.hp;
	
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

	this.power_max = options.power_max;
	this.power_current = this.power_max;
	this.power_regen = options.power_regen;
	this.movement_relative_to_screen = options.movement_relative_to_screen;
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
	// END: THREE.js
	
	// BEGIN: liquidfun
	var entity_body_def = new b2BodyDef();
	entity_body_def.type = b2_dynamicBody;
	entity_body_def.angle = options.angle*DEGTORAD;
	entity_body_def.position = new b2Vec2(options.x/GSS.PTM, options.y/GSS.PTM);
	entity_body_def.fixedRotation = this.lock_rotation;
	
	
	// Todo: Create Polygons for each fixture
	var entity_body_fixture = new b2FixtureDef();	
	entity_body_fixture.density = 1;
	entity_body_fixture.friction = 1;
	entity_body_fixture.restitution = 0;
	entity_body_fixture.filter.groupIndex = -GSS.faction_data[options.faction_id].category; // Same faction does not collide with each other
	entity_body_fixture.shape = new b2PolygonShape();
	entity_body_fixture.shape.SetAsBoxXY(this.three_data.width/this.body_image_data.frames/2/GSS.PTM, this.three_data.height/2/GSS.PTM);
	
	this.entity_body = GSS.world.CreateBody(entity_body_def);
	this.entity_body.CreateFixtureFromDef(entity_body_fixture);
	this.entity_body.GSSData = {type: 'GSSEntity', obj: this};
	console.log('this', -GSS.faction_data[options.faction_id].category);
	// END: liquidfun
	
	this.id = GSSEntity.id++;
	return this;
}

GSSEntity.prototype = {
	getBody: function(){
		return this.entity_body;
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
		this.entity_body.SetTransform(this.entity_body.GetPosition(), this.angle_current);
	},
	getAngleToPosition: function(x, y)
	{
		var angle = -1,
		position = this.entity_body.GetPosition(),
		x = position.x - x,
		y = position.y - y,
		angle = Math.atan2(y, x);
		
		angle = angle < 0 ? angle+(2*Math.PI) : angle;
		
		return angle;
	},
	damage: function(damage){
		if(this.damage_effect)
			return;
		
		this.hp-=damage;
		
		this.damage_effect = true;
		this.damage_next = this.damage_delay+Date.now();
		this.material.color = new THREE.Color("hsl(0, 100%, 80%)");
		this.mesh_plane.scale.x = this.damage_scale;
		this.mesh_plane.scale.y = this.damage_scale;
		
	},
	destroy: function(){
		if(this.mark_for_delete)
			return;
			
		this.mark_for_delete = true;
		GSS.scene.remove(this.mesh_plane);
		GSS.world.DestroyBody(this.entity_body);
		GSS.entities_to_remove.push(this);
	},
	update: function(){
		
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
		angle_current = this.entity_body.GetAngle(),
		angle_target = this.getAngleToPosition(offset_mouse_x, offset_mouse_y),
		move_target = Math.atan2(move_mouse_y, move_mouse_x),
		angle_delta,
		dir,
		angular_acceleration_needed,
		torque,
		deceleration_thrust = false;
		
		this.angular_velocity_current = this.entity_body.GetAngularVelocity();
		this.velocity_current = this.entity_body.GetLinearVelocity();
		
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
				this.entity_body.ApplyForceToCenter(new b2Vec2(x, y), true);
			
			// Set to max velocity if applied force exceeds max velocity
			if(Math.abs(this.velocity_current.Length()) >= this.velocity_magnitude_max)
			{
				var new_vec = new b2Vec2(0, 0);
				b2Vec2.Normalize(new_vec, this.entity_body.GetLinearVelocity());
				b2Vec2.MulScalar(new_vec, new_vec, this.velocity_magnitude_max);
				this.entity_body.SetLinearVelocity(new_vec);
			}
			
			//console.log(this.velocity_current.Length(), x, y);
			
			deceleration_thrust = new b2Vec2(0,0);
			b2Vec2.Sub(deceleration_thrust, this.entity_body.GetLinearVelocity(), new b2Vec2(x, y));
			x_force = this.entity_body.GetMass()*deceleration_thrust.x;
			y_force = this.entity_body.GetMass()*deceleration_thrust.y;
			x_force = Math.abs(x_force) >= this.thrust_deceleration ? this.thrust_deceleration*(x_force > 0 ? -1 : 1): -x_force;
			y_force = Math.abs(y_force) >= this.thrust_deceleration ? this.thrust_deceleration*(y_force > 0 ? -1 : 1): -y_force;
			this.entity_body.ApplyForceToCenter(new b2Vec2(x_force, y_force), true);
			
			// END: Linear Movement
			
			// BEGIN: Angular Movement (Mouse Tracking)
			// See: http://www.iforce2d.net/b2dtut/rotate-to-angle
			// See: http://www.dummies.com/how-to/content/how-to-calculate-the-torque-needed-to-accelerate-a.html
			if(!this.lock_rotation)
			{			
				if(this.follow_mouse)
				{
					this.entity_body.SetTransform(this.entity_body.GetPosition(), angle_target);
				}
				else
				{
					// Constrain body's current angle to 0 - 360
					if(angle_current > 2*Math.PI)
						this.entity_body.SetTransform(this.entity_body.GetPosition(), angle_current-2*Math.PI);
					
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

					torque = this.entity_body.GetInertia()*angular_acceleration_needed;
					this.entity_body.ApplyTorque(torque);
					
					// Cap angular velocity
					this.angular_velocity_current = this.entity_body.GetAngularVelocity();
					if(Math.abs(this.angular_velocity_current) > this.angular_velocity_max)
						this.entity_body.SetAngularVelocity(dir*this.angular_velocity_max);
				}
				this.angle_current = angle_current;
			}
			else
			{
				//console.log('hit');
				this.entity_body.SetTransform(this.entity_body.GetPosition(), this.angle_current);
			}
			// END: Angular Movement (Mouse Tracking)
		}
		else
		{
			deceleration_thrust = new b2Vec2(0,0);
			b2Vec2.Sub(deceleration_thrust, this.entity_body.GetLinearVelocity(), new b2Vec2(x, y));
			x_force = this.entity_body.GetMass()*deceleration_thrust.x;
			y_force = this.entity_body.GetMass()*deceleration_thrust.y;
			x_force = Math.abs(x_force) >= this.thrust_deceleration ? this.thrust_deceleration*(x_force > 0 ? -1 : 1): -x_force;
			y_force = Math.abs(y_force) >= this.thrust_deceleration ? this.thrust_deceleration*(y_force > 0 ? -1 : 1): -y_force;
			this.entity_body.ApplyForceToCenter(new b2Vec2(x_force, y_force), true);
			
			/*
			// Find acceleration for a step needed to move angle_delta
			angular_acceleration_needed = ((angle_delta-this.angular_velocity_current)/GSS.FPS).clamp(-this.angular_acceleration, this.angular_acceleration);

			torque = this.entity_body.GetInertia()*angular_acceleration_needed;
			this.entity_body.ApplyTorque(torque);
			*/
		}
		
		if(Date.now() >= this.frame_next && !this.body_image_data.animate_on_fire)
		{
			
			this.frame_current  = this.frame_current == this.body_image_data.frames-1 ? 0 : this.frame_current+1;
			this.mesh_plane.material.map.offset.x = this.frame_current/this.body_image_data.frames;
			this.frame_next = Date.now()+this.body_image_data.frame_rate;
		}
		else if(Date.now() >= this.frame_next && this.body_image_data.animate_on_fire && fire)
		{
			this.frame_current  = this.frame_current == this.body_image_data.frames-1 ? 0 : this.frame_current+1;
			this.mesh_plane.material.map.offset.x = this.frame_current/this.body_image_data.frames;
			this.frame_next = Date.now()+this.body_image_data.frame_rate;
		}
		else if(this.body_image_data.animate_on_fire && !fire)
		{
			this.frame_current = 0;
			this.mesh_plane.material.map.offset.x = 1-(this.three_data.width*(1/(0+1)))/this.three_data.width;
		}
		
		if(this.material.color.getHex() != 0xffffff && Date.now() > this.damage_next)
		{
			this.material.color = new THREE.Color("rgb(255, 255, 255)");
			this.damage_effect = false;
		}
		
		this.mesh_plane.scale.x = this.mesh_plane.scale.x > 1 ? this.mesh_plane.scale.x-0.10 : 1;
		this.mesh_plane.scale.y = this.mesh_plane.scale.y > 1 ? this.mesh_plane.scale.y-0.10 : 1;
		
		this.mesh_plane.position.x = this.entity_body.GetPosition().x*GSS.PTM;
		this.mesh_plane.position.y = this.entity_body.GetPosition().y*GSS.PTM; 
		this.mesh_plane.rotation.z = this.entity_body.GetAngle();
	}
}