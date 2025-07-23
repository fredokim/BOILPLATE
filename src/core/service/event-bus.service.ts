// src/core/service/event-bus.service.ts
import mitt from "mitt";
import type { Component } from "vue";
interface Events extends Record<PropertyKey, unknown> {
  alert: {
    message: string;
    type?: "success" | "error" | "info" | "warning";
    variant?: "basic" | "filled" | "outlined";
    duration?: number;
  };
  confirm: {
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  };
  dialog: {
    component: Component;
    props?: Record<string, unknown>;
  };
}

export const emitter = mitt<Events>();

export class EventBusService {
  alert(payload: Events["alert"]) {
    emitter.emit("alert", payload);
  }
  confirm(payload: Events["confirm"]) {
    emitter.emit("confirm", payload);
  }
  dialog(payload: Events["dialog"]) {
    emitter.emit("dialog", payload);
  }
}
