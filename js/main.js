/*
Todo(s): 
Create UI skeleton
	Title Screen (Sprite a sweet logo!)
		- Build list of content that needs loading
		- Display content
		- Display load progress
		- Show menu on complete
	Menu
		- Create animation 
	Pre-game
		- Pre deploy everything no updates should be running
	Game
		- Non stop running
Top down shooter (arena shooter timeline has been created);
	Enemy waves timeline
*/

/* Load this externally */
/* Data setup 
{
	assets
	data
}
*/
var weapon_data = [
	{
		projectile_data: {	
			image_data: {
				url: 'images/laser_beam.png', 
				frames: 1
			},
			hit_effect_data: {
				image_data: {
					url: 'images/projectile_hit.png', 
					frames: 5,
					frame_rate: 500
				},
				lifetime: 200,
				animate_with_lifetime: true
			},
			damage: 10,
			hit_sound_url: 'sounds/explode.wav',
			velocity_initial: 10,
			acceleration: -1,
			lifetime: 1000
		},
		firerate: 10,
		spread: 3,
		
		fire_sound_url:'sounds/shoot.wav',
		
		id: 0
	}
],
entity_data = [
	{
		image_data: {
			url: 'images/simplefighter.png', 
			frames: 2, 
			frame_rate: 100, 
			animate_on_fire: true
		}, 
		angle: 90, 
		angular_velocity_max: 180, 
		angular_acceleration: 45, 
		acceleration: 15, 
		deceleration: 10, 
		velocity_magnitude_max: 10, 
		weapons:[{x: -21, y: 0, weapon_id: 0}],
		life: 3,
		display_hp: true,
		display_shield: true
	},
	{
		image_data: {
			url: 'images/test_target.png', 
			frames: 5, 
			frame_rate: 500, 
		}, 
		angle: 90, 
		//angular_velocity_max: 20, 
		angular_acceleration: 25, 
		thrust_acceleration: 1, 
		thrust_deceleration: 50, 
		acceleration: 1, 
		deceleration: 1, 
		death_effect_data: {
			image_data: {
				url: 'images/projectile_hit.png', 
				frames: 5,
				frame_rate: 500
			},
			lifetime: 200,
			animate_with_lifetime: true,
			scale: 10
		},
		shield_regen_rate: 250,
		points: 10
	},
	{
		image_data: {
			url: 'images/simplefighter.png', 
			frames: 2, 
			frame_rate: 100, 
			animate_on_fire: true
		}, 
		angle: 90, 
		angular_velocity_max: 30, 
		angular_acceleration: 180, 
		thrust_acceleration: 1, 
		thrust_deceleration: 25, 
		acceleration: 1, 
		deceleration: 1, 
		velocity_magnitude_max: 10, 
		weapons:[{x: -21, y: 0, weapon_id: 0}],
		updateFunction: GSSBaseUpdateFunctions.updateStaticLookAtAggressive,
		hp_max: 10,
		shield_max: 0,
		points: 100
		
	},
],
faction_data = [
	{faction: 'player'},
	{faction: 'enemy'}
],
num_images_loaded = 0,
num_audio_loaded = 0,
images_loaded = false,
audio_loaded = false;

var world,
GSS = {
	keys: {},
	mouse_info: {x: -1, y: -1, left_click: false, right_click: false, middle_click: false},
	basic_assets: {
		title: {
			image_data: {
				url: 'images/title.png',
				frames: 1
			}
		}
	},
	/*
	* Current state game is in:
	* 0 - Loading
	* 1 - Displaying title
	* 2 - Menu
	* 3 - Game
	*/
	state: 0, 
	
	entities_index: 0,
	entities: [],
	entities_to_remove: [],
	projectiles: [],
	projectiles_to_remove: [],
	effects: [],
	effects_to_remove: [],
	weapon_data: [],
	entity_data: [],
	image_data: [],
	audio_data: [],
	faction_data: [],
	player: false,
	player_data: {
		lives: 3,
		points: 0
	},
	flag_follow_player: true,
	flag_init: false,
	
	/* Event vars */
	event_images_loaded: new Event('all_images_loaded'),
	event_audio_loaded: new Event('all_audio_loaded'),
	event_assets_loaded: new Event('all_assets_loaded'),
	
	/* Update vars */
	FPS: 1/60,
	update_timer: null,
	update_paused: false,
	
	/* Web audio API vars */
	audio_context: null, 
	audio_gain: null,
	
	/* Liquidfun vars */
	PTM: null,
	world: null,
	
	/* THREE.js vars*/
	canvas: null,
	scene: null,
	renderer: null,
	clear_color: new THREE.Color(0xdddddd),
	// Camera
	camera: null,
	camera_offset_position: {x: 0, y: 0},
	camera_current_distance: 0,
	camera_angle_previous: 0,
	// For debug HP/Shield Display
	hp_bar_texture: new THREE.MeshBasicMaterial({color: 0x00ff00}),
	shield_bar_texture: new THREE.MeshBasicMaterial({color: 0x0000ff}),
	
	// Functions
	/**
	* Init
	* Initializes GSS; creates THREE.js and liquidfun related objects
	* @param canvas canvas - Canvas to render GSS on
	*/
	init: function(canvas, faction_data, entity_data, weapon_data) {
			var 
			canvas_width = canvas.clientWidth,
			canvas_height = canvas.clientHeight,
			near = 0.1,
			far = 10000,
			assets_to_load = 0;
			
			/* Init Web Audio API */
			// See: http://www.html5rocks.com/en/tutorials/webaudio/intro/
			window.AudioContext = window.AudioContext || window.webkitAudioContext;
			GSS.audio_context = new AudioContext();
			GSS.audio_context.listener.setPosition($(window).width()/2, $(window).height()/2, 300);
			
			// Global volume
			GSS.audio_gain = GSS.audio_context.createGain();
			GSS.audio_gain.gain.value = 0.7;
			GSS.audio_gain.connect(GSS.audio_context.destination);	
			
			/* Init THREE.js */
			GSS.canvas = canvas;
			GSS.renderer = new THREE.WebGLRenderer({canvas: GSS.canvas, antilias: false});
			GSS.camera = new THREE.OrthographicCamera( canvas_width / - 2, canvas_width / 2, canvas_height / 2, canvas_height / - 2, near, far );
			GSS.scene = new THREE.Scene();

			GSS.renderer.setClearColor(GSS.clear_color);
			GSS.renderer.setSize(canvas_width, canvas_height);
			
			GSS.scene.add(GSS.camera);
			GSS.camera.position.z = 300;
	
			GSS.renderer.render(GSS.scene, GSS.camera);
			
			GSS.camera_offset_position = new THREE.Vector3(0, 0, 0);
			
			/* Init Liquidfun */
			GSS.PTM = 12;
			GSS.world = world = new b2World(new b2Vec2(0, 0));
		
			// Collision handling
			GSS.world.SetContactListener({
				BeginContactBody: function(contact) {
					
					var
					a = contact.GetFixtureA(),
					b = contact.GetFixtureB(),
					a_body = a.body,
					b_body = b.body, 
					a_GSSData,
					b_GSSData,
					a_type,
					b_type,
					a_GSSObject,
					b_GSSObject,
					GSSData,
					type;
			
					if(a_body.GSSData !== undefined)
					{
						a_GSSData = a_body.GSSData;
						a_type = a_GSSData.type;
						a_GSSObject = a_GSSData.obj;
					}
			
					if(b_body.GSSData !== undefined)
					{
						b_GSSData = b_body.GSSData;
						b_type = b_GSSData.type;
						b_GSSObject = b_GSSData.obj;
					}
				
					// Do stuff if the projectile hits a GSS_ thing
					if(a_GSSData !== undefined && b_GSSData !== undefined)
					{	
						
						// Projectiles cannot interact with each other
						if((a_type == 'GSSProjectile' || b_type == 'GSSProjectile') &&  (a_type == 'GSSEntity' || b_type == 'GSSEntity'))
						{
							var projectile = a_type == 'GSSProjectile' ? a_GSSObject : b_GSSObject,
							entity = a_type == 'GSSEntity' ? a_GSSObject : b_GSSObject;
							
							if(projectile.mark_for_delete || entity.mark_for_delete)
								return;
								
							projectile.destroy(true);
							entity.damage(projectile.damage);
						}
					}
					// Do stuff if it hits something
					else if(a_GSSData !== undefined || b_GSSData !== undefined)
					{
						GSSData = a_GSSData !== undefined ? a_GSSData : b_GSSData;
						if(GSSData.type == 'GSSProjectile')
						{
							GSSData.obj.destroy(true);
						}
					}
				}
			});
			
			// Events
			window.addEventListener('all_images_loaded', function(){
				images_loaded = true;
				
				var image_data = GSS.image_data[GSS.basic_assets.title.image_data.index],
				material = new THREE.MeshBasicMaterial({map: image_data.texture, transparent:true});
				
				material.side = THREE.DoubleSide;
				material.shading = THREE.FlatShading;
				console.log('images_loaded');
				console.info(image_data);
				GSS.basic_assets.title.mesh = new THREE.Mesh(new THREE.PlaneGeometry(image_data.width, image_data.height), material);
				GSS.basic_assets.title.mesh.material.opacity = 0;
				
				if(images_loaded && audio_loaded)
					window.dispatchEvent(GSS.event_assets_loaded);
			});
			
			window.addEventListener('all_audio_loaded', function(){
				audio_loaded = true;
				console.log('audio_loaded');
				if(images_loaded && audio_loaded)
					window.dispatchEvent(GSS.event_assets_loaded);
			});
			
			// CHange this
			window.addEventListener('all_assets_loaded', function(){
				console.log('All assets loaded: Showing player');
				GSS.setState(1);
				/*
				window.player = GSS.addEntity(0, 0, {is_player: true});
				window.target = GSS.addEntity(1, 2, {x: 0, y: -100});
				*/
			});
			
			// Load assets
			/* Pre-creates Materials per image */
			function loadTexture(texture){
				var image_index = -1;
				for(var id = 0; id < GSS.image_data.length; id++)
				{
					if(texture.image.src.search(GSS.image_data[id].url) != -1)
						image_index = id;
				}
				
				if(image_index == -1)
					return;
				
				// Prevents blurry sprites
				texture.anisotropy = 0;
				texture.minFilter = THREE.NearestFilter;
				texture.magFilter = THREE.NearestFilter;
				texture.repeat.x = (texture.image.width/GSS.image_data[image_index].frames)/texture.image.width;
				console.info(texture.repeat.x, texture.image.width, GSS.image_data[image_index].url, GSS.image_data[image_index].frames);
				GSS.image_data[image_index].texture = texture;
				GSS.image_data[image_index].width = texture.image.width;
				GSS.image_data[image_index].height = texture.image.height;
				
				num_images_loaded++;
	
				if(num_images_loaded == GSS.image_data.length)
					window.dispatchEvent(GSS.event_images_loaded);
			}
			
			function loadAudioURL(url, index){
				var request = new XMLHttpRequest(),
				index = index;
				request.open('GET', url, true);
				request.responseType = 'arraybuffer';
				
				request.onload = function(){
					num_audio_loaded++;
					GSS.audio_context.decodeAudioData(request.response, function(buffer) {
						if(!buffer)
						{
							console.error('failed to load audio file');
							GSS.audio_data[index].buffer = false;
							return;
						}
						GSS.audio_data[index].buffer = buffer;
					}, function(){console.error('failed');});
					if(num_audio_loaded == GSS.audio_data.length)
						window.dispatchEvent(GSS.event_audio_loaded);
				}
				
				request.send();
			}

			// Load basic assets
			// Load title
			GSS.image_data.push({url: GSS.basic_assets.title.image_data.url, index: GSS.image_data.length, frames: GSS.basic_assets.title.image_data.frames});
			GSS.basic_assets.title.image_data.index = GSS.image_data.length-1;
			
			// Process factions (for collision filters) up to 16?
			for(var i = 0; i < faction_data.length; i++)
			{
				var faction = faction_data[i],
				hex_value="0x",
				category = (i+1).toString(16);
				for(var h = 0; h < 4-category.length; h++)
				{
					hex_value+='0';
				}
				hex_value+=category;
		
				faction.category = parseInt(hex_value, 16);
			}
			GSS.faction_data = faction_data;
			
			// Find entity images to load
			for(var e = 0; e < entity_data.length; e++)
			{
				var 
				current_entity_data = entity_data[e],
				body_image_data = current_entity_data.image_data,
				death_effect_data = current_entity_data.death_effect_data,
				death_effect_image_data,
				entity_image_existing_index = -1,
				death_effect_image_existing_index = -1;
				console.log(body_image_data);

				// Find duplicate images
				for(var a = 0; a < GSS.image_data.length; a++)
				{
					if(GSS.image_data[a].url == body_image_data.url)
					{
						entity_image_existing_index = a;
						break;
					}
				}
				
				if(entity_image_existing_index == -1)
				{
					GSS.image_data.push({url: body_image_data.url, index: GSS.image_data.length, frames: body_image_data.frames});
					entity_image_existing_index = GSS.image_data.length-1;
				}
				
				if(death_effect_data !== undefined)
				{
					death_effect_image_data = death_effect_data.image_data;
					for(var d = 0; d < GSS.image_data.length; d++)
					{
						if(GSS.image_data[d].url == death_effect_image_data.url)
						{
							death_effect_image_existing_index = d;
							break;
						}
					}
					
					if(death_effect_image_data !== undefined && death_effect_image_existing_index == -1)
					{
						GSS.image_data.push({url: death_effect_image_data.url, index: GSS.image_data.length, frames: death_effect_image_data.frames});
						death_effect_image_existing_index = GSS.image_data.length-1;
					}
					
					death_effect_image_data.image_index = death_effect_image_existing_index;
				}
				
				body_image_data.image_index = entity_image_existing_index;
				
				GSS.entity_data.push(current_entity_data);
			}
			
			// Build list of images to load (avoid duplicates)
			// Find weapon images to load
			// Find audio to load
			for(var w = 0; w < weapon_data.length; w++)
			{
				var current_weapon_data = weapon_data[w],
				weapon_fire_sound_url = current_weapon_data.fire_sound_url,
				projectile_data = current_weapon_data.projectile_data,
				projectile_hit_data = projectile_data.hit_effect_data,
				projectile_image_url = projectile_data.image_data.url,
				projectile_hit_image_url = projectile_hit_data.image_data.url,
				projectile_hit_sound_url = projectile_data.hit_sound_url,
				i = 0,
				weapon_fire_sound_index = -1,
				projectile_image_index = -1,
				projectile_hit_image_index = -1,
				projectile_hit_sound_index = -1; 
				
				// Find duplicate images
				for(i = 0; i < GSS.image_data.length; i++)
				{
					var image_data = GSS.image_data[i];
					if(projectile_image_url == image_data.url)
						projectile_image_index = i;
					if(projectile_hit_image_url == image_data.url)
						projectile_hit_image_index = i
						
					if(projectile_image_url != -1 && projectile_hit_image_index != -1)
						break;
				}
				
				// Find duplicate audio
				for(i = 0; i < GSS.audio_data.length; i++)
				{
					var audio_data = GSS.audio_data[i];
					if(weapon_fire_sound_url == audio_data.url)
						weapon_fire_sound_index = i;
					if(projectile_hit_sound_url == audio_data.url)
						projectile_hit_sound_index = i;
						
					if(weapon_fire_sound_url != -1 && projectile_hit_sound_index != -1)
						break;
				}
				
				if(projectile_image_index == -1)
				{
					GSS.image_data.push({url: projectile_image_url, index: GSS.image_data.length, frames: projectile_data.image_data.frames});
					projectile_image_index = GSS.image_data.length-1;
				}
				
				if(projectile_hit_image_index == -1)
				{
					GSS.image_data.push({url: projectile_hit_image_url, index: GSS.image_data.length, frames: projectile_data.hit_effect_data.image_data.frames});
					projectile_hit_image_index = GSS.image_data.length-1;
				}
				
				if(weapon_fire_sound_index == -1)
				{
					GSS.audio_data.push({url: weapon_fire_sound_url, index: GSS.audio_data.length})
					weapon_fire_sound_index = GSS.audio_data.length-1;
				}
				
				if(projectile_hit_sound_index == -1)
				{
					GSS.audio_data.push({url: projectile_hit_sound_url, index: GSS.audio_data.length})
					projectile_hit_sound_index = GSS.audio_data.length-1;
				}
				
				current_weapon_data.fire_sound_index = weapon_fire_sound_index;
			 	projectile_data.image_data.image_index = projectile_image_index;
			 	projectile_data.hit_effect_data.image_data.image_index = projectile_hit_image_index;
			 	projectile_data.hit_sound_index = projectile_hit_sound_index;
			 	
			 	GSS.weapon_data.push(current_weapon_data);
			 	console.log('audio to load', GSS.audio_data);
			}
			
			assets_to_load = GSS.image_data.length + GSS.audio_data.length;
			
			// Load images if empty (this should rarely happen)
			if(GSS.image_data.length === 0)
				window.dispatchEvent(event_images_loaded);
			
			for(var i = 0; i < GSS.image_data.length; i++)
			{
				var texture_loader = new THREE.TextureLoader(),
				material,
				image_data = GSS.image_data[i];
				texture_loader.load(image_data.url, loadTexture);
			}
		
			//window.dispatchEvent(GSS.event_audio_loaded);
			// Load audio if empty
			if(GSS.audio_data.length === 0)
				window.dispatchEvent(GSS.event_audio_loaded);
				
			var audio_urls = [];
			for(var i = 0; i < GSS.audio_data.length; i++)
			{
				audio_urls.push(GSS.audio_data[i].url);	
			}
			
			for(var i = 0; i < audio_urls.length; i++)
			{
				loadAudioURL(audio_urls[i], i);
			}
			
			flag_init = true;
	},
	setState: function(state) {
		
		switch(state) 
		{
			case 0:
				// Maybe debug?
				break;
			case 1:
				{
				console.log('asdf');
				GSS.basic_assets.title.mesh.position.y-=100;
				GSS.scene.add(GSS.basic_assets.title.mesh);
				console.log(GSS.basic_assets.title.mesh);
				}
				break;
			case 2:
				break;
				
			case 3:
				console.log('asdf3');
				window.player = GSS.addEntity(0, 0, {is_player: true});
				window.target = GSS.addEntity(1, 2, {x: 0, y: -100});
				break;
			
			
			default:
				return;
		}
		GSS.state = state;
	},
	/**
	* update
	* Updates the current state of the GSS game world, handles camera tracking of player and cleans up 'dead' entities and projectiles	
	*/
	update: function() {
		if(GSS.world === undefined || GSS.update_paused)
			return;
		
		
		var offset_mouse_x = GSS.mouse_info.x-GSS.canvas.clientWidth/2,
		offset_mouse_y = -(GSS.mouse_info.y-GSS.canvas.clientHeight/2),
		angle = Math.atan2(offset_mouse_y, offset_mouse_x), 
		max_distance = GSS.canvas.width < GSS.canvas.height ? GSS.canvas.width/4 : GSS.canvas.height/4,
		distance = ( Math.sqrt(Math.pow(-offset_mouse_x, 2)+Math.pow(-offset_mouse_y, 2))).clamp(0, max_distance),
		x = distance*Math.cos(angle),
		y = distance*Math.sin(angle);
		
		if(GSS.state == 1)
		{
			GSS.basic_assets.title.mesh.position.lerp(new THREE.Vector3(0, 0, 0), 0.01);
			GSS.basic_assets.title.mesh.material.opacity = Math.lerp(GSS.basic_assets.title.mesh.material.opacity, 1, 0.01);
			if(Math.round(GSS.basic_assets.title.mesh.position.y) === 0)
				GSS.setState(3);
		}
		else if(GSS.state == 3)
		{
			GSS.old_time = (new Date()).getMilliseconds();
			GSS.world.Step(GSS.FPS, 6, 2);
			
			for(var e = 0; e < GSS.entities.length; e++)
				GSS.entities[e].update();
			
			for(var p = 0; p < GSS.projectiles.length; p++)
				GSS.projectiles[p].update();
			
			for(var ef = 0; ef < GSS.effects.length; ef++)
				GSS.effects[ef].update();
			
			if(GSS.flag_follow_player && (GSS.player !== undefined && GSS.player && !GSS.player.mark_for_delete))
			{	
				// This does not account for angle at all...
				//var lerp = Math.lerp(GSS.camera_current_distance, distance, 0.05),
				
				//ang_lerp = Math.lerp(GSS.camera_angle_previous, GSS.camera_angle_previous+Math.nearestAngle(GSS.camera_angle_previous, angle), 0.01);
				
				GSS.camera_offset_position.lerp(new THREE.Vector3(x, y, 0), 0.01);
				GSS.camera.position.x = GSS.camera_offset_position.x + GSS.player.mesh_plane.position.x;
				GSS.camera.position.y = GSS.camera_offset_position.y + GSS.player.mesh_plane.position.y;
			}
			
			// Clean up
			while(GSS.entities_to_remove.length !== 0)
			{
				var entity = GSS.entities_to_remove.pop(),
				index = GSS.getEntityWithID(entity.id);
				GSS.entities.splice(index, 1);
			}
			
			while(GSS.projectiles_to_remove.length !== 0)
			{
				var projectile = GSS.projectiles_to_remove.pop(),
				index = GSS.getProjectileWithID(projectile.id);
				GSS.projectiles.splice(index, 1);
			}
			
			while(GSS.effects_to_remove.length !== 0)
			{
				var effect = GSS.effects_to_remove.pop(),
				index = GSS.getEffectWithID(effect.id);
				GSS.effects.splice(index, 1);
			}
		}
	},
	/**
	* start
	* Starts the main game loop and rendering
	*/
	start: function(){
		GSS.update_timer = setInterval(GSS.update, GSS.FPS);
		
		function renderScene(){
			GSS.renderer.render(GSS.scene, GSS.camera);
			
			if(GSS.update_timer !== undefined)
				window.requestAnimationFrame(renderScene);
		}
		window.requestAnimationFrame(renderScene);
	},
	/**
	* stop
	* Stops the main game loop and rendering
	*/
	stop: function(){
		clearInterval(GSS.update_timer);
		GSS.update_timer = null;
	},
	addEntity: function(faction_id, entity_data_index, options)
	{
		var 
		defaults = {
			x: 0,
			y: 0,
			is_player: false
		},
		data = clone(GSS.entity_data[entity_data_index]),
		new_entity;
		
		options = extend(defaults, options);
		
		if(faction_id === undefined || entity_data_index === undefined || (options.is_player && GSS.player))
			return;
		
		if(options.is_player && !GSS.player)
			data.is_player = true;
		
		data.x = options.x;
		data.y = options.y;
		data.faction_id = faction_id;
	
		new_entity = new GSSEntity(GSS.entities_index++, data);
		console.log(options, GSS.player);
		if(options.is_player && !GSS.player)
			GSS.player = new_entity;
	
		GSS.entities.push(new_entity);
		
		return new_entity;
	},
	addEffect: function(data, x, y)
	{
		data = clone(data);
		data.x = x;
		data.y = y;
		GSS.effects.push(new GSSEffect(data));
	},
	/* TODO: Combine these three functions to one */
	getEntityWithID: function(id, start, end){
		var halfway, candidate;

		if(end-start <= 0 || id === undefined)
		{
			if(GSS.entities[start].id == id)
				return start;
			else
				return -1;
		}
		start = start === undefined ? 0 : start;
		end = end === undefined ? GSS.projectiles.length-1 : end;
		halfway = start+Math.floor((end-start)/2);
		candidate = GSS.entities[halfway];
	
		if(candidate === undefined || candidate.id === undefined)
			return -1;
	
		if(candidate.id == id)
			return halfway; 
		else
		{
			if(id > candidate.id)
				return GSS.getEntityWithID(id, halfway+1, end);
			else
				return GSS.getEntityWithID(id, start, halfway);
		}
	},
	/**
	* Will assume the projectile array is sorted
	*/
	getProjectileWithID: function(id, start, end) {
		var halfway, candidate;

		if(end-start <= 0 || id === undefined)
		{
			if(GSS.projectiles[start].id == id)
				return start;
			else
				return -1;
		}
		start = start === undefined ? 0 : start;
		end = end === undefined ? GSS.projectiles.length-1 : end;
		halfway = start+Math.floor((end-start)/2);
		candidate = GSS.projectiles[halfway];
	
		if(candidate === undefined || candidate.id === undefined)
			return -1;
	
		if(candidate.id == id)
			return halfway; 
		else
		{
			if(id > candidate.id)
				return GSS.getProjectileWithID(id, halfway+1, end);
			else
				return GSS.getProjectileWithID(id, start, halfway);
		} 
	},
	getEffectWithID: function(id, start, end) {
		var halfway, candidate;

		if(end-start <= 0 || id === undefined)
		{
			if(GSS.effects[start].id == id)
				return start;
			else
				return -1;
		}
		start = start === undefined ? 0 : start;
		end = end === undefined ? GSS.effects.length-1 : end;
		halfway = start+Math.floor((end-start)/2);
		candidate = GSS.effects[halfway];
	
		if(candidate === undefined || candidate.id === undefined)
			return -1;
	
		if(candidate.id == id)
			return halfway; 
		else
		{
			if(id > candidate.id)
				return GSS.getEffectWithID(id, halfway+1, end);
			else
				return GSS.getEffectWithID(id, start, halfway);
		} 
	},
	cameraFollowPlayer: function(follow_player) {
		if(follow_player === undefined)
			GSS.follow_player = !GSS.follow_player;
	
		GSS.follow_player = follow_player;
	},
	playSound: function(index, x, y){
		if(GSS.audio_data.length === 0)
			return;
		
		var source;
		if(GSS.audio_data[index] !== undefined && GSS.audio_data[index].buffer !== false)
		{
			var panner = GSS.audio_context.createPanner();
			
			//panner.connect(GSS.audio_context.destination);
			panner.panningModel = 'HRTF';
			panner.distanceModel = 'inverse';
			panner.coneOuterGain = 1;
			panner.coneOuterAngle = 360;
			panner.coneInnerAngle = 0;
			panner.refDistance = 50;
			panner.maxDistance = 10000;
			panner.rolloffFactor = 0.5;
			panner.setOrientation(1, 0, 0);
			panner.connect(GSS.audio_gain);
			panner.setPosition(x*GSS.PTM-GSS.camera.position.x+GSS.canvas.width/2, y*GSS.PTM-GSS.camera.position.y+GSS.canvas.height/2, 0);

			source = GSS.audio_context.createBufferSource();
			source.buffer = GSS.audio_data[index].buffer;
			source.connect(panner);
			source.start(0);	
		}
	},
	queryAABB: function(top, left, right, bottom)
	{
		var AABB = new b2AABB(),
		results = [];
		
		AABB.lowerBound = new b2Vec2(top, left);
		AABB.upperBound = new b2Vec2(right, bottom);
		GSS.world.QueryAABB({
			ReportFixture: function(asdf)
			{
				results.push(asdf);
				return true;
			}
		}, AABB);	
		return results;
	},
	queryRayCast: function(point_from, options)
	{
		var result = [],
		sorted_results = [],
		point_to = false,
		x_offset,
		y_offset,
		defaults = {
			point_to: false,
			angle: false,
			distance: false,
			stop_on_hit: true,
			ignore_entities: [],
			ignores_projectiles: false,
		};
		
		options = extend(defaults, options);
		
		if(!options.point_to && !options.requester && !options.angle && !options.distance)
		{
			return [];
		}

		if(options.point_to != false)
			point_to = options.point_to;
		else if(options.angle != false && options.distance != false)
		{
			x_offset = -options.distance*Math.cos(options.angle);
			y_offset = -options.distance*Math.sin(options.angle);
			point_to = new b2Vec2(point_from.x+x_offset, point_to+y_offset);
		}
		
		
		GSS.world.RayCast(
		{	
			ReportFixture: function(fixture, point, normal, fraction){
				var GSSData = fixture.body.GSSData;
				if(GSSData !== undefined)
				{
					if(GSSData.obj instanceof GSSEntity)
					{
						for(var e = 0; e < options.ignore_entities.length; e++)
						{
							if(options.ignore_entities[e] == GSSData.obj)
								return -1;
						}
					}
					else if (GSSData.obj instanceof GSSProjectile)
					{
						if(options.ignores_projectiles)
							return -1;
					}
				}

				result.push({fixture: fixture, point: point});	
					
				return options.stop_on_hit ? fraction : 1;
				
			}
		}, point_from, point_to);
		
		result = result.sort(function(a, b){
			var point_a = a.point,
			point_b = b.point,
			distance_a = Math.sqrt(Math.pow(point_from.x-point_a.x, 2)+Math.pow(point_from.y-point_a.y, 2)),
			distance_b = Math.sqrt(Math.pow(point_from.x-point_b.x, 2)+Math.pow(point_from.y-point_b.y, 2));
			
			if(distance_a > distance_b)
				return 1;
			else if(distance_a < distance_b)
				return -1;
				
			return 0;
		});
		
		for(var r = 0; r < result.length; r++)
		{
			sorted_results.push(result[r].fixture);
		}
		return sorted_results;
	}
};

jQuery(function($){
	var $canvas = $('#canvas');
	
	GSS.init($canvas[0], faction_data, entity_data, weapon_data);

	// Temp LiquidFun 
	/*
	var 
	ground_def = new b2BodyDef(),
	ground_body,
	ground_poly;
	
	ground_def.position.Set(0, 5);
	ground_body = GSS.world.CreateBody(ground_def);
	ground_poly = new b2PolygonShape();
	ground_poly.SetAsBoxXY(500/GSS.PTM, 20/GSS.PTM);
	ground_body.CreateFixtureFromShape(ground_poly, 0);
	var ground_mesh = new THREE.Mesh(new THREE.PlaneGeometry(1000, 40), new THREE.MeshBasicMaterial({color: 0x8B8E89}));
	ground_mesh.position.x = ground_body.GetPosition().x*GSS.PTM;
	ground_mesh.position.y = ground_body.GetPosition().y*GSS.PTM;
	GSS.scene.add(ground_mesh);
	*/
	
	$(window).on('resize', function(){
		canvas_width = $canvas.width();
		canvas_height = $canvas.height();
		GSS.renderer.setSize(canvas_width, canvas_height);
	}).trigger('resize');
	
	$(window)
	.on('keydown', function(e){
		GSS.keys[e.which] = true;
	}).on('keyup', function(e){
		GSS.keys[e.which] = false;
	});
	
	$canvas.on('mousemove', function(e){
		GSS.mouse_info.x = e.clientX-$canvas.offset().left;
		GSS.mouse_info.y = e.clientY-$canvas.offset().top;
	})
	.on('mousedown', function(e){
		e.preventDefault();
		switch(e.which)
		{
			case 1:
				GSS.mouse_info.left_click = true;
				break;
			case 2:
				GSS.mouse_info.middle_click = true;
				break;
			case 3:
				GSS.mouse_info.right_click = true;
				break;
		}
		return false;
	})
	.on('mouseup', function(e){
		switch(e.which)
		{
			case 1:
				GSS.mouse_info.left_click = false;
				break;
			case 2:
				GSS.mouse_info.middle_click = false;
				break;
			case 3:
				GSS.mouse_info.right_click = false;
				break;
		}
	});
	

	GSS.start();
});