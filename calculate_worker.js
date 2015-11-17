importScripts('bundle.js');

onmessage = function(e) {
	var input = e.data.input;
	var id = e.data.id;
	var evaluator = require('evaluator');
	var result = evaluator.evaluateSync(input);

	postMessage({
		id: id,
		result: result
	});
};