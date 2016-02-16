importScripts('liquidfun.js');
importScripts('GSSEntity.js');
importScripts('GSSWeapon.js');

/*
* Not sure if I actually want to implement this... 
*/

var world = new b2World(new b2Vec2(0, 0)),
update_timer,
FPS = 1/60,
bodies = [];

function start(){
	updateTimer = setInterval(function(){
		world.Step(FPS, 6, 2);
		// Post entities that need redraws
	}, FPS);
}

function stop(){
	clearInterval(update_timer);
}

function addEntity(entity_id, faction_id) {
	if(entity_id < 0 || faction_id < 0)
		return;
}

self.onmessage = function(e){
	var request = e.data.request,
	entity_id,
	faction_id;
	
	switch(request)
	{
		case 'start':
			start();
			break;
		
		case 'stop':
			stop();
			break;
		
		case 'addEntity':
		{
			if(request.entity_id !== undefined  || request.faction_id !== undefined)
				addEntity(request.entity_id, request.faction_id);
		}
			break;
			
		default: 
			break;
	}
}