
export const compilerTest = {
    template: `
    <div class="static"
    :class="{ active: isActive, 'text-danger': hasError }">
        {{ message }}
    </div>
    <div :class="[isActive ? activeClass : '', errorClass]"></div>
    <template v-if="ok">
        <h1>Title</h1>
        <p>Paragraph 1</p>
        <p>Paragraph 2</p>
    </template>
    <li v-for="item in items">
        {{ item.message }}
    </li>
    `,
    
}
