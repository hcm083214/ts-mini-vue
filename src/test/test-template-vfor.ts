import { compile } from '../core/compiler/index'

// 测试 <template v-for> 编译
const template = `
<ul>
  <template v-for="item in items">
    <li>{{ item.msg }}</li>
    <li class="divider" role="presentation"></li>
  </template>
</ul>
`

console.log('=== Test: <template v-for> ===')
console.log(compile(template))
console.log('')