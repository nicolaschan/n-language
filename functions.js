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
        functions['ackermann'] = function(arg) {
            if (arg.type === 'error')
                return arg;
            var ackermann_function = function(m, n) //returns big number
                {
                    const zero = math.bignumber(0);
                    const one = math.bignumber(1);
                    if (m.equals(zero))
                        return n.plus(1);
                    else if (n.equals(zero) && m.greaterThan(zero))
                        return ackermann_function(m.minus(1), one);
                    else if (n.greaterThan(zero) && m.greaterThan(zero))
                        return ackermann_function(m.minus(1), ackermann_function(m, n.minus(1)));
                    else
                        throw "IllegalArg";
                };
            var ackermann_function_wrapper = function(arg) {
                if (arg.length != 2)
                    throw "IllegalArg";
                var m = math.bignumber(arg[0].value);
                var n = math.bignumber(arg[1].value);
                return ackermann_function(m, n).toString();

            }
            return {
                type: 'text',
                value: ackermann_function_wrapper(arg)
            }
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
        functions['call'] = function(arg) {
            const syntax = {
                begin: '{',
                end: '}',
                escape: '\\',
                multiple_selector: '*'
            };

            var indexOfActualChar = function(character, string) {
                string = string.split(syntax.escape + syntax.escape).join('  ');
                for (var i = 0; i < string.length; i++) {
                    if ((string.charAt(i) === character) && (string.charAt(i - 1) !== syntax.escape))
                        return i;
                }
                return -1;
            };

            var compiler = require('./compiler');
            var compile = compiler.compileSync((arg.type) ? arg.value : arg[0].value);

            var replace = function(object) {
                if (object.function) {
                    object.arguments = replace(object.arguments);
                } else if (object.type && object.type === 'text') {
                    var removeEscapeChars = function(string) {
                        string = string.split(syntax.escape + syntax.escape).join(syntax.escape);
                        string = string.split(syntax.escape + syntax.begin).join(syntax.begin);
                        string = string.split(syntax.escape + syntax.end).join(syntax.end);

                        return string;
                    };
                    if (indexOfActualChar(syntax.begin, object.value) === 0) {
                        var index_string = object.value.substring(indexOfActualChar(syntax.begin, object.value) + 1, indexOfActualChar(syntax.end, object.value));
                        if (index_string === syntax.multiple_selector) {
                            object = arg.splice(1);
                        } else {
                            var index = parseInt(index_string);
                            object = arg[index];
                        }
                    }
                    if (object.type && object.type === 'text')
                        object.value = removeEscapeChars(object.value);
                } else {
                    for (var i in object) {
                        object[i] = replace(object[i]);
                    }
                }
                return object;
            };

            compile = replace(compile);

            var evaluator = require('./evaluator');
            return evaluator.evaluateCompiled(compile);
        };
        functions['derivative'] = function(arg) {
            var command = arg[0].value;
            var number = math.bignumber(arg[1].value);
            var variable_name = arg[2].value;
            var delta = (arg[3]) ? math.bignumber(arg[3].value) : math.bignumber('1e-16');

            var call_function = function() {
                return math.bignumber(functions['evaluate']({
                    type: 'text',
                    'value': command
                }).value);
            };
            var set_variable = function(value) {
                functions['var']([{
                    type: 'text',
                    value: variable_name
                }, {
                    type: 'text',
                    value: value
                }]);
            };

            set_variable(number.toString());
            var first_value = call_function();
            set_variable(number.minus(delta).toString());
            var second_value = call_function();

            return {
                type: 'text',
                'value': first_value.minus(second_value).dividedBy(delta).toString()
            };
        };
        functions['d'] = functions['derivative'];
        functions['each'] = function(arg) {
            var result = [];
            for (var i = 1; i < arg.length; i++) {
                result.push(functions[arg[0].value](arg[i]));
            }
            return result;
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
        functions['eval'] = functions['evaluate'];
        functions['$'] = functions['evaluate'];
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
        functions['function'] = function(arg) {
            functions[arg[0].value] = function(arg2) {
                var args = [];
                args.push(arg[1]);
                if (arg2.type) {
                    args.push(arg2);
                } else {
                    for (var i in arg2) {
                        args.push(arg2[i]);
                    }
                }
                if (args.length > 1) {
                    args = [args];
                }
                return functions['call'].apply(null, args);
            };
            return null;
        };
        functions['func'] = functions['function'];
        functions['help'] = function(arg) {
            var keys = [];
            for (var k in functions) {
                keys.push({
                    type: 'text',
                    value: k
                });
            }
            return keys;
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
        functions['math_config'] = function(arg) {
            var config = {};
            config[arg[0].value] = arg[1].value;
            math.config(config);
            return null;
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
        functions['test'] = function(arg) {
            return {
                type: 'json',
                value: 'hello'
            }
        };
        functions['pow'] = function(arg) {
            arg[0].value = math.bignumber(arg[0].value).pow(arg[1].value).toString();
            return arg[0];
        };
        functions['pre'] = function(arg) {
            return previous_result;
        };
        functions['recursion'] = function(arg) {
            var count = 0;

            var func_definition = arg[0];
            var times = parseInt(arg[1].value);
            var args = arg.splice(2);

            if (args.length === 1)
                args = args[0];

            var iterate = function(args) {
                if (count >= times)
                    return args;

                args = functions['call']([func_definition].concat(args));

                count++;
                return iterate(args);
            };
            return iterate(args);
        };
        functions['repeat'] = function(arg) {
            var result = [];
            for (var i = 0; i < parseInt(arg[1].value); i++) {
                result.push(arg[0]);
            }
            return result;
        };
        functions['round'] = function(arg) {
            if (arg[0]) {
                arg[0].value = math.round(arg[0].value, arg[1].value);
                return arg[0];
            } else {
                arg.value = math.round(arg.value, 0);
                return arg;
            }
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
        functions['solve'] = function(arg) {
            var command1 = arg[0].value;
            var command2 = arg[1].value;
            var variable_name = arg[2].value;
            var starting_value = (arg[3]) ? math.bignumber(arg[3].value) : math.bignumber(0);
            var iterations = (arg[4]) ? parseFloat(arg[4].value) : 10;
            var derivative_delta = (arg[5]) ? math.bignumber(arg[5].value) : math.bignumber('1e-16');

            var set_variable = function(value) {
                functions['var']([{
                    type: 'text',
                    value: variable_name
                }, {
                    type: 'text',
                    value: value
                }]);
            };
            var call_function = function(x) {
                set_variable(x.toString());
                var first = math.bignumber(functions['evaluate']({
                    type: 'text',
                    value: command1
                }).value);
                set_variable(x.toString());
                var second = math.bignumber(functions['evaluate']({
                    type: 'text',
                    value: command2
                }).value)
                return first.minus(second);
            };
            var getSlope = function(x) {
                return math.bignumber(functions['derivative']([{
                    type: 'text',
                    value: command1
                }, {
                    type: 'text',
                    value: x
                }, {
                    type: 'text',
                    value: variable_name
                }, {
                    type: 'text',
                    value: derivative_delta.toString()
                }]).value).minus(functions['derivative']([{
                    type: 'text',
                    value: command2
                }, {
                    type: 'text',
                    value: x
                }, {
                    type: 'text',
                    value: variable_name
                }, {
                    type: 'text',
                    value: derivative_delta.toString()
                }]).value);
            };
            var nextX = function(x) {
                var y = call_function(x);
                var m = getSlope(x);

                // intercept is x - (y / m)
                return math.bignumber(x).minus(y.dividedBy(m));
            };

            var current = starting_value;
            for (var i = 0; i < iterations; i++) {
                current = nextX(current);
            }
            return {
                type: 'text',
                value: current.toString()
            }
        };
        functions['substitute'] = function(arg) {
            const syntax = {
                begin: '{',
                end: '}',
                escape: '\\'
            };
            var indexOfActualChar = function(character, string) {
                string = string.split(syntax.escape + syntax.escape).join('  ');
                for (var i = 0; i < string.length; i++) {
                    if ((string.charAt(i) === character) && (string.charAt(i - 1) !== syntax.escape))
                        return i;
                }
                return -1;
            };
            var countActualChar = function(character, string) {
                string = string.split(syntax.escape + syntax.escape).join('');
                var count = 0;
                for (var i = 0; i < string.length; i++) {
                    if ((string.charAt(i) === character) && (string.charAt(i - 1) !== syntax.escape))
                        count++;
                }
                return count;
            };

            var command = '';
            while (indexOfActualChar(syntax.begin, arg[0].value) > -1) {
                var start = indexOfActualChar(syntax.begin, arg[0].value);
                var end = indexOfActualChar(syntax.end, arg[0].value);
                command += arg[0].value.substring(0, start);

                var index = parseInt(arg[0].value.substring(start + 1, end));
                command += arg[index].value;

                arg[0].value = arg[0].value.substring(end + 1);
            }
            command += arg[0].value;

            var removeEscapeChars = function(string) {
                string = string.split(syntax.escape + syntax.escape).join(syntax.escape);
                string = string.split(syntax.escape + syntax.begin).join(syntax.begin);
                string = string.split(syntax.escape + syntax.end).join(syntax.end);

                return string;
            };

            command = removeEscapeChars(command);

            return {
                type: 'text',
                value: command
            };
        };
        functions['time'] = function(arg) {
            var start = Date.now();
            var result = functions['evaluate'](arg);
            var end = Date.now();
            return [result, {
                type: 'text',
                value: (end - start).toString()
            }];
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
            try {
                result = functions[name](arg);
            } catch (e) {
                result = {
                    type: 'error',
                    message: e
                };
            }
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