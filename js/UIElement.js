UIElement.init = function(renderer, scene, camera, debug)
{
	UIElement.renderer = renderer;
	UIElement.scene = scene;
	UIElement.camera = camera;
	
	UIElement.mouse_info = {x: -1, y: -1, left_click: false, right_click: false, middle_click: false};
	UIElement.mouse_position = new THREE.Vector2();
	UIElement.raycaster = new THREE.Raycaster();
	UIElement.debug = debug === undefined ? false : debug;
	UIElement.elements = [];
	UIElement.init_flag = true;
	/**
	* Get UIElement mouse over
	*/
	UIElement.update = function(){
		if(UIElement.renderer === undefined && UIElement.scene === undefined && UIElement.camera === undefined)
			return;
		
		// Because calling 'this' repeatedly is getting old
		var raycaster = UIElement.raycaster,
		mouse_position = UIElement.mouse_position,
		renderer = UIElement.renderer,
		camera = UIElement.camera,
		scene = UIElement.scene,
		intersects,
		closest,
		elements = UIElement.elements,
		element,
		elements_counter = 0;
		
		// Update mouse position
		mouse_position.x = (UIElement.mouse_info.x/renderer.domElement.width)*2-1;
		mouse_position.y = -(UIElement.mouse_info.y/renderer.domElement.height)*2+1;

		raycaster.setFromCamera(mouse_position, camera); 
		intersects = raycaster.intersectObjects (scene.children);
		
		closest = intersects[0];
		if(intersects.length !== 0 && closest.object.UIElement !== undefined)
		{
			element = closest.object.UIElement;
			if(element.state < 3)
			{
				if(UIElement.mouse_info.left_click)
					element.state = 2;
				else
					element.state = 1;
			}
		}
		
		for(elements_counter = 0; elements_counter < elements.length; elements_counter++)
		{
			element = elements[elements_counter];
			element.update();
		}
	};
}



/**
* Uses Three.js to draw elements.
*/
function UIElement(options) {
	var defaults = {
		map: false,					// Texture to use for button
		horizontal_frames: 1,		// Animated buttons
		vertical_frames: 1,			// Button states
		frame_delay: 100,			// Time between each frame
		/*
			0 - Neutral
			1 - Hover
			2 - Active
			3 - Disabled
		*/
		state: 0,					// Element's current state
		callback: function(){}, 	// Function to be called when element changes state
		debug: false,				// Show debug messages for this object
		scale: 1				
	},
	material,
	image;
	/* BEGIN: Static members */
	
	if(UIElement.init_flag !== undefined)
	{
		options = extend(defaults, options);
		
		if(UIElement.scene === undefined || UIElement.camera === undefined)
		{
			console.log('asdf');
			if(options.debug) console.error('UIElement: Missing scene or camera', UIElement.scene, UIElement.camera);
			return;
		}
		
		this.horizontal_frames = options.horizontal_frames;
		this.frame_current = 0;
		this.vertical_frames = options.vertical_frames;
		
		this.frame_delay = options.frame_delay;
		this.frame_next = Date.now()+this.frame_delay;
		
		this.map = options.map.clone();
		this.map.needsUpdate = true;
		this.map.repeat.x = (this.map.image.width/this.horizontal_frames)/this.map.image.width;
		this.map.repeat.y = (this.map.image.height/this.vertical_frames)/this.map.image.height;
		
		this.state = options.state;
		this.debug = options.debug;
		
		/* BEGIN: THREE.js */
		material = new THREE.MeshBasicMaterial({map: this.map, transparent: true});
		material.side = THREE.DoubleSide;
		material.shading = THREE.FlatShading;
		
		image = this.map.image;
		
		this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(image.width/this.horizontal_frames, image.height/this.vertical_frames), material);
		this.mesh.UIElement = this;
		this.mesh.scale.x = options.scale;
		this.mesh.scale.y = options.scale;
		/* END: THREE.js */
		UIElement.elements.push(this);
		return this;
	}
	else
		if(UIElement.debug) console.error('ERROR: Must call UIElement.init(renderer, scene, camera) before attempting to construct UIElement');
}

UIElement.prototype = {
	setScale: function(new_scale){
		this.mesh.scale.x = new_scale;
		this.mesh.scale.y = new_scale;
	},
	setState: function(new_state)
	{
		this.state = new_state;
	},
	update: function(){
		if(this.state === 4)
			return;
		
		var time_now = Date.now();
		
		if(this.horizontal_frames > 1 && time_now >= this.frame_next)
		{
			this.frame_next = time_now + this.frame_delay;
			this.frame_current++;
			this.mesh.material.map.offset.x = this.frame_current/this.horizontal_frames;
		}
		
		this.mesh.material.map.offset.y = 1-(this.state/this.vertical_frames)-(1/this.vertical_frames);
		this.state = 0;
	}
}

// Todo: Create timeline for UIElement animation