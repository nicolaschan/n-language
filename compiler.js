(function() {
    const syntax = {
        begin_arg: '(',
        end_arg: ')',
        arg_sep: ',',
        escape: '\\',
        preprocess: {
            begin_string: '[',
            end_string: ']'
        }
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
    var indexOfActualChar = function(character, string) {
        string = string.split(syntax.escape + syntax.escape).join('  ');
        for (var i = 0; i < string.length; i++) {
            if ((string.charAt(i) === character) && (string.charAt(i - 1) !== syntax.escape))
                return i;
        }
        return -1;
    };

    var preprocess = function(command) {
        var preprocess_settings = syntax.preprocess;

        var countActualBeginnings = function(string) {
            return countActualChar(preprocess_settings.begin_string, string);
        };
        var indexOfFirstBeginning = function(string) {
            return indexOfActualChar(preprocess_settings.begin_string, string);
        };
        var countActualEndings = function(string) {
            return countActualChar(preprocess_settings.end_string, string);
        };
        var indexOfFirstEnding = function(string) {
            return indexOfActualChar(preprocess_settings.end_string, string);
        };

        while (countActualBeginnings(command) > 0) {
            var beginningIndex = indexOfFirstBeginning(command);
            var endingIndex = indexOfFirstEnding(command);

            var escape = function(string) {
                string = string.split(syntax.escape).join(syntax.escape + syntax.escape);
                string = string.split(syntax.begin_arg).join(syntax.escape + syntax.begin_arg);
                string = string.split(syntax.end_arg).join(syntax.escape + syntax.end_arg);
                string = string.split(syntax.arg_sep).join(syntax.escape + syntax.arg_sep);

                return string;
            };

            var beginning = command.substring(0, beginningIndex);
            var middle = command.substring(beginningIndex + 1, endingIndex);
            var end = command.substring(endingIndex + 1);
            try
            {
                command = beginning + escape(middle) + end;
            }
            catch(err)
            {
                throw("Syntax error");
            }
        }

        command = command.split(syntax.escape + syntax.preprocess.begin_string).join(syntax.preprocess.begin_string);
        command = command.split(syntax.escape + syntax.preprocess.end_string).join(syntax.preprocess.end_string);

        while (countActualChar(syntax.begin_arg, command) > countActualChar(syntax.end_arg, command)) {
            command += syntax.end_arg;
        }

        return command;
    };

    var compileSync = function(command) {
        command = preprocess(command);

        var getFunctionArgumentSeparatorIndex = function(command) {
            for (var i in command) {
                if ((command.charAt(i) === syntax.begin_arg) && (command.charAt(i - 1) !== syntax.escape))
                    return parseInt(i);
            }
            return -1;
        };
        var getArgumentsByString = function(command) {
            var getFirstSeparator = function(string) {
                var countActualBeginnings = function(string) {
                    var count = 0;
                    for (var i = 0; i < string.length; i++) {
                        if ((string.charAt(i) === syntax.begin_arg) && (string.charAt(i - 1) !== syntax.escape))
                            count++;
                    }
                    return count;
                };
                var countActualEndings = function(string) {
                    var count = 0;
                    for (var i = 0; i < string.length; i++) {
                        if ((string.charAt(i) === syntax.end_arg) && (string.charAt(i - 1) !== syntax.escape))
                            count++;
                    }
                    return count;
                };
                for (var i = 0; i < string.length; i++) {
                    if ((string.charAt(i) === syntax.arg_sep) && (string.charAt(i - 1) !== syntax.escape) && (countActualEndings(string.substring(0, i)) === countActualBeginnings(string.substring(0, i))))
                        return i;
                }
                return -1;
            };

            var arguments_string = command;
            var arguments = [];

            while (getFirstSeparator(arguments_string) > -1) {
                arguments.push(arguments_string.substring(0, getFirstSeparator(arguments_string)));
                arguments_string = arguments_string.substring(getFirstSeparator(arguments_string) + 1);
            }
            arguments.push(arguments_string);

            return arguments;
        };
        var getArguments = function(command) {
            var arguments_string = command.substring(getFunctionArgumentSeparatorIndex(command) + 1, command.lastIndexOf(syntax.end_arg));
            return getArgumentsByString(arguments_string);
        };
        var convert = function(command) {
            var checkIfFunction = function(string) {
                if (getFunctionArgumentSeparatorIndex(string) > -1)
                    return true;
                return false;
            };
            var removeEscapeChars = function(string) {
                string = string.split(syntax.escape + syntax.escape).join(syntax.escape);
                string = string.split(syntax.escape + syntax.begin_arg).join(syntax.begin_arg);
                string = string.split(syntax.escape + syntax.end_arg).join(syntax.end_arg);
                string = string.split(syntax.escape + syntax.arg_sep).join(syntax.arg_sep);

                return string;
            };

            if (checkIfFunction(command)) {
                var getFunctionName = function(command) {
                    var function_name = command.substring(0, getFunctionArgumentSeparatorIndex(command));
                    function_name = removeEscapeChars(function_name);
                    return function_name;
                };

                var function_object = {
                    function: getFunctionName(command),
                    arguments: getArguments(command)
                };
                for (var i in function_object.arguments) {
                    function_object.arguments[i] = convert(function_object.arguments[i]);
                }
                return function_object;
            } else {
                var convertToObject = function(string) {
                    string = removeEscapeChars(string);

                    return {
                        type: 'text',
                        value: string
                    };
                };
                var object = convertToObject(command);
                return object;
            }
        };

        var commands = getArgumentsByString(command);
        var output = [];

        for (var i in commands) {
            output.push(convert(commands[i]));
        }
        return output;
    };

    var compile = function(command, callback) {
        callback(null, compileSync(command));
    };

    module.exports.compileSync = compileSync;
    module.exports.compile = compile;
})();