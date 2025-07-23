import "reflect-metadata";
import { createApp } from "vue";
import { router } from "@/router/index";
import { initTheme } from "@core/theme";

import App from "./App.vue";
import "./app/styles/tailwind.css";
import "./assets/main.scss";

import { EventBusService } from "@core/service/event-bus.service";
import { EventBusKey } from "@core/service/event-bus.key";

initTheme();

const app = createApp(App);

// EventBusService 인스턴스를 EventBusKey로 provide
app.provide(EventBusKey, new EventBusService());

app.use(router);
app.mount("#app");
