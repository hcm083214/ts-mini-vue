import { createApp, h, reactive, ref } from "./core";

const App = {
  template: `
  <div class="container">
    <h1>{{ state.title }}</h1>
    <p>{{ state.message }}</p>
    <button @click="increment">Click Me</button>
    <p>Count: {{ count }}</p>
  </div>
  `,
  setup() {
    const state = reactive({
      message: 'Hello Mini Vue!',
      title: 'Welcome to Mini Vue'
    });
    const count = ref(0);

    const increment = () => {
      count.value++;
    };

    return {
      state,
      count,
      increment,
    }
  }
};

const app = createApp(App);
app.mount('#app');
