["defer" "comp" "undefined" "null"] @keyword
["if" "match" "else"] @keyword.conditional
["for" "while"] @keyword.control.repeat
["try" "catch"] @keyword.control.exception
["pub" "inline" "mut"] @keyword.storage.modifier
["true" "false"] @constant.builtin.boolean
["struct" "enum" "error" "type"] @type.builtin
["module" "use"] @keyword.control.import
"return" @keyword.control.return

(identifier) @variable

(declaration (identifier) @type (expression (non_literal_expression [(enum) (error) (struct)])))
(declaration (identifier) @function (expression (non_literal_expression (fn))))

(mut_declaration (identifier) @type (expression (non_literal_expression [(enum) (error) (struct)])))
(mut_declaration (identifier) @function (expression (non_literal_expression (fn))))

((identifier) @type.builtin (#match? @type "^(i|u)[0-9]+$"))
((identifier) @type.builtin (#match? @type "^f(16|32|64|128)+$"))

(comment) @comment

(block (identifier) @label)
(return_expression (identifier) @label)
(break_expression (identifier) @label)
(continue_expression (identifier) @label)
(member_access (identifier) @variable.other.member)
(enum_error_initialization (identifier) @type.enum.variant)
(call (non_literal_expression (identifier))) @function.call

(string) @string
(number) @constant.numeric.integer
(float) @constant.numeric.float
(char) @constant.character

(enum_member (identifier) @constant)
(error_member (identifier) @constant)
(struct_member (identifier) @variable.other.member)

(enum_member (declaration (identifier) @variable.other))
(error_member (declaration (identifier) @variable.other))
(struct_member (declaration (identifier) @variable.other))

(struct_initialization name: (identifier) @type)

["," "." ":"] @punctuation.delimiter
["(" ")" "[" "]" "{" "}"] @punctuation.bracket

["=" "*=" "%=" "/=" "+=" "-=" "<<=" ">>=" "&=" "^=" "|=" "||" "&&" "==" "!=" ">" ">=" "<" "<=" "&" "|" "<<" ">>" "+" "-" "*" "/" "%"] @operator

