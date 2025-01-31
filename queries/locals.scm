 (block) @scope
(function_definition) @scope
(for_statement) @scope
(while_statement) @scope
(match_statement) @scope

(function_definition
  name: (identifier) @definition.function)
  
(variable_definition
  name: (identifier) @definition.var)

(parameter_list
  (identifier) @definition.parameter)

(capture
  (identifier) @definition.var)

(identifier) @reference
