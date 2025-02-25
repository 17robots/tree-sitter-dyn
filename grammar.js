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
    source_file: $ => seq($.module_declaration, repeat(seq($.declaration, ';'))),
    module_declaration: $ => seq('module', $.identifier, ';'),
    declaration: $ => seq(),
    identifier: _ => token(/(?:(\$)?[A-Za-z][A-Za-z0-9_]*|_[A-Za-z0-9_]*[A-Za-z][A-Za-z0-9_]*)/),
    comment: _ => token(choice(/\/\/[^\n]*/, /\/\*([^*]|\*+[^/*])*\*+\//)),
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
  },
})

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)))
}

function commaSep(rule) {
  return optional(commaSep1(rule))
}
