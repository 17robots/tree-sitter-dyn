module.exports = grammar({
  name: 'dyn',
  extras: $ => [ /\s+/, /\/\/[^\n]*/, $.comment ],
  word: $ => $.identifier,
  rules: {
    source_file: $ => repeat(seq(optional(token('pub')), $.declaration)),
    declaration: $ => choice($.use, $.thread_local, $.const_, $.struct_, $.enum_, $.function_),
    use: $ => seq(token('use'), $.string_, optional($.identifier)),
    thread_local: $ => seq('thread_local', $.identifier, ':', $.type_signature),
    const_: $ => seq('const', $.identifier, optional(seq(':', $.type_signature)), '=', $.expression),
    struct_: $ => seq('struct', $.identifier, '{', repeat(seq( commaSeparated($.identifier), ':', $.type_signature, optional(','))), '}'),
    enum_: $ => seq('enum', $.identifier, '{', commaSeparated(choice($.identifier, seq($.identifier, ':', $.type_signature))), optional(','), '}'),
    function_: $ => seq('fn', $.identifier, $.parameter_list, optional($.type_signature), $.block),
    parameter_list: $ => seq('(', commaSeparated(seq( commaSeparated($.identifier), ':', $.type_signature)), ')'),
    type_signature: $ => choice($.identifier, seq('*', $.type_signature), seq('*', 'const', $.type_signature), seq('[', $.integer, ']', $.type_signature), seq('[', ']', $.type_signature)),
    statement: $ => choice($.variable_declaration, $.assignment, $.defer, $.if_statement, $.case, $.for_, $.break_, $.continue_, $.return_, $.asm, seq($.expression)),
    block: $ => seq('{', repeat($.statement), '}'),
    variable_declaration: $ => seq($.identifier, ':', $.type_signature, optional(seq('=', $.expression))),
    assignment: $ => seq($.expression, '=', $.expression),
    defer: $ => seq('defer', $.statement),
    if_statement: $ => seq('if', $.expression, $.block, optional(seq('else', $.block))),
    case: $ => seq('case', $.expression, '{', repeat1($.case_arm), '}'),
    case_arm: $ => seq( choice($.expression, '_'), '=>', $.block),
    for_: $ => seq(optional(seq($.identifier, ':')), 'for', optional(choice($.expression, seq($.identifier, 'in', $.expression))), $.block),
    break_: $ => seq('break', optional(seq(':', $.identifier))),
    continue_: $ => seq('continue', optional(seq(':', $.identifier))),
    return_: $ => seq('return', optional($.expression)),
    asm: $ => seq('asm', '{', repeat($.identifier), '}'),
    expression: $ => choice( $.identifier, $.integer, $.float, $.string_, $.char_, $.bool, $.prefix_unary, $.postfix_unary, $.binary, $.call, $.member_access, $.index, $.struct_literal, $.builtin_operator),
    postfix_unary: $ => prec(6, seq($.expression, '.*')),
    prefix_unary: $ => prec(7, seq(choice('-', '&'), $.expression)),
    binary: $ => choice(
      ...[
        ['&&', 1], ['||', 1],
        ['==', 2], ['!=', 2], ['<', 2], ['<=', 2], ['>', 2], ['>=', 2],
        ['+', 3], ['-', 3],
        ['*', 4], ['/', 4], ['%', 4],
        ['&', 5], ['|', 5], ['^', 5], ['<<', 5], ['>>', 5]
      ].map(([operator, precedence]) => prec.left(precedence, seq(
        $.expression,
        operator,
        $.expression
      )))
    ),
    call: $ => prec(7, seq($.expression, '(', commaSeparated($.expression), ')')),
    member_access: $ => prec(8, seq( $.expression, '.', $.identifier)),
    index: $ => prec(8, seq($.expression, '[', $.expression, ']')),
    struct_literal: $ => seq(optional($.type_signature), '{', commaSeparated(seq($.identifier, ':', $.expression)), optional(','), '}'),
    builtin_operator: $ => choice(seq('#sizeof', $.type_signature), seq('#alignof', $.type_signature), seq('#panic', '(', $.string_, ')'), seq('#typeid', $.type_signature), seq('#cast', '(', $.type_signature, ',', $.expression,')')),
    identifier: _ => /[a-zA-Z_][a-zA-Z0-9_]*/,
    integer: _ => choice(
      /0x[0-9a-fA-F_]+/, // Hex
      /0b[01_]+/,        // Binary
      /0o[0-7_]+/,        // Octal
      /[0-9_]+/          // Standard Base-10
    ),
    float: _ => /[0-9_]+\.[0-9_]+/,
    string_: _ => /"([^"\\]|\\.)*"/,
    char_: _ => /'([^'\\]|\\.)*'/,
    bool: _ => choice('true', 'false'),
    comment: _ => token(choice(seq('//', /[^\n]*/), seq('/*', /([^*]|\*+[^/*])*/, /\*+\//))),
  }
});

// Helper function to handle clean comma-separated sequence rules without code noise
function commaSeparated(rule) {
  return optional(seq(rule, repeat(seq(',', rule))));
}

