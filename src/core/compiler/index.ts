import { tokenize } from './tokenizer'
import { parse } from './parser'
import { generate } from './generator'

export function compile(template: string) {
  const tokens = tokenize(template);
  const ast = parse(tokens);
  const code = generate(ast);
  
  return code;
}

