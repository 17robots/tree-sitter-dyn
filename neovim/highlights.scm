[ "pub" "inline" "struct" "enum" "use" ] @keyword
[ "if" "else" "case" ] @keyword.conditional
"for" @keyword.repeat
"return" @keyword.return
[ "break" "continue" ] @keyword.control
[ "defer" "thread_local" ] @keyword
"const" @type.qualifier
[ "#sizeof" "#alignof" "#len" "#cast" ] @function.builtin
[
  "=" "+=" "-=" "*=" "/=" "%=" "&=" "|=" ">>=" "<<=" "~=" "^="
  "+" "-" "*" "/" "%" "+%" "-%" "*%"
  "==" "!=" "<" ">" "<=" ">="
  "&&" "||"
  "&" "|" "^"
  "<<" ">>"
  ".." "..=" "=>" ".*"
] @operator
[ "." "," ":" ] @punctuation.delimiter
[ "(" ")" "[" "]" "{" "}" ] @punctuation.bracket
(number_) @number
(string_) @string
(char_) @character
(bool_) @boolean
(null_) @constant.builtin
"_" @variable.builtin
(primitive) @type.builtin
((identifier) @type (#match? @type "^[A-Z]"))
(struct (identifier) @type)
(enum (identifier) @type)
(type (identifier) @type)
(const_variable "const" @type.qualifier)
(const_variable (variable (identifier) @constant))
(thread_local_variable "thread_local" @keyword.storage)
(thread_local_variable (variable (identifier) @variable))
(variable (identifier) @variable)
(fn (identifier) @function)
(fn_param (identifier) @variable.parameter)
(struct_member (identifier) @variable.member)
(enum_member (identifier) @constant)
(struct_literal_member (identifier) @variable.member)
(field_access (identifier) @variable.member)
(call (primary (identifier) @function.call))
(call (primary (field_access (identifier) @function.method.call)))
(call (primary (identifier) @function.call))
(call (primary (field_access (identifier) @function.method.call)))
(field_access (identifier) @constant)
(break_ (identifier) @label)
(continue_ (identifier) @label)
(for_ (identifier) @label)
(use (string_) @string.special.path)
(comment) @comment
(ERROR) @error
