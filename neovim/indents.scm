; tree-sitter-dyn — indents for Neovim / nvim-treesitter

[
  (block)
  (struct)
  (enum)
  (case)
  (struct_literal)
  (array_literal)
  (array_type)
  (call)
  (group)
  (fn)
] @indent.begin

[ "}" "]" ")" ] @indent.end
[ (comment) ] @indent.ignore
[ (binary) (assign) (declaration) (call_arg) (struct_literal_member) (struct_member) (enum_member) ] @indent.align
