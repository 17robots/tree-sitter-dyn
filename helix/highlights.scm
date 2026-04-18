; Dyn Tree-sitter highlights for Helix

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

(declaration
  name: (identifier) @function
  signature: (extern_function_signature))

; Function-valued bindings
(declaration
  name: (identifier) @function
  value: (expression (primary_expression (function_expression))))

(declaration_statement
  name: (identifier) @function
  value: (expression (primary_expression (function_expression))))

; Type-literal-valued bindings (struct/enum declarations)
(declaration
  name: (identifier) @type
  value: (expression (primary_expression (type_literal_expression))))

(declaration_statement
  name: (identifier) @type
  value: (expression (primary_expression (type_literal_expression))))

; All other bindings
(declaration
  name: (identifier) @variable)

(declaration_statement
  name: (identifier) @variable)

; Associated bindings (TypeName.member := expr)
(declaration
  owner: (identifier) @type
  name: (identifier) @variable)

(declaration
  owner: (type_path) @type)

(declaration
  owner: (identifier) @type
  name: (identifier) @function
  value: (expression (primary_expression (function_expression))))

(declaration
  owner: (identifier) @type
  name: (identifier) @type
  value: (expression (primary_expression (type_literal_expression))))

; Destructure bindings
(destructure_item
  (identifier) @variable)

(function_parameter
  name: (identifier) @variable.parameter)

(function_type_parameter
  name: (identifier) @variable.parameter)

(pipe_binding
  (identifier) @variable.parameter)

(loop_binding
  (identifier) @variable.parameter)

(named_type (identifier) @type)

(applied_type
  callee: (identifier) @type)

(field_expression
  field: (identifier) @property)

(named_field_initializer
  name: (identifier) @property)

(typed_struct_field
  name: (identifier) @property)

(struct_type_field
  name: (identifier) @property)

(enum_type_variant
  name: (identifier) @constructor)

(enum_variant_expression
  variant: (identifier) @constructor)

(enum_pattern
  root: (identifier) @type)

(enum_pattern
  variant: (identifier) @constructor)

(call_expression
  function: (expression (primary_expression (identifier) @function.call)))

(call_expression
  function: (expression (postfix_expression (field_expression field: (identifier) @function.call))))

(builtin_identifier) @function.builtin

(labeled_statement
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
  "struct"
  "enum"
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

"or" @keyword.operator

[
  ":="
  "."
  ".."
  "..="
  ".*"
  ".?"
  ".!"
  ":"
  "="
  "=>"
  "!"
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
  "&="
  "|="
  "^="
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
