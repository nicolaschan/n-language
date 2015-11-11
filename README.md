# The Nicolas Language
Based on f(x) notation, the Nicolas language is a flexible way to easily call JavaScript functions. These functions can be nested and return many different JavaScript data types including objects and arrays.
## Syntax
The syntax follows f(x) notation meaning calling a function looks like this:
`functionName(argument)`

Functions can be nested:
`func1(func2(arg))`

And can have multiple arguments:
`func1(arg1,arg2)`

Multiple arguments are treated like an array. The above function passes an array that looks like `[arg1, arg2]` to `func1`.

### Escape characters
Sometimes you might want to have your argument contain reserved characters such as a comma or parentheses. To do this, you can use a backslash to escape them: `func(hello\,there)`

You can also use a shortcut using square brackets to escape the text within them. This is especially useful if there are multiple characters you need to escape: `func([hello,there])`
