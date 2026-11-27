/// <reference types="tree-sitter-cli/dsl" />

const PREC = {
  ASSIGN: 1,
  LOGICAL_OR: 2,
  LOGICAL_AND: 3,
  EQUALITY: 4,
  RELATIONAL: 5,
  BIT_OR: 6,
  BIT_XOR: 7,
  BIT_AND: 8,
  SHIFT: 9,
  ADD: 10,
  MUL: 11,
  PREFIX: 12,
  POSTFIX: 13,
};
const commaSep = (rule) =>
  optional(seq(rule, repeat(seq(",", rule)), optional(",")));
const commaSep1 = (rule) => seq(rule, repeat(seq(",", rule)));
module.exports = grammar({
  name: "dyn",
  extras: ($) => [/\s/, $.comment],
  word: ($) => $.identifier,
  reserved: {
    global: (_) => ["distinct", "packed"],
  },
  // Pure choices would appear in every tree only as wrapper nodes. Inlining
  // them removes about a third of all nodes without changing what parses.
  // primary stays: it marks identifiers used as values.
  inline: ($) => [$.expression, $.literal, $.statement],
  conflicts: ($) => [
    [$.defer, $.primary],
    [$.errdefer, $.primary],
    [$.block, $.primary],
    [$.block, $.struct_literal],
    [$.field_type, $.primary],
    [$.field_type, $.primary, $.struct_literal],
    [$.primary, $.struct_literal],
    [$.array_type, $.array_literal],
  ],
  rules: {
    source_file: ($) =>
      seq(
        optional($.shebang),
        repeat(choice($.target_directive, $.link_directive, $.declaration)),
      ),
    shebang: (_) => token(seq("#!", /[^\n]*/)),
    target_directive: ($) =>
      seq(token("#target"), "(", commaSep1($.target_condition), ")"),
    target_condition: ($) => seq($.identifier, ":", choice($.identifier, $.number_)),
    link_directive: ($) =>
      seq(token("#link"), "(", field("library", $.string_), ")"),
    declaration: ($) =>
      choice(
        $.use,
        $.static_assert,
        seq(
          optional(token("pub")),
          choice(
            $.const_variable,
            $.struct,
            $.enum,
            $.fn,
            $.extern_fn,
            $.extern_variable,
            $.type_alias,
            $.variable,
          ),
        ),
      ),
    use: ($) => seq(token("use"), $.import, repeat(seq(",", $.import))),
    import: ($) =>
      seq(optional(field("alias", $.identifier)), field("path", $.string_)),
    variable: ($) =>
      seq(
        $.identifier,
        choice(
          $.type_qualifier,
          seq(":", $.type, "=", $.expression),
          seq(":=", $.expression),
        ),
      ),
    const_variable: ($) => seq(token("const"), $.variable),
    type_alias: ($) =>
      seq(
        optional(token("distinct")),
        token("type"),
        $.identifier,
        "=",
        $.type,
      ),
    struct: ($) =>
      seq(
        optional(
          choice(
            seq(token("nocopy"), optional(token("packed"))),
            seq(token("packed"), optional(token("nocopy"))),
          ),
        ),
        token("struct"),
        $.identifier,
        optional(seq("<", commaSep1($.type_parameter), ">")),
        "{",
        commaSep($.struct_member),
        "}",
      ),
    type_parameter: ($) => $.identifier,
    struct_member: ($) =>
      seq(
        $.identifier,
        repeat(seq(",", $.identifier)),
        $.type_qualifier,
        optional(seq("=", field("default", $.expression))),
      ),
    enum: ($) =>
      seq(
        token("enum"),
        optional(seq("(", choice($.primitive, $.field_type), ")")),
        $.identifier,
        optional(seq("<", commaSep1($.type_parameter), ">")),
        "{",
        commaSep($.enum_member),
        "}",
      ),
    enum_member: ($) =>
      seq($.identifier, optional(seq("(", $.type, ")")), optional(seq("=", field("value", $.expression)))),
    fn: ($) =>
      seq(
        token("fn"),
        field("name", $.identifier),
        optional(seq("<", commaSep1($.type_parameter), ">")),
        "(",
        commaSep(choice($.fn_param, $.variadic_param)),
        ")",
        optional(choice($.fallible_type, $.type)),
        $.block,
      ),
    extern_fn: ($) =>
      prec.right(
        seq(
          token("extern"),
          token("fn"),
          field("name", $.identifier),
          optional(field("link_name", $.string_)),
          "(",
          choice(
            seq(commaSep1($.fn_param), optional(seq(",", optional($.variadic)))),
            optional($.variadic),
          ),
          ")",
          // The return type starts on the same line as the ")".
          optional(seq(token.immediate(/[ \t]+/), $.type)),
        ),
      ),
    extern_variable: ($) =>
      seq(
        token("extern"),
        field("name", $.identifier),
        optional(field("link_name", $.string_)),
        $.type_qualifier,
      ),
    fn_param: ($) =>
      seq($.identifier, repeat(seq(",", $.identifier)), $.type_qualifier),
    variadic_param: ($) =>
      seq(field("name", $.identifier), ":", $.variadic, field("type", $.type)),
    variadic: (_) => "...",
    block: ($) => seq("{", repeat(choice($.statement)), "}"),
    statement: ($) =>
      choice(
        $.return_,
        $.fail_,
        $.continue_,
        $.break_,
        $.variable,
        $.const_variable,
        $.if_,
        $.case_,
        $.for_,
        $.defer,
        $.errdefer,
        $.try_,
        $.catch_,
        $.call,
        $.assignment,
        $.panic,
        $.static_assert,
        $.init,
        $.syscall,
        $.type_alias,
        $.block,
      ),
    return_: ($) => prec.right(seq(token("return"), optional($.expression))),
    fail_: ($) => prec.right(seq(token("fail"), optional($.expression))),
    continue_: ($) => prec.right(seq(token("continue"), optional(field("label", $.identifier)))),
    break_: ($) => prec.right(seq(token("break"), optional(field("label", $.identifier)))),
    if_: ($) => seq(token("if"), $.expression, $.block, optional($.else_)),
    else_: ($) => seq(token("else"), choice($.if_, $.block)),
    case_: ($) =>
      seq(token("case"), $.expression, "{", repeat($.case_arm), "}"),
    case_arm: ($) =>
      choice(
        seq($.type_pattern, repeat(seq(",", $.type)), "=>", $.block),
        seq(choice("_", seq($.case_pattern, repeat(seq(",", $.case_pattern)))), "=>", $.block),
      ),
    case_pattern: ($) => choice($.range, $.expression),
    // Only spellings that cannot be values; a named type such as Point(p) parses
    // as a case_pattern, which the compiler resolves to a type.
    type_pattern: ($) =>
      prec(1, seq(
        choice($.primitive, $.pointer_type, $.array_type, $.fn_type),
        optional(seq("(", choice("_", $.identifier), ")")),
      )),
    for_: ($) =>
      seq(optional(seq(field("label", $.identifier), ":")), token("for"), optional($.for_condition), $.block),
    for_condition: ($) =>
      choice(
        seq(
          choice(
            $.identifier,
            seq($.identifier, ":", $.type),
            seq("*", $.identifier),
          ),
          // for x, i in xs: the element's index.
          optional(seq(",", field("index", $.identifier))),
          token("in"),
          choice($.range, $.step, $.reverse, $.expression),
        ),
        $.expression,
      ),
    defer: ($) =>
      seq(
        token("defer"),
        choice(
          $.block,
          $.call,
          $.catch_,
          $.assignment,
          $.if_,
          $.case_,
          $.for_,
          $.panic,
          $.syscall,
        ),
      ),
    errdefer: ($) =>
      seq(
        token("errdefer"),
        choice(
          $.block,
          $.call,
          $.catch_,
          $.assignment,
          $.if_,
          $.case_,
          $.for_,
          $.panic,
          $.syscall,
        ),
      ),
    assignment: ($) =>
      prec(
        PREC.ASSIGN,
        seq(
          $.primary,
          choice(
            "=",
            "+=",
            "-=",
            "*=",
            "/=",
            "%=",
            "&=",
            "|=",
            ">>=",
            "<<=",
            "^=",
          ),
          $.expression,
        ),
      ),
    static_assert: ($) =>
      seq(token("#assert"), "(", $.expression, optional(seq(",", $.string_)), ")"),
    panic: ($) => seq(token("#panic"), "(", $.expression, ")"),
    init: ($) => seq(token("#init"), "(", $.expression, ")"),
    take: ($) => seq(token("#take"), "(", $.expression, ")"),
    syscall: ($) => seq(token("#syscall"), "(", commaSep($.expression), ")"),
    range: ($) => seq($.expression, choice("..", "..="), $.expression),
    type_qualifier: ($) => seq(":", $.type),
    type: ($) =>
      prec.right(
        choice(
          $.union_type,
          $.paren_type,
          $.generic_type,
          $.field_type,
          $.array_type,
          $.fn_type,
          $.pointer_type,
          $.primitive,
        ),
      ),
    paren_type: ($) => seq("(", $.type, ")"),
    union_type: ($) => prec.left(1, seq($.type, "|", $.type)),
    fallible_type: ($) =>
      prec.right(
        choice(
          seq($.type, "!", optional($.type)),
          seq("!", optional($.type)),
        ),
      ),
    generic_type: ($) =>
      prec(2, seq($.field_type, "<", commaSep1($.type), ">")),
    field_type: ($) =>
      prec.right(seq($.identifier, repeat(seq(".", $.identifier)))),
    array_type: ($) =>
      seq("[", optional(field("length", $.expression)), "]", optional(token("const")), $.type),
    pointer_type: ($) =>
      seq("*", optional(token("const")), $.type),
    primitive: (_) =>
      token(
        choice(
          "i8",
          "i16",
          "i32",
          "i64",
          "u8",
          "u16",
          "u32",
          "u64",
          "f32",
          "f64",
          "isize",
          "usize",
          "bool",
          "str",
          "rawptr",
          "any",
        ),
      ),
    fn_type: ($) =>
      prec.right(
        seq(token("fn"), "(", commaSep($.fn_type_parameter), ")", optional(choice($.fallible_type, $.type))),
      ),
    // Parameter names in a function type are documentation only.
    fn_type_parameter: ($) =>
      seq(optional(seq(field("name", $.identifier), ":")), $.type),
    expression: ($) =>
      choice(
        $.literal,
        $.primary,
        $.unary_prefix,
        $.try_,
        $.catch_,
        $.binary,
        $.size,
        $.align,
        $.limit,
        $.offset,
        $.pointer_slice,
        $.wrapping,
        $.float_op,
        $.load,
        $.typeof,
        $.syscall,
      ),
    try_: ($) => prec(PREC.PREFIX, seq(token("try"), $.expression)),
    catch_: ($) =>
      prec.right(
        PREC.ASSIGN,
        seq(
          $.expression,
          token("catch"),
          choice(
            $.block,
            prec(1, seq(field("binding", $.identifier), $.block)),
            $.expression,
          ),
        ),
      ),
    // What indexing, calls and field access apply to: a primary, or a
    // builtin's result, as in #slice(p, n)[i]. Hidden, so trees keep their shape.
    _postfix_base: ($) =>
      prec(PREC.POSTFIX, choice(
        $.primary,
        $.string_,
        $.array_literal,
        $.size,
        $.align,
        $.offset,
        $.pointer_slice,
        $.wrapping,
        $.float_op,
        $.load,
        $.typeof,
      )),
    primary: ($) =>
      choice(
        $.cast,
        $.take,
        $.generic_instantiation,
        $.identifier,
        $.enum_shorthand,
        $.unary_postfix,
        $.group,
        $.call,
        $.field_access,
        $.index,
      ),
    generic_instantiation: ($) =>
      prec(PREC.POSTFIX, seq(
        choice($.identifier, $.field_access),
        token.immediate("<"),
        commaSep1($.type),
        ">",
      )),
    enum_shorthand: ($) => prec(PREC.POSTFIX, seq(".", $.identifier)),
    group: ($) => seq("(", $.expression, ")"),
    binary: ($) =>
      choice(
        ...[
          ["||", PREC.LOGICAL_OR],
          ["&&", PREC.LOGICAL_AND],
          ["==", PREC.EQUALITY],
          ["!=", PREC.EQUALITY],
          [">", PREC.RELATIONAL],
          ["<", PREC.RELATIONAL],
          [">=", PREC.RELATIONAL],
          ["<=", PREC.RELATIONAL],
          ["|", PREC.BIT_OR],
          ["^", PREC.BIT_XOR],
          ["&", PREC.BIT_AND],
          ["<<", PREC.SHIFT],
          [">>", PREC.SHIFT],
          ["+", PREC.ADD],
          ["-", PREC.ADD],
          ["*", PREC.MUL],
          ["/", PREC.MUL],
          ["%", PREC.MUL],
        ].map(([op, p]) => prec.left(p, seq($.expression, op, $.expression))),
      ),
    unary_prefix: ($) =>
      prec(PREC.PREFIX, seq(choice("-", "&", "!", "~"), $.expression)),
    unary_postfix: ($) => prec(PREC.POSTFIX, seq($.expression, ".*")),
    call: ($) =>
      prec(
        PREC.POSTFIX,
        seq($._postfix_base, "(", field("call_args", commaSep(choice($.expression, $.pointer_binding))), ")"),
      ),
    pointer_binding: ($) => seq("*", $.identifier),
    field_access: ($) => prec(PREC.POSTFIX, seq($._postfix_base, ".", $.identifier)),
    index: ($) =>
      prec(
        PREC.POSTFIX,
        seq(
          $._postfix_base,
          "[",
          choice(
            $.expression,
            "..",
            seq("..", $.expression),
            seq($.expression, ".."),
            seq($.expression, "..", $.expression),
          ),
          "]",
        ),
      ),
    size: ($) => seq(token("#sizeof"), "(", choice($.type, $.expression), ")"),
    align: ($) =>
      seq(token("#alignof"), "(", choice($.type, $.expression), ")"),
    // #max(T) and #min(T): an integer type's largest and smallest values.
    limit: ($) =>
      seq(choice(token("#max"), token("#min")), "(", $.type, ")"),
    load: ($) => seq(token("#load"), "(", $.string_, ")"),
    pointer_slice: ($) =>
      seq(token("#slice"), "(", $.expression, ",", $.expression, ")"),
    offset: ($) =>
      seq(token("#offsetof"), "(", $.type, ",", $.identifier, ")"),
    typeof: ($) =>
      seq(token("#typeof"), "(", choice($.type, $.expression), ")"),
    reverse: ($) =>
      seq(token("#reverse"), "(", choice($.range, $.step, $.expression), ")"),
    // #step(first..last, n): every nth value of a range, in for loops.
    step: ($) => seq(token("#step"), "(", $.range, ",", $.expression, ")"),
    // #wrapping(e): e's arithmetic wraps instead of overflowing.
    wrapping: ($) => seq(token("#wrapping"), "(", $.expression, ")"),
    // Floating-point operations the hardware has.
    float_op: ($) =>
      seq(
        choice(
          token("#sqrt"),
          token("#floor"),
          token("#ceil"),
          token("#trunc"),
          token("#round"),
          token("#fma"),
        ),
        "(",
        commaSep1($.expression),
        ")",
      ),
    cast: ($) =>
      seq(
        choice(token("#cast"), token("#bitcast")),
        "(",
        $.type,
        ",",
        $.expression,
        ")",
      ),
    literal: ($) =>
      choice(
        $.bool_,
        $.null_,
        $.number_,
        $.string_,
        $.char_,
        $.struct_literal,
        $.array_literal,
      ),
    struct_literal: ($) =>
      choice(
        seq(
          seq($.identifier, repeat(seq(".", $.identifier))),
          "{",
          commaSep($.struct_literal_member),
          "}",
        ),
        seq(
          field("instance", $.generic_instantiation),
          "{",
          commaSep($.struct_literal_member),
          "}",
        ),
      ),
    struct_literal_member: ($) => seq($.identifier, ":", $.expression),
    array_literal: ($) => seq("[", commaSep($.expression), "]"),
    bool_: (_) => choice("true", "false"),
    null_: (_) => "nil",
    number_: (_) =>
      token(
        choice(
          /0x[0-9A-Fa-f_]+/,
          /0b[01_]+/,
          /0o[0-7_]+/,
          /([0-9][0-9_]*\.[0-9][0-9_]*|\.[0-9][0-9_]*)([eE][+-]?[0-9][0-9_]*)?/,
          /[0-9][0-9_]*[eE][+-]?[0-9][0-9_]*/,
          /[0-9][0-9_]*/,
        ),
      ),
    string_: ($) =>
      choice(
        seq(
          '"',
          // Above comments, so text such as "//" stays the string's.
          repeat(choice($.escape_sequence, token.immediate(prec(1, /[^"\\\n]+/)))),
          '"',
        ),
        token(seq("`", /[^`]*/, "`")),
      ),
    char_: ($) =>
      seq("'", choice($.escape_sequence, token.immediate(/[^'\\\n]/)), "'"),
    escape_sequence: (_) =>
      token.immediate(
        seq(
          "\\",
          choice(/[nrt0\\"']/, /x[0-9A-Fa-f]{2}/, /u\{[0-9A-Fa-f]{1,6}\}/),
        ),
      ),
    identifier: (_) => /[A-Za-z_][A-Za-z0-9_]*/,
    comment: (_) =>
      token(
        choice(
          seq("//", /[^\n]*/),
          seq("/*", repeat(choice(/[^*]/, /\*[^/]/)), "*/"),
        ),
      ),
  },
});
