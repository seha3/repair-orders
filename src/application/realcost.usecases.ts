import { getOrderById, upsertOrder } from "../infrastructure/storage/orders.repo";
import { makeId } from "../domain/shared/id";
import type { RepairOrder } from "../domain/orders/order.types";
import { calculateLimit110 } from "../domain/orders/order.rules";
import { ok, err, type Result } from "./result";

function nowIso() {
  return new Date().toISOString();
}

function calcRealTotal(order: RepairOrder) {
  return order.services.reduce((sum, s) => {
    const comps = s.components.reduce((s2, c) => s2 + (c.real || 0), 0);
    return sum + (s.laborReal || 0) + comps;
  }, 0);
}

export function updateLaborReal(orderId: string, serviceId: string, laborReal: number): Result<RepairOrder> {
  const order = getOrderById(orderId);
  if (!order) return err("NOT_FOUND", "Orden no encontrada.");
  if (order.status !== "IN_PROGRESS") return err("INVALID_STATUS_TRANSITION", "Solo se pueden capturar costos reales en IN_PROGRESS.");

  const services = order.services.map((s) => (s.id === serviceId ? { ...s, laborReal: Number(laborReal) || 0 } : s));
  let next: RepairOrder = { ...order, services };

  const realTotal = calcRealTotal(next);
  next = { ...next, realTotal };

  const limit = calculateLimit110(next.authorizedAmount);
  if (realTotal > limit) {
    next = {
      ...next,
      status: "WAITING_FOR_APPROVAL",
      events: [
        { id: makeId("evt"), orderId: order.id, type: "EXCESO_COSTO_DETECTADO", timestamp: nowIso() } as any,
        ...order.events,
      ],
    };
  } else {
    next = {
      ...next,
      events: [
        { id: makeId("evt"), orderId: order.id, type: "COSTO_REAL_ACTUALIZADO", timestamp: nowIso() } as any,
        ...order.events,
      ],
    };
  }

  upsertOrder(next);
  return ok(next);
}

export function updateComponentReal(orderId: string, serviceId: string, componentId: string, real: number): Result<RepairOrder> {
  const order = getOrderById(orderId);
  if (!order) return err("NOT_FOUND", "Orden no encontrada.");
  if (order.status !== "IN_PROGRESS") return err("INVALID_STATUS_TRANSITION", "Solo se pueden capturar costos reales en IN_PROGRESS.");

  const services = order.services.map((s) => {
    if (s.id !== serviceId) return s;
    return {
      ...s,
      components: s.components.map((c) => (c.id === componentId ? { ...c, real: Number(real) || 0 } : c)),
    };
  });

  let next: RepairOrder = { ...order, services };

  const realTotal = calcRealTotal(next);
  next = { ...next, realTotal };

  const limit = calculateLimit110(next.authorizedAmount);
  if (realTotal > limit) {
    next = {
      ...next,
      status: "WAITING_FOR_APPROVAL",
      events: [
        { id: makeId("evt"), orderId: order.id, type: "EXCESO_COSTO_DETECTADO", timestamp: nowIso() } as any,
        ...order.events,
      ],
    };
  } else {
    next = {
      ...next,
      events: [
        { id: makeId("evt"), orderId: order.id, type: "COSTO_REAL_ACTUALIZADO", timestamp: nowIso() } as any,
        ...order.events,
      ],
    };
  }

  upsertOrder(next);
  return ok(next);
}
