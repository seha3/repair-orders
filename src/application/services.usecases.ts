import { getOrderById, upsertOrder } from "../infrastructure/storage/orders.repo";
import { makeId } from "../domain/shared/id";
import type { RepairOrder, Service } from "../domain/orders/order.types";
import { calculateAuthorizedAmount, calculateSubtotalEstimated } from "../domain/orders/order.rules";
import { ok, err, type Result } from "./result";


function nowIso() {
  return new Date().toISOString();
}

function canEditServices(order: RepairOrder) {
  return order.status === "CREATED" || order.status === "DIAGNOSED";
}

export function addService(orderId: string, payload: { name: string; description?: string; laborEstimated: number }): Result<RepairOrder> {
  const order = getOrderById(orderId);
  if (!order) return err("NOT_FOUND", "Orden no encontrada.");
  if (!canEditServices(order)) return err("INVALID_STATUS_TRANSITION", "Solo se pueden editar servicios en CREATED o DIAGNOSED.");

  const serviceId = makeId("svc");
  const service: Service = {
    id: serviceId,
    orderId: order.id,
    name: payload.name.trim() || "Servicio",
    description: payload.description?.trim(),
    laborEstimated: Number(payload.laborEstimated) || 0,
    laborReal: 0,
    components: [],
  };

  const nextBase: RepairOrder = { ...order, services: [service, ...order.services] };

  const subtotalEstimated = calculateSubtotalEstimated(nextBase);
  const authorizedAmount = calculateAuthorizedAmount(subtotalEstimated);

  const next: RepairOrder = {
    ...nextBase,
    subtotalEstimated,
    authorizedAmount,
    events: [
      {
        id: makeId("evt"),
        orderId: order.id,
        type: "SERVICIO_AGREGADO",
        timestamp: nowIso(),
      } as any,
      ...order.events,
    ],
  };

  upsertOrder(next);
  return ok(next);
}

export function updateServiceEstimated(orderId: string, serviceId: string, patch: { name?: string; description?: string; laborEstimated?: number }): Result<RepairOrder> {
  const order = getOrderById(orderId);
  if (!order) return err("NOT_FOUND", "Orden no encontrada.");
  if (!canEditServices(order)) return err("INVALID_STATUS_TRANSITION", "Solo se pueden editar servicios en CREATED o DIAGNOSED.");

  const services = order.services.map((s) => {
    if (s.id !== serviceId) return s;
    return {
      ...s,
      name: patch.name !== undefined ? patch.name.trim() : s.name,
      description: patch.description !== undefined ? patch.description.trim() : s.description,
      laborEstimated: patch.laborEstimated !== undefined ? Number(patch.laborEstimated) || 0 : s.laborEstimated,
    };
  });

  const nextBase: RepairOrder = { ...order, services };

  const subtotalEstimated = calculateSubtotalEstimated(nextBase);
  const authorizedAmount = calculateAuthorizedAmount(subtotalEstimated);

  const next: RepairOrder = {
    ...nextBase,
    subtotalEstimated,
    authorizedAmount,
    events: [
      {
        id: makeId("evt"),
        orderId: order.id,
        type: "SERVICIO_EDITADO",
        timestamp: nowIso(),
      } as any,
      ...order.events,
    ],
  };

  upsertOrder(next);
  return ok(next);
}

export function deleteService(orderId: string, serviceId: string): Result<RepairOrder> {
  const order = getOrderById(orderId);
  if (!order) return err("NOT_FOUND", "Orden no encontrada.");
  if (!canEditServices(order)) return err("INVALID_STATUS_TRANSITION", "Solo se pueden editar servicios en CREATED o DIAGNOSED.");

  const services = order.services.filter((s) => s.id !== serviceId);

  const nextBase: RepairOrder = { ...order, services };

  const subtotalEstimated = calculateSubtotalEstimated(nextBase);
  const authorizedAmount = calculateAuthorizedAmount(subtotalEstimated);

  const next: RepairOrder = {
    ...nextBase,
    subtotalEstimated,
    authorizedAmount,
    events: [
      {
        id: makeId("evt"),
        orderId: order.id,
        type: "SERVICIO_ELIMINADO",
        timestamp: nowIso(),
      } as any,
      ...order.events,
    ],
  };

  upsertOrder(next);
  return ok(next);
}

export function addComponentEstimated(orderId: string, serviceId: string, payload: { name: string; description?: string; estimated: number }): Result<RepairOrder> {
  const order = getOrderById(orderId);
  if (!order) return err("NOT_FOUND", "Orden no encontrada.");
  if (!canEditServices(order)) return err("INVALID_STATUS_TRANSITION", "Solo se pueden editar servicios en CREATED o DIAGNOSED.");

  const services = order.services.map((s) => {
    if (s.id !== serviceId) return s;

    const cmp = {
      id: makeId("cmp"),
      serviceId: s.id,
      name: payload.name.trim() || "Componente",
      description: payload.description?.trim(),
      estimated: Number(payload.estimated) || 0,
      real: 0,
    };

    return { ...s, components: [cmp, ...s.components] };
  });

  const nextBase: RepairOrder = { ...order, services };
  const subtotalEstimated = calculateSubtotalEstimated(nextBase);
  const authorizedAmount = calculateAuthorizedAmount(subtotalEstimated);

  const next: RepairOrder = {
    ...nextBase,
    subtotalEstimated,
    authorizedAmount,
    events: [
      {
        id: makeId("evt"),
        orderId: order.id,
        type: "COMPONENTE_AGREGADO",
        timestamp: nowIso(),
      } as any,
      ...order.events,
    ],
  };

  upsertOrder(next);
  return ok(next);
}

export function updateComponentEstimated(orderId: string, serviceId: string, componentId: string, patch: { name?: string; estimated?: number }): Result<RepairOrder> {
  const order = getOrderById(orderId);
  if (!order) return err("NOT_FOUND", "Orden no encontrada.");
  if (!canEditServices(order)) return err("INVALID_STATUS_TRANSITION", "Solo se pueden editar servicios en CREATED o DIAGNOSED.");

  const services = order.services.map((s) => {
    if (s.id !== serviceId) return s;

    const components = s.components.map((c) => {
      if (c.id !== componentId) return c;
      return {
        ...c,
        name: patch.name !== undefined ? patch.name.trim() : c.name,
        estimated: patch.estimated !== undefined ? Number(patch.estimated) || 0 : c.estimated,
      };
    });

    return { ...s, components };
  });

  const nextBase: RepairOrder = { ...order, services };
  const subtotalEstimated = calculateSubtotalEstimated(nextBase);
  const authorizedAmount = calculateAuthorizedAmount(subtotalEstimated);

  const next: RepairOrder = {
    ...nextBase,
    subtotalEstimated,
    authorizedAmount,
    events: [
      {
        id: makeId("evt"),
        orderId: order.id,
        type: "COMPONENTE_EDITADO",
        timestamp: nowIso(),
      } as any,
      ...order.events,
    ],
  };

  upsertOrder(next);
  return ok(next);
}

export function deleteComponent(orderId: string, serviceId: string, componentId: string): Result<RepairOrder> {
  const order = getOrderById(orderId);
  if (!order) return err("NOT_FOUND", "Orden no encontrada.");
  if (!canEditServices(order)) return err("INVALID_STATUS_TRANSITION", "Solo se pueden editar servicios en CREATED o DIAGNOSED.");

  const services = order.services.map((s) => {
    if (s.id !== serviceId) return s;
    return { ...s, components: s.components.filter((c) => c.id !== componentId) };
  });

  const nextBase: RepairOrder = { ...order, services };
  const subtotalEstimated = calculateSubtotalEstimated(nextBase);
  const authorizedAmount = calculateAuthorizedAmount(subtotalEstimated);

  const next: RepairOrder = {
    ...nextBase,
    subtotalEstimated,
    authorizedAmount,
    events: [
      {
        id: makeId("evt"),
        orderId: order.id,
        type: "COMPONENTE_ELIMINADO",
        timestamp: nowIso(),
      } as any,
      ...order.events,
    ],
  };

  upsertOrder(next);
  return ok(next);
}
