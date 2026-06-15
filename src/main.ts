import { createApp, h, reactive, ref, computed } from "./core";

const App = {
  template: `
  <div class="container">
    <h1 :id="state.title">{{ state.title }}</h1>
    <p>{{ state.message }}</p>
    <button @click="increment" :disabled="count >= 2">Click Me</button>
    <p :id="'id' + count">Count: {{ count+1 }}</p>
    <p>{{ count >= 2 ? 'YES' : 'NO' }}</p>
    <p>{{ state.title.split('').reverse().join('') }}</p>
    <p>Has published books:</p>
    <span>{{ publishedBooksMessage }}</span>
    <div>
      <div
        class="static"
        :class="{ active: isActive, 'text-danger': hasError }"
      ></div>
      <div :class="classObject"></div>
      <div :class="[activeClass, errorClass]"></div>
      <div :class="[isActive ? activeClass : '', errorClass]"></div>
      <div :class="[{ [activeClass]: isActive }, errorClass]"></div>
      <div :style="{ color: activeColor, fontSize: fontSize + 'px' }">1</div>
      <div :style="styleObject">2</div>
      <h1 style="color: red" :style="'font-size: 1em'">hello</h1>
      <button @click="(event) => console.log('Form cannot be submitted yet.', event)">
        Submit
      </button>
    </div>
    <div>
      <button @click="isActive = !isActive">Toggle</button>

      <h1 v-if="isActive">Vue is awesome!</h1>
      <h1 v-else>Oh no 😢</h1>
      <h1 v-show="isActive">Hello!</h1>
      <template v-if="isActive">
        <h1>Title</h1>
        <p>Paragraph 1</p>
        <p>Paragraph 2</p>
      </template>
    </div>
    <div>
      <div v-if="type === 'A'">
        A
      </div>
      <div v-else-if="type === 'B'">
        B
      </div>
      <div v-else-if="type === 'C'">
        C
      </div>
      <div v-else>
        Not A/B/C
      </div>
    </div>
    <div>
      <li v-for="(item, index) in items">
        {{ parentMessage }} - {{ index }} - {{ item.message }}
      </li>
      <li v-for="(value, key, index) in myObject">
        {{ index }}. {{ key }}: {{ value }}
      </li>
      <span v-for="n in 10">{{ n }}</span>
      <ul>
        <template v-for="item in items">
          <li>{{ item.message }}</li>
          <li class="divider" role="presentation">11</li>
        </template>
      </ul>
    </div>
  </div>
  `,
  setup() {

    const state = reactive({
      message: 'Hello Mini Vue!',
      title: 'Welcome to Mini Vue'
    });
    const count = ref(0);

    const author = reactive({
      name: 'John Doe',
      books: [
        'Vue 2 - Advanced Guide',
        'Vue 3 - Basic Guide',
        'Vue 4 - The Mystery'
      ]
    })

    // 一个计算属性 ref
    const publishedBooksMessage = computed(() => {
      return author.books.length > 2 ? 'Yes' : 'No'
    })

    const increment = () => {
      count.value++;
    };

    const isActive = ref(false)
    const hasError = ref(true)
    const error = ref(null)

    const classObject = computed(() => ({
      active: isActive.value && !error.value,
      'text-danger': error.value && hasError.value
    }))

    const activeClass = ref('activeClass')
    const errorClass = ref('errorClass')

    const activeColor = ref('red')
    const fontSize = ref(30)

    const styleObject = reactive({
      color: 'red',
      fontSize: '30px'
    })
    const type = ref('E')
    const parentMessage = ref('Parent')
    const items = ref([{ message: 'Foo' }, { message: 'Bar' }])
    const myObject = reactive({
      title: 'How to do lists in Vue',
      author: 'Jane Doe',
      publishedAt: '2016-04-10'
    })
    return {
      state,
      count,
      increment,
      publishedBooksMessage,
      isActive,
      hasError,
      classObject,
      activeClass,
      errorClass,
      activeColor,
      fontSize,
      styleObject,
      type,
      parentMessage,
      items,
      myObject
    }
  }
};

const app = createApp(App);
app.mount('#app');
