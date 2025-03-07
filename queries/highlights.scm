(declaration (identifier) @variable)
(mut_declaration (identifier) @variable)

["defer" "comp" "undefined" "null"] @keyword
["if" "match" "else"] @keyword.conditional
["for" "while"] @keyword.repeat
["try" "catch"] @keyword.exception
["pub" "inline" "mut"] @keyword.modifier
["struct" "enum" "error" "type"] @keyword.type
"module" @module
"return" @keyword.return
"use" @keyword.import

(declaration (identifier) @module)
(comment) @comment
(block (identifier) @label)
(return_expression (identifier) @label)
(break_expression (identifier) @label)
(continue_expression (identifier) @label)
(member_access (identifier) @variable.member)
(fn (identifier) @variable.parameter)
(enum_error_initialization (identifier) @type.enum.variant)
(call) @function.call

(string) @string
(number) @number
(float) @number.float
(char) @character

(enum_member (identifier) @type)
(error_member (identifier) @type)
(struct_member (identifier) @property)

(enum_member (declaration (identifier) @property))
(error_member (declaration (identifier) @property))
(struct_member (declaration (identifier) @property))

["," "." ":"] @punctuation.delimiter
["(" ")" "[" "]" "{" "}"] @punctuation.bracket

["=" "*=" "%=" "/=" "+=" "-=" "<<=" ">>=" "&=" "^=" "|=" "||" "&&" "==" "!=" ">" ">=" "<" "<=" "&" "|" "<<" ">>" "+" "-" "*" "/" "%"] @operator
