; tree-sitter-dyn — indents (Neovim, nvim-treesitter indent module)
[
  (block)
  (struct_type)
  (enum_type)
  (match_expression)
  (literal_body)
  (array_literal)
  (parameter_list)
  (argument_list)
] @indent.begin

[
  "}"
  ")"
  "]"
] @indent.branch

(comment) @indent.auto
