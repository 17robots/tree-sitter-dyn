/**
 * @file A general systems programming language
 * @author 17robots <mdray@duck.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "dyn",
  extras: $ => [/\s+/],
  conflicts: $ => [
    [$.expr, $.member_chain, $.struct_initializer],
    [$.expr, $.member_chain],
    [$.stmt, $.else_stmt],
    [$.suffix, $.call],
    [$.match_expr, $.match_stmt],
    [$.expr, $.type_expr],
    [$.expr, $.type_list],
    [$.expr, $.struct_initializer, $.type_expr],
    [$.stmt_match, $.else_stmt_match],
    [$.fn_literal, $.fn_type],
    [$.expr, $.member_chain, $.member_chain_lhs, $.call],
    [$.range_expr, $.arrow_expr],
    [$.expr, $.type_expr, $.call],
    [$.assign_stmt, $.range_expr],
    [$.expr, $.member_chain, $.member_chain_lhs, $.struct_initializer],
    [$.expr, $.member_chain, $.member_chain_lhs],
    [$.var_decl, $.label, $.expr, $.member_chain],
  ],
  rules: {
    source_file: $ => seq($.module_decl, repeat(seq(choice($.var_decl, $.pub_decl), ';'))),
    module_decl: $ => seq('module', $.string, ';'),
    pub_decl: $ => seq('pub', $.var_decl),
    var_decl: $ => seq($.identifier, choice(seq(':=', $.expr), seq(':', $.type_expr, '=', $.expr))),
    mut_var_decl: $ => seq('mut', $.identifier, choice(seq(':', $.type_expr, optional(seq('=', $.expr))), seq(':=', $.expr))),

    use_literal: $ => seq('use', $.string),

    enum_literal: $ => seq('enum', '{', optional($.enum_param_list), '}'),
    enum_param_list: $ => seq($.enum_param, repeat(seq(',', $.enum_member))),
    enum_member: $ => choice($.var_decl, $.enum_param),
    enum_param: $ => seq($.identifier, repeat(seq(',', $.identifier)), ':', $.type_expr, ','),

    error_literal: $ => seq('error', '{', optional($.error_param_list), '}'),
    error_param_list: $ => seq($.error_param, repeat(seq(',', $.error_member))),
    error_member: $ => choice($.var_decl, $.error_param),
    error_param: $ => seq($.identifier, repeat(seq(',', $.identifier)), ':', $.type_expr, ','),

    struct_literal: $ => seq('struct', '{', optional($.struct_param_list), '}'),
    struct_param_list: $ => seq($.struct_param, repeat(seq(',', $.struct_member))),
    struct_member: $ => choice($.var_decl, $.struct_param),
    struct_param: $ => seq($.identifier, repeat(seq(',', $.identifier)), ':', $.type_expr, ','),

    fn_literal: $ => seq('(', optional($.param_list), ')', optional($.type_expr), choice($.block, $.arrow_expr)),
    param_list: $ => seq($.param, repeat(seq(',', $.param))),
    param: $ => choice(seq($.identifier, ':', $.type_expr), seq($.identifier, repeat(seq(',', $.identifier)), ':', $.type_expr)),
    
    arrow_expr: $ => seq('=>', choice($.expr, $.call, $.assign_stmt, $.while_stmt, $.for_stmt, $.if_stmt, $.match_stmt)), // TODO: fill this in
    
    block: $ => seq('{', repeat($.stmt), '}'),
    label: $ => seq(optional(seq($.identifier, ':')), $.block),
    match_pattern: $ => choice('_', $.expr),

    // exprs
    expr: $ => choice(
      $.use_literal,
      $.struct_literal,
      $.enum_literal,
      $.error_literal,
      $.fn_literal,
      $.literal,
      $.binary_expr,
      $.unary_expr,
      prec(2, seq($.fn_literal, $.fn_call_suffix)),
      $.identifier,
      $.grouped_expr,
      $.member_chain,
      $.struct_initializer,
      $.enum_error_initializer,
      $.array_initializer,
      $.if_expr,
      $.match_expr,
      $.type_expr,
      $.range_expr
    ),

    if_expr: $ => prec.right(2, seq('if', choice($.binary_expr, $.member_chain), optional(seq(':', $.capture)), choice($.label, $.expr), seq('else', choice($.if_expr, $.expr)))),
    
    match_expr: $ => seq('match', $.expr, '{', optional($.match_arms_expr), '}'),
    match_arms_expr: $ => seq($.match_arm_expr, repeat(seq(',', $.match_arm_expr))),
    match_arm_expr: $ => seq($.match_pattern, repeat(seq(',', $.match_pattern)), ':', $.expr),

    binary_expr: $ => prec.left(2, seq($.expr, $.op, $.expr)),
    op: $ => choice('+', '-', '*', '/', '%', '|', '&', '^', '>>', '<<', '==', '!=', '||', '&&', '??'),
    unary_expr: $ => prec.right(3, seq(choice('-', '&', '!', '~'), $.expr)),

    member_chain: $ => prec.left(seq(choice($.identifier, $.struct_literal, $.enum_literal, $.error_literal), repeat($.suffix))),
    member_chain_lhs: $ => seq($.identifier, optional(seq(repeat($.suffix), $.suffix_no_call))),

    suffix: $ => choice($.suffix_no_call, $.fn_call_suffix),
    suffix_no_call: $ => choice($.member_access, $.pointer_deref, $.optional_deref, $.array_index),

    member_access: $ => seq('.', $.identifier),
    pointer_deref: $ => '.*',
    optional_deref: $ => '.?',
    array_index: $ => seq('[', $.expr, ']'),
    
    fn_call_suffix: $ => seq('(', optional($.arg_list), ')'),
    arg_list: $ => seq($.expr, repeat(seq(',', $.expr))),
    
    grouped_expr: $ => seq('(', $.expr, ')'),
    
    range_expr: $ => prec.left(seq($.expr, '..', $.expr)),
    
    literal: $ => choice($.number, $.string, $.char, $.boolean, 'undefined', 'null'),
    number: $ => choice($.int, $.float),
    int: $ => token(/[0-9]+/),
    float: $ => token(/[0-9]+\.[0-9]+/),
    string: $ => seq('"', repeat($.string_character), '"'),
    string_character: $ => choice($.escape_sequence, $.non_escape_character),
    escape_sequence: $ => seq('\\', choice('\\', '"', 'n', 't', 'r')),
    non_escape_character: $ => token(/[^"]+/),
    char: $ => seq('\'', choice($.escape_sequence, $.non_escape_char), '\''),
    non_escape_char: $ => token(/[^']+/),
    boolean: $ => choice('true', 'false'),
    
    struct_initializer: $ => seq(choice($.member_chain, $.identifier), '.', '{', optional($.struct_field_initializers), '}'),
    struct_field_initializers: $ => seq($.struct_field_initializer, repeat(seq(',', $.struct_field_initializer))),
    struct_field_initializer: $ => seq($.identifier, ':', $.expr),
    
    enum_error_initializer: $ => prec.left(seq('.', $.identifier, optional(seq('(', $.expr, ')')))),
    
    array_initializer: $ => seq('.', '[', optional($.expr_list), ']'),
    expr_list: $ => seq($.expr, repeat(seq(',', $.expr))),
    
    identifier: $ => token(/(?:[A-Za-z][A-Za-z0-9_]*|_[A-Za-z0-9_]*[A-Za-z][A-Za-z0-9_]*)/),
    
    type_expr: $ => choice($.array_type, $.pointer_type, $.optional_type, $.member_chain, $.member_chain, $.fn_type),
    array_type: $ => seq('[', ']', $.type_expr),
    pointer_type: $ => seq('*', $.type_expr),
    optional_type: $ => seq('?', $.type_expr),
    fn_type: $ => seq('(', optional($.type_list), ')', $.type_expr),
    type_list: $ => seq($.type_expr, repeat(seq(',', $.type_expr))),


    // stmts
    stmt: $ => choice($.if_stmt, $.while_stmt, $.for_stmt, $.match_stmt, seq($.return_stmt, ';'), $.defer_stmt, seq(choice($.mut_var_decl, $.var_decl), ';'), seq($.break_stmt, ';'), seq($.call, ';'), seq($.assign_stmt, ';')),
    stmt_match: $ => choice($.if_stmt_match, $.while_stmt_match, $.for_stmt_match, $.match_stmt, $.return_stmt, $.defer_stmt_match, $.break_stmt, $.call),

    if_stmt: $ => prec.right(seq('if', choice($.binary_expr, $.member_chain), optional(seq(':', $.capture)), choice(seq($.label, optional($.else_stmt)), seq($.stmt, optional($.else_stmt))))),
    else_stmt: $ => seq('else', choice($.if_stmt, $.label, seq($.stmt, ';'))),
    if_stmt_match: $ => prec.right(seq('if', choice($.binary_expr, $.member_chain, $.literal), optional(seq(':', $.capture)), choice(seq($.label, optional($.else_stmt)), seq($.stmt, optional($.else_stmt_match))))),
    else_stmt_match: $ => seq('else', choice($.if_stmt_match, $.label, $.stmt_match)),

    for_stmt: $ => seq('for', seq(choice($.range_expr, $.member_chain), repeat(seq(',', choice($.range_expr, $.member_chain)))), optional(seq(':', $.capture)), choice($.label, $.stmt)),
    for_stmt_match: $ => seq('for', seq(choice($.range_expr, $.member_chain), repeat(seq(',', choice($.range_expr, $.member_chain)))), optional(seq(':', $.capture)), choice($.label, $.stmt)),

    while_stmt: $ => seq('while', choice($.binary_expr, $.member_chain, $.literal), optional(seq(':', $.capture)), choice($.label, $.stmt)),
    while_stmt_match: $ => seq('while', choice($.binary_expr, $.member_chain, $.literal), optional(seq(':', $.capture)), choice($.label, $.stmt)),

    match_stmt: $ => seq('match', $.expr, '{', optional($.match_arms_stmt), '}'),
    match_arms_stmt: $ => seq($.match_arm_stmt, repeat(seq(',', $.match_arm_stmt))),
    match_arm_stmt: $ => seq($.match_pattern, repeat(seq(',', $.match_pattern)), ':', $.stmt_match),

    return_stmt: $ => seq('return', optional($.expr)),

    defer_stmt: $ => seq('defer', optional(seq(':', $.capture)), choice($.label, $.stmt)),
    defer_stmt_match: $ => seq('defer', optional(seq(':', $.capture)), choice($.label, $.stmt)),

    break_stmt: $ => seq('break', optional($.label_break)),
    label_break: $ => seq(optional(seq(':', $.identifier)), $.expr),

    assign_stmt: $ => seq($.member_chain_lhs, $.assign_op, $.expr),
    assign_op: $ => choice('+=', '-=', '*=', '/=', '%=', '^=', '='),

    call: $ => seq(choice($.member_chain, $.identifier, $.fn_literal), $.fn_call_suffix),

    capture: $ => seq('|', $.capture_member, repeat(seq(',', $.capture_member)), '|'),
    capture_member: $ => seq(optional('mut'), $.identifier),
  }
})
