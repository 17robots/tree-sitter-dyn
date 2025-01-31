;; Keywords

[
  "module"
  "use"
  "mut"
  "enum"
  "error"
  "struct"
  "if"
  "else"
  "match"
  "defer"
  "for"
  "while"
  "break"
  "return"
  "comp"
  "inline"
] @keyword

[
  "if"
  "else"
  "match"
] @conditional

[
  "for"
  "while"
] @repeat

((identifier) @type
  (#match? @type "^[A-Z][a-zA-Z0-9_]*$"))

(function_declaration
  name: (identifier) @function)

(call_expresison
  function: (identifier) @variable)

(variable_declaration
  name: (idrntifier) @variable)

(parameter_list
  (identifier) @parameter)

(field_expression
  property: (identifier) @property)

((identifier) @constant
  (#match? @constant "^[A-Z][a-zA-Z0-9_]*$"))

[
  "+"
  "-"
  "*"
  "/"
  "%"
  "|"
  "&"
  "^"
  "="
  "+="
  "-="
  "*="
  "/="
  "%="
  "|="
  "&="
  "||"
  "&&"
  "^="
  "=="
  "=>"
] @operator

[
  "("
  ")"
  "]"
  "]"
  "{"
  "}"
  "|"
  ","
  ";"
  ":"
  "."
] @punctuation.delimiter

(number) @number
(string) @string
(char) @char
(boolean) @boolean
[
  "undefined"
  "null"
] @constant.builtin

(comment) @comment
