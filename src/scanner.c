#include "tree_sitter/parser.h"
#include <stdbool.h>
#include <stddef.h>

enum TokenType { TRAILING_FLOAT, SAME_LINE };

void *tree_sitter_dyn_external_scanner_create(void) { return NULL; }
void tree_sitter_dyn_external_scanner_destroy(void *payload) { (void)payload; }
unsigned tree_sitter_dyn_external_scanner_serialize(void *payload, char *buffer) {
  (void)payload;
  (void)buffer;
  return 0;
}
void tree_sitter_dyn_external_scanner_deserialize(void *payload, const char *buffer,
                                                   unsigned length) {
  (void)payload;
  (void)buffer;
  (void)length;
}

bool tree_sitter_dyn_external_scanner_scan(void *payload, TSLexer *lexer,
                                           const bool *valid_symbols) {
  (void)payload;
  /* Zero width: the next token is on this line. Error recovery marks every
     symbol valid, so only answer when a trailing float is not also wanted. */
  if (valid_symbols[SAME_LINE] && !valid_symbols[TRAILING_FLOAT]) {
    lexer->mark_end(lexer);
    while (lexer->lookahead == ' ' || lexer->lookahead == '\t' || lexer->lookahead == '\r')
      lexer->advance(lexer, true);
    if (lexer->lookahead == '\n' || lexer->lookahead == '/' || lexer->eof(lexer))
      return false;
    lexer->result_symbol = SAME_LINE;
    return true;
  }
  while (lexer->lookahead == ' ' || lexer->lookahead == '\t' ||
         lexer->lookahead == '\n' || lexer->lookahead == '\r' ||
         lexer->lookahead == '\f')
    lexer->advance(lexer, true);
  if (!valid_symbols[TRAILING_FLOAT] || lexer->lookahead < '0' ||
      lexer->lookahead > '9')
    return false;
  do {
    lexer->advance(lexer, false);
  } while ((lexer->lookahead >= '0' && lexer->lookahead <= '9') ||
           lexer->lookahead == '_');
  if (lexer->lookahead != '.')
    return false;
  lexer->advance(lexer, false);
  if (lexer->lookahead == '.' ||
      (lexer->lookahead >= '0' && lexer->lookahead <= '9'))
    return false;
  lexer->mark_end(lexer);
  lexer->result_symbol = TRAILING_FLOAT;
  return true;
}
