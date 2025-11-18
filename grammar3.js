/**
 * @file A general systems programming language
 * @author 17robots <mdray@duck.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check/

const PRECEDENCE = {
  postfix: 15,
  dot: 14,
  call: 13,
  unary: 12,
  range: 6,
  mul: 5,
  add: 4,
  cmp: 3,
  eq: 2,
  logical: 1,
};

module.exports = grammar({
  name: 'mylang',

  extras: $ => [/\s+/, $.line_comment, $.block_comment],

  conflicts: $ => [
    [$.expression, $.if_expression],
    [$.expression, $.match_expression],
    [$.use_expression, $.call_expression],
    [$.lambda_expression, $.function_signature],
    [$.field_access, $.range_expression],
    [$.iterable_list, $.binary_expression],
  ],

  rules: {
    source_file: $ => seq($.module_declaration, repeat($.top_level)),
    module_declaration: $ => seq(choice('module', 'mod'), field('name', $.identifier), ';'),
    top_level: $ => seq(optional('pub'), $.variable_declaration),
    variable_declaration: $ => seq(optional('mut'), $.identifier, choice($.typed_init, $.untyped_init), ';'),
    typed_init: $ => seq(':', $.expression, optional(seq('=', $.expression))),
    untyped_init: $ => seq(':=', $.expression),
    expression: $ => choice(
      $.primary_expression,
      $.range_expression,
      $.binary_expression,
      $.unary_expression,
      $.field_access,
      $.index_expression,
      $.call_expression,
      $.if_expression,
      $.match_expression,
      $.error_handling_expression,
    ),
    primary_expression: $ => choice(
      $.identifier,
      $.literal,
      $.array_literal,
      $.struct_literal,
      $.enum_literal,
      $.use_expression,
      $.lambda_expression,
      $.block,
      $.grouped
    ),
    identifier: $ => { },
    literal: $ => { },
    array_literal: $ => {},
    struct_literal: $ => {},
    enum_literal: $ => {},
    use_expression: $ => {},
    lambda_expression: $ => {},
    block: $ => {},
    grouped: $ => {},
    range_expression: $ => prec(PRECEDENCE.range, seq($.expression, '..', $.expression)),
    binary_expression: $ => choice(...[
      ['*', '/', '%'],
      ['+', '-'],
      ['==', '!=', '<', '<=', '>', '>='],
      ['&&', '||']
    ].flatMap(([op]) => [
      prec.left(PRECEDENCE.mul, seq($.expression, op, $.expression)),
      prec.left(PRECEDENCE.add, seq($.expression, op, $.expression)),
      prec.left(PRECEDENCE.cmp, seq($.expression, op, $.expression)),
      prec.left(PRECEDENCE.eq, seq($.expression, op, $.expression)),
      prec.left(PRECEDENCE.logical, seq($.expression, op, $.expression)),
    ])),
    unary_expression: $ => prec(PRECEDENCE.unary, seq(choice('-', '!', 'comp', '&', 'try'), $.expression)),
    field_access: $ => prec(PRECEDENCE.dot, seq(field('object', $.expression), '.', field('field', $.identifier))),
    index_expression: $ => prec(PRECEDENCE.dot, seq(field('object', $.expression), '[', field('index', $.expression), ']')),
    call_expression: $ => prec(PRECEDENCE.call, seq(field('function', $.expression), '(', comma_separated($.expression), ')')),
    if_expression: $ => prec(PRECEDENCE.logical, seq($.if_expression, )),
    match_expression: $ => {},
    error_handling_expression: $ => prec.left(PRECEDENCE.postfix, seq(field('value', $.expression), optional($.catch_clause))),
    catch_clause: $ => seq('catch', optional($.capture), $.expression),
    capture: $ => seq(),

    // other
    if_prefix: $ => seq('if', field('condition', $.expression), optional($.capture), ':', optional($.capture)),
    match_prefix: $ => seq('match', field('condition', $.expression), '{', repeat($.case_expression), '}'),
  },
});

function comma_separated1($, rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function comma_separated($, rule) {
  return optional(comma_separated1($, rule));
}
