import { err, ok } from "./result";
import type { Result } from "./result";
import { getOrders, getOrderById, saveOrders, upsertOrder } from "../infrastructure/storage/orders.repo";
import { makeId } from "../domain/shared/id";
import { canTransition, calculateAuthorizedAmount, calculateLimit110, calculateRealTotal, calculateSubtotalEstimated } from "../domain/orders/order.rules";
import type { BusinessError, RepairOrder } from "../domain/orders/order.types";

function nowIso() {
  return new Date().toISOString();
}

function pushError(order: RepairOrder, code: BusinessError["code"], message: string): RepairOrder {
  const nextError: BusinessError = {
    id: makeId("err"),
    orderId: order.id,
    code,
    message,
    createdAt: nowIso(),
  };
  return { ...order, errors: [nextError, ...order.errors].slice(0, 10) };
}

function pushEvent(order: RepairOrder, type: RepairOrder["events"][number]["type"], fromStatus?: RepairOrder["status"], toStatus?: RepairOrder["status"]) {
  return {
    ...order,
    events: [
      {
        id: makeId("evt"),
        orderId: order.id,
        type,
        fromStatus,
        toStatus,
        timestamp: nowIso(),
      },
      ...order.events,
    ],
  };
}

export function listOrders(): Result<RepairOrder[]> {
  return ok(getOrders());
}

export function listOrdersForCustomer(customerId: string): Result<RepairOrder[]> {
  return ok(getOrders().filter((o) => o.customerId === customerId));
}

/** Diagnosticar”, “Iniciar” */
export function transitionOrder(orderInternalId: string, toStatus: RepairOrder["status"]): Result<RepairOrder> {
  const order = getOrderById(orderInternalId);
  if (!order) return err("NOT_FOUND", "Orden no encontrada.");

  if (order.status === "CANCELLED") {
    const next = pushError(order, "ORDER_CANCELLED", "La orden está cancelada. No se puede modificar.");
    upsertOrder(next);
    return err("ORDER_CANCELLED", "La orden está cancelada.");
  }

  if (!canTransition(order.status, toStatus)) {
    const next = pushError(order, "INVALID_STATUS_TRANSITION", `Transición inválida: ${order.status} → ${toStatus}`);
    upsertOrder(next);
    return err("INVALID_STATUS_TRANSITION", `No puedes pasar de ${order.status} a ${toStatus}.`);
  }

  const prev = order.status;
  let next: RepairOrder = { ...order, status: toStatus };

  // events
  const eventMap: Partial<Record<RepairOrder["status"], RepairOrder["events"][number]["type"]>> = {
    DIAGNOSED: "ORDEN_DIAGNOSTICADA",
    AUTHORIZED: "ORDEN_AUTORIZADA",
    IN_PROGRESS: "REPARACION_INICIADA",
    COMPLETED: "REPARACION_COMPLETADA",
    DELIVERED: "ORDEN_ENTREGADA",
    CANCELLED: "ORDEN_CANCELADA",
  };
  next = pushEvent(next, eventMap[toStatus] ?? "ORDEN_CREADA", prev, toStatus);

  upsertOrder(next);
  return ok(next);
}

/** DIAGNOSED → AUTHORIZED */
export function authorizeOrder(orderInternalId: string): Result<RepairOrder> {
  const order = getOrderById(orderInternalId);
  if (!order) return err("NOT_FOUND", "Orden no encontrada.");

  if (order.status === "CANCELLED") {
    const next = pushError(order, "ORDER_CANCELLED", "La orden está cancelada. No se puede autorizar.");
    upsertOrder(next);
    return err("ORDER_CANCELLED", "La orden está cancelada.");
  }

  if (order.services.length === 0) {
    const next = pushError(order, "NO_SERVICES", "No se puede autorizar sin servicios.");
    upsertOrder(next);
    return err("NO_SERVICES", "Agrega al menos un servicio antes de autorizar.");
  }

  const subtotal = calculateSubtotalEstimated(order);
  const authorized = calculateAuthorizedAmount(subtotal);

  let next: RepairOrder = {
    ...order,
    subtotalEstimated: subtotal,
    authorizedAmount: authorized,
  };

  // DIAGNOSED → AUTHORIZED
  if (order.status !== "DIAGNOSED") {
    next = pushError(next, "INVALID_STATUS_TRANSITION", "Solo se puede autorizar desde DIAGNOSED.");
    upsertOrder(next);
    return err("INVALID_STATUS_TRANSITION", "Solo se puede autorizar cuando la orden está en DIAGNOSED.");
  }

  next = { ...next, status: "AUTHORIZED" };
  next = pushEvent(next, "ORDEN_AUTORIZADA", "DIAGNOSED", "AUTHORIZED");
  next = {
    ...next,
    authorizations: [
      {
        id: makeId("auth"),
        orderId: next.id,
        amount: authorized,
        createdAt: nowIso(),
        comment: "Autorización inicial",
      },
      ...next.authorizations,
    ],
  };

  upsertOrder(next);
  return ok(next);
}

export function recalcRealAndCheckOvercost(orderInternalId: string): Result<RepairOrder> {
  const order = getOrderById(orderInternalId);
  if (!order) return err("NOT_FOUND", "Orden no encontrada.");

  const realTotal = calculateRealTotal(order);
  const limit = calculateLimit110(order.authorizedAmount);

  let next: RepairOrder = { ...order, realTotal };

  if (order.authorizedAmount > 0 && realTotal > limit) {
    next = { ...next, status: "WAITING_FOR_APPROVAL" };
    next = pushError(next, "REQUIRES_REAUTH", "Se excedió el 110%. Requiere reautorización.");
    next = pushEvent(next, "REAUTORIZADA", order.status, "WAITING_FOR_APPROVAL");
  }

  upsertOrder(next);
  return ok(next);
}

export function createOrder(params: {
  customerId: string;
  vehicleId: string;
  source: "TALLER" | "CLIENTE";
}): Result<RepairOrder> {
  const orders = getOrders();
  const nextNum = orders.length + 1;

  const newOrder: RepairOrder = {
    id: makeId("order"),
    orderId: `RO-${String(nextNum).padStart(3, "0")}`,
    customerId: params.customerId,
    vehicleId: params.vehicleId,
    status: "CREATED",
    subtotalEstimated: 0,
    authorizedAmount: 0,
    realTotal: 0,
    authorizations: [],
    services: [],
    events: [],
    errors: [],
    source: params.source,
  };

  const withEvent = pushEvent(newOrder, "ORDEN_CREADA");
  saveOrders([withEvent, ...orders]);

  return ok(withEvent);
}
