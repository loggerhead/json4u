import { createApp } from "vue";
import App from "./App.vue";
import { setupNaive } from "./naiveConfig";
import "./tailwind.css";

const app = createApp(App);
setupNaive(app);
app.mount("#app");
