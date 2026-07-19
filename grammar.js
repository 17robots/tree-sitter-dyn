/// <reference types="tree-sitter-cli/dsl" />

const PREC = {
  ASSIGN: 1,
  OR: 2,
  AND: 3,
  EQUALITY: 4,
  RELATIONAL: 5,
  BIT_OR: 6,
  BIT_XOR: 7,
  BIT_AND: 8,
  SHIFT: 9,
  ADD: 10,
  MUL: 11,
  PREFIX: 12,
  POSTFIX: 13,
}
const commaSep = (rule) => optional(seq(rule, repeat(seq(",", rule)), optional(",")))
const commaSep1 = (rule) => seq(rule, repeat(seq(",", rule)), optional(","))
module.exports = grammar({
  name: 'dyn',
  extras: $ => [/\s/, $.comment],
  word: $ => $.identifier,
  conflicts: $ => [],
  rules: {
    source_file: $ => repeat(seq(optional(token('pub')), $.declaration)),
    declaration: $ => choice($.use, $.variable, $.const_variable, $.thread_local_variable, $.struct, $.enum, $.fn),
    use: $ => prec.right(seq(token('use'), $.string_literal, optional($.identifier))),
    variable: $ => seq($.identifier, choice($.type_qualifier, seq(optional($.type_qualifier), '=', $.expression))),
    const_variable: $ => seq(token('const'), $.variable),
    thread_local_variable: $ => seq(token('thread_local'), $.variable),
    struct: $ => seq(token('struct'), $.identifier, '{', commaSep($.struct_member), '}'),
    struct_member: $ => seq($.identifier, repeat(seq(',', $.identifier)), $.type_qualifier, optional(seq('=', $.expression))),
    enum: $ => seq(token('enum'), $.identifier, '{', commaSep($.enum_member), '}'),
    enum_member: $ => seq($.identifier, optional($.type_qualifier), optional(seq('=', $.expression))),
    fn: $ => seq(token('fn'), $.identifier, '(', commaSep($.fn_param), ')', optional($.type), $.block),
    fn_param: $ => seq($.identifier, repeat(seq(',', $.identifier)), $.type_qualifier),
    block: $ => seq('{', repeat($.statement), '}'),
    statement: $ => choice($.identifier),
    type_qualifier: $ => seq(':', $.type),
    type: $ => choice($.identifier),
    expression: $ => choice($.identifier),
    bool_literal: _ => choice("true", "false"),
    null_literal: _ => "nil",
    number_literal: _ => token(choice( /0x[0-9A-Fa-f_]+/, /0b[01_]+/, /0o[0-7_]+/, /[0-9][0-9_]*\.[0-9][0-9_]*/, /[0-9][0-9_]*/)),
    string_literal: _ => token(seq( '"', repeat(choice(/[^"\\\n]/, /\\./)), '"')),
    char_literal: _ => token(seq( "'", choice(/[^'\\\n]/, /\\./), "'")),
    builtin_identifier: _ => /#[A-Za-z_][A-Za-z0-9_]*/,
    identifier: _ => /[A-Za-z_][A-Za-z0-9_]*/,
    comment: _ => token(choice( seq("//", /[^\n]*/), seq("/*", repeat(choice(/[^*]/, /\*[^/]/)), "*/"))),
  }
})
