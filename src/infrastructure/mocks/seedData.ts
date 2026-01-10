import { makeId } from "../../domain/shared/id";
import type { Customer } from "../../domain/customers/customer.types";
import type { Vehicle } from "../../domain/vehicles/vehicle.types";
import type { RepairOrder, OrderEventType } from "../../domain/orders/order.types";

export function createSeedState() {
  const customers: Customer[] = [
    { id: "CUST-001", name: "Silvia Demo", phone: "5555555555", email: "silvia@demo.com" },
    { id: "CUST-002", name: "Cliente Dos", phone: "4444444444" },
  ];

  const vehicles: Vehicle[] = [
    { id: "VEH-001", plate: "ABC-123", model: "Nissan Versa 2018", customerId: "CUST-001" },
    { id: "VEH-002", plate: "XYZ-987", model: "VW Jetta 2016", customerId: "CUST-002" },
  ];

  const baseOrder = (idx: number, status: RepairOrder["status"], customerId: string, vehicleId: string): RepairOrder => ({
    id: makeId("order"),
    orderId: `RO-${String(idx).padStart(3, "0")}`,
    customerId,
    vehicleId,
    status,
    subtotalEstimated: 0,
    authorizedAmount: 0,
    realTotal: 0,
    authorizations: [],
    services: [],
    events: [{ id: makeId("evt"), orderId: "tmp", type: "ORDEN_CREADA" as OrderEventType, timestamp: new Date().toISOString() }].map(e => ({
      ...e,
      orderId: "tmp",
    })),
    errors: [],
    source: "TALLER",
  });

  const orders: RepairOrder[] = [
    baseOrder(1, "CREATED", "CUST-001", "VEH-001"),
    baseOrder(2, "DIAGNOSED", "CUST-001", "VEH-001"),
    baseOrder(3, "WAITING_FOR_APPROVAL", "CUST-002", "VEH-002"),
    baseOrder(4, "CANCELLED", "CUST-002", "VEH-002"),
  ].map((o) => {
    const orderId = o.id;
    return {
      ...o,
      events: o.events.map((ev) => ({ ...ev, orderId })),
    };
  });

  return { customers, vehicles, orders };
}
