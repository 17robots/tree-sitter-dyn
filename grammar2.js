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
const postfix_operators = ['!', '?']
module.exports = grammar({
  name: 'dyn',
  extras: $ => [],
  conflicts: $ = [],
  rules: {
    comment: _ => token(choice(/\/\/[^\n]*/, /\/\*([^*]|\*+[^/*])*\*+\//)),
    boolean_literal: _ => choice('true', 'false'),
    char_literal: _ => token(seq("'", choice(/[^'\\]/, /\\./), "'")),
    float_literal: _ => token(/[0-9]+\.[0-9]+/),
    identifier: _ => token(/[a-zA-Z_][a-zA-Z0-9_]*/),
    int_literal: _ => token(/[0-9]+/),
    source_file: seq($.module_declaration),
    string_literal: _ => token(seq('"', repeat(choice(/[^"\\]/, /\\./)), '"')),
  }
})
const separated1 = (sep, rule) => seq(rule, repeat(seq(sep, rule)), optional(sep))
const separated = (sep, rule) =>  optional(separated1(sep, rule))
