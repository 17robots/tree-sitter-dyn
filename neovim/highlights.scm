; tree-sitter-dyn — highlights for Neovim (nvim-treesitter capture names)

; -------------------------------------------------------------- keywords
[
  "struct"
  "enum"
  "use"
  "pub"
  "mut"
  "comp"
  "inline"
] @keyword

"defer" @keyword
(context_expression) @variable.builtin

[
  "if"
  "else"
  "match"
] @keyword.conditional

[
  "for"
  "in"
] @keyword.repeat

"return" @keyword.return

[
  "break"
  "continue"
  "or"
] @keyword.control

; ------------------------------------------------------------- operators
[
  "=" "+" "-" "*" "/" "%" "+%" "-%" "*%"
  "==" "!=" "<" ">" "<=" ">="
  "&&" "||" "!" "&" "|" "^" "~" "<<" ">>"
  "+=" "-=" "*=" "/=" "%=" "&=" "|=" "^=" "<<=" ">>="
  ".." "..=" "=>" "?"
] @operator

; ------------------------------------------------------------- literals
(int_literal) @number
(float_literal) @number.float
(string_literal) @string
(char_literal) @character
(boolean_literal) @boolean
"null" @constant.builtin
"undefined" @constant.builtin
"_" @variable.builtin

; ---------------------------------------------------------------- types
(builtin_type) @type.builtin
(type_identifier) @type
(pointer_type "mut" @type.qualifier)
(slice_type "mut" @type.qualifier)
(array_type "mut" @type.qualifier)
((identifier) @type
  (#match? @type "^[A-Z]"))

; ------------------------------------------------------------ functions
; `name = (params) ... { }` and `name = (params) ... => expr`
(declaration
  (identifier) @function
  (function))

(call_expression
  function: (identifier) @function.call)
(call_expression
  function: (field_expression field: (identifier) @function.method.call))

(parameter_group (identifier) @variable.parameter)

(directive) @function.macro
(directive_expression (directive) @function.macro)

; -------------------------------------------------------------- members
(field_expression field: (identifier) @variable.member)
(field_group (identifier) @variable.member)
(field_init (identifier) @variable.member)
(enum_variant (identifier) @constant)
(enum_shorthand (identifier) @constant)
(variant_pattern (identifier) @constant)

; --------------------------------------------------------------- misc
(use_expression (string_literal) @string.special.path)
(label (identifier) @label)
(break_statement (identifier) @label)
(continue_statement (identifier) @label)
(comment) @comment

(ERROR) @error
