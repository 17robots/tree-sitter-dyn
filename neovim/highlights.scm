; tree-sitter-dyn — highlights for Neovim / nvim-treesitter

; Keywords
[
  "pub"
  "mut"
  "inline"
  "struct"
  "enum"
  "use"
] @keyword

[
  "if"
  "else"
  "case"
] @keyword.conditional

"for" @keyword.repeat

"return" @keyword.return

[
  "break"
  "continue"
] @keyword.control

; Operators / punctuation-like operators
[
  "=" "+" "-" "*" "/" "%" "+%" "-%" "*%" "==" "!==" "<" ">"
  "<=" ">=" "&&" "||" "!" "&" "|" "^" "~" "<<" ">>" "+=" "-="
  "*=" "/=" "%=" "&=" "|=" "^=" "<<=" ">>=" ".." "=>" ".*"
] @operator

; Literals
(int_literal) @number
(float_literal) @number.float
(string_literal) @string
(char_literal) @character
(boolean_literal) @boolean
"null" @constant.builtin
"_" @variable.builtin

; Types
(builtin) @type.builtin

(pointer_type
  "mut" @type.qualifier)

(array_type
  "mut" @type.qualifier)

((identifier) @type
  (#match? @type "^[A-Z]"))

; Declarations
(declaration
  (decl_lhs
    (identifier) @variable))

; Function declarations:
; name = (...) ...
(declaration
  (decl_lhs
    (identifier) @function)
  "="
  (primary_expression
    (grouped)?)*)

(declaration
  (decl_lhs
    (identifier) @function)
  "="
  (function))

; Parameters / function-like identifiers inside function rule
(function
  (identifier) @variable.parameter)

; Fields / members
(field_postfix
  (identifier) @variable.member)

(struct_member
  (identifier) @variable.member)

(struct_init_member
  (identifier) @variable.member)

(enum_member
  (identifier) @constant)

(enum_literal
  (identifier) @constant)

; Calls
(postfix
  (identifier) @function.call
  (call_postfix))

(postfix
  (postfix
    (field_postfix
      (identifier) @function.method.call))
  (call_postfix))

(call_arg
  (identifier) @variable.parameter)

; Labels
(break
  (identifier) @label)

(continue
  (identifier) @label)

; Imports
(use
  (string_literal) @string.special.path)

; Misc
(comment) @comment
(ERROR) @error
