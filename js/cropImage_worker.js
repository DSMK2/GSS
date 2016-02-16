importScripts('ImageDataUtils.js');
self.onmessage =  function(e) {
	var request = e.data.request;

	switch(request)
	{
		case 'crop':
			self.postMessage({requestType: request, result: ImageDataUtils.getTrimAmounts.apply(null, e.data.args)});
			break;
		
		case 'get_outline':
			self.postMessage({requestType: request, result: ImageDataUtils.getOutline.apply(null, e.data.args)});
			break;
			
		default:
			self.postMessage('No matching request')
			break;
	}
};