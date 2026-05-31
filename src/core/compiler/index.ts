import { tokenize, type Token } from './tokenizer'
import { parse, type ASTNode, type ASTRoot, type ASTElement, type ASTInterpolation, type ASTText, type ASTComment, type ASTPropValue } from './parser'
import { generate } from './generator'

export function compile(template: string) {
  const tokens = tokenize(template);
  const ast = parse(tokens);
  const code = generate(ast);
  console.log("🚀 ~ compile ~ Generated render code:", code)
  
  return code;
}

// 重新导出所有编译器相关的内容
export { tokenize, parse, generate }
export type { Token, ASTNode, ASTRoot, ASTElement, ASTInterpolation, ASTText, ASTComment, ASTPropValue }
