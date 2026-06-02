import { createApp, h, reactive, ref } from "./core";

const App = {
  template: `
  <div class="container">
    <h1 :id="state.title">{{ state.title }}</h1>
    <p>{{ state.message }}</p>
    <button @click="increment" :disabled="count >= 2">Click Me</button>
    <p>Count: {{ count+1 }}</p>
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
