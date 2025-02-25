/**
 * @file A general systems programming language
 * @author 17robots <mdray@duck.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

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
  ['??', precedences.bitwise],
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
  rules: {
    source_file: $ => seq($.module_decl, repeat(seq($.declaration, ';'))),
    module_decl: $ => seq('module', $.identifier, ';'),
    identifier: _ => token(/(?:(\$)?[A-Za-z][A-Za-z0-9_]*|_[A-Za-z0-9_]*[A-Za-z][A-Za-z0-9_]*)/),
    declaration: $ => seq($.identifier, choice(seq(':=', $.expression), seq(':', $.type_expression, '=', $.expression))),
    mut_declaration: $ => seq(optional('mut'), $.identifier, choice(seq(':=', $.expression), seq(':', $.type_expression, optional(seq('=', $.expression))))),

    while_prefix: $ => seq(optional('inline'), 'while', $.expression, optional(seq(':', $.capture))),
    for_prefix: $ => seq(optional('inline'), 'for', $.expression, repeat(seq(',', $.expression)), ':', $.capture),
    if_prefix: $ => seq(optional('inline'), 'if', $.expression, optional(seq(':', $.capture))),
    match: $ => seq('match', $.expression, '{', repeat($.arm), '}'),
    arm: $ => seq(choice($.expression, '_'), ':', optional($.capture), choice($.expression, $.block, seq($.while_prefix), seq($.for_prefix), seq($.if_prefix), $.assign_expression), ','), // TODO: this needs finished

    statement: $ => choice(
      prec(1, $.match),
      seq($.while_prefix, choice($.block, seq($.statement))),
      seq($.for_prefix, choice($.block, seq(choice($.expression, $.assign_expression), ';'))),
      seq($.if_prefix, choice($.block, seq(choice($.expression, $.assign_expression), ';')), optional(seq('else', choice($.block, $.statement)))),
      seq($.expression, ';'),
      seq($.mut_declaration, ';'),
      seq($.assign_expression, ';'),
    ),

    block: $ => seq('{', repeat($.statement), '}'),

    expression: $ => prec.right(choice(
      $.literal,
      $.expression_without_literal,
      $.binary_expr,
      $.unary_expression,
      $.return_expression,
      $.break_expression,
      $.use,
    )),
    expression_without_literal: $ => prec.right(choice(
      $.type_expression,
      $.range_expression,
      $.array_initializer,
      $.struct_initializer,
      $.enum_error_initializer,
      $.fn,
      $.match,
      $.grouped,
      prec.right(seq($.if_prefix, choice($.expression, $.block), 'else', $.expression)),
    )),
    assign_expression: $ => prec.right(seq(choice($.expression, '_'), choice(...assign_operators), $.expression)),
    range_expression: $ => prec.right(seq($.expression, '..', $.expression)),
    fn: $ => prec.right(seq('(', commaSep(seq(commaSep1($.identifier), ':', $.type_expression, optional(seq('=', $.expression)))), ')', optional($.type_expression), choice($.block, seq('=>', $.expression)))),

    struct_initializer: $ => seq(choice('.', $.identifier), '{', commaSep(seq($.identifier, ':', $.expression)), '}'),
    array_initializer: $ => seq('.', '[', commaSep($.expression),']'),
    enum_error_initializer: $ => prec.right(precedences.member, seq('.', $.identifier, optional(seq('(', $.expression, ')')))),
    // @ts-ignore
    binary_expr: $ => choice(...binary_operators.map(([operator, precedence]) => prec.left(precedence, seq($.expression, operator, $.expression)))),
    unary_expression: $ => prec.left(precedences.unary, seq(choice(...unary_operators), $.expression)),

    optional_dereference: $ => seq($.expression, '.?'),
    pointer_dereference: $ => seq($.expression, '.*'),
    array_index: $ => prec.right(precedences.member, seq($.expression, '[', $.expression, ']')),
    member_access: $ => prec.right(precedences.member, seq($.expression, '.', $.identifier)),
    call: $ => prec(precedences.member, seq($.expression, '(', commaSep($.expression),')')),
    catch: $ => prec.right(precedences.bitwise, seq($.expression, 'catch', optional($.capture), choice($.block, $.expression))),
    try: $ => prec.right(precedences.bitwise, seq('try', $.expression)),
    grouped: $ => seq('(', $.expression, ')'),
    use: $ => prec.right(seq('use', $.identifier, repeat(seq(':', $.identifier)))),
    comp_expression: $ => prec.right(seq('comp', $.expression)),
    return_expression: $ => prec.right(seq('return', optional($.expression))),
    break_expression: $ => prec.right(seq('break', optional(seq(':', $.identifier, optional($.expression))))),
    literal: _ => choice(
      /[0-9]+/,
      /[0-9]+\.[0-9]+/,
      /"[^"]*"/,
      /'[^']*'/,
      'true',
      'false',
      'undefined',
      'null'
    ),

    type_expression: $ => prec.right(choice(
      $.optional_dereference,
      $.pointer_dereference,
      $.array_index,
      $.member_access,
      $.call,
      $.catch,
      $.try,
      $.identifier,
    )),
    primary_type_expression: $ => prec.right(choice(
      $.optional_type,
      $.pointer_type,
      $.array_type,
      prec.right($.fn_type),
      $.struct,
      $.enum,
      $.error,
      $.if_type_expression
    )),
    if_type_expression: $ => prec.right(seq($.if_prefix, choice($.type_expression, $.block), 'else', $.type_expression)),
    optional_type: $ => prec(1, seq('?', $.expression_without_literal)),
    pointer_type: $ => prec.right(1,seq('*', $.expression_without_literal)),
    array_type: $ => prec.right(1, seq('[', ']', $.expression_without_literal)),
    fn_type: $ => prec.right(seq('(', commaSep($.expression_without_literal), ')', optional($.expression_without_literal))),

    struct: $ => seq('struct', '{', repeat($.struct_member), '}'),
    struct_member: $ => choice(seq($.declaration, ';'), seq(commaSep1($.identifier), ':', $.type_expression, optional(seq('=', $.expression)), ',')),

    enum: $ => seq('enum', '{', repeat($.enum_member), '}'),
    enum_member: $ => choice(seq($.declaration, ';'), seq($.identifier, optional(seq(':', $.type_expression)), ',')),

    error: $ => seq('error', '{', repeat($.error_member), '}'),
    error_member: $ => choice(seq($.declaration, ';'), seq($.identifier, optional(seq(':', $.type_expression)), ',')),

    error_union: $ => seq(optional($.type_expression), '!', optional($.type_expression)),

    capture: $ => seq('|', commaSep1(seq(optional('mut'), $.identifier)), '|'),
    comment: _ => token(choice(/\/\/[^\n]*/, /\/\*([^*]|\*+[^/*])*\*+\//)),
  },
})

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)))
}

function commaSep(rule) {
  return optional(commaSep1(rule))
}
