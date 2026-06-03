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
      styleObject
    }
  }
};

const app = createApp(App);
app.mount('#app');
