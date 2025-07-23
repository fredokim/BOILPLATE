// src/core/composable/useNotification.ts
import { Component, inject } from "vue";
import { EventBusKey } from "@core/service/event-bus.key";
import { EventBusService } from "@core/service/event-bus.service";

function useEventBus(): EventBusService {
  const bus = inject(EventBusKey);
  if (!bus) throw new Error("EventBusService가 제공되지 않았습니다.");
  return bus;
}

export function useAlert() {
  const bus = useEventBus();
  return (
    message: string,
    type: "success" | "error" | "info" | "warning" = "info",
    duration = 3000
  ) => {
    bus.alert({ message, type, duration });
  };
}

export function useConfirm() {
  const bus = useEventBus();
  return (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText = "확인",
    cancelText = "취소"
  ) => {
    bus.confirm({ message, onConfirm, onCancel, confirmText, cancelText });
  };
}

export function useDialog() {
  const bus = useEventBus();
  return (component: Component, props?: Record<string, unknown>) => {
    bus.dialog({ component, props });
  };
}
