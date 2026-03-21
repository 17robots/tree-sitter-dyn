; Dyn Tree-sitter highlights for Neovim

(doc_comment) @comment.documentation
(line_comment) @comment
(block_comment) @comment

(string_literal) @string
(char_literal) @character
(integer_literal) @number
(float_literal) @number.float
(boolean_literal) @boolean
(null_literal) @constant.builtin

(module_declaration
  name: (identifier) @namespace)

(extern_binding_declaration
  name: (identifier) @function)

(binding_declaration
  name: (identifier) @variable)

(local_binding_statement
  name: (identifier) @variable)

(function_parameter
  name: (identifier) @variable.parameter)

(function_type_parameter
  name: (identifier) @variable.parameter)

(pipe_binding
  (identifier) @variable.parameter)

(named_type
  name: (identifier) @type)

(applied_type
  callee: (identifier) @type)

(struct_literal
  type: (identifier) @type)

(field_expression
  field: (identifier) @property)

(struct_literal_field
  name: (identifier) @property)

(struct_type_member
  name: (identifier) @property)

(enum_type_variant
  name: (identifier) @constructor)

(enum_variant_expression
  variant: (identifier) @constructor)

(enum_pattern
  variant: (identifier) @constructor)

(call_expression
  function: (identifier) @function.call)

(call_expression
  function: (field_expression
    field: (identifier) @function.call))

(builtin_identifier) @function.builtin

(labeled_block_expression
  label: (identifier) @label)

(break_expression
  label: (identifier) @label)

(continue_expression
  label: (identifier) @label)

[
  "module"
  "extern"
  "packed"
  "use"
  "pub"
  "mut"
  "comp"
  "inline"
  "type"
] @keyword

[
  "if"
  "else"
  "match"
  "for"
  "break"
  "continue"
  "return"
  "defer"
] @keyword.control

"fn" @keyword.function
"or" @keyword.operator

[
  "."
  ".."
  "..="
  ".*"
  ".?"
  ".!"
  ":"
  "="
  "=>"
  "+"
  "-"
  "*"
  "/"
  "%"
  "+="
  "-="
  "*="
  "/="
  "%="
  "=="
  "!="
  "<"
  "<="
  ">"
  ">="
  "&&"
  "||"
  "&"
  "|"
  "^"
  "~"
  "<<"
  ">>"
  "<<="
  ">>="
  "?"
] @operator

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

[
  ","
  ";"
] @punctuation.delimiter
