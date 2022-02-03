import { createApp } from "vue";
import App from "./App.vue";
import "./tailwind.css";
import setupI18n from "./i18n.config";

const app = createApp(App);
setupI18n(app);
app.mount("#app");
