; tree-sitter-dyn — highlights for Neovim / nvim-treesitter

; Keywords
"pub" "inline" "struct" "enum" "use" @keyword
"if" "else" "case" @keyword.conditional
"for" @keyword.repeat
"return" @keyword.return
"break" "continue" @keyword.control
(builtin_identifier) @keyword

; Operators / punctuation-like operators
"=" "+" "-" "*" "/" "%" "+%" "-%" "*%" "==" "!==" "<" ">" "<=" ">=" "&&" "||" "!" "&" "|" "^" "~" "<<" ">>" ".." "..=" "=>" ".*" @operator

; Literals
(number_) @number
(string_) @string
(char_) @character
(bool_) @boolean
"nil" @constant.builtin
"_" @variable.builtin

; Types
(primitive) @type.builtin
(pointer_type "const" @type.qualifier)
(array_type "const" @type.qualifier)
(identifier (#match? @type "^[A-Z]"))
(identifier (#match? @type "^#"))

; Declarations
(const_variable "const" @type.qualifier)
(const_variable (identifier) @constant)
(thread_local_variable "thread_local" @type.qualifier)
(struct identifier @type)
(enum identifier @type)
(fn identifier @function)

; Parameters / function-like identifiers inside function rule
(fn (identifier) @variable.parameter)

; Fields / members
(field_access (identifier) @variable.member)
(struct_member (identifier) @variable.member)
(struct_literal_member (identifier) @variable.member)
(enum_member (identifier) @constant)

; Calls
(call (identifier) @function.call)
(call (field_access (identifier) @function.method.call))
(call (call_args (identifier) @variable.parameter))

; Labels
(break (identifier) @label)
(continue (identifier) @label)

; Imports
(use (string_literal) @string.special.path)

; Misc
(comment) @comment
(ERROR) @error
