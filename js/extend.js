/*
* Very light (first level) extention function that extends the objects class; made for applying options to defaults
*/
function extend(extend, target, debug)
{
	if(target === undefined || !target)
		return extend;
		
	debug = debug !== undefined ? debug : false;

	var extended = {};
	
	if(debug) console.log('extend:', extend, target); 
		
	for(var prop in extend)
	{
		if(extend.hasOwnProperty(prop) && extend[prop] !== undefined)
		{
			
			if(debug) console.log('extend:', prop, extended[prop], target[prop]);
			if(target.hasOwnProperty(prop) && target[prop] !== undefined)
				extended[prop] = target[prop];
			else
				extended[prop] = extend[prop];
		}
	}
	
	return extended;
}

function clone(target) 
{
	var clone = {};
	
	if(target === undefined || !target)
		return;
		
	for(var prop in target)
	{
		if(target.hasOwnProperty(prop))
			clone[prop] = target[prop];
	}

	return clone;
}