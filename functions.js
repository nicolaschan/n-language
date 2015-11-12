(function() {
    var math = require('mathjs');
    math.config({
        number: 'bignumber',
        precision: 64
    });

    var scope = {};
    var vars = {};

    var previous_result;

    var functions = {};

    var set_functions = function() {
        functions[''] = function(arg) {
            return arg;
        };
        functions['add'] = function(arg) {
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
        };
        functions['concat'] = function(arg) {
            if (arg.type === 'error')
                return arg;
            var concat = function(strings) {
                var result = '';

                if (strings.type && strings.type === 'text') {
                    return strings;
                }

                for (var i in strings) {
                    if (strings[i].type && strings[i].type === 'text') {
                        result += strings[i].value;
                    } else {
                        result += concat(strings[i]);
                    }
                }

                return result;
            };

            return {
                type: 'text',
                value: concat(arg)
            }
        };
        functions['math_config'] = function(arg) {
            var config = {};
            config[arg[0].value] = arg[1].value;
            math.config(config);
            return null;
        };
        functions['echo'] = function(arg) {
            return arg;
        };
        functions['evaluate'] = function(arg) {
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
        };
        functions['factorial'] = function(arg) {
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
        };
        functions['length'] = function(arg) {
            if (arg.type) {
                return {
                    type: 'text',
                    value: '1'
                };
            }
            return {
                type: 'text',
                value: arg.length.toString()
            };
        };
        functions['math'] = function(arg) {
            if (arg.type === 'error')
                return arg;
            var evaluate = function(s) {
                return math.eval(s, scope);
            };

            if (arg.type && arg.type === 'text') {
                var result = evaluate(arg.value);
                if (result) {
                    arg.value = result.toString();
                } else {
                    arg = result;
                }
            } else {
                for (var i in arg) {
                    arg[i] = functions.math(arg[i]);
                }
            }

            return arg;
        };
        functions['multiply'] = function(arg) {
            if (arg.type === 'error')
                return arg;
            var multiply = function(nums) {
                var result = math.bignumber(1);

                if (nums.type && nums.type === 'text') {
                    return nums;
                }

                for (var i in nums) {
                    if (nums[i].type && nums[i].type === 'text') {
                        result = result.times(math.bignumber(nums[i].value));
                    } else {
                        result = result.times(multiply(nums[i]));
                    }
                }

                return result;
            };

            return {
                type: 'text',
                value: multiply(arg).toString()
            };
        };
        functions['now'] = function(arg) {
            return {
                type: 'text',
                value: Date.now().toString()
            };
        };
        functions['pre'] = function(arg) {
            return previous_result;
        };
        functions['select'] = function(arg) {
            var objects = [];

            for (var i = 1; i < arg.length; i++) {
                if (arg[i].type && arg[i].type === 'text') {
                    objects.push(arg[0][parseInt(arg[i].value)]);
                } else {
                    var subarray = [];
                    for (var j = parseInt(arg[i][0].value); j <= parseInt(arg[i][1].value); j++) {
                        subarray.push(arg[0][j]);
                    }
                    objects.push(subarray);
                }
            }

            if (objects.length === 1) {
                return objects[0];
            }

            return objects;
        };
        functions['var'] = function(arg) {
            if (arg.type && arg.type === 'text') {
                return vars[arg.value];
            }
            vars[arg[0].value] = arg[1];
            return null;
        };
    };
    set_functions();

    var has_function = function(name) {
        if (functions[name])
            return true;
        return false;
    };
    var evaluate = function(name, arg) {
        var result;

        if (has_function(name)) {
            result = functions[name](arg);
        } else {
            result = {
                type: 'error',
                message: 'Function not found: ' + name
            };
        }

        previous_result = result;
        return result;
    };

    module.exports.has_function = has_function;
    module.exports.evaluate = evaluate;
    module.exports.functions = functions;
})();