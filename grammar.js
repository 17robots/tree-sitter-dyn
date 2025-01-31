/**
 * @file A general systems programming language
 * @author 17robots <mdray@duck.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "dyn",
  extras: $ => [
    /\s/,
    $.comment,
  ],
  word: $ => $.identifier,

  rules: {
    source_file: $ => seq($.module_declaration, repeat(choice($.definition, $.pub_definition))),

    module_declaration: $ => seq('module', $.string, ';'),

    pub_definition: $ => seq('pub', $.definition),

    definition: $ => choice(
      $.use_definition,
      $.fn_definition,
      $.variable_definition,
      $.enum_definition,
      $.error_definition,
      $.struct_definition,
    ),

    use_definition: $ => seq('use', optional($.identifier), $.string, ';'),

    fn_definition: $ => prec(2,seq($.identifier, '=', $.param_list, choice($.block, $.arrow_expression))),

    param_list: $ => prec.left(1, seq('(', repeat(seq(
      optional('mut'),
      $.identifier,
      repeat(seq(',', $.identifier)),
      seq(':', $.type_expression)
    )), ')')) ,

    variable_definition: $ => seq(commaSep1($.identifier), choice(seq(':', $.type_expression, '=', $.expression), seq(':=', $.expression), seq(':', $.type_expression)), ';'),

    enum_definition: $ => prec(2, seq($.identifier, '=', 'enum', '{', optional($.enum_member_list), '}')),

    enum_member_list: $ => repeat1(choice(
      prec.left(1,seq($.identifier, optional(seq(':', $.type_expression)), ',')),
      prec.left(2,choice($.fn_definition, $.variable_definition, $.enum_definition, $.error_definition, $.struct_definition))
    )),

    error_definition: $ => prec(2, seq($.identifier, '=', 'error', '{', optional($.error_member_list), '}')),

    error_member_list: $ => repeat1(choice(
      prec.left(1,seq($.identifier, optional(seq(':', $.type_expression)), ',')),
      prec.left(2,choice($.fn_definition, $.variable_definition, $.enum_definition, $.error_definition, $.struct_definition))
    )),

    struct_definition: $ => prec(2, seq($.identifier, '=', 'struct', '{', optional($.struct_member_list), '}')),

    struct_member_list: $ => repeat1(choice(
      seq(sepBy1(',', $.identifier), ':', $.type_expression, ','),
      $.definition,
    )),

    block: $ => seq('{', repeat($.statement), '}'),

    label: $ => prec(3, seq($.identifier, ':', $.block)),

    statement: $ => choice(
        seq(optional('mut'), $.variable_definition),
        $.if_statement,
        $.match_statement,
        $.defer_statement,
        $.return_statement,
        $.break_statement,
        $.for_statement,
        $.while_statement,
        $.assignment_statement,
        $.enum_definition,
        $.fn_definition,
        $.struct_definition,
        $.error_definition,
    ),

    if_statement: $ => prec.right(seq(
      'if',
      $.expression,
      optional($.capture),
      $.block,
      optional(seq('else', choice($.if_statement, $.block)))
    )),

    match_statement: $ => seq('match', $.expression, '{', optional($.match_arms), '}'),

    match_arms: $ => repeat1(seq($.match_pattern, ':', optional($.capture), $.expression, optional(','))),

    match_pattern: $ => choice('_', $.expression, $.range_expression, seq('.', $.identifier), seq('(', $.expression, ')')),

    defer_statement: $ => seq('defer', optional($.capture), choice($.block, seq($.expression, ';'))),

    return_statement: $ => seq('return', optional($.expression), ';'),

    break_statement: $ => seq('break', optional(seq($.label, $.expression)), ';'),

    for_statement: $ => seq('for', commaSep1($.expression), ':', $.capture, $.block),

    while_statement: $ => seq('while', $.expression, optional(seq(':', $.capture)), $.block),

    assignment_statement: $ => prec(1, seq(choice($.identifier, $.array_access, $.field_expression), $.assignment_operators, $.expression, ';')),

    assignment_operators: $ => choice('=', '+=', '-=', '*=', '%=', '/=', '|=', '&=', '~='),

    capture: $ => seq('|', sepBy1(',', $.identifier), '|'),

    type_expression: $ => prec(2, choice($.identifier, $.array_type, $.pointer_type, $.optional_type, $.function_type)),

    array_type: $ => seq('[', ']', $.type_expression),

    pointer_type: $ => seq('*', $.type_expression),

    optional_type: $ => seq('?', $.type_expression),

    function_type: $ => prec.left(2, seq( '(', optional(repeat($.type_expression)), ')', optional($.type_expression))),

    expression: $ => prec(1, choice(
      $.literal,
      $.binary_expression,
      $.unary_expression,
      $.call_expression,
      $.field_expression,
      $.array_expression,
      $.lambda_expression,
      $.identifier,
      $.type_expression,
    )),

    literal: $ => choice(
      $.number,
      $.string,
      $.char,
      $.boolean,
      'undefined',
      'null',
    ),

    binary_expression: $ => {
      const operators = [
        ['+', 1],
        ['-', 1],
        ['*', 2],
        ['/', 2],
        ['%', 2],
        ['|', 3],
        ['&', 3],
        ['^', 3],
        ['==', 5],
        ['!=', 5],
        ['||', 6],
        ['&&', 6]
      ]

      return choice(...operators.map(([operator, precedence]) => prec.left(precedence, seq(
        field('left', $.expression),
        field('operator', operator),
        field('right', $.expression)
      ))));
    },
    
    unary_expression: $ => choice(
      prec.right(3, seq(field('operator', choice('-', '!', '&')), field('argument', $.expression))),
      prec.left(3, seq(field('operator', $.expression), field('operator', choice('++', '--'))))
    ),

    call_expression: $ => prec.left(1, seq(field('function', $.expression), '(', optional(commaSep1($.expression)), ')')),

    field_expression: $ => prec.left(2, seq(field('object', $.expression), '.', field('property', choice($.identifier, '*', '?')))),

    array_expression: $ => seq('.', '[', optional(commaSep1($.expression)), ']'),

    array_access: $ => seq($.identifier, '[', $.expression, ']'),

    lambda_expression: $ => seq($.param_list, optional($.type_annotation), choice($.expression, $.block)),

    range_expression: $ => seq($.expression, '..', $.expression),

    arrow_expression: $ => seq('=>', $.expression, ';'),

    type_annotation: $ => seq(':', $.type_expression),

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
    
    number: $ => /\d+(\.\d+)?/,

    string: $ => /"[^"]*"/,

    char: $ => /'[^']*'/,

    boolean: $ => choice('true', 'false'),

    comment: $ => token(choice(seq('//', '/.*/'), seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/*'))),
  }
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)))
}

function sepBy1(sep, rule) {
  return seq(rule, repeat(seq(sep, rule)))
}
