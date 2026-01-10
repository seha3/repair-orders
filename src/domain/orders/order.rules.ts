import type { RepairOrder, OrderStatus } from "./order.types";

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calculateSubtotalEstimated(order: RepairOrder) {
  const subtotal = order.services.reduce((acc, s) => {
    const comps = s.components.reduce((cAcc, c) => cAcc + (c.estimated || 0), 0);
    return acc + (s.laborEstimated || 0) + comps;
  }, 0);

  return round2(subtotal);
}

export function calculateAuthorizedAmount(subtotalEstimated: number) {
  return round2(subtotalEstimated * 1.16);
}

export function calculateLimit110(authorizedAmount: number) {
  return round2(authorizedAmount * 1.1);
}

export function calculateRealTotal(order: RepairOrder) {
  const total = order.services.reduce((acc, s) => {
    const comps = s.components.reduce((cAcc, c) => cAcc + (c.real || 0), 0);
    return acc + (s.laborReal || 0) + comps;
  }, 0);

  return round2(total);
}

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ["DIAGNOSED", "CANCELLED"],
  DIAGNOSED: ["AUTHORIZED", "CANCELLED"],
  AUTHORIZED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["CANCELLED"],
  WAITING_FOR_APPROVAL: ["AUTHORIZED", "CANCELLED"],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return allowedTransitions[from]?.includes(to) ?? false;
}
