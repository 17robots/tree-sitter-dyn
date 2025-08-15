["defer" "comp" "undefined" "null"] @keyword
["if" "match" "else"] @keyword.conditional
["for" "while"] @keyword.repeat
["try" "catch"] @keyword.exception
["pub" "inline" "mut"] @keyword.modifier
["true" "false"] @boolean
["struct" "enum" "error" "type"] @keyword.type
"module" @module
"return" @keyword.return
"use" @keyword.import

(identifier) @variable

(declaration (identifier) @type (expression (non_literal_expression [(enum) (error) (struct)])))
(declaration (identifier) @function (expression (non_literal_expression (fn))))

(mut_declaration (identifier) @type (expression (non_literal_expression [(enum) (error) (struct)])))
(mut_declaration (identifier) @function (expression (non_literal_expression (fn))))

((identifier) @type (#match? @type "^(i|u)[0-9]+$"))
((identifier) @type (#match? @type "^f(16|32|64|128)+$"))

(comment) @comment

(block (identifier) @label)
(return_expression (identifier) @label)
(break_expression (identifier) @label)
(continue_expression (identifier) @label)
(member_access (identifier) @variable.member)
(enum_error_initialization (identifier) @type.enum.variant)
(call (non_literal_expression (identifier))) @function.call

(string) @string
(number) @number
(float) @number.float
(char) @character

(enum_member (identifier) @constant)
(error_member (identifier) @constant)
(struct_member (identifier) @property)

(enum_member (declaration (identifier) @property))
(error_member (declaration (identifier) @property))
(struct_member (declaration (identifier) @property))

(struct_initialization name: (identifier) @type)

["," "." ":"] @punctuation.delimiter
["(" ")" "[" "]" "{" "}"] @punctuation.bracket

["=" "*=" "%=" "/=" "+=" "-=" "<<=" ">>=" "&=" "^=" "|=" "||" "&&" "==" "!=" ">" ">=" "<" "<=" "&" "|" "<<" ">>" "+" "-" "*" "/" "%"] @operator
