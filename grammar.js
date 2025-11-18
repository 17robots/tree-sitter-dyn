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
  range: 8,
  mul: 7,
  add: 6,
  shift: 5,
  bitwise: 4,
  cmp: 3,
  logical: 2,
  eq: 1,
};

const assign_operators = ['=', '*=', '%=', '/=', '+=', '-=', '<<=', '>>=', '&=', '^=', '|=']
const binary_operators = [
  ['||', PRECEDENCE.logical],
  ['&&', PRECEDENCE.logical],
  ['==', PRECEDENCE.cmp],
  ['!=', PRECEDENCE.cmp],
  ['>', PRECEDENCE.cmp],
  ['>=', PRECEDENCE.cmp],
  ['<', PRECEDENCE.cmp],
  ['<=', PRECEDENCE.cmp],
  ['&', PRECEDENCE.shift],
  ['|', PRECEDENCE.shift],
  ['<<', PRECEDENCE.shift],
  ['>>', PRECEDENCE.shift],
  ['+', PRECEDENCE.add],
  ['-', PRECEDENCE.add],
  ['*', PRECEDENCE.mul],
  ['/', PRECEDENCE.mul],
  ['%', PRECEDENCE.mul],
]
const unary_operators = ['!', '~', '-', '&']

// TODO: assign statements; fill in missing
module.exports = grammar({
  name: 'dyn',

  extras: $ => [/\s+/, $.comment],

  conflicts: $ => [],

  rules: {
    /* root */
    source_file: $ => seq($.module_declaration, repeat($.top_level)),
    module_declaration: $ => seq(choice('module', 'mod'), $.identifier, ';'),
    top_level: $ => seq(optional('pub'), $.variable_declaration, ';'),
    variable_declaration: $ => seq(optional('mut'), $.identifier, choice($.typed_decl, $.untyped_decl)),
    typed_decl: $ => seq(':', $.type, optional(seq('=', $.expression))),
    untyped_decl: $ => seq(':=', $.expression),

    /* expressions */
    expression: $ => choice(
      // declarations
      $.function_declaration,
      $.labeled_block,

      // primitive
      $.literal,
      $.type,

      // other
      $.assign_expression,
      $.binary_expression,
      $.catch_expression,
      $.range_expression,
      $.try_expression,
      $.unary_expression,
      $.use_expression
    ),

    /* expressions - declarations */
    block: $ => seq('{', repeat($.statement), '}'),
    labeled_block: $ => seq(seq($.identifier, ':'), '{', repeat($.statement), '}'),
    enum_declaration: $ => seq('enum', '{', comma_separated($.member), '}'),
    error_declaration: $ => seq('error', '{', comma_separated($.member), '}'),
    function_declaration: $ => seq(optional('inline'), '(', comma_separated($.parameter), ')', $.type, choice($.block, seq('=>', $.expression))),
    parameter: $ => seq(comma_separated1($.identifier), ':', choice($.type, seq('comp', 'type'))),
    member: $ => seq($.identifier, optional(choice(
      seq(':', $.type, optional(seq('=', $.expression))),
      seq(':=', $.expression)
    ))),
    struct_declaration: $ => seq('struct', '{', comma_separated($.struct_member), '}'),
    struct_member: $ => seq(comma_separated1($.identifier), choice(
      seq(':', $.type, optional(seq('=', $.expression))),
      seq(':=', $.expression),
    )),

    /* expressions - primitive */
    identifier: _ => token(/[a-zA-Z_][a-zA-Z0-9_]*/),
    literal: $ => choice(
      $.enum_literal,
      $.struct_literal,
      $.error_literal,
      $.int_literal,
      $.float_literal,
      $.string_literal,
      $.char_literal,
      $.boolean_literal,
    ),
    type: $ => choice(
      // declarations
      $.enum_declaration,
      $.error_declaration,
      $.struct_declaration,

      // primitives
      $.array_type,
      $.function_type,
      $.optional_type,
      $.pointer_type,
      'type',
      'void',

      // expressions
      $.default_expression,
      $.actionable_expression,
      $.comp_call_expression,

      // statements
      $.break_expression,
      $.for_expression,
      $.return_expression,
    ),

    /* type - primitive */
    array_type: $ => seq('[', ']', $.type),
    function_type: $ => seq('(', comma_separated($.type), ')', $.type),
    optional_type: $ => seq('?', $.type),
    pointer_type: $ => seq('*', $.type),

    /* expressions - other */
    default_expression: $ => seq(field('item', $.actionable_expression), '??', field('default', $.expression)),
    assign_expression: $ => prec.right(PRECEDENCE.eq, seq($.actionable_expression, choice(...assign_operators), $.expression)),
    comp_call_expression: $ => seq('comp', $.call_expression),
    try_expression: $ => seq('try', $.call_expression),
    catch_expression: $ => prec(PRECEDENCE.postfix, seq(choice($.call_expression, $.paren_expression), 'catch', optional($.capture), choice($.block, $.expression))),

    actionable_expression: $ => choice(
      $.array_access_expression,
      $.call_expression,
      $.field_access_expression,
      $.identifier,
      $.if_expression,
      $.match_expression,
      $.optional_dereference_expression,
      $.paren_expression,
      $.pointer_dereference_expression,
    ),
    array_access_expression: $ => seq(field('item', $.actionable_expression), '[', field('index', $.expression), ']'),
    binary_expression: $ => choice(...binary_operators.map(([o, p]) => prec.left(p, seq($.expression, o, $.expression)))),
    call_expression: $ => prec(PRECEDENCE.call, seq($.actionable_expression, '(', comma_separated($.expression), ')')),
    field_access_expression: $ => prec(PRECEDENCE.dot, seq(field('item', $.actionable_expression), '.', field('member', $.identifier))),
    if_expression: $ => prec.left(seq($.if_prefix, choice($.block, $.expression), 'else', choice($.block, $.expression))),
    match_expression: $ => seq($.match_prefix, '{', comma_separated1($.arm_expression), '}'),
    range_expression: $ => prec.left(PRECEDENCE.range, seq(field('start', $.expression), '..', field('end', $.expression))),
    optional_dereference_expression: $ => seq(field('item', $.actionable_expression), '.?'),
    paren_expression: $ => seq('(', $.expression, ')'),
    pointer_dereference_expression: $ => seq(field('item', $.actionable_expression), '.*'),
    unary_expression: $ => prec.left(PRECEDENCE.unary, seq(choice(...unary_operators), $.expression)),
    use_expression: $ => seq('use', $.string_literal),

    /* statements */
    statement: $ => choice(
      seq($.semicolon_statement, ';'),
      $.nonsemicolon_statement,
    ),
    semicolon_statement: $ => choice(
      $.assign_expression,
      $.break_expression,
      $.call_expression,
      $.comp_call_expression,
      $.return_expression,
      $.try_expression,
      $.variable_declaration
    ),
    nonsemicolon_statement: $ => choice(
      $.block,
      $.for_expression,
      $.if_expression,
      $.match_expression,
    ),

    /* statements - other */
    statement_expression: $ => choice(
      $.assign_expression,
      $.break_expression,
      $.for_statement,
      $.return_expression,
    ),
    break_expression: $ => seq('break', optional(seq(':', $.identifier)), $.expression),
    for_expression: $ => seq(optional('inline'), 'for', comma_separated($.expression), ':', optional($.capture), choice($.block, $.statement)),
    return_expression: $ => seq('return', $.expression),

    /* extras - literals */
    boolean_literal: _ => choice('true', 'false'),
    char_literal: _ => token(seq("'", choice(/[^'\\]/, /\\./), "'")),
    enum_literal: $ => seq(optional($.actionable_expression), '.', $.identifier, optional(seq('(', $.expression, ')'))),
    error_literal: $ => seq(optional($.actionable_expression), '.', $.identifier, optional(seq('(', $.expression, ')'))),
    float_literal: _ => token(/[0-9]+\.[0-9]+/),
    int_literal: _ => token(/[0-9]+/),
    string_literal: _ => token(seq('"', repeat(choice(/[^"\\]/, /\\./)), '"')),
    struct_literal: $ => seq(optional($.identifier), '{', comma_separated($.struct_member), '}'),
    struct_member: $ => seq($.identifier, ':', $.expression),

    /* extras - other */
    arm_prefix: $ => seq(choice(comma_separated1($.expression), '_'), ':'),
    arm_expression: $ => seq($.arm_prefix, choice($.block, $.expression)),
    arm_statement: $ => seq($.arm_prefix, choice($.nonsemicolon_statement, $.semicolon_statement)),
    capture: $ => seq('|', comma_separated(seq(optional('mut'), $.identifier)), '|'),
    comment: _ => token(choice(/\/\/[^\n]*/, /\/\*([^*]|\*+[^/*])*\*+\//)),
    if_prefix: $ => seq('if', $.expression, ':', optional($.capture)),
    match_prefix: $ => seq('match', $.expression),
  },
});

function comma_separated1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function comma_separated(rule) {
  return optional(comma_separated1(rule));
}
