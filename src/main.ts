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
    console.log('[App.setup] Creating reactive state...');
    
    const state = reactive({
      message: 'Hello Mini Vue!',
      title: 'Welcome to Mini Vue'
    });
    const count = ref(0);

    console.log('[App.setup] count initial value:', count.value);

    const increment = () => {
      console.log('[App.increment] Before increment, count.value:', count.value);
      count.value++;
      console.log('[App.increment] After increment, count.value:', count.value);
    };

    console.log('[App.setup] Returning setup state...');
    return {
      state,
      count,
      increment,
    }
  }
};

console.log('[Main] Creating app...');
const app = createApp(App);
console.log('[Main] Mounting app...');
app.mount('#app');
console.log('[Main] App mounted');
