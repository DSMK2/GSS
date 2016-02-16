var node_size = 32
// From world center
function getNodeDataAtPoint(world, x, y){
	var node_x = Math.floor(x/node_size),
	node_y = Math.floor(y/node_size),
	bounds = {upperBound: new b2Vec2(node_x, node_y), lowerBound: new b2Vec2(node_x+node_size, node_y+node_size)};
	
	world.QueryAABB(function(test){
		console.log(test);
	}, bounds);
}