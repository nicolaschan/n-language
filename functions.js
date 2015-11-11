(function() {
	var math = require('mathjs');
	var scope = {};
	var vars = {};

	var functions = {
		'': function(arg) {
			return arg;
		},
		echo: function(arg) {
			return arg;
		},
		evaluate: function(arg) {
			if (arg.type === 'error')
				return arg;

			if (arg.type && arg.type === 'text') {
				var evaluator = require('./evaluator');
				arg = evaluator.evaluateSync(arg.value);
			} else {
				for (var i in arg) {
					arg[i] = functions.evaluate(arg[i]);
				}
			}

			return arg;
		},
		factorial: function(arg) {
			if (arg.type === 'error')
				return arg;
			var factorial = function(n) {
				var output = math.bignumber(1);
				while (n.gt(1)) {
					output = output.times(n);
					n = n.minus(1);
				}
				return output;
			};

			if (arg.type && arg.type === 'text') {
				arg.value = (factorial(math.bignumber(arg.value))).toString();
			} else {
				for (var i in arg) {
					arg[i] = functions.factorial(arg[i]);
				}
			}

			return arg;
		},
		math: function(arg) {
			if (arg.type === 'error')
				return arg;
			var evaluate = function(s) {
				return math.eval(s, scope);
			};

			if (arg.type && arg.type === 'text') {
				arg.value = evaluate(arg.value).toString();
			} else {
				for (var i in arg) {
					arg[i] = functions.math(arg[i]);
				}
			}

			return arg;
		},
		now: function(arg) {
			return {
				type: 'text',
				value: Date.now().toString()
			};
		},
		select: function(arg) {
			return arg[0][parseInt(arg[1].value)];
		},
		sum: function(arg) {
			if (arg.type === 'error')
				return arg;
			var sum = function(nums) {
				var result = math.bignumber(0);

				if (nums.type && nums.type === 'text') {
					return nums;
				}

				for (var i in nums) {
					if (nums[i].type && nums[i].type === 'text') {
						result = result.plus(math.bignumber(nums[i].value));
					} else {
						result = result.plus(sum(nums[i]));
					}
				}

				return result;
			};

			return {
				type: 'text',
				value: sum(arg).toString()
			};
		},
		var: function(arg) {
			if (arg.type && arg.type === 'text') {
				return vars[arg.value];
			}
			vars[arg[0].value] = arg[1];
			return arg[1];
		}
	};

	module.exports = functions;
})();