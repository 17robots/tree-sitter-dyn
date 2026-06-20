; tree-sitter-dyn — indents for Neovim / nvim-treesitter

[
  (block)
  (struct)
  (enum)
  (case)
  (struct_postfix)
  (array_literal)
  (array_type)
  (call_postfix)
  (grouped)
  (function)
] @indent.begin

[
  "}"
  "]"
  ")"
] @indent.end

[
  (comment)
] @indent.ignore

[
  (binary)
  (compound_assign)
  (call_arg)
  (struct_init_member)
  (struct_member)
  (enum_member)
] @indent.align
