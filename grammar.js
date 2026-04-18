const PREC = {
  assignment: 1,
  orElse: 2,
  range: 3,
  logicalOr: 4,
  logicalAnd: 5,
  bitOr: 6,
  bitXor: 7,
  bitAnd: 8,
  equality: 9,
  shift: 10,
  additive: 11,
  multiplicative: 12,
  unary: 13,
  call: 14,
  functionLiteral: 15,
}

module.exports = grammar({
  name: "dyn",

  word: ($) => $.identifier,

  extras: ($) => [/[\s\uFEFF\u2060\u200B]/, $.line_comment, $.block_comment],

  conflicts: ($) => [
    [$.tuple_literal, $.anonymous_struct_literal],
    [$.primary_expression, $.applied_type],
    [$.primary_expression, $.named_type],
    [$.enum_variant_expression],
    [$.expression_statement],
    [$.statement, $.expression],
    [$.for_expression, $.primary_expression],
    [$.defer_expression, $.primary_expression],
    [$.function_return_spec],
    [$.extern_function_signature],
    [$.destructure_item, $.primary_expression],
    [$.expression_branch, $.primary_expression],
    [$.function_expression],
    [$.type_literal_expression, $.non_error_type_expression],
    [$.error_type_suffix],
    [$.expression_statement, $.expression_branch],
    [$.statement_or_block, $.primary_expression],
    [$.statement_or_block, $.expression_branch, $.primary_expression],
    [$.declaration_statement],
    [$.destructure_assignment],
    [$.block_expression, $.tuple_type],
    [$.argument_list, $.parameter_list],
    [$.call_argument, $.parenthesized_expression],
    [$.primary_expression, $.loop_binding],
    [$.parameter_list, $.function_type],
    [$.destructure_item, $.named_type],
    [$.destructure_item, $.primary_expression, $.named_type],
    [$.array_literal, $.non_error_type_expression],
    [$.error_type_list],
    [$.statement, $.if_statement],
    [$.match_arm, $.primary_expression],
    [$.function_parameter, $.function_type_parameter],
  ],

  rules: {
    source_file: ($) => seq($.module_declaration, repeat($.top_level_declaration)),

    module_declaration: ($) => seq("module", field("name", $.identifier)),

    top_level_declaration: ($) =>
      seq(
        repeat($.doc_comment),
        optional("pub"),
        $.declaration,
      ),

    declaration: ($) =>
      choice(
        seq(
          optional("mut"),
          field("name", $.identifier),
          choice(
            seq(":=", field("value", $.expression)),
            seq(":", field("type", $.type_expression), "=", field("value", $.expression)),
          ),
        ),
        seq(
          field("name", $.identifier),
          ":=",
          "extern",
          field("signature", $.extern_function_signature),
        ),
        seq(
          field("owner", choice($.type_path, $.identifier)),
          ".",
          field("name", $.identifier),
          choice(
            seq(":=", field("value", $.expression)),
            seq(":", field("type", $.type_expression), "=", field("value", $.expression)),
          ),
        ),
      ),

    extern_function_signature: ($) =>
      seq(
        "(",
        optional(seq(commaSep1($.function_type_parameter), optional(","))),
        ")",
        optional(field("return_type", $.type_expression)),
        optional(seq("=", field("link_name", $.string_literal))),
      ),

    type_path: ($) => prec.left(seq($.identifier, repeat1(seq(".", $.identifier)))),

    statement: ($) =>
      choice(
        $.declaration_statement,
        $.assignment_statement,
        $.destructure_assignment,
        $.if_statement,
        $.for_expression,
        $.match_expression,
        $.break_expression,
        $.continue_expression,
        $.return_expression,
        $.defer_expression,
        $.labeled_statement,
        $.expression_statement,
        $.empty_statement,
      ),

    empty_statement: () => ";",

    declaration_statement: ($) =>
      seq(
        repeat($.doc_comment),
        choice(
          seq(
            optional("mut"),
            field("name", $.identifier),
            choice(
              seq(":=", field("value", $.expression)),
              seq(":", field("type", $.type_expression), "=", field("value", $.expression)),
            ),
          ),
          seq(
            "{",
            optional(seq(commaSep1($.destructure_item), optional(","))),
            "}",
            choice(
              seq(":=", field("value", $.expression)),
              seq(":", field("type", $.tuple_type), "=", field("value", $.expression)),
            ),
          ),
        ),
        optional(";"),
      ),

    destructure_assignment: ($) =>
      seq(
        "{",
        optional(seq(commaSep1($.destructure_item), optional(","))),
        "}",
        "=",
        field("value", $.expression),
        optional(";"),
      ),

    destructure_item: ($) => choice(seq(optional("mut"), $.identifier), "_"),

    labeled_statement: ($) =>
      seq(field("label", $.identifier), ":", field("body", choice($.block_expression, $.for_expression))),

    statement_or_block: ($) => choice($.statement, $.block_expression),

    expression_statement: ($) => seq($.expression, optional(";")),

    expression: ($) =>
      choice(
        $.if_expression,
        $.match_expression,
        $.for_expression,
        $.break_expression,
        $.continue_expression,
        $.return_expression,
        $.defer_expression,
        $.comptime_expression,
        $.inline_expression,
        $.use_expression,
        $.or_else_expression,
        $.binary_expression,
        $.unary_expression,
        $.postfix_expression,
        $.primary_expression,
      ),

    if_statement: ($) =>
      prec.right(
        seq(
          "if",
          field("condition", $.condition_expression),
          field("consequence", $.statement_or_block),
          optional(seq("else", field("alternative", choice($.if_statement, $.statement_or_block)))),
        ),
      ),

    if_expression: ($) =>
      prec.right(
        seq(
          "if",
          field("condition", $.condition_expression),
          field("consequence", $.expression_branch),
          "else",
          field("alternative", $.expression_branch),
        ),
      ),

    condition_expression: ($) =>
      choice(
        seq(field("value", $.expression), ":", field("capture", $.pipe_binding)),
        $.expression,
      ),

    expression_branch: ($) => choice($.expression, $.block_expression),

    match_expression: ($) =>
      seq(
        "match",
        field("scrutinee", $.expression),
        "{",
        optional(seq(commaSep1($.match_arm), optional(","))),
        "}",
      ),

    match_arm: ($) =>
      seq(
        field("pattern", $.pattern_list),
        optional(seq("if", field("guard", $.expression))),
        ":",
        optional(field("capture", $.loop_binding)),
        field("value", choice($.expression, $.block_expression)),
      ),

    pattern_list: ($) => seq($.pattern, repeat(seq(",", $.pattern))),

    for_expression: ($) =>
      prec.right(
        seq(
          "for",
          choice(
            field("body", $.block_expression),
            seq(
              field("head", $.expression),
              optional(":"),
              optional(field("binding", $.loop_binding)),
              field("body", choice($.expression, $.block_expression)),
            ),
          ),
        ),
      ),

    break_expression: ($) =>
      prec.right(
        seq(
          "break",
          optional(seq(":", field("label", $.identifier))),
          optional(field("value", $.expression)),
        ),
      ),

    continue_expression: ($) =>
      prec.right(seq("continue", optional(seq(":", field("label", $.identifier))))),

    return_expression: ($) => prec.right(seq("return", optional(field("value", $.expression)))),

    defer_expression: ($) =>
      seq(
        "defer",
        optional(field("binding", $.loop_binding)),
        field("body", choice($.expression, $.block_expression)),
      ),

    comptime_expression: ($) => prec(PREC.unary, seq("comp", field("expression", $.expression))),

    inline_expression: ($) => prec(PREC.unary, seq("inline", field("expression", $.expression))),

    use_expression: ($) => seq("use", field("path", $.string_literal)),

    assignment_statement: ($) =>
      prec.right(
        PREC.assignment,
        seq(
          field("target", $.postfix_expression),
          field(
            "operator",
            choice(
              "=",
              "+=",
              "-=",
              "*=",
              "/=",
              "%=",
              "&=",
              "|=",
              "^=",
              "<<=",
              ">>=",
            ),
          ),
          field("value", $.expression),
          optional(";"),
        ),
      ),

    or_else_expression: ($) =>
      prec.left(
        PREC.orElse,
        seq(
          field("value", $.expression),
          "or",
          optional(field("binding", $.loop_binding)),
          field("fallback", $.expression),
        ),
      ),

    binary_expression: ($) =>
      choice(
        prec.right(PREC.range, seq($.expression, choice("..", "..="), $.expression)),
        prec.left(PREC.logicalOr, seq($.expression, "||", $.expression)),
        prec.left(PREC.logicalAnd, seq($.expression, "&&", $.expression)),
        prec.left(PREC.bitOr, seq($.expression, "|", $.expression)),
        prec.left(PREC.bitXor, seq($.expression, "^", $.expression)),
        prec.left(PREC.bitAnd, seq($.expression, "&", $.expression)),
        prec.left(
          PREC.equality,
          seq($.expression, choice("==", "!=", "<", "<=", ">", ">="), $.expression),
        ),
        prec.left(PREC.shift, seq($.expression, choice("<<", ">>"), $.expression)),
        prec.left(PREC.additive, seq($.expression, choice("+", "-"), $.expression)),
        prec.left(PREC.multiplicative, seq($.expression, choice("*", "/", "%"), $.expression)),
      ),

    unary_expression: ($) =>
      prec(
        PREC.unary,
        seq(field("operator", choice("-", "!", "~", "&", seq("&", "mut"))), field("value", $.expression)),
      ),

    postfix_expression: ($) =>
      choice(
        $.call_expression,
        $.subscript_expression,
        $.field_expression,
        $.deref_access_expression,
        $.optional_unwrap_expression,
        $.error_unwrap_expression,
      ),

    call_expression: ($) => prec.left(PREC.call, seq(field("function", $.expression), $.argument_list)),

    argument_list: ($) => seq("(", optional(seq(commaSep1($.call_argument), optional(","))), ")"),

    call_argument: ($) =>
      choice(seq(field("name", $.identifier), ":", field("value", $.expression)), $.expression),

    subscript_expression: ($) =>
      prec.left(
        PREC.call,
        seq(
          field("base", $.expression),
          "[",
          choice(
            field("index", $.expression),
            seq(
              optional(field("start", $.expression)),
              field("range_operator", choice("..", "..=")),
              optional(field("end", $.expression)),
            ),
          ),
          "]",
        ),
      ),

    field_expression: ($) =>
      prec.left(PREC.call, seq(field("base", $.expression), ".", field("field", $.identifier))),

    deref_access_expression: ($) => prec.left(PREC.call, seq(field("base", $.expression), ".*")),

    optional_unwrap_expression: ($) => prec.left(PREC.call, seq(field("base", $.expression), ".?")),

    error_unwrap_expression: ($) => prec.left(PREC.call, seq(field("base", $.expression), ".!")),

    primary_expression: ($) =>
      choice(
        $.identifier,
        $.builtin_identifier,
        $.integer_literal,
        $.float_literal,
        $.string_literal,
        $.char_literal,
        $.boolean_literal,
        $.null_literal,
        $.parenthesized_expression,
        $.function_expression,
        $.array_literal,
        $.tuple_literal,
        $.anonymous_struct_literal,
        $.typed_struct_literal,
        $.block_expression,
        $.enum_variant_expression,
        $.type_literal_expression,
      ),

    parenthesized_expression: ($) => seq("(", $.expression, ")"),

    function_expression: ($) =>
      prec(
        PREC.functionLiteral,
        seq(
          optional("inline"),
          $.parameter_list,
          optional(field("return_spec", $.function_return_spec)),
          field("body", choice(seq("=>", $.expression), $.block_expression)),
        ),
      ),

    parameter_list: ($) => seq("(", optional(seq(commaSep1($.function_parameter), optional(","))), ")"),

    function_parameter: ($) =>
      seq(
        field("name", $.identifier),
        ":",
        optional("comp"),
        field("type", $.param_type_expression),
        optional(seq("=", field("default", $.expression))),
      ),

    function_return_spec: ($) =>
      choice(
        seq(field("return_type", $.type_expression), "!", optional(field("errors", $.error_type_list))),
        seq("!", optional(field("errors", $.error_type_list))),
        seq("comp", field("return_type_expr", $.expression), "!", optional(field("errors", $.error_type_list))),
        seq("comp", field("return_type_expr", $.expression)),
        field("return_type", $.type_expression),
      ),

    array_literal: ($) => seq("[", optional(seq(commaSep1($.expression), optional(","))), "]"),

    tuple_literal: ($) => seq(".", "{", optional(seq(commaSep1($.expression), optional(","))), "}"),

    anonymous_struct_literal: ($) =>
      seq(".", "{", optional(seq(commaSep1($.named_field_initializer), optional(","))), "}"),

    named_field_initializer: ($) =>
      seq(field("name", $.identifier), ":", field("value", $.expression)),

    typed_struct_literal: ($) =>
      seq(
        field("type", choice($.named_type, $.applied_type)),
        "{",
        optional(seq(commaSep1($.typed_struct_field), optional(","))),
        "}",
      ),

    typed_struct_field: ($) =>
      choice(
        seq(field("name", $.identifier), ":", field("value", $.expression)),
        field("name", $.identifier),
      ),

    block_expression: ($) => seq("{", repeat($.statement), "}"),

    enum_variant_expression: ($) =>
      choice(
        seq(".", field("variant", $.identifier), $.argument_list_values),
        seq(".", field("variant", $.identifier)),
      ),

    argument_list_values: ($) =>
      seq("(", optional(seq(commaSep1($.expression), optional(","))), ")"),

    type_literal_expression: ($) => choice($.struct_type, $.enum_type),

    pattern: ($) =>
      choice(
        $.wildcard_pattern,
        $.range_pattern,
        $.enum_pattern,
        $.literal_pattern,
        $.identifier_pattern,
      ),

    wildcard_pattern: () => "_",

    range_pattern: ($) =>
      prec.right(
        seq(
          field("start", choice($.literal_pattern, $.identifier_pattern)),
          field("operator", choice("..", "..=")),
          field("end", $.pattern),
        ),
      ),

    enum_pattern: ($) =>
      choice(
        seq(".", field("variant", $.identifier), optional($.pattern_binding_list)),
        seq(
          field("root", $.identifier),
          ".",
          field("variant", $.identifier),
          optional($.pattern_binding_list),
        ),
      ),

    pattern_binding_list: ($) =>
      seq("(", optional(seq(commaSep1(choice($.identifier, "_")), optional(","))), ")"),

    identifier_pattern: ($) => $.identifier,

    literal_pattern: ($) =>
      choice(
        $.integer_literal,
        $.float_literal,
        $.string_literal,
        $.char_literal,
        $.boolean_literal,
        $.null_literal,
      ),

    type_expression: ($) =>
      prec.right(seq(field("base", $.non_error_type_expression), optional($.error_type_suffix))),

    error_type_suffix: ($) => seq("!", optional($.error_type_list)),

    error_type_list: ($) => seq($.type_expression, repeat(seq(",", $.type_expression))),

    non_error_type_expression: ($) =>
      choice(
        seq("?", $.type_expression),
        seq("*", optional("mut"), $.type_expression),
        seq("[", "]", optional("mut"), $.type_expression),
        seq("[", $.expression, "]", $.type_expression),
        $.function_type,
        $.tuple_type,
        $.struct_type,
        $.enum_type,
        $.applied_type,
        $.named_type,
        "type",
      ),

    param_type_expression: ($) => $.type_expression,

    named_type: ($) => seq($.identifier, repeat(seq(".", $.identifier))),

    applied_type: ($) =>
      seq(
        field("callee", $.identifier),
        "(",
        optional(seq(commaSep1($.type_expression), optional(","))),
        ")",
      ),

    function_type: ($) =>
      prec.right(
        seq(
          "(",
          optional(seq(commaSep1($.function_type_parameter), optional(","))),
          ")",
          optional(field("return_type", $.type_expression)),
        ),
      ),

    function_type_parameter: ($) =>
      choice(
        seq(field("name", $.identifier), ":", field("type", $.param_type_expression)),
        field("type", $.param_type_expression),
      ),

    tuple_type: ($) => seq("{", optional(seq(commaSep1($.type_expression), optional(","))), "}"),

    struct_type: ($) =>
      seq(
        optional("packed"),
        "struct",
        "{",
        optional(seq(commaSep1($.struct_type_field), optional(","))),
        "}",
      ),

    struct_type_field: ($) =>
      seq(
        field("name", $.identifier),
        ":",
        field("type", $.type_expression),
        optional(seq("=", field("default", $.expression))),
      ),

    enum_type: ($) =>
      seq(
        "enum",
        optional(seq("(", field("repr", $.type_expression), ")")),
        "{",
        optional(seq(commaSep1($.enum_type_variant), optional(","))),
        "}",
      ),

    enum_type_variant: ($) =>
      seq(field("name", $.identifier), optional(seq(":", field("payload", $.type_expression)))),

    pipe_binding: ($) => seq("|", commaSep1(choice($.identifier, "_")), "|"),

    loop_binding: ($) => seq("|", choice($.identifier, "_"), "|"),

    identifier: () => /[A-Za-z_][A-Za-z0-9_]*/,
    builtin_identifier: () => /\$[A-Za-z_][A-Za-z0-9_]*/,

    integer_literal: () =>
      token(
        choice(
          /0[bB][01]([01_]*[01])?/,
          /0[oO][0-7]([0-7_]*[0-7])?/,
          /0[xX][0-9A-Fa-f]([0-9A-Fa-f_]*[0-9A-Fa-f])?/,
          /[0-9]([0-9_]*[0-9])?/,
        ),
      ),

    float_literal: () =>
      token(
        choice(
          /[0-9]([0-9_]*[0-9])?\.[0-9]([0-9_]*[0-9])?([eE][+-]?[0-9]+)?/,
          /[0-9]([0-9_]*[0-9])?[eE][+-]?[0-9]+/,
        ),
      ),

    string_literal: () => token(seq('"', repeat(choice(/[^"\\\n]/, /\\./)), '"')),
    char_literal: () => token(seq("'", choice(/[^'\\\n]/, /\\./), "'")),
    boolean_literal: () => choice("true", "false"),
    null_literal: () => "null",

    doc_comment: () => token(prec(2, seq("///", /[^\n]*/))),
    line_comment: () => token(prec(1, seq("//", /[^\n]*/))),
    block_comment: () => token(/\/\*[^*]*\*+([^/*][^*]*\*+)*\//),
  },
})

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)))
}
