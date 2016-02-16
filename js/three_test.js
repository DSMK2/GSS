// See: https://aerotwist.com/tutorials/getting-started-with-three-js/
jQuery(function($){
	
	var 
	$container = $('.three_container'),
	width = $container.width(),
	height = $container.height(),
	// Camera
	view_angle = 45,
	aspect = width/height,
	near = 0.1,
	far = 10000,
	
	renderer = new THREE.WebGLRenderer({antialias: false}),
	camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, near, far );
	scene = new THREE.Scene();
	
	renderer.setClearColor(0x8B8E89);
	
	scene.add(camera);
	camera.position.z = 300;
	renderer.setSize(width, height);
	$container.append(renderer.domElement);
	
	var radius = 50,
	segments = 25,
	rings = 25,
	sphereMaterial = new THREE.MeshLambertMaterial({color: 0xFFAE00});
	
	var sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, rings), sphereMaterial);
	scene.add(sphere);
	
	var pointLight= new THREE.PointLight(0xFFFFFF);
	pointLight.position.x = 0;
	pointLight.position.y = 0;
	pointLight.position.z = 130;

	var ambientLight = new THREE.AmbientLight(0x222222);
	scene.add(ambientLight);
	scene.add(pointLight);
	scene.fog = new THREE.Fog(0xFFFFFF);

	renderer.render(scene, camera);
	
	var sphere_distance = 100,
	current_angle_position = 0,
	current_angle_sphere = 0;
	
	var fighter_texture_loader = new THREE.TextureLoader(),
	fighter_texture,
	fighter_plane;
	
	fighter_texture_loader.load('./images/simplefighter.png', function(texture){
		texture.anisotropy = 0;
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		fighter_plane = new THREE.Mesh(new THREE.PlaneGeometry(42, 25), new THREE.MeshBasicMaterial({map: texture, wireframe: false, transparent: true}));
		fighter_plane.material.side = THREE.DoubleSide;
		scene.add(fighter_plane);
	});
	
	//fighter_texture.magFilter = THREE.NearestFilter;


	window.setInterval(function(){
		sphere.position.x = sphere_distance*Math.cos(current_angle_position);
		sphere.position.y = sphere_distance*Math.sin(current_angle_position);
		sphere.rotation.y = current_angle_sphere*2*Math.PI/180;
		current_angle_sphere+=0.05;
		current_angle_position+=0.001;
		if(fighter_plane !== undefined)
		{
			fighter_plane.rotation.z += 0.001;
		}
		renderer.render(scene, camera);
		
		
	}, 1/60);
});