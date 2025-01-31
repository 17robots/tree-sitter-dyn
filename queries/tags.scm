(function_definition
  name: (identifier) @name) @definition.function

(enum_definition
  name: (identifier) @name) @definition.enum

(struct_definition
  name: (identifier) @name) @definition.struct

(error_definition
  name: (identifier) @name) @definition.type

(variable_definition
  name: (identifier) @name) @definition.var

(module_definition
  (string) @name) @definition.module
