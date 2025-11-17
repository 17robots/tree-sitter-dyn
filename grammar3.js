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
    variable_declaration: $ => seq(optional('mut'), $.identifier, ),
    typed_init: $ => seq(),
    identifier: $ => {},
  },
});

function comma_separated1($, rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function comma_separated($, rule) {
  return optional(comma_separated1($, rule));
}
