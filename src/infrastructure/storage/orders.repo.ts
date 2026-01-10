import type { RepairOrder } from "../../domain/orders/order.types";
import { loadAppState, saveAppState } from "./localStorageRepo";
import { ensureAppState } from "./initAppState";

function getStateOrInit() {
  return loadAppState() ?? ensureAppState();
}

export function getOrders(): RepairOrder[] {
  return getStateOrInit().orders;
}

export function getOrderById(orderInternalId: string): RepairOrder | undefined {
  return getOrders().find((o) => o.id === orderInternalId);
}

export function saveOrders(nextOrders: RepairOrder[]) {
  const state = getStateOrInit();
  saveAppState({ ...state, orders: nextOrders });
}

export function upsertOrder(nextOrder: RepairOrder) {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === nextOrder.id);
  const next = idx >= 0 ? orders.map((o) => (o.id === nextOrder.id ? nextOrder : o)) : [nextOrder, ...orders];
  saveOrders(next);
}
