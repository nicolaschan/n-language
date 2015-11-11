(function() {
	var compiler = require('./compiler');
	var evaluator = require('./evaluator');
	var displayer = require('./displayer')

	var prompt = function() {
		process.stdout.write('\033[90min  > \033[0m');
	};

	process.stdin.setEncoding('utf8');
	process.stdin.on('readable', function() {
		var chunk = process.stdin.read();
		if (chunk !== null) {
			chunk = chunk.substring(0, chunk.length - 1);

			var start = Date.now();

			var compile = compiler.compileSync(chunk);
			var raw = evaluator.evaluateCompiled(compile);

			//process.stdout.write('\033[90m# compile > \033[37m' + JSON.stringify(compile) + '\n');
			//process.stdout.write('\033[90m# raw > \033[37m' + JSON.stringify(raw) + '\n');
			process.stdout.write('\033[90mout > \033[0m' + displayer.display(raw) + '\n');
			//process.stdout.write('\033[90m#' + count + ' time > ' + '\033[90m(' + (Date.now() - start) / 1000 + ' s)\n');
		}
		prompt();
	});
})();