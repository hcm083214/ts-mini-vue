import { tokenize, type Token } from './tokenizer'
import { parse, type ASTNode, type ASTRoot, type ASTElement, type ASTInterpolation, type ASTText, type ASTComment, type ASTPropValue } from './parser'
import { generate } from './generator'

export function compile(template: string) {
  const tokens = tokenize(template);
  const ast = parse(tokens);
  const code = generate(ast);
  
  return code;
}