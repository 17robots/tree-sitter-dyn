["defer" "comp" "null" "mod" "module"] @keyword
["if" "match" "else"] @keyword.conditional
"for" @keyword.repeat
["try" "catch"] @keyword.exception
["pub" "inline" "mut"] @keyword.modifier
["true" "false"] @boolean
["struct" "enum" "error" "type" "void"] @keyword.type
"return" @keyword.return
["break" "continue"] @keyword.continue
"use" @keyword.import

(identifier) @variable
((identifier) @type (#match? @type "^f(16|32|64|128)+$"))
((identifier) @type (#match? @type "^(i|u)[0-9]+$"))

(comment) @comment

(call_expression (actionable_expression (identifier) @function.call))
(call_expression (actionable_expression (member_access (identifier) @function.method.call)))

(member_access (identifier) @variable.member)

(variable_declaration (identifier) @function (typed_decl value: (expression [(function_declaration)])))
(variable_declaration (identifier) @type (typed_decl value: (expression [(type)])))
(variable_declaration (identifier) @function (untyped_decl (expression [(function_declaration)])))
(variable_declaration (identifier) @type (untyped_decl (expression [(type)])))

(block (identifier) @label)
(break_expression (identifier) @label)
(continue_expression (identifier) @label)
(enum_error_literal (identifier) @type.variant)
(enum_error_member name: (identifier) @variable.member)
(enum_error_member name: (identifier) @function.method (expression [(function_declaration)]))
(expression [(type)]) @type
(module_declaration (identifier) @module)
(parameter (identifier) @variable.parameter)
(struct_literal (identifier) @type)
(struct_literal_member (identifier) @variable.member)
(struct_member (identifier) @variable.member)
(struct_member (identifier) @function.method (expression [(function_declaration)]))

(boolean_literal) @boolean
(char_literal) @character
(float_literal) @number.float
(int_literal) @number
(string_literal) @string

["," "." ":" ";"] @punctuation.delimiter
["(" ")" "[" "]" "{" "}"] @punctuation.bracket
["=" "*=" "%=" "/=" "+=" "-=" "<<=" ">>=" "&=" "^=" "|=" "||" "&&" "==" "!=" ">" ">=" "<" "<=" "&" "|" "<<" ">>" "+" "-" "*" "/" "%"] @operator
