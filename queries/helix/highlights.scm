(declaration (identifier) @variable)
(mut_declaration (identifier) @variable)

["defer" "comp" "undefined" "null"] @keyword
"return" @keyword.control.return
"use" @keyword.control.import
["if" "match" "else"] @keyword.control.conditional
["for" "while"] @keyword.control.repeat
["try" "catch"] @keyword.control.exception
["pub" "inline" "mut"] @keyword.storage.modifier
["struct" "enum" "error"] @type.builtin
"type" @type.parameter

(identifier) @variable
(comment) @comment
(block (identifier) @label)
(return_expression (identifier) @label)
(break_expression (identifier) @label)
(continue_expression (identifier) @label)
(member_access (identifier) @variable.other.member)
(fn (identifier) @variable.parameter)
(enum_error_initialization (identifier) @type.enum.variant)

(string) @string
(number) @constant.numeric.integer
(float) @constant.numeric.float
(char) @constant.character

["," "." ":"] @punctuation.delimiter
["(" ")" "[" "]" "{" "}"] @punctuation.bracket

["=" "*=" "%=" "/=" "+=" "-=" "<<=" ">>=" "&=" "^=" "|=" "||" "&&" "==" "!=" ">" ">=" "<" "<=" "&" "|" "<<" ">>" "+" "-" "*" "/" "%"] @operator
