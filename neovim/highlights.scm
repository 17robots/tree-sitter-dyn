; bool
(bool_) @boolean

; char
(char_) @character

; comment
(comment) @comment

; constant
(const_variable (variable (identifier) @constant))
(enum_member (identifier) @constant)
(field_access (identifier) @constant)
(null_) @constant.builtin

; error
(ERROR) @error

; function
(fn (identifier) @function)
[ "#sizeof" "#alignof" "#len" "#cast" "#panic" "#syscall" ] @function.builtin
(call (primary (identifier) @function.call))
(call (primary (field_access (identifier) @function.method.call)))

; keyword
[ "pub" "inline" "struct" "enum" "use" "fn" "defer" "type" ] @keyword
[ "if" "else" "case" ] @keyword.conditional
[ "break" "continue" ] @keyword.control
"for" @keyword.repeat
"return" @keyword.return
(thread_local_variable "thread_local" @keyword.storage)

; label
(break_ (identifier) @label)
(continue_ (identifier) @label)
(for_ (identifier) @label)

; operator
[
  "=" "+=" "-=" "*=" "/=" "%=" "&=" "|=" ">>=" "<<=" "~=" "^="
  "+" "-" "*" "/" "%" "+%" "-%" "*%"
  "==" "!=" "<" ">" "<=" ">="
  "&&" "||"
  "&" "|" "^"
  "<<" ">>"
  ".." "..=" "=>" ".*"
] @operator

; punctuation
[ "(" ")" "[" "]" "{" "}" ] @punctuation.bracket
[ "." "," ":" ] @punctuation.delimiter

; number
(number_) @number

; string
(string_) @string
(escape_sequence) @string.escape
(use (string_) @string.special.path)

; type
(enum (identifier) @type)
(struct (identifier) @type)
((identifier) @type (#match? @type "^[A-Z]"))
(type (field_type (identifier) @type))
(type_alias (identifier) @type)
(dynamic_type) @type.builtin
(primitive) @type.builtin
"const" @type.qualifier
(struct "packed" @type.qualifier)

; variable
(thread_local_variable (variable (identifier) @variable))
(variable (identifier) @variable)
"_" @variable.builtin
(field_access (identifier) @variable.member)
(struct_literal_member (identifier) @variable.member)
(struct_member (identifier) @variable.member)
(fn_param (identifier) @variable.parameter)
