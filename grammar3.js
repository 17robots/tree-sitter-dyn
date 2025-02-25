/**
 * @file A general systems programming language
 * @author 17robots <mdray@duck.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const prec_table = {
  logical_or: 1,
  logical_and: 2,
  equal: 3,
  bitwise: 4,
  shift: 5,
  add: 6,
  mult: 7,
  unary: 8,
};

module.exports = grammar({
  name: 'dyn',
  word: $ => $.identifier,
  extras: $ => [/\s+/, $.comment],
  conflicts: $ => [
    [$.expr, $.type_expr],
    [$.stmt, $.expr_no_literal],
    [$.body_expr, $.expr_no_literal]
  ],
  rules: {
    source_file: $ => seq($.module_decl, repeat(seq(optional('pub'), $.var_decl, ';'))),
    module_decl: $ => seq('module', $.identifier, ';'),

    var_decl: $ => seq($.identifier, choice(':=', seq(':', $.type_expr, '=')), $.expr),
    mut_var_decl: $ => seq(optional('mut'), $.identifier, choice(seq(':=', $.expr), seq(':', $.type_expr, optional(seq('=', $.expr))))),

    stmt: $ => choice(
      $.if_stmt,
      $.while_stmt,
      $.for_stmt,
      $.expr_stmt,
      $.block,
      prec(1, $.match_expr),
      seq($.mut_var_decl, ';'),
    ),

    return_expr: $ => prec.right(seq('return', optional($.expr))),
    break_expr: $ => prec.right(seq('break', optional(seq(':', $.identifier, $.expr)))),
    continue_expr: $ => prec.right(seq('continue', optional(seq(':', $.identifier, $.expr)))),

    fn: $ => prec.right(seq(optional('inline'), '(', optional($.params_list), ')', optional($.type_expr), choice(seq('=>', $.expr), $.block))),
    parameter_list: $ => optional(seq(commaSep($.parameter), optional(','))),
    parameter: $ => seq(commaSep($.identifier), ':', $.type_expr),

    range_expr: $ => seq($.expr, '..', $.expr),

    if_prefix: $ => seq('if', $.expr, optional(seq(':', $.capture))),
    if_stmt: $ => prec.right(seq($.if_prefix, $.body)),
    if_expr: $ => prec.right(seq($.if_prefix, $.expr, optional(seq('else', optional($.capture), $.expr)))),

    expr_stmt: $ => seq($.expr, ';'),

    match_prefix: $ => seq('match', $.expr),
    match_pattern: $ => choice('_', $.range_expr, $.expr),
    match_expr: $ => prec.right(seq($.match_prefix, '{', $.match_arm_expr, '}')),
    match_arm_expr: $ => prec.right(seq($.match_pattern, ':', optional($.capture), $.expr, optional(seq(',', $.match_arm_expr)))),

    block: $ => seq(optional(seq($.identifier, ':')), '{', repeat($.stmt), '}'),

    while_prefix: $ => seq('while', $.expr, optional(seq(':', $.capture))),
    while_stmt: $ => seq($.while_prefix, $.body),
    while_expr: $ => prec.right(seq($.while_prefix, $.body_expr)),

    for_prefix: $ => seq(optional('inline'), 'for', choice($.expr, $.range_expr), repeat(seq(',', choice($.expr, $.range_expr))), seq(':', $.capture)),
    for_stmt: $ => seq($.for_prefix, $.body),
    for_expr: $ => prec.right(seq($.for_prefix, $.body_expr)),

    body: $ => choice(
      seq($.block, optional($.else_body)),
      seq($.expr, choice(';', $.else_body))
    ),
    else_body: $ => seq('else', optional($.capture), $.stmt),

    body_expr: $ => choice(
      seq($.block, optional($.else_body_expr)),
      seq($.expr, optional($.else_body_expr))
    ),
    else_body_expr: $ => seq('else', optional($.capture), $.stmt),

    expr: $ => prec.right(choice($.literal, seq(optional('comp'), choice($.type_expr, $.expr_no_literal)), $.binary_expr, $.unary_expr, $.assign_expr)),

    binary_expr: $ => {
      const table = [
        ['||', prec_table.logical_or],
        ['&&', prec_table.logical_and],
        ['==', prec_table.equal],
        ['!=', prec_table.equal],
        ['>', prec_table.equal],
        ['>=', prec_table.equal],
        ['<', prec_table.equal],
        ['<=', prec_table.equal],
        ['&', prec_table.bitwise],
        ['|', prec_table.bitwise],
        ['??', prec_table.bitwise],
        ['<<', prec_table.shift],
        ['>>', prec_table.shift],
        ['+', prec_table.add],
        ['-', prec_table.add],
        ['*', prec_table.mult],
        ['/', prec_table.mult],
        ['%', prec_table.mult],
      ];
      return choice(...table.map(([operator, precedence]) => prec.left(precedence, seq(
        field('left', $.expr),
        // @ts-ignore
        field('operator', operator),
        field('right', $.expr)
      ))));
    },

    unary_expr: $ => prec.left(prec_table.unary, seq(choice('!', '~', '-', '&'), $.expr)),

    assign_expr: $ => prec.right(seq($.expr, choice('=', '*=', '%=', '/=', '+=', '-=', '<<=', '>>=', '&=', '^=', '|='), $.expr)),

    expr_no_literal: $ => prec.left(choice(
      $.identifier,
      $.fn,
      $.if_expr,
      $.for_expr,
      $.while_expr,
      $.match_expr,
      $.struct_initializer,
      $.enum_error_initializer,
      $.array_initializer,
      $.block,
      $.return_expr,
      $.break_expr,
      $.continue_expr,
      seq('try', $.expr_no_literal), // try expression
      seq('(', $.expr, ')'), // grouped expr
      seq($.expr_no_literal, '.?'), // optional dereference
      seq($.expr_no_literal, '.*'), // pointer dereference
      seq($.expr_no_literal, '[', $.expr, ']'), // array access
      seq($.expr_no_literal, '.', $.identifier), // member access
      seq($.expr_no_literal, '(', optional(seq($.expr, repeat(seq(',', $.expr)))), ')'), // call
      seq($.expr_no_literal, 'catch', optional($.capture), $.expr), // catch expr
      seq('use', $.identifier, repeat(seq(':', $.identifier))),
    )),

    type_expr: $ => prec.right(choice(
      seq('?', $.type_expr), // optional type
      seq('*', $.type_expr), // pointer type
      seq('[]', $.type_expr), // array type
      seq('(', optional(seq($.type_expr, repeat(seq(',', $.type_expr)))), ')', optional($.type_expr)), // fn type
      $.enum,
      $.error,
      $.struct,
      $.expr_no_literal, // anything but literals count
      "type",
    )),

    identifier: $ => token(/(?:(\$)?[A-Za-z][A-Za-z0-9_]*|_[A-Za-z0-9_]*[A-Za-z][A-Za-z0-9_]*)/),

    struct: $ => seq('struct', '{', optional($.struct_member), '}'),
    struct_member: $ => seq(choice(seq($.var_decl, ';'), seq($.identifier, repeat(seq(',', $.identifier)), ':', $.type_expr, optional(seq('=', $.expr)), ',')), optional($.struct_member)),

    struct_initializer: $ => seq(choice('.', $.identifier), '{', optional($.struct_initializer_member), '}'),
    struct_initializer_member: $ => seq($.identifier, ':', $.expr, optional(seq(',', $.struct_initializer_member))),

    enum_error_initializer: $ => prec.right(seq('.', $.identifier, optional(seq('(', $.expr, ')')))),

    array_initializer: $ => seq('.', '[', optional(seq($.expr, repeat(seq(',', $.expr)))), ']'),

    enum: $ => seq('enum', '{', optional($.enum_member), '}'),
    enum_member: $ => seq(choice(seq($.var_decl, ';'), seq($.identifier, optional(seq(':', $.type_expr)), ',')), optional($.enum_member)),

    error: $ => seq('error', '{', optional($.error_member), '}'),
    error_member: $ => seq(choice(seq($.var_decl, ';'), seq($.identifier, optional(seq(':', $.type_expr)), ',')), optional($.error_member)),

    capture: $ => seq('|', optional('mut'), $.identifier, repeat(seq(',', optional('mut'), $.identifier)), '|'),

    literal: $ => choice(
      /[0-9]+/,
      /[0-9]+\.[0-9]+/,
      /"[^"]*"/,
      /'[^']*'/,
      'true',
      'false',
      'undefined',
      'null'
    ),
    comment: $ => token(choice(/\/\/[^\n]*/, /\/\*([^*]|\*+[^/*])*\*+\//)),
  }
})

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)))
}

function commaSep(rule) {
  return optional(commaSep1(rule))
}
