import { router } from "@routers/index";
import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";

import "./assets/index.css";

createApp(App).use(createPinia()).use(router).mount("#app");
