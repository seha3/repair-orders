import { makeId } from "../../domain/shared/id";
import type { Customer } from "../../domain/customers/customer.types";
import type { Vehicle } from "../../domain/vehicles/vehicle.types";
import type { RepairOrder, OrderEventType, Service } from "../../domain/orders/order.types";
import { calculateAuthorizedAmount, calculateSubtotalEstimated } from "../../domain/orders/order.rules";


export function createSeedState() {
  const customers: Customer[] = [
    { id: "CUST-001", name: "Silvia Demo", phone: "5555555555", email: "silvia@demo.com" },
    { id: "CUST-002", name: "Cliente Dos", phone: "4444444444" },
  ];

  const vehicles: Vehicle[] = [
    { id: "VEH-001", plate: "ABC-123", model: "Nissan Versa 2018", customerId: "CUST-001" },
    { id: "VEH-002", plate: "XYZ-987", model: "VW Jetta 2016", customerId: "CUST-002" },
  ];

  function makeService(orderInternalId: string): Service {
    const serviceId = makeId("svc");

    return {
      id: serviceId,
      orderId: orderInternalId,
      name: "Diagnóstico + cambio de aceite",
      description: "Servicio de ejemplo para permitir autorización",
      laborEstimated: 500,
      laborReal: 0,
      components: [
        {
          id: makeId("cmp"),
          serviceId,
          name: "Filtro de aceite",
          description: "Refacción ejemplo",
          estimated: 250,
          real: 0,
        },
      ],
    };
  }

  const baseOrder = (
    idx: number,
    status: RepairOrder["status"],
    customerId: string,
    vehicleId: string
  ): RepairOrder => ({
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
    events: [],
    errors: [],
    source: "TALLER",
  });

  const orders: RepairOrder[] = [
    baseOrder(1, "CREATED", "CUST-001", "VEH-001"),
    baseOrder(2, "DIAGNOSED", "CUST-001", "VEH-001"),
    baseOrder(3, "WAITING_FOR_APPROVAL", "CUST-002", "VEH-002"),
    baseOrder(4, "CANCELLED", "CUST-002", "VEH-002"),
  ].map((o) => {
    const orderInternalId = o.id;

    const services =
      o.status === "DIAGNOSED" || o.status === "WAITING_FOR_APPROVAL"
        ? [makeService(orderInternalId)]
        : o.services;
    const subtotalEstimated = services.length > 0 ? calculateSubtotalEstimated({ ...o, services }) : o.subtotalEstimated;
    const authorizedAmount = services.length > 0 ? calculateAuthorizedAmount(subtotalEstimated) : o.authorizedAmount;

    const createdEvent = {
      id: makeId("evt"),
      orderId: orderInternalId,
      type: "ORDEN_CREADA" as OrderEventType,
      timestamp: new Date().toISOString(),
    };

    return {
      ...o,
      services,
      subtotalEstimated,
      authorizedAmount,
      events: [createdEvent],
    };
  });

  return { customers, vehicles, orders };
}
