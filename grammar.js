/**
 * @file A general systems programming language
 * @author 17robots <mdray@duck.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check/
const precedence = {
  default: 10,
  unary: 9,
  mul: 7,
  add: 6,
  shift: 5,
  bitwise: 4,
  cmp: 3,
  logical: 2,
}
const assign_operators = ['=', '*=', '%=', '/=', '+=', '-=', '<<=', '>>=', '&=', '^=', '|=']
const binary_operators = [
  ['||', precedence.logical],
  ['&&', precedence.logical],
  ['==', precedence.cmp],
  ['!=', precedence.cmp],
  ['>', precedence.cmp],
  ['>=', precedence.cmp],
  ['<', precedence.cmp],
  ['<=', precedence.cmp],
  ['&', precedence.shift],
  ['|', precedence.shift],
  ['<<', precedence.shift],
  ['>>', precedence.shift],
  ['+', precedence.add],
  ['-', precedence.add],
  ['*', precedence.mul],
  ['/', precedence.mul],
  ['%', precedence.mul],
  ['??', precedence.default],
]
const unary_operators = ['!', '~', '-', '&']

module.exports = grammar({
  name: 'dyn',
  extras: $ => [/\s+/, $.comment],
  conflicts: $ => [
    [$.actionable_expression, $.parameter],
    [$.paren_expression, $.function_type],
    [$.break_expression],
    [$.return_expression],
    [$.expression, $.statement_nosemicolon],
    [$.struct_literal, $.block],
    [$.variable_declaration, $.actionable_expression, $.block],
    [$.continue_expression],
    [$.statement, $.statement_nosemicolon],
    [$.statement_nosemicolon],
    [$.expression, $.assign_expression],
    [$.typed_decl],
    [$.expression, $.parameter],
    [$.block],
    [$.array_literal, $.array_type],
    [$.actionable_expression, $.semicolon_statement],
    [$.error_suffix],
    [$.function_type],
  ],
  rules: {
    source_file: $ => seq($.module_declaration, repeat($.top_level)),
    module_declaration: $ => seq(choice('module', 'mod'), $.identifier, ';'),
    top_level: $ => seq(optional('pub'), $.variable_declaration, ';'),
    variable_declaration: $ => seq(optional('mut'), $.identifier, choice($.typed_decl, $.untyped_decl)),
    typed_decl: $ => seq(':', field('type', $.expression), field('value', optional(seq('=', $.expression)))),
    untyped_decl: $ => seq(':=', $.expression),
    expression: $ => choice(
      $.actionable_expression,
      $.binary_expression,
      $.catch_expression,
      $.comp_expression,
      $.function_declaration,
      seq($.if_expression, $.expression, 'else', $.expression),
      $.literal,
      $.match_expression,
      'null',
      $.statement_nosemicolon,
      $.try_expression,
      $.type,
      $.unary_expression,
      $.use,
    ),
    actionable_expression: $ => choice(
      $.array_access,
      $.identifier,
      $.member_access,
      $.optional_dereference,
      $.paren_expression,
      $.pointer_dereference,
      $.call_expression,
    ),
    array_access: $ => seq($.actionable_expression, '[', $.int_literal, ']'),
    identifier: _ => token(/[a-zA-Z_][a-zA-Z0-9_]*/),
    member_access: $ => seq($.actionable_expression, '.', $.identifier),
    optional_dereference: $ => seq($.actionable_expression, '.', '?'),
    paren_expression: $ => seq('(', $.expression, ')'),
    pointer_dereference: $ => seq($.actionable_expression, '.', '*'),
    binary_expression: $ => choice(...binary_operators.map(([o, p]) => prec.left(p, seq($.expression, o, $.expression)))),
    catch_expression: $ => seq($.call_expression, 'catch', optional($.capture), $.expression),
    comp_expression: $ => seq('comp', choice($.block, $.call_expression)),
    function_declaration: $ => seq(optional('inline'), '(', comma_separated($.parameter), ')', choice($.type, $.actionable_expression), optional($.error_suffix), choice($.block, seq('=>', $.expression))),
    parameter: $ => seq(comma_separated1($.identifier), ':', choice($.type, $.actionable_expression, seq('comp', 'type'))),
    literal: $ => choice(
      $.array_literal,
      $.boolean_literal,
      $.char_literal,
      $.enum_error_literal,
      $.float_literal,
      $.int_literal,
      $.string_literal,
      $.struct_literal,
    ),
    array_literal: $ => seq('[', comma_separated($.expression), ']'),
    boolean_literal: _ => choice('true', 'false'),
    char_literal: _ => token(seq("'", choice(/[^'\\]/, /\\./), "'")),
    enum_error_literal: $ => seq('.', $.identifier, optional(seq('(', $.expression, ')'))),
    float_literal: _ => token(/[0-9]+\.[0-9]+/),
    int_literal: _ => token(/[0-9]+/),
    string_literal: _ => token(seq('"', repeat(choice(/[^"\\]/, /\\./)), '"')),
    struct_literal: $ => seq(optional($.identifier), '{', comma_separated($.struct_literal_member), '}'),
    struct_literal_member: $ => seq($.identifier, ':', $.expression),
    try_expression: $ => seq('try', $.call_expression),
    type: $ => choice(
      $.enum_error_declaration,
      $.struct_declaration,
      $.array_type,
      $.function_type,
      $.optional_type,
      $.pointer_type,
      'type',
      'void',
    ),
    enum_error_declaration: $ => seq(choice('enum', 'error'), '{', comma_separated($.enum_error_member), '}'),
    enum_error_member: $ => seq(
      $.identifier,
      optional(choice(
        seq(':=', $.expression),
        seq(':', choice($.actionable_expression, $.type), optional(seq('=', $.expression)))
      ))
    ),
    error_suffix: $ => seq('!', optional(seq(repeat(seq($.identifier, '!')), $.identifier))),
    struct_declaration: $ => seq('struct', '{', comma_separated($.struct_member), '}'),
    struct_member: $ => seq(comma_separated1($.identifier), choice(
      seq(':=', $.expression),
      seq(':', choice($.actionable_expression, $.type), optional(seq('=', $.expression)))
    )),
    array_type: $ => seq('[', ']', choice($.actionable_expression, $.type)),
    function_type: $ => seq('(', comma_separated(choice($.expression, seq('comp', 'type'))), ')', choice($.actionable_expression, $.type), optional($.error_suffix)),
    optional_type: $ => seq('?', choice($.actionable_expression, $.type)),
    pointer_type: $ => seq('*', choice($.actionable_expression, $.type)),
    unary_expression: $ => choice(...unary_operators.map(([o]) => prec.left(precedence.unary, seq(o, $.expression)))),
    use: $ => seq('use', $.string_literal),
    block: $ => seq(optional(seq($.identifier, ':')), '{', repeat($.statement), '}'),
    range_expression: $ => choice(
      seq($.int_literal, '..', $.int_literal),
      seq($.char_literal, '..', $.char_literal),
    ),
    statement: $ => choice(
      $.block,
      seq('defer', optional($.capture), $.statement),
      seq($.for_expression, $.statement),
      seq($.if_expression, optional(seq($.statement_nosemicolon, 'else')), $.statement),
      $.match_expression,
      seq($.semicolon_statement, ';')
    ),
    statement_nosemicolon: $ => choice(
      $.block,
      seq($.for_expression, $.statement_nosemicolon),
      seq($.if_expression, optional(seq($.statement_nosemicolon, 'else')), $.statement_nosemicolon),
      $.match_expression,
      $.semicolon_statement
    ),
    semicolon_statement: $ => choice(
      $.assign_expression,
      $.break_expression,
      $.call_expression,
      $.continue_expression,
      $.return_expression,
      $.variable_declaration
    ),
    assign_expression: $ => choice(...assign_operators.map(op => seq(choice($.actionable_expression, '_'), op, $.expression))),
    break_expression: $ => seq('break', optional(seq(':', $.identifier)), optional($.expression)),
    call_expression: $ => seq($.actionable_expression, '(', comma_separated($.expression), ')'),
    continue_expression: $ => seq('continue', optional(seq(':', $.identifier))),
    return_expression: $ => seq('return', optional($.expression)),
    for_expression: $ => seq('for', optional(comma_separated(choice($.expression, $.range_expression))), ':', optional($.capture)),
    if_expression: $ => seq('if', $.expression, ':', optional($.capture)),
    match_expression: $ => seq('match', $.expression, ':', '{', comma_separated($.arm), '}'),
    arm: $ => seq(
      choice(comma_separated1(choice($.expression, $.range_expression)), '_'),
      ':',
      $.expression
    ),
    capture: $ => seq('|', comma_separated1(seq(optional('mut'), $.identifier)), '|'),
    comment: _ => token(choice(/\/\/[^\n]*/, /\/\*([^*]|\*+[^/*])*\*+\//)),
  }
})

function comma_separated1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function comma_separated(rule) {
  return optional(comma_separated1(rule));
}
