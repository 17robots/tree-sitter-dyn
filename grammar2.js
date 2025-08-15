// Tree-sitter grammar for the Dyn language, derived from the current
// lexer (`src/lexer.zig`) and packed parser (`src/parser_packed.zig`).

// Helpful precedence aliases mirroring parser precedence levels
// (parser: call/member/index 17 → unary 16 → mul 15 → add 14 → nullish 13
// → bitwise 12 → relations 11/10 → eq 9 → && 8 → || 7 → range 6 → assign 2)
const PREC = {
  call: 17,
  unary: 16,
  multiplicative: 15,
  additive: 14,
  nullish: 13,
  bitwise: 12,
  relational: 11,
  relational_eq: 10,
  equality: 9,
  andand: 8,
  oror: 7,
  range: 6,
  assign: 2,
  primary: 1,
};

function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}

function sep(rule, separator) {
  return optional(sep1(rule, separator));
}

module.exports = grammar({
  name: 'dyn',

  extras: $ => [
    /[\s\r\n\t]/,
    $.comment,
  ],

  supertypes: $ => [
    $._statement,
    $._expression,
  ],

  conflicts: $ => [
    // Distinguish a bare block from a struct initialization without a type name
    [$.block, $.struct_init],
  ],

  word: $ => $.identifier,

  rules: {
    // Entry -----------------------------------------------------------------
    source_file: $ => seq(
      $.module_declaration,
      ';',
      repeat(seq(choice($.declaration, $._statement), optional(';'))),
    ),

    // Tokens ----------------------------------------------------------------
    identifier: _ => token(/[A-Za-z$][A-Za-z0-9_]*/),

    int_literal: _ => token(/\d+/),
    float_literal: _ => token(/\d+\.\d+(?:[eE][+-]?\d+)?/),
    string_literal: _ => token(seq('"', repeat(choice(/[^"\\]/, /\\./)), '"')),
    char_literal: _ => token(seq('\'', choice(/[^'\\]/, /\\./), '\'')),

    comment: _ => token(choice(
      seq('//', /[^\n]*/),
      seq('/*', /[\s\S]*?/, '*/'),
    )),

    // Top-level --------------------------------------------------------------
    module_declaration: $ => seq('module', field('name', $.identifier)),

    declaration: $ => seq(
      field('pub', optional('pub')),
      field('mut', optional('mut')),
      field('name', $.identifier),
      choice(
        // Special case: name use "path"
        seq('use', field('value', $.string_literal)),
        seq(
          field('type', optional(seq(':', $._expression))),
          field('value', optional(seq(choice('=', ':='), $._expression))),
        ),
      ),
    ),

    // Statements -------------------------------------------------------------
    _statement: $ => choice(
      $.labeled_block,
      $.block,
      $.if_statement,
      $.while_statement,
      $.for_statement,
      $.match_statement,
      $.break_statement,
      $.continue_statement,
      $.defer_statement,
      $.return_statement,
      $._expression,
    ),

    labeled_block: $ => seq(field('label', $.identifier), ':', $.block),

    block: $ => seq(
      '{',
      repeat(seq($._statement, optional(';'))),
      '}',
    ),

    result_block: $ => choice(
      $.labeled_block,
      $.block,
      $._statement,
    ),

    if_statement: $ => seq(
      'if', field('condition', $._expression), ':',
      field('capture', optional($.capture)),
      field('consequence', $.result_block),
      optional(seq('else', field('alternative', $.result_block))),
    ),

    while_statement: $ => seq(
      'while', field('condition', $._expression), ':',
      field('capture', optional($.capture)),
      field('body', $.result_block),
    ),

    for_statement: $ => seq(
      field('inline', optional('inline')),
      'for',
      field('iterables', $.expression_list),
      ':',
      field('capture', $.capture),
      field('body', $.result_block),
    ),

    expression_list: $ => sep1($._expression, ','),

    capture: $ => seq(
      '|', sep($.capture_item, ','), '|',
    ),
    capture_item: $ => seq(optional('mut'), $.identifier),

    break_statement: $ => seq(
      'break',
      optional(seq(':', field('label', $.identifier))),
      optional(field('value', $._expression)),
    ),

    continue_statement: $ => seq(
      'continue',
      optional(seq(':', field('label', $.identifier))),
    ),

    defer_statement: $ => seq(
      'defer',
      field('capture', optional($.capture)),
      field('body', $.result_block),
    ),

    return_statement: $ => seq('return', optional(field('value', $._expression))),

    match_statement: $ => seq(
      'match', field('value', $._expression), ':', '{',
      sep($.match_arm, ','),
      '}',
    ),
    match_arm: $ => seq(
      field('patterns', $.expression_list), ':',
      field('capture', optional($.capture)),
      field('body', $.result_block),
    ),

    // Expressions ------------------------------------------------------------
    _expression: $ => choice(
      $.assignment_expression,
      $.range_expression,
      $.binary_expression,
      $.nullish_expression,
      $.logical_expression,
      $.relational_expression,
      $.bitwise_expression,
      $.unary_expression,
      $.postfix_chain,
      $.primary_expression,
    ),

    // Postfix chain: call, member, index, derefs, catch
    postfix_chain: $ => prec(PREC.call, seq(
      $.primary_expression,
      repeat1(choice(
        seq('.', field('member', $.identifier)),
        seq('[', field('index', $._expression), ']'),
        seq('(', field('arguments', sep($._expression, ',')), ')'),
        // Postfix pointer / optional deref tokens
        $.postfix_pointer_deref,
        $.postfix_optional_deref,
        $.catch_clause,
      )),
    )),

    postfix_pointer_deref: _ => token(seq('.', token.immediate('*'))),
    postfix_optional_deref: _ => token(seq('.', token.immediate('?'))),

    catch_clause: $ => seq(
      'catch',
      choice(
        // catch (expr)
        seq('(', field('handler', $._expression), ')'),
        // catch [capture] result_block
        seq(optional(field('capture', $.capture)), field('body', $.result_block)),
      ),
    ),

    primary_expression: $ => choice(
      $.identifier,
      $.literal,
      $.grouped,
      $.array_literal,
      $.array_type,
      $.function_literal,
      $.function_type,
      $.type_expression,
      $.comp_expression,
      $.try_expression,
      $.use_expression,
      $.error_union_type,
      $.enum_decl,
      $.struct_decl,
      $.error_decl,
      $.struct_init,
      $.enum_error_init,
    ),

    literal: $ => choice(
      $.int_literal,
      $.float_literal,
      $.string_literal,
      $.char_literal,
      'true',
      'false',
      'null',
      'undefined',
    ),

    grouped: $ => seq('(', optional(choice($.labeled_block, $._expression)), ')'),

    // Array literal: [a, b, c]
    array_literal: $ => seq('[', sep($._expression, ','), ']'),
    // Array type: []TypeExpr
    array_type: $ => seq('[', ']', field('element', $._expression)),

    // Function literal and type
    function_literal: $ => seq(
      optional('inline'),
      'fn', '(', sep($.parameter, ','), ')',
      choice(
        seq('=>', field('body', $._expression)),
        field('body', $.block),
      ),
    ),

    function_type: $ => seq(
      'fn', '(', sep($.parameter, ','), ')',
      optional(field('result', $._expression)),
    ),

    parameter: $ => choice(
      // name[, name[, ...]] [: type]
      seq(
        field('names', sep1($.identifier, ',')),
        optional(seq(':', field('type', $._expression))),
      ),
      // type-only parameter (function type style)
      field('type', $._expression),
    ),

    // Decls as expressions
    struct_decl: $ => seq('struct', '{', sep($.member, ','), '}'),
    enum_decl: $ => seq('enum', '{', sep($.member, ','), '}'),
    error_decl: $ => seq('error', '{', sep($.member, ','), '}'),
    // error union type: error ! TypeExpr
    error_union_type: $ => seq('error', '!', $._expression),

    member: $ => seq(
      field('names', sep1($.identifier, ',')),
      choice(
        seq(':', field('type', $._expression), optional(seq(choice('=', ':='), field('value', $._expression)))),
        seq(optional(':'), optional(seq(choice('=', ':='), field('value', $._expression)))),
      ),
    ),

    // Struct initialization: [TypeName] { field: value, ... }
    struct_init: $ => seq(
      optional(field('type', $.identifier)),
      '{', sep($.struct_init_member, ','), '}'
    ),
    struct_init_member: $ => seq(field('name', $.identifier), ':', field('value', $._expression)),

    // Enum/error variant init: .Variant [ (expr) ]
    enum_error_init: $ => seq('.', field('name', $.identifier), optional(seq('(', field('value', $._expression), ')'))),

    // Keyword-y unary forms
    type_expression: $ => seq('type', field('value', $._expression)),
    comp_expression: $ => seq('comp', field('value', $._expression)),
    try_expression: $ => seq('try', field('value', $._expression)),
    use_expression: $ => seq('use', field('path', $.string_literal)),

    // Operators --------------------------------------------------------------
    assignment_operator: _ => choice('=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '~='),

    assignment_expression: $ => prec.right(PREC.assign, seq(
      field('left', $._expression),
      field('operator', $.assignment_operator),
      field('right', $._expression),
    )),

    range_expression: $ => prec.left(PREC.range, seq(
      field('left', $._expression), '..', field('right', $._expression),
    )),

    binary_expression: $ => choice(
      // multiplicative
      prec.left(PREC.multiplicative, seq($._expression, field('operator', choice('*', '/', '%')), $._expression)),
      // additive
      prec.left(PREC.additive, seq($._expression, field('operator', choice('+', '-')), $._expression)),
      // bitwise
      prec.left(PREC.bitwise, seq($._expression, field('operator', choice('&', '|', '^')), $._expression)),
    ),

    logical_expression: $ => choice(
      prec.left(PREC.andand, seq($._expression, '&&', $._expression)),
      prec.left(PREC.oror, seq($._expression, '||', $._expression)),
    ),

    nullish_expression: $ => prec.left(PREC.nullish, seq($._expression, '??', $._expression)),

    relational_expression: $ => choice(
      prec.left(PREC.relational, seq($._expression, field('operator', choice('<', '>', '<=', '>=')), $._expression)),
      prec.left(PREC.equality, seq($._expression, field('operator', choice('==', '!=')), $._expression)),
    ),

    unary_expression: $ => prec.right(PREC.unary, choice(
      seq(field('operator', choice('!', '~', '&', '-')), $._expression),
      // type operators
      seq(field('operator', '*'), $._expression),
      seq(field('operator', '?'), $._expression),
    )),
  },
});


