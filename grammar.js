/**
 * tree-sitter grammar for dyn (syntax3)
 *
 * Deliberately minimal: few fields, no external scanner. Newlines are treated
 * as plain whitespace — dyn's statements are self-delimiting enough for
 * editor tooling (the `=`-anchored declaration form does most of the work).
 * Postfix `.` and `[` use token.immediate: they bind only with no whitespace
 * before them (`arr[i]`, `x.f`), so a newline-led `[a, b] = x` destructuring
 * or `.variant:` match arm starts fresh instead of continuing the previous
 * expression — mirroring the language's ASI rule with no external scanner.
 * Residual limitation: a line beginning with `(` still continues the prior
 * expression (call), as the language's own ASI rule also dictates. Block
 * comments do not nest here (tree-sitter regex tokens can't); the reference
 * compiler nests them.
 */

const PREC = {
  or: 1,        // `a or handler` — lowest, guards everything to its left
  logical_or: 2,
  logical_and: 3,
  comparison: 4,
  range: 5,
  bit_or: 6,
  bit_xor: 7,
  bit_and: 8,
  shift: 9,
  add: 10,
  mul: 11,
  unary: 12,
  postfix: 13,
  composite: -1, // `Type{...}` loses to blocks in `if x {` via dynamic prec
};

module.exports = grammar({
  name: 'dyn',
  word: $ => $.identifier,
  extras: $ => [/\s/, ';', $.comment],
  conflicts: $ => [
    [$._decl_lhs, $.label],
    [$._decl_lhs, $.label, $.field_init],
    [$.composite_literal, $._expression],
    [$._expression, $.literal_pattern],
    [$._expression, $.range_pattern],
    [$._expression, $.binding_pattern],
    [$.array_literal, $.array_pattern],
    [$.argument_list, $.parameter_list],
    [$._expression, $.parameter_group, $.type_identifier],
    [$._parenthesized_expression, $._argument],
    [$.literal_body, $.struct_pattern],
    [$._expression, $._type],
    [$.block, $.literal_body],
    [$.return_types],
    [$.return_statement],
    [$.break_statement],
    [$._decl_lhs, $._expression],
  ],
  rules: {
    source_file: $ => repeat($._statement),
    // ---------------------------------------------------------- statements
    _statement: $ => choice(
      $.declaration,
      $.assignment,
      $.for_statement,
      $.defer_statement,
      $.return_statement,
      $.break_statement,
      $.continue_statement,
      $.block,
      $.expression_statement,
    ),
    expression_statement: $ => prec.right(-2, $._expression),
    // `pub? mut? name (: Type)? = value` — also multi-names and destructuring.
    declaration: $ => prec.right(prec.dynamic(1, seq(
      optional('pub'),
      $._decl_lhs,
      repeat(seq(',', $._decl_lhs)),
      optional(seq(':', $._type)),
      '=',
      $._expression,
      repeat(seq(',', $._expression)),
    ))),
    _decl_lhs: $ => seq(
      optional('mut'),
      choice($.identifier, '_', $.struct_pattern, $.array_pattern),
    ),
    assignment: $ => prec.right(-1, seq(
      $._expression,
      choice('=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>='),
      $._expression,
    )),
    label: $ => seq($.identifier, ':', choice($.block, $.for_statement)),
    if_statement: $ => prec.right(seq(
      'if',
      field('condition', $._expression),
      field('consequence', choice($.block, $.label)),
      optional(seq('else', field('alternative',
        choice($.block, $._expression)))),
    )),
    for_statement: $ => prec.right(seq(
      'for',
      choice(
        $.block,                                                       // for { }       infinite
        seq($.identifier, optional(seq(',', $.identifier)), 'in',
          $._expression, $._statement),                              // for x[, i] in iter
        seq($._expression, $._statement),                              // for cond
      ),
    )),
    defer_statement: $ => seq('defer', $._statement),
    return_statement: $ => seq(
      'return',
      optional(seq($._return_value, repeat(seq(',', $._return_value)))),
    ),
    _return_value: $ => choice('_', $._expression),
    break_statement: $ => seq(
      'break',
      optional(seq(':', $.identifier)),
      optional($._expression),
    ),
    continue_statement: $ => prec.right(seq(
      'continue',
      optional(seq(':', $.identifier)),
    )),
    block: $ => seq('{', repeat($._statement), '}'),
    // --------------------------------------------------------- expressions
    _expression: $ => choice(
      $.identifier,
      $.int_literal,
      $.float_literal,
      $.string_literal,
      $.char_literal,
      $.boolean_literal,
      'null',
      'undefined',
      $.context_expression,
      $.use_expression,
      $.enum_shorthand,
      $.unary_expression,
      $.binary_expression,
      $.or_expression,
      $.range_expression,
      $.call_expression,
      $.field_expression,
      $.index_expression,
      $.deref_expression,
      $.unwrap_expression,
      $.function,
      $.function_type,
      $.composite_literal,
      $.anon_struct_literal,
      $.array_literal,
      $.match_expression,
      $.if_statement,
      $.label,
      $.struct_type,
      $.enum_type,
      $.directive_expression,
      $._parenthesized_expression,
    ),
    _parenthesized_expression: $ => seq('(', $._expression, ')'),
    use_expression: $ => seq('use', $.string_literal),
    context_expression: $ => 'context',
    // `.variant` / `.variant(payload)` when the enum type is inferable.
    enum_shorthand: $ => prec.right(2, seq('.', $.identifier, optional($.argument_list))),
    unary_expression: $ => prec(PREC.unary, seq(
      choice('-', '!', '~', '&', seq('&', 'mut')),
      $._expression,
    )),
    binary_expression: $ => {
      const table = [
        ['||', PREC.logical_or], ['&&', PREC.logical_and],
        ['==', PREC.comparison], ['!=', PREC.comparison],
        ['<', PREC.comparison], ['>', PREC.comparison],
        ['<=', PREC.comparison], ['>=', PREC.comparison],
        ['|', PREC.bit_or], ['^', PREC.bit_xor], ['&', PREC.bit_and],
        ['<<', PREC.shift], ['>>', PREC.shift],
        ['+', PREC.add], ['-', PREC.add],
        ['+%', PREC.add], ['-%', PREC.add],
        ['*', PREC.mul], ['/', PREC.mul], ['%', PREC.mul], ['*%', PREC.mul],
      ];
      return choice(...table.map(([op, p]) =>
        prec.left(p, seq($._expression, op, $._expression))));
    },
    // expr or [binding] (expr | block | return | break | continue)
    or_expression: $ => prec.left(PREC.or, seq(
      $._expression,
      'or',
      optional(field('binding', $.identifier)),
      choice(
        $.block,
        $.return_statement,
        $.break_statement,
        $.continue_statement,
        $._expression,
      ),
    )),
    range_expression: $ => prec.left(PREC.range, seq($._expression, choice('..', '..='), $._expression)),
    call_expression: $ => prec(PREC.postfix, seq(field('function', $._expression), $.argument_list)),
    argument_list: $ => seq('(', optional(seq($._argument, repeat(seq(',', $._argument)), optional(','))), ')'),
    _argument: $ => choice($._expression, $._type, seq($.identifier, ':', $._expression)),
    field_expression: $ => prec(PREC.postfix, seq($._expression, token.immediate('.'), field('field', $.identifier))),
    // token.immediate: `arr[i]` indexes, but a whitespace/newline-led `[` does
    // not — which is what lets `[a, b] = x` destructuring follow any statement.
    index_expression: $ => prec(PREC.postfix, seq($._expression, token.immediate('['), $._expression, ']')),
    deref_expression: $ => prec(PREC.postfix, seq($._expression, token.immediate('.'), '*')),
    unwrap_expression: $ => prec(PREC.postfix, seq($._expression, token.immediate('.'), '?')),
    // (params) [Type] body  → value; bodiless form is function_type (in types).
    function: $ => prec.right(seq(
      optional(choice('inline', $.directive)),
      $.parameter_list,
      optional($.return_types),
      choice($.block, seq('=>', choice($.assignment, $._expression))),
    )),
    return_types: $ => seq($._type, repeat(seq(',', $._type))),
    parameter_list: $ => seq(
      '(',
      optional(seq($.parameter_group, repeat(seq(',', $.parameter_group)), optional(','))),
      ')',
    ),
    // `a, b: T = default` — names share the group's type.
    parameter_group: $ => seq(
      $.identifier,
      repeat(seq(',', $.identifier)),
      ':',
      $._type,
      optional(seq('=', $._expression)),
    ),
    composite_literal: $ => prec.dynamic(PREC.composite, seq(
      field('type', choice($.identifier, $.call_expression, $.field_expression)),
      $.literal_body,
    )),
    anon_struct_literal: $ => seq('.', $.literal_body),
    literal_body: $ => seq('{', optional(seq($.field_init, repeat(seq(',', $.field_init)), optional(','))), '}'),
    field_init: $ => seq($.identifier, ':', $._expression),
    array_literal: $ => seq('[', optional(seq($._expression, repeat(seq(',', $._expression)), optional(','))), ']'),
    directive_expression: $ => prec(PREC.postfix, seq($.directive, optional($.argument_list))),
    // -------------------------------------------------------------- match
    match_expression: $ => seq('match', $._expression, '{', repeat($.match_arm), '}'),
    match_arm: $ => seq($._pattern, ':', choice($.block, $._expression), optional(',')),
    // ------------------------------------------------------------ patterns
    _pattern: $ => choice(
      $.wildcard_pattern,
      $.variant_pattern,
      $.struct_pattern,
      $.array_pattern,
      $.range_pattern,
      $.literal_pattern,
      $.binding_pattern,
    ),
    wildcard_pattern: _ => '_',
    binding_pattern: $ => $.identifier,
    literal_pattern: $ => choice($.int_literal, $.float_literal, $.string_literal, $.char_literal, $.boolean_literal, 'null'),
    range_pattern: $ => seq(choice($.int_literal, $.char_literal), choice('..', '..='), choice($.int_literal, $.char_literal)),
    // Juxtaposed depth: `.f2 .f1 .empty`, `.thing v`, `.thing .{info: 9}`, `.v [a, b]`
    variant_pattern: $ => prec.right(seq(repeat1(seq('.', $.identifier)), optional(choice($.binding_pattern, $.struct_pattern, $.array_pattern, $.literal_pattern, $.range_pattern)))),
    struct_pattern: $ => seq('.', '{', optional(seq($.field_pattern, repeat(seq(',', $.field_pattern)), optional(','))), '}'),
    field_pattern: $ => choice(seq($.identifier, ':', $._pattern), $.identifier),
    array_pattern: $ => seq('[', optional(choice( '..', seq($._pattern, repeat(seq(',', $._pattern)), optional(seq(',', optional('..')))),)), ']'),
    // --------------------------------------------------------------- types
    _type: $ => choice($.builtin_type, $.type_identifier, $.pointer_type, $.slice_type, $.array_type, $.optional_type, $.function_type, $.struct_type, $.enum_type, $.comp_type, $.generic_type, $.field_type),
    builtin_type: _ => choice('void', 'type', 'module', 'any', /[iu][0-9]+/, 'f32', 'f64', 'bool'),
    type_identifier: $ => prec(-1, $.identifier),
    generic_type: $ => prec(1, seq(choice($.type_identifier, $.field_type), $.argument_list)),
    field_type: $ => prec.left(2, seq($._type, '.', $.identifier)),
    pointer_type: $ => prec.right(seq('*', optional('mut'), $._type)),
    slice_type: $ => prec.right(1, seq('[', ']', optional('mut'), $._type)),
    array_type: $ => prec.right(1, seq('[', $._expression, ']', optional('mut'), $._type)),
    optional_type: $ => prec.right(seq('?', $._type)),
    comp_type: $ => prec.right(seq('comp', $._type)),
    // (a, b: T) R — bodiless, return type mandatory (void written out).
    function_type: $ => prec.right(-1, seq($.parameter_list, $.return_types)),
    struct_type: $ => seq('struct', '{', optional(seq($._struct_member, repeat(seq(',', $._struct_member)), optional(','))), '}'),
    _struct_member: $ => choice($.field_group, $.embed_field),
    field_group: $ => seq($.identifier, repeat(seq(',', $.identifier)), ':', $._type, optional(seq('=', $._expression))),
    embed_field: $ => seq($.directive, choice($.identifier, '_'), ':', $._type),
    enum_type: $ => seq('enum', optional($.builtin_type), '{', optional(seq($.enum_variant, repeat(seq(',', $.enum_variant)), optional(','))), '}'),
    enum_variant: $ => seq($.identifier, optional(seq(':', $._type))),
    // -------------------------------------------------------------- tokens
    identifier: _ => /[A-Za-z_][A-Za-z0-9_]*/,
    directive: _ => /#[a-z_]+/,
    int_literal: _ => token(choice(/[0-9][0-9_]*/, /0[xX][0-9a-fA-F_]+/, /0[bB][01_]+/, /0[oO][0-7_]+/)),
    float_literal: _ => token(/[0-9][0-9_]*\.[0-9][0-9_]*([eE][+-]?[0-9]+)?/),
    string_literal: _ => token(seq('"', repeat(choice(/[^"\\]/, /\\./)), '"')),
    char_literal: _ => token(seq("'", choice(/[^'\\]/, /\\./), "'")),
    boolean_literal: _ => choice('true', 'false'),
    comment: _ => token(choice(seq('//', /[^\n]*/), seq('/*', /([^*]|\*+[^/*])*/, /\*+\//))),
  }
});
