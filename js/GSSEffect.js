/*
* Intended to come and go, GSSEffect objects aren't supposed to persist
*/

GSSEffect.id = 0;
GSSEffect.defaults = {
	image_data: false,
	image_index: 0,
	image_frames: 0,
	image_frame_rate: 0.5,
	animate_with_lifetime : false,
	x: 0, 
	y: 0,
	lifetime: 1000,
	scale: 1
};

function GSSEffect(options){
	options = extend(GSSEffect.defaults, options);

	this.mark_for_delete = false;
	this.id = GSSEffect.id;
	
	this.image_data = options.image_data
	this.image_frames = this.image_data.frames;
	this.image_frame_current = 0;
	this.lifetime = Date.now()+options.lifetime;
	if(options.animate_with_lifetime)
		this.image_frame_rate = options.lifetime/this.image_frames;
	else
		this.image_frame_rate = this.image_data.frame_rate;
	this.time_to_next_frame = Date.now()+this.image_frame_rate;
	
	// BEGIN: THREE.js 
	this.mesh_data = GSS.image_data[this.image_data.image_index];
	this.texture = this.mesh_data.texture.clone();
	this.texture.needsUpdate = true;
	this.material = new THREE.MeshBasicMaterial({map: this.texture, wireframe: false, transparent: true});
	this.material.side = THREE.DoubleSide;
	
	this.mesh_plane = new THREE.Mesh(new THREE.PlaneGeometry(this.mesh_data.width/this.image_frames, this.mesh_data.height), this.material);
	this.mesh_plane.position.x = options.x;
	this.mesh_plane.position.y = options.y;
	this.mesh_plane.scale.x = options.scale;
	this.mesh_plane.scale.y = options.scale;
	GSS.scene.add(this.mesh_plane);
	// END: THREE.js
	
	GSSEffect.id++;

}

GSSEffect.prototype = {
	update: function(){
		if(this.mark_for_delete)
			return;
		
		var current_date = Date.now();
		if(current_date >= this.time_to_next_frame)
		{
			this.image_frame_current  = this.image_frame_current == this.image_frames-1 ? 0 : this.image_frame_current+1;
			this.mesh_plane.material.map.offset.x = this.image_frame_current/this.image_frames;
			
			this.time_to_next_frame = current_date+this.image_frame_rate;
		}
		
		if(current_date >= this.lifetime)
			this.destroy();
	},
	destroy: function(){
		if(this.mark_for_delete)
			return;
		
		GSS.scene.remove(this.mesh_plane);
		
		GSS.effects_to_remove.push(this);
		this.mark_for_delete = true;
	}
}