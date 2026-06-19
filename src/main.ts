import { createApp, h, reactive, ref, computed } from "./core";
import TestCom from "./test/TestCom";

const App = { 
  template: `
  <div class="container">
    <TestCom />
  </div>
  `,
  components: {
    TestCom
  }
};

const app = createApp(App);
app.mount('#app');
