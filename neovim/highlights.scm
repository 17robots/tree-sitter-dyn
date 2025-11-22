["defer" "comp" "undefined" "null"] @keyword
["if" "match" "else"] @keyword.conditional
["for"] @keyword.repeat
["try" "catch"] @keyword.exception
["pub" "inline" "mut"] @keyword.modifier
["true" "false"] @boolean
["struct" "enum" "error" "type"] @keyword.type
["module", "mod"] @module
"return" @keyword.return
["break" "continue"] @keyword.continue
"use" @keyword.import

(identifier) @variable

(variable_declaration (identifier) @type (typed_decl value: (expression [(enum) (error) (struct) (function_type)])))
(variable_declaration (identifier) @function (typed_decl value: (expression [(function_declaration)])))
(typed_decl type: (expression @type [(identifier)]))

((identifier) @type (#match? @type "^(i|u)[0-9]+$"))
((identifier) @type (#match? @type "^f(16|32|64|128)+$"))

(comment) @comment

(block (identifier) @label)
(return_expression (identifier) @label)
(break_expression (identifier) @label)
(continue_expression (identifier) @label)
(member_access (identifier) @variable.member)
(call_expression (actionable_expression (identifier))) @function.call

(string_literal) @string
(int_literal) @number
(float_literal) @number.float
(char_literal) @character

(enum_member (identifier) @constant)
(error_member (identifier) @constant)
(struct_member (identifier) @property)

(enum_error_member (identifier) @property)
(struct_member (identifier) @property)

(struct_literal name: (identifier) @type)
(enum_error_literal (identifier) @type.variant)

["," "." ":"] @punctuation.delimiter
["(" ")" "[" "]" "{" "}"] @punctuation.bracket

["=" "*=" "%=" "/=" "+=" "-=" "<<=" ">>=" "&=" "^=" "|=" "||" "&&" "==" "!=" ">" ">=" "<" "<=" "&" "|" "<<" ">>" "+" "-" "*" "/" "%"] @operator
