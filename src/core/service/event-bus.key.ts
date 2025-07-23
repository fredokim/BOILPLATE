import type { InjectionKey } from "vue";
import { EventBusService } from "./event-bus.service";

export const EventBusKey: InjectionKey<EventBusService> = Symbol("EventBus");
