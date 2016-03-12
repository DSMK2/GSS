var UIElement = {
	mouse_info: {x: -1, y: -1, left_click: false, right_click: false, middle_click: false},
	mouse_position: new THREE.Vector2(),
	raycaster: new THREE.Raycaster(),
	scene: null,
	camera: null,
	debug: false,
	/**
	* Get UIElement mouse over
	*/
	update: function(){
		if(UIElement.scene === undefined && UIElement.camera === undefined)
			return;
		
		// Because calling 'this' repeatedly is getting old
		var raycaster = UIElement.raycaster,
		mouse_position = UIElement.mouse_position,
		camera = UIElement.camera,
		intersects,
		closest,
		elements = UIElement.elements,
		element,
		elements_counter = 0;
		
		raycaster.setFromCamera(mouse_position, camera); 
		intersects = raycaster.insersectsObjects(scene.children);
		
		closest = intersects[0];
		
		if(intersects.length !== 0 && closest.UIElement !== undefined)
		{
			if(closest.UIElement.state < 3)
			{
				if(mouse_info.left_click)
					closest.UIElement.state = 2;
				else
					closest.UIElement.state = 1;
			}
		}
		
		for(elements_counter = 0; elements_counter < elements.length; elements_counter++)
		{
			element = elements[elements_counters];
			elements.update();
		}
	},
	elements: []
};

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
	
	options = extend(defaults, options);
	
	if(UIElement.scene === undefined || UIElement.camera === undefined)
	{
		if(options.debug) console.error('UIElement: Missing scene or camera', UIElement.scene, UIElement.camera);
		return;
	}
	
	this.map = options.map.clone();
	this.map.needsUpdate = true;
	
	this.horizontal_frames = options.horizontal_frames;
	this.frame_current = 0;
	this.vertical_frames = options.vertical_frames;
	
	this.frame_delay = options.frame_delay;
	this.frame_next = Date.now()+this.frame_delay;
	
	this.state = option.state;
	this.debug = options.debug;
	
	/* BEGIN: THREE.js */
	material = new THREE.MeshPhongMaterial({map: this.map, transparent: true});
	material.side = THREE.DoubleSide;
	material.shading = THREE.FlatShading;
	
	image = map.image;
	
	this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(image.width/this.horizontal_frames, image.height/this.vertical_frames), material);
	this.mesh.UIElement = this;
	this.mesh.scale.x = options.scale;
	this.mesh.scale.y = options.scale;
	UIElement.scene.add(this.mesh);
	/* END: THREE.js */
	
	UIElement.push(this);
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
		if(this.state === 3)
			return;
		
		var time_now = Date.now();
		
		if(time_now >= this.frame_next)
		{
			this.frame_next = time_now + this.frame_delay;
			this.frame_current++;
			this.mesh.material.map.offset.x = this.frame_current/this.horizontal_frames;
		}
		
		this.mesh.material.map.offset.y = this.state/4;
	
		this.state = 0;
	}
}

// Todo: Create timeline for UIElement animation