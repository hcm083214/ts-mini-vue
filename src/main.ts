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

    const isActive = ref(true)
    const hasError = ref(true)
    return {
      state,
      count,
      increment,
      publishedBooksMessage,
      isActive,
      hasError
    }
  }
};

const app = createApp(App);
app.mount('#app');
