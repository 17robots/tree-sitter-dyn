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
    /\s+/,
    $.comment
  ],
  conflicts: $ => [
    [$.expr, $.type_expr],
    [$.expr, $.member_chain, $.struct_initializer],
    [$.expr, $.member_chain],
    [$.expr, $.struct_initializer],
    [$.type_expr, $.member_chain],
    [$.var_decl, $.enum_param],
    [$.var_decl, $.error_param],
    [$.semicolon_expr, $.type_expr],
    [$.member_access_suffix, $.enum_error_initializer],
    [$.argument_list, $.grouped_expr],
    [$.fn_call_suffix, $.lambda_expr],
    [$.semicolon_expr, $.member_chain, $.type_expr],
    [$.expr, $.member_chain, $.type_expr],
    [$.param, $.expr, $.member_chain, $.type_expr],
    [$.label, $.expr, $.member_chain],
    [$.non_semicolon_expr, $.expr]
  ],
  rules: {
    source_file: $ => seq(
      $.module_decl,
      repeat(choice($.decl, $.pub_decl))
    ),

    module_decl: $ => seq('module', $.string, ';'),
    pub_decl: $ => seq( 'pub', $.decl ),
    decl: $ => choice( $.use_decl, $.var_decl ),
    use_decl: $ => seq( 'use', optional($.identifier), $.string, ';' ),

    param_list: $ => seq(
      $.param,
      repeat(seq(',', $.param))
    ),

    param: $ => seq(
      optional('mut'),
      $.identifier,
      repeat(seq(',', $.identifier)),
      ':',
      $.type_expr,
      optional(seq('=', $.expr))
    ),

    non_semicolon_expr: $ => choice(
      $.struct_literal,
      $.enum_literal,
      $.error_literal,
      $.lambda_expr
    ),

    semicolon_expr: $ => choice(
      $.literal,
      $.binary_expr,
      $.unary_expr,
      prec(2,seq($.lambda_expr, $.fn_call_suffix)),
      $.identifier,
      $.grouped_expr,
      $.member_chain,
      $.struct_initializer,
      $.enum_error_initializer,
      $.array_initializer,
      $.if_expr,
      $.match_expr,
      $.type_expr
    ),

    var_decl: $ => seq(
      $.identifier,
      repeat(seq(',', $.identifier)),
      choice(seq(':', $.type_expr, '=', $.var_expr), seq(':=', $.var_expr))
    ),

    mut_var_decl: $ => seq(
      'mut',
      $.identifier,
      repeat(seq(',', $.identifier)),
      optional(choice(seq(':', $.type_expr, '=', $.expr), seq(':=', $.expr)))
    ),

    var_expr: $ => choice( $.non_semicolon_expr, seq($.semicolon_expr, ';') ),

    enum_param_list: $ => seq(
      $.enum_member,
      repeat(seq(',', $.enum_member))
    ),

    enum_member: $ => choice( $.enum_param, $.var_decl ),

    enum_param: $ => seq(
      $.identifier,
      optional(seq(':', $.type_expr)),
      ','
    ),

    error_param_list: $ => seq(
      $.error_member,
      repeat(seq(',', $.error_member))
    ),

    error_member: $ => choice( $.error_param, $.var_decl ),

    error_param: $ => seq(
      $.identifier,
      optional(seq(':', $.type_expr)),
      ','
    ),

    struct_param_list: $ => seq(
      $.struct_member,
      repeat(seq(',', $.struct_member))
    ),

    struct_member: $ => choice( $.struct_param, $.var_decl ),

    struct_param: $ => seq(
      $.identifier,
      repeat(seq(',', $.identifier)),
      ':',
      $.type_expr,
      ','
    ),

    block: $ => seq(
      '{',
      repeat($.something),
      '}'
    ),

    label: $ => seq( optional(seq($.identifier, ':')), $.block ),
    arrow_expr: $ => seq(
      '=>',
      choice(seq(choice($.expr, $.return_stmt, $.break_stmt), ';'), $.assign_stmt),
    ),

    capture: $ => seq(
      '[',
      optional('mut'),
      $.identifier,
      repeat(seq(',', optional('mut'), $.identifier)),
      ']'
    ),

    semicolon_stmt: $ => choice(
      $.mut_var_decl,
      $.return_stmt,
      $.break_stmt,
      $.call,
    ),

    non_semicolon_stmt: $ => choice(
      $.if_stmt,
      $.match_stmt,
      $.for_stmt,
      $.while_stmt,
      $.defer_stmt,
      $.decl,
      $.assign_stmt,
    ),

    call: $ => seq(
      choice($.member_chain, $.identifier, $.lambda_expr),
      $.fn_call_suffix
    ),

    if_stmt: $ => prec.right(seq(
      'if',
      choice($.binary_expr, $.member_chain, $.identifier),
      optional(seq(':', $.capture)),
      $.something,
      optional(seq('else', $.something))
    )),

    something: $ => choice($.label, $.non_semicolon_stmt, seq($.semicolon_stmt, ';')),

    if_expr: $ => prec.right(2,seq(
      'if',
      choice($.binary_expr, $.member_chain, $.identifier),
      optional(seq(':', $.capture)),
      choice($.label, $.expr),
      'else',
      choice($.label, $.expr)
    )),

    match_stmt: $ => seq(
      'match',
      $.expr,
      '{',
      optional($.match_arms_stmt),
      '}'
    ),

    match_arms_stmt: $ => seq(
      $.match_arm_stmt,
      repeat(seq(',', $.match_arm_stmt))
    ),

    match_arm_stmt: $ => seq(
      $.match_pattern,
      ':',
      optional($.capture),
      choice($.label, $.return_stmt, $.break_stmt, $.assign_stmt, $.call)
    ),

    match_expr: $ => seq(
      'match',
      $.expr,
      '{',
      optional($.match_arms_expr),
      '}'
    ),

    match_arms_expr: $ => seq(
      $.match_arm_expr,
      repeat(seq(',', $.match_arm_expr))
    ),

    match_arm_expr: $ => seq(
      $.match_pattern,
      ':',
      optional($.capture),
      choice($.label, $.expr)
    ),

    match_pattern: $ => choice(
      '_',
      $.expr,
      $.range_expr
    ),

    defer_stmt: $ => seq(
      'defer',
      optional($.capture),
      $.something
    ),

    return_stmt: $ => seq(
      'return',
      optional($.expr)
    ),

    break_stmt: $ => seq(
      'break',
      optional($.label_break)
    ),

    label_break: $ => seq(
      ':',
      $.identifier,
      optional($.expr)
    ),

    for_stmt: $ => seq(
      'for',
      choice($.expr, $.range_expr),
      ':',
      $.capture,
      $.something,
    ),

    while_stmt: $ => seq(
      'while',
      $.expr,
      optional(seq(':', $.capture)),
      $.something,
    ),

    assign_stmt: $ => seq(
      $.member_chain_lhs,
      choice(seq($.assign, $.var_expr), seq($.assign_op, $.semicolon_expr, ';'))
    ),

    assign_op: $ => choice(
      "+=",
      "-=",
      "*=",
      "/=",
      "%=",
      "^="
    ),

    assign: $ => '=',

    expr: $ => choice(
      $.literal,
      $.binary_expr,
      $.unary_expr,
      $.lambda_expr,
      prec(2,seq($.lambda_expr, $.fn_call_suffix)),
      $.identifier,
      $.grouped_expr,
      $.member_chain,
      $.struct_literal,
      $.enum_literal,
      $.error_literal,
      $.struct_initializer,
      $.enum_error_initializer,
      $.array_initializer,
      $.if_expr,
      $.match_expr
    ),

    binary_expr: $ => prec.left(2, choice(
      seq($.expr, $.op, $.expr),
      seq($.type_expr,
        choice('==', '!='),
        $.type_expr)
    )),

    op: $ => choice(
      "+",
      "-",
      "*",
      "/",
      "%",
      "|",
      "&",
      "^",
      ">>",
      "<<",
      "==",
      "!=",
      "||",
      "&&",
      "??"
    ),

    unary_expr: $ => prec.right(3, seq(
      choice("-", "&", "!", "~"),
      $.expr
    )),

    member_chain: $ => prec.left(seq(
      $.identifier,
      repeat($.suffix)
    )),
    suffix: $ => prec(2, choice(
      $.suffix_no_call,
      $.fn_call_suffix
    )),

    suffix_no_call: $ => choice(
      $.member_access_suffix,
      $.pointer_deref_suffix,
      $.optional_deref_suffix,
      $.array_index_suffix
    ),

    member_chain_lhs: $ => seq(
      $.identifier,
      optional(seq(repeat($.suffix), $.suffix_no_call))
    ),

    member_access_suffix: $ => seq(
      '.',
      $.identifier
    ),

    pointer_deref_suffix: $ => '.*',

    optional_deref_suffix: $ => '.?',

    array_index_suffix: $ => seq(
      '[',
      $.expr,
      ']'
    ),

    fn_call_suffix: $ => seq(
      '(',
      optional($.argument_list),
      ')'
    ),

    argument_list: $ => seq(
      choice($.expr, $.type_expr),
      repeat(seq(',', choice($.expr, $.type_expr)))
    ),

    lambda_expr: $ => seq(
      '(',
      optional($.param_list),
      ')',
      optional($.type_expr),
      choice($.block, $.arrow_expr)
    ),

    grouped_expr: $ => seq( '(', $.expr, ')' ),

    range_expr: $ => seq( $.expr, '..', $.expr ),

    literal: $ => choice(
      $.number,
      $.string,
      $.char,
      $.boolean,
      'undefined',
      'null'
    ),

    number: $ => choice( $.int, $.float ),
    int: $ => token(/[0-9]+/),
    float: $ => token(/[0-9]+\.[0-9]+/),

    string: $ => seq(
      '"',
      repeat($.string_character),
      '"'
    ),

    string_character: $ => choice(
      $.escape_sequence,
      $.non_escape_character
    ),

    escape_sequence: $ => seq(
      '\\',
      choice('\\', '"', 'n', 't', 'r')
    ),

    non_escape_character: $ => token(/[^"]+/),

    char: $ => seq(
      '\'',
      choice($.escape_sequence, $.non_escape_char),
      '\''
    ),

    non_escape_char: $ => token(/[^']+/),
    boolean: $ => choice( 'true', 'false' ),

    struct_literal: $ => seq(
      'struct',
      '{',
      repeat($.struct_param_list),
      '}'
    ),

    enum_literal: $ => seq(
      'enum',
      '{',
      repeat($.enum_param_list),
      '}'
    ),

    error_literal: $ => seq(
      'error',
      '{',
      repeat($.error_param_list),
      '}'
    ),

    struct_initializer: $ => seq(
      choice($.member_chain, $.identifier),
      '.',
      '{',
      optional($.struct_field_initializers),
      '}'
    ),

    struct_field_initializers: $ => seq(
      $.identifier,
      ':',
      $.expr
    ),

    enum_error_initializer: $ => prec.left(seq(
      '.',
      $.identifier,
      optional(seq('(', $.expr, ')'))
    )),

    array_initializer: $ => seq(
      '.',
      '[',
      optional($.expr_list),
      ']'
    ),

    expr_list: $ => seq(
      $.expr,
      repeat(seq(',', $.expr))
    ),

    identifier: $ => token(/(?:[A-Za-z][A-Za-z0-9_]*|_[A-Za-z0-9_]*[A-Za-z][A-Za-z0-9_]*)/),

    type_expr: $ => choice(
      $.array_type,
      $.pointer_type,
      $.optional_type,
      $.member_chain,
      $.identifier
    ),

    array_type: $ => seq( '[', ']', $.type_expr ),
    pointer_type: $ => seq( '*', $.type_expr ),
    optional_type: $ => seq( '?', $.type_expr ),

    comment: $ => choice(
      seq('//', /.*/),
      seq('/*', /[^*]*\*+([^/*][^*]*\"+)*/ ,'/')
    ),
  }
});
