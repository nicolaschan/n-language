(function() {
    var display = function(object) {
        var chalk = require('chalk');

        var string = '';

        if (!object) {
            return chalk.gray.bold(object);
        }

        if (object.type) {
            if (object.type === 'text') {
                string += chalk.green(object.value);
            } else if (object.type === 'error') {
                string += chalk.bgRed('Error!') + chalk.red(' ' + object.message);
            } else {
                string += chalk.magenta.bold('Object: ') + chalk.magenta(JSON.stringify(object));
            }
        } else {
            string += chalk.gray('[');
            for (var i in object) {
                string += display(object[i]) + chalk.gray(',');
            }
            string = string.substring(0, string.length - 6) + chalk.gray(']');
            if (object.length === 0)
                string = chalk.gray('[]');
        }

        return string;
    };

    module.exports.display = display;
})();