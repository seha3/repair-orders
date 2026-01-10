import type { Customer } from "../../domain/customers/customer.types";
import type { Vehicle } from "../../domain/vehicles/vehicle.types";
import type { RepairOrder } from "../../domain/orders/order.types";

export type AppState = {
  customers: Customer[];
  vehicles: Vehicle[];
  orders: RepairOrder[];
};
