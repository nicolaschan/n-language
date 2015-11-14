importScripts('bundle.js');

onmessage = function(e) {
	var evaluator = require('evaluator');
	postMessage(evaluator.evaluateSync(e.data));
};