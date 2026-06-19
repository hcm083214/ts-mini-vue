import { createApp, h, reactive, ref, computed } from "./core";
import App from "./App";
import router from './router'

const app = createApp(App);
app.use(router)
app.mount('#app');
