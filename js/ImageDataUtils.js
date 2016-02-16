/**
*
* @param data [array] - 2d array to travel
* @param x - Starting x coordinate
* @param y - Starting y coordinate
* @param result [array] - A 1d array of coordinates
*/
function marchingSquaresTraveler(data, x, y, result, start_x, start_y, prev_index)
{
	/*
		Direction codes:
		-1: Nowhere
		0 : up
		1 : right
		2 : down
		3 : left
		
		Square setup
		1---2
		|   |
		8---4
	*/
	// TODO: Reorder points for clockwise direction
	var square = [
		{dir: -1, points: []}, //'0000', // 0 No sides
		{dir: 3, points: [{x: 0, y: 0.5}, {x: 0.5, y: 0}]}, //'0001', // 1
		{dir: 0, points: [{x: 1, y: 0.5}, {x: 0.5, y: 0}]}, //'0010', // 2
		{dir: 3, points: [{x: 1, y: 0.5}, {x: 0, y: 0.5}]}, //'0011', // 3
		{dir: 1, points: [{x: 0.5, y: 1}, {x: 1, y: 0.5}]}, //'0100', // 4
		{dir: 2, points: []}, //'0101', // 5 // Special case of "//" We need special case cells
		{dir: 0, points: [{x: 0.5, y: 0}, {x: 0.5, y: 1}]}, //'0110', // 6
		{dir: 3, points: [{x: 0.5, y: 1}, {x: 0, y: 0.5}]}, //'0111', // 7 Uses reversed coordinates of 1 to signify inside
		{dir: 2, points: [{x: 0, y: 0.5}, {x: 0.5, y: 1}]}, //'1000', // 8
		{dir: 2, points: [{x: 0.5, y: 0}, {x: 0.5, y: 1}]},  //'1001', // 9 Uses reversed coordinates of 6 to signify inside
		{dir: 2, points: []}, //'1010', // 10 // Special case of "\\"
		{dir: 2, points: [{x: 1, y: 0.5}, {x: 0.5, y: 1}]}, //'1011', // 11 Uses reversed coordinates of 4 to signify inside
		{dir: 1, points: [{x: 0, y: 0.5}, {x: 1, y: 0.5}]}, //'1100', // 12
		{dir: 1, points: [{x: 0.5, y: 0}, {x: 1, y: 0.5}]}, //'1101', // 13 Uses reversed coordinates of 2 to signify inside
		{dir: 0, points: [{x: 0, y: 0.5}, {x: 0.5, y: 0}]}, //'1110', // 14 Uses reversed coordinates of 1 to signify inside
		{dir: -1, points: []},  // 15 All sides (same as 0)
		
		// Special cases for case 5 and 10 (should never be found normally)
		{dir: 3, points: [{x: 0.5, y: 1}, {x: 0, y: 0.5}]},			// 5-16 come in from up 0
		{dir: 0, points: [{x: 1, y: 0.5}, {x: 0.5, y: 1}]}, 		// 5-17 come in from right 1
		{dir: 1, points: [{x: 0.5, y: 0}, {x: 1, y: 0.5}]}, 		// 5-18 come in from down 2
		{dir: 2, points: [{x: 1, y: 0.5}, {x: 0.5, y: 1}]}, 		// 5-19 come in from left 3
		
		{dir: 3, points: [{x: 0.5, y: 1}, {x: 0.5, y: 0.5}]},		// 10-20 come in from up 0
		{dir: 0, points: [{x: 0, y: 0.5}, {x: 0.5, y: 0}]},			// 10-21 come in from right 1
		{dir: 1, points: [{x: -20, y:0}, {x: 1, y: 0.5}]},			// 10-22 come in from down 2
		{dir: 2, points: [{x: 1, y: 0.5}, {x: 0.5, y: 1}]}			// 10-23 come in from left 3
	],
	selected_square,
	index = 0,
	dir,
	x_offset,
	y_offset;
	
	result = result === undefined ? [] : result;
		
	// Back at the start, return the result
	if(x == start_x && y == start_y)
		return result;
	
	if(x < 0 || y < 0 || x > data[0].length || y > data.length)
	{
		console.log('Exceeded bounds x:', x, 'y:', y, 'x-length:', data[0].length, 'y-length:', data.length);
		return result;
	}
	
	// Remember starting x position
	if(start_x === undefined)
		start_x = x;
		
	// Remember starting y position
	if(start_y === undefined)
		start_y = y;
	
	index = data[y][x] + data[y][x+1]*2 + data[y+1][x+1]*4 + data[y+1][x]*8;
	selected_square = square[index];
	dir = selected_square.dir;
	console.log(selected_square, 'square index:', index, 'x:', x, 'y:', y, 'previous square index:', prev_index);
	
	// Blank spaces need not apply
	if(selected_square.dir == -1)
	{
		console.log('blank stopping');
		return result;
	}
	
	// Solve for ambigious saddle cases
	// COnnecting points get index subbed
	if(index == 5 || index == 10)
	{
		var prev_dir = square[prev_index].dir;
		if(index == 5)
		{
			switch(prev_dir)
			{
				case 0:
					index = 16;
					selected_square = square[index];
					dir = selected_square.dir;
					break;
				case 1:
					index = 17;
					selected_square = square[index];
					dir = selected_square.dir; 
					break;
				case 2:
					index = 18;
					selected_square = square[index];
					dir = selected_square.dir;
					break;
				case 3:
					index = 19;
					selected_square = square[index];
					dir = selected_square.dir;
					break;
			}
		}
		
		if(index == 10)
		{
			switch(prev_dir)
			{
				case 0:
					index = 20;
					selected_square = square[index];
					dir = selected_square.dir;
					break;
				case 1:
					index = 21;
					selected_square = square[index];
					dir = selected_square.dir; 
					break;
				case 2:
					index = 22;
					selected_square = square[index];
					dir = selected_square.dir;
					break;
				case 3:
					index = 23;
					selected_square = square[index];
					dir = selected_square.dir;
					break;
			}
		}
	}
	
	// Add acquired points to the list of points that make up polygons
	// TODO: Simplify later see: http://gamedev.stackexchange.com/questions/38721/how-can-i-generate-a-navigation-mesh-for-a-tile-grid/43826#43826
	for(var i = 0; i < selected_square.points.length; i++)
		result.push({x: selected_square.points[i].x+x, y: selected_square.points[i].y+y});
	
	// Get new coordinate modifiers based on direction to move
	x_offset = (dir == 1 || dir == 3) ? (dir == 1 ? 1 : -1) : 0;
	y_offset = (dir === 0 || dir == 2) ? (dir === 0 ? -1 : 1) : 0;
	
	return marchingSquaresTraveler(data, x+x_offset, y+y_offset, result, start_x, start_y, index); 
}

var ImageDataUtils = {
	getColor:function(image_data, x, y) {
			var 
			width = image_data.width,
			index = (width*y+x)*4;
			
			return {r: image_data.data[index], g:image_data.data[index+1], b:image_data.data[index+2], a: image_data.data[index+3]};
	},
	isColor: function(rgba, rgba_target) {
		// Matching or color is completely transparent
		return (rgba.r == rgba_target.r && rgba.g == rgba_target.g && rgba.b == rgba_target.b && rgba.a == rgba_target.a) || (rgba == rgba_target.a && rgba_target.a === 0);
	},
	scanX: function(image_data, rgba_target, left) {
		var
		width = image_data.width,
		height = image_data.height,
		x_start = left ? 0 : width-1,
		x_end = left ? width : 0;

		for(var x = x_start; left ? x < x_end : x >= x_end; left ? x++ : x--)
		{
			for(var y = 0; y < height; y++)
			{
				if(!ImageDataUtils.isColor(ImageDataUtils.getColor(image_data, x, y), rgba_target))
					return (left ? x : width-x-1); // Return the previous x position in which it was clear
			}
		}
		return 0;
	},
	scanY: function(image_data, rgba_target, down) {
		var
		width = image_data.width,
		height = image_data.height,
		y_start = down ? 0 : height-1,
		y_end = down ? height : 0;
		
		for(var y = y_start; down ? y < y_end : y >= y_end; down ? y++ : y--)
		{
			for(var x = 0; x < width; x++)
			{
				if(!ImageDataUtils.isColor(ImageDataUtils.getColor(image_data, x, y), rgba_target))
					return (down ? y : height-y-1) ; // Return the previous y position in which it was clear
			}
		}
		return 0;
	},
	/* Returns an array of 0 and 1s matching colors are 0, non-maching is 1. Created for the purposes of marching squares*/	
	getPixelGrid: function(image_data, rgba_ignore){
		var width = image_data.width,
		height = image_data.height,
		result = [],
		new_row;
		console.log(width, height);
		for(var y = 0; y < height; y++)
		{
			new_row = [];
			for(var x = 0; x < width; x++)
			{
				if(ImageDataUtils.isColor(ImageDataUtils.getColor(image_data, x, y), rgba_ignore))
					new_row.push(false);
				else
					new_row.push(true);
			}
			result.push(new_row);
		}
		
		return result;
	},
	getOutline:function(image_data, r, g, b, a, triangulate, simplify) {
		// Coordinates for each vector square possibility (clockwise from top corner), actual offsets happen later
		var rgba_ignore = {r: r, g: g, b: b, a: a},
		pixel_grid = ImageDataUtils.getPixelGrid(image_data, rgba_ignore),
		result = [],
		curr_angle = -1,
		ref_angle,
		curr_vector,
		prev_vector,
		ref_vector;
		
		// Default to transparent
		r = r === undefined ? 0 : r;
		g = g === undefined ? 0 : g;
		b = b === undefined ? 0 : b;
		a = a === undefined ? 0 : a; 
		
		if(pixel_grid.length === 0)
			return result;
		
		// Incrementally step per pixel a 2x2 square (build a one dimensional array of selected points)
		/*
			Square setup
			1---2
			|   |
			8---4
		*/
		// Second implementation
		/*
		Move cell based on clockwise direction, not scanning
		*/
		// Find start position
		/*
		var found_poly = false;
		for(var y = 0; y < pixel_grid.length-1; y++)
		{
			for(var x = 0; x < pixel_grid[y].length; x++)
			{
				if(pixel_grid[y+1][x])
				{
					console.log('start');
					result = marchingSquaresTraveler(pixel_grid, x-1, y);
					found_poly = true;
				}
				if(found_poly)
					break;
			}
			if(found_poly)
					break;
		}
		*/
		var found_poly = false;
		for(var x = 0; x < pixel_grid[0].length; x++)
		{
			for(var y = 0; y < pixel_grid.length-1; y++)
			{
				if(pixel_grid[y+1][x])
				{
					console.log('start');
					result = marchingSquaresTraveler(pixel_grid, x-1, y);
					found_poly = true;
				}
				if(found_poly)
					break;
			}
			if(found_poly)
					break;
		}
		
		// Clean up duplicate vectors
		for(var r = 0; r < result.length; r++)
		{
			for(var rd = r; rd < result.length; rd++)
			{
				if(rd != r)
				{
					if(result[r].x == result[rd].x && result[r].y == result[rd].y)
					{
						result.splice(rd, 1);
						rd--;
					}
				}
			} 
		}
		
		
		// Clean up stuff on the same "line"
		if(result.length !== 0)
		{
			// Starting from a reference vector 
			// Check angle with preceding vectors
			// Remove points between reference vector and preceding vector when angle to ref vector changes.
			ref_vector = result[0];
			prev_vector = result[1];
			ref_angle = Math.atan2(prev_vector.y-ref_vector.y, prev_vector.x-ref_vector.x);
			var index = [];
			for(var p = 2; p < result.length; p++)
			{
				//3 "changed" 8.13010235415598 0 Object {x: 19, y: 0.5} Object {x: 19.5, y: 1}
				
				curr_vector = result[p];
				curr_angle = Math.atan2(curr_vector.y-ref_vector.y, curr_vector.x-ref_vector.x)
				if(ref_angle == curr_angle)
				{
					result.splice(--p, 1);
					
					prev_vector = curr_vector;
				}
				else if(ref_angle != curr_angle)
				{
					ref_vector = prev_vector;
					ref_angle = Math.atan2(curr_vector.y-ref_vector.y, curr_vector.x-ref_vector.x);
					prev_vector = curr_vector;
				}
			}
			curr_angle = Math.atan2(result[0].y-ref_vector.y, result[0].x-ref_vector.x);
			if(ref_angle == curr_angle)
				result.splice(result.length-1, 1);
		}
		
		/*
		if(result.length !== 0 && simplify !== undefined && simplify)
		{
			prev_vector = result[0];
			curr_vector = result[1];
			var distance = Math.sqrt(Math.pow(curr_vector.x-prev_vector.x,2)+Math.pow(curr_vector.y-prev_vector.y,2));
			var between_vector = {x: (curr_vector.x+prev_vector.x)/2, y: (curr_vector.y+prev_vector.y)/2};
			var distance_threshold=1;
			if(distance < distance_threshold)
			{
				
				result.splice(0, 2, between_vector);
				prev_vector = between_vector;
				
			}
			else
				prev_vector = curr_vector;
			console.log(between_vector, curr_vector, prev_vector);
			
			for(var s = 2; s < result.length; s++)
			{
				curr_vector = result[s];
				
				distance = Math.sqrt(Math.pow(curr_vector.x-prev_vector.x,2)+Math.pow(curr_vector.y-prev_vector.y,2));
				between_vector = {x: (curr_vector.x+prev_vector.x)/2, y: (curr_vector.y+prev_vector.y)/2};
				console.log(distance, curr_vector, prev_vector, between_vector);
				if(distance < distance_threshold)
				{
					s--;
					result.splice(s, 2, between_vector);
					prev_vector = between_vector;
				}
				else
					prev_vector = curr_vector;
			}
			prev_vector = result[result.length-1];
			curr_vector = result[0];
			distance = Math.sqrt(Math.pow(curr_vector.x-prev_vector.x,2)+Math.pow(curr_vector.y-prev_vector.y,2));
			between_vector = {x: (curr_vector.x+prev_vector.x)/2, y: (curr_vector.y+prev_vector.y)/2};
			if(distance < distance_threshold)
			{
				result.splice(result.length-1, 1, between_vector);
				result[0] = between_vector;
			}
			console.log(between_vector, curr_vector, prev_vector);
			
		}
		*/
		if(result.length !== 0 && simplify !== undefined && simplify)
		{
			prev_vector = result[0];
			curr_vector = result[1];
			var distance = Math.sqrt(Math.pow(curr_vector.x-prev_vector.x,2)+Math.pow(curr_vector.y-prev_vector.y,2));
			var between_vector = {x: (curr_vector.x+prev_vector.x)/2, y: (curr_vector.y+prev_vector.y)/2};
			var distance_threshold=1.5;
			if(distance < distance_threshold)
			{
				
				result.splice(0, 2, between_vector);
				prev_vector = between_vector;
				
			}
			else
				prev_vector = curr_vector;
				
			for(var s = 2; s < result.length; s++)
			{
				curr_vector = result[s];
				distance = Math.sqrt(Math.pow(curr_vector.x-prev_vector.x,2)+Math.pow(curr_vector.y-prev_vector.y,2));
				between_vector = {x: (curr_vector.x+prev_vector.x)/2, y: (curr_vector.y+prev_vector.y)/2};
				if(distance < distance_threshold)
				{
					result.splice(--s, 2, between_vector);
					prev_vector = between_vector;
					
				}
				else
					prev_vector = curr_vector;
				
			}
			
		}
		if(triangulate !== undefined && triangulate)
		{
			for(var i = 0; i < result.length; i++)
			{
				
			}
		}
		
		
		// Simply polygon by traveling circuits;
		
		//http://stackoverflow.com/questions/6989100/sort-points-in-clockwise-order
		/*
		result.sort(function(a, b){
			
		});
		*/
		// Build polygon out of results by joining points into lines
		return result;
		//ImageDataUtils
		
	},
	// See http://stackoverflow.com/questions/12175991/crop-image-white-space-automatically-using-jquery/12178531#12178531
	// Oh oh good time to learn how to use web workers!
	/**
	* Clean up image so there's less things to check via marching squares
	* @param image_data [ImageData] - Image data to process
	* @param r [int] - Red value of color 0 - 255
	* @param g [int] - Green value of color 0 - 2555
	* @param b [int] - Blue value of color 0 - 255
	* @param a [float] - Alpha value of color 0 - 1
	*/
	getTrimAmounts: function(image_data, r, g, b, a)
	{
		// Default to transparent
		r = r === undefined ? 0 : r;
		g = g === undefined ? 0 : g;
		b = b === undefined ? 0 : b;
		a = a === undefined ? 0 : a; 
		
		var rgba_target = {r: r, g: g, b: b, a: a};

		return {top: ImageDataUtils.scanY(image_data, rgba_target, true), 
		bottom: ImageDataUtils.scanY(image_data, rgba_target, false),
		left: ImageDataUtils.scanX(image_data,rgba_target, true), 
		right: ImageDataUtils.scanX(image_data, rgba_target, false)};
	}
};