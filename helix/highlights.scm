; tree-sitter-dyn — highlights for Helix

["struct" "enum"] @keyword.storage.type
["mut" "comp" "inline"] @keyword.storage.modifier
["use" "pub"] @keyword.control.import
["if" "else" "match"] @keyword.control.conditional
["for" "in"] @keyword.control.repeat
"return" @keyword.control.return
["break" "continue" "or" "defer"] @keyword.control
(context_expression) @variable.builtin

[
  "=" "+" "-" "*" "/" "%" "+%" "-%" "*%"
  "==" "!=" "<" ">" "<=" ">="
  "&&" "||" "!" "&" "|" "^" "~" "<<" ">>"
  "+=" "-=" "*=" "/=" "%=" "&=" "|=" "^=" "<<=" ">>="
  ".." "..=" "=>" "?"
] @operator

(int_literal) @constant.numeric.integer
(float_literal) @constant.numeric.float
(string_literal) @string
(char_literal) @constant.character
(boolean_literal) @constant.builtin.boolean
"null" @constant.builtin
"undefined" @constant.builtin
"_" @variable.builtin

(builtin_type) @type.builtin
(type_identifier) @type
((identifier) @type (#match? @type "^[A-Z]"))

(declaration (identifier) @function (function))
(call_expression function: (identifier) @function)
(call_expression function: (field_expression field: (identifier) @function.method))
(parameter_group (identifier) @variable.parameter)
(directive) @function.macro

(field_expression field: (identifier) @variable.other.member)
(field_group (identifier) @variable.other.member)
(field_init (identifier) @variable.other.member)
(enum_variant (identifier) @type.enum.variant)
(enum_shorthand (identifier) @type.enum.variant)
(variant_pattern (identifier) @type.enum.variant)

(use_expression (string_literal) @string.special.path)
(label (identifier) @label)
(comment) @comment
