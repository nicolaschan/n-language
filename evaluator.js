(function() {
    var evaluateCompiled = function(object) {
        var run = function(object) {
            var functions = require('./functions');

            if (object.arguments.length === 1) {
                object.arguments = object.arguments[0];
            }

            return functions.evaluate(object.function, object.arguments);
        };


        if (object.function !== null && object.function !== undefined) {
            for (var i in object.arguments) {
                object.arguments[i] = evaluateCompiled(object.arguments[i]);
            }
            return run(object);
        } else if (object.type) {
            return object;
        } else {
            var output = [];
            for (var i in object) {
                output.push(evaluateCompiled(object[i]));
            }
            if (output.length === 1) {
                return output[0];
            }
            return output;
        }
    };

    var evaluateSync = function(command) {
        var compiler = require('./compiler');
        return evaluateCompiled(compiler.compileSync(command));
    };
    var evaluate = function(command, callback) {
        callback(null, evaluateSync(command));
    };

    module.exports.evaluateCompiled = evaluateCompiled;
    module.exports.evaluateSync = evaluateSync;
    module.exports.evaluate = evaluate;
})();