; Dyn Tree-sitter locals for Helix

(source_file) @local.scope
(block_expression) @local.scope
(function_expression) @local.scope
(match_expression) @local.scope
(match_arm) @local.scope
(for_expression) @local.scope
(labeled_block_expression) @local.scope

(module_declaration
  name: (identifier) @local.definition)

(extern_binding_declaration
  name: (identifier) @local.definition)

(binding_declaration
  name: (identifier) @local.definition)

(local_binding_statement
  name: (identifier) @local.definition)

(function_parameter
  name: (identifier) @local.definition)

(function_type_parameter
  name: (identifier) @local.definition)

(pipe_binding
  (identifier) @local.definition)

(pattern_binding_list
  (identifier) @local.definition)

(identifier) @local.reference
