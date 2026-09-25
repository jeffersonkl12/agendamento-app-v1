import { setupStoreReset } from "@libs/pinia-reset";
import { router } from "@routers/index";
import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";

import "./assets/index.css";

const pinia = createPinia();
pinia.use(setupStoreReset);

createApp(App).use(pinia).use(router).mount("#app");
