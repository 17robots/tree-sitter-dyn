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
  rules: {
    source_file: $ => seq($.module_declaration, repeat(seq($.pub_declaration, ';'))),
    declaration: $ => seq(optional('mut'), $.identifier, choice(':=', seq(':', $.non_literal_expression, '=')), $.expression),
    module_declaration: $ => seq('module', $.identifier, ';'),
    pub_declaration: $ => seq(optional('pub'), $.declaration),

    // expression
    expression: $ => prec.right(choice()),
    binary_expression: $ => choice(...binary_operators.map(([operator, precedence]) => prec.left(precedence, seq($.expression, operator, $.expression)))),
    unary_expression: $ => prec.left(precedences.unary, seq(choice(...unary_operators), $.expression)),

    // literal
    literal: $ => choice($.number, $.float, $.string, $.char, 'true', 'false', 'undefined', 'null'),
    char: _ => token(/'[^']*'/),
    comment: _ => token(choice(/\/\/[^\n]*/, /\/\*([^*]|\*+[^/*])*\*+\//)),
    float: _ => token(/[0-9]+\.[0-9]+/),
    identifier: _ => token(/[a-zA-Z_][a-zA-Z0-9_]*/),
    number: _ => token(/[0-9]+/),
    string: _ => token(/"[^"]*"/),

    // statement
    statement: $ => choice(),
  },

  // misc
})

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)))
}

function commaSep(rule) {
  return optional(commaSep1(rule))
}
