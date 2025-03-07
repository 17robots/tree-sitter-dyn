/**
 * @file A general systems programming language
 * @author 17robots <mdray@duck.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check/

const precedences = {
  logical_or: 1,
  logical_and: 2,
  equal: 3,
  bitwise: 4,
  shift: 5,
  add: 6,
  mult: 7,
  unary: 8,
  member: 10,
}

const assign_operators = ['=', '*=', '%=', '/=', '+=', '-=', '<<=', '>>=', '&=', '^=', '|=']

const binary_operators = [
  ['||', precedences.logical_or],
  ['&&', precedences.logical_and],
  ['==', precedences.equal],
  ['!=', precedences.equal],
  ['>', precedences.equal],
  ['>=', precedences.equal],
  ['<', precedences.equal],
  ['<=', precedences.equal],
  ['&', precedences.bitwise],
  ['|', precedences.bitwise],
  ['<<', precedences.shift],
  ['>>', precedences.shift],
  ['+', precedences.add],
  ['-', precedences.add],
  ['*', precedences.mult],
  ['/', precedences.mult],
  ['%', precedences.mult],
]
const unary_operators = ['!', '~', '-', '&']

module.exports = grammar({
  name: 'dyn',
  extras: $ => [/\s+/, $.comment],
  conflicts: $ => [
    [$.statement, $.result_block],
    [$.statement, $.result_block, $.if_expression],
    [$.statement, $.result_block, $.result_block_expr],
    [$.comp, $.expression],
    [$.fn, $.expression],
  ],
  rules: {
    source_file: $ => seq($.module_declaration, repeat(seq($.declaration, ';'))),
    module_declaration: $ => seq('module', $.identifier, ';'),
    declaration: $ => seq(optional('pub'), $.identifier, choice(':=', seq(field('type', seq(':', $.non_literal_expression)), '=')), $.expression),
    mut_declaration: $ => seq(optional('mut'), $.identifier, choice(seq(':=', $.expression), seq(field('type', seq(':', $.non_literal_expression)), optional(seq('=', $.expression))))),

    statement: $ => choice(
      $.for_statement,
      $.if_statement,
      $.while_statement,
      $.defer_statement,
      prec(1, $.match),
      seq($.assign_expression, ';'),
      seq($.expression, ';'),
      seq($.mut_declaration, ';'),
      $.block,
    ),
    block: $ => seq(optional(seq($.identifier, ':')), '{', repeat($.statement), '}'),

    fn: $ => prec.right(seq(optional('inline'), '(', commaSep(seq(optional(seq(commaSep1($.identifier), ':')), field('type', choice($.non_literal_expression, $.comp)))), ')', optional($.non_literal_expression), optional(choice($.block, $.arrow_expression)))),

    arrow_expression: $ => seq('=>', choice($.expression, $.assign_expression)),

    assign_expression: $ => seq($.non_literal_expression, choice(...assign_operators), $.expression),

    if_prefix: $ => seq(token('if'), $.expression, optional(seq(':', $.capture))),
    while_prefix: $ => seq(token('while'), $.expression, optional(seq(':', $.capture))),
    for_prefix: $ => seq(optional('inline'), token('for'), commaSep1(choice($.expression, $.range_expression)), seq(':', $.capture)),
    match: $ => seq(token('match'), $.expression, '{', commaSep($.arm), '}'),
    arm: $ => seq(commaSep1(choice($.expression, '_', $.range_expression)), ':', optional($.capture), $.result_block_expr),

    if_statement: $ => seq($.if_prefix, choice(seq($.block, optional(seq('else', $.result_block))), seq(choice($.expression, $.assign_expression), choice(';', seq('else', $.result_block))))),
    while_statement: $ => seq($.while_prefix, $.result_block),
    for_statement: $ => seq($.for_prefix, $.result_block),
    defer_statement: $ => seq('defer', optional($.capture), $.result_block),
    result_block: $ => choice($.block, $.statement),

    expression: $ => prec.right(choice(
      $.literal,
      $.non_literal_expression,
      $.binary_expression,
      $.unary_expression,
      $.return_expression,
      $.break_expression,
      $.continue_expression,
      $.for_expression,
      $.while_expression,
      $.comp,
    )),
    non_literal_expression: $ => prec.right(choice(
      $.identifier,
      $.if_expression,
      $.nullish_expression,
      $.optional_dereference,
      $.optional_type,
      $.pointer_dereference,
      $.pointer_type,
      $.array_index,
      $.array_type,
      $.error_union_type,
      $.member_access,
      $.call,
      $.catch,
      $.try,
      $.grouped,
      $.struct,
      $.enum,
      $.error,
      $.match,
      $.use,
      $.struct_initialization,
      $.array_initialization,
      $.enum_error_initialization,
      $.fn,
      token('type')
    )),

    binary_expression: $ => choice(...binary_operators.map(([operator, precedence]) => prec.left(precedence, seq($.expression, operator, $.expression)))),
    unary_expression: $ => prec.left(precedences.unary, seq(choice(...unary_operators), $.expression)),

    return_expression: $ => prec.right(seq('return', optional(seq(':', $.identifier)), optional($.expression))),
    break_expression: $ => prec.right(seq('break', optional(seq(':', $.identifier)), optional($.expression))),
    continue_expression: $ => prec.right(seq('continue', optional(seq(':', $.identifier, optional($.expression))))),

    nullish_expression: $ => prec.right(precedences.bitwise, seq($.expression, '??', $.expression)),
    range_expression: $ => seq($.expression, '..', $.expression),
    use: $ => prec.right(seq('use', $.identifier, repeat(seq(':', $.identifier)))),

    optional_dereference: $ => seq($.non_literal_expression, '.?'),
    pointer_dereference: $ => seq($.non_literal_expression, '.*'),
    array_index: $ => prec.right(precedences.member, seq($.non_literal_expression, '[',  $.expression, ']')),
    member_access: $ => prec.right(precedences.member, seq($.non_literal_expression, '.', $.identifier)),
    call: $ => prec.right(precedences.member, seq($.non_literal_expression, '(', commaSep($.expression), ')')),

    catch: $ => prec.right(precedences.bitwise, seq($.non_literal_expression, 'catch', optional($.capture), choice($.block, $.expression))),
    try: $ => prec.right(precedences.bitwise, seq('try', $.non_literal_expression)),
    comp: $ => prec.right(seq('comp', $.non_literal_expression)),

    optional_type: $ => prec.right(1, seq('?', $.non_literal_expression)),
    pointer_type: $ => prec.right(1, seq('*', $.non_literal_expression)),
    array_type: $ => prec.right(1, seq('[', ']', $.non_literal_expression)),
    error_union_type: $ => prec.right(1, seq(optional($.non_literal_expression), '!', optional(seq(repeat(seq($.non_literal_expression, '!')), $.non_literal_expression)))),

    grouped: $ => seq('(', $.expression, ')'),
    while_expression: $ => prec.right(seq($.while_prefix, $.result_block_expr)),
    for_expression: $ => prec.right(seq($.for_prefix, $.result_block_expr)),
    result_block_expr: $ => prec.right(choice($.block, $.expression, $.assign_expression)),

    array_initialization: $ => seq('[', commaSep($.expression), ']'),
    enum_error_initialization: $ => prec.right(seq('.', $.identifier, optional(seq('(', $.expression, ')')))),
    struct_initialization: $ => seq('.', optional(field('name', $.identifier)), '{', commaSep(seq($.identifier, ':', $.expression)), '}'),

    struct: $ => seq('struct', '{', repeat($.struct_member), '}'),
    struct_member: $ => choice(seq($.declaration, ';'), seq(commaSep1($.identifier), field('type', seq(':', $.non_literal_expression)), optional(seq('=', $.expression)), ',')),
    enum: $ => seq('enum', '{', repeat($.enum_member), '}'),
    enum_member: $ => choice(seq($.declaration, ';'), seq($.identifier, optional(field('type', seq(':', $.non_literal_expression))), ',')),
    error: $ => seq('error', '{', repeat($.error_member), '}'),
    error_member: $ => choice(seq($.declaration, ';'), seq($.identifier, optional(field('type', seq(':', $.non_literal_expression))), ',')),

    if_expression: $ => prec.right(seq($.if_prefix, choice($.expression, $.block), 'else', choice($.expression, $.block))),

    capture: $ => seq('|', commaSep1(seq(optional('mut'), $.identifier)), '|'),

    identifier: _ => token(/[a-zA-Z_][a-zA-Z0-9_]*/),
    comment: _ => token(choice(/\/\/[^\n]*/, /\/\*([^*]|\*+[^/*])*\*+\//)),
    literal: $ => choice($.number, $.float, $.string, $.char, 'true', 'false', 'undefined', 'null'),
    number: _ => token(/[0-9]+/),
    float: _ => token(/[0-9]+\.[0-9]+/),
    char: _ => token(/'[^']*'/),
    string: _ => token(/"[^"]*"/)
  },
})

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)))
}

function commaSep(rule) {
  return optional(commaSep1(rule))
}
