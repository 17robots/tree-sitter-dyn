; tree-sitter-dyn — locals
(block) @local.scope
(function) @local.scope
(source_file) @local.scope

(declaration (identifier) @local.definition.var)
(parameter_group (identifier) @local.definition.parameter)
(identifier) @local.reference
