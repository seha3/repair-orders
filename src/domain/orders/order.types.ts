export type OrderStatus =
  | "CREATED"
  | "DIAGNOSED"
  | "AUTHORIZED"
  | "IN_PROGRESS"
  | "WAITING_FOR_APPROVAL"
  | "COMPLETED"
  | "DELIVERED"
  | "CANCELLED";

export type OrderSource = "TALLER" | "CLIENTE";

export type BusinessErrorCode =
  | "NO_SERVICES"
  | "REQUIRES_REAUTH"
  | "NOT_ALLOWED_AFTER_AUTHORIZATION"
  | "ORDER_CANCELLED"
  | "INVALID_STATUS_TRANSITION";

export type BusinessError = {
  id: string;
  orderId: string;
  code: BusinessErrorCode;
  message: string;
  createdAt: string;
};

export type OrderEventType =
  | "ORDEN_CREADA"
  | "ORDEN_DIAGNOSTICADA"
  | "ORDEN_AUTORIZADA"
  | "REAUTORIZADA"
  | "REPARACION_INICIADA"
  | "REPARACION_COMPLETADA"
  | "ORDEN_ENTREGADA"
  | "ORDEN_CANCELADA"
  | "CLIENTE_RECHAZO"
  | "CLIENTE_SOLICITO_CAMBIOS";

export type Event = {
  id: string;
  orderId: string;
  type: OrderEventType;
  fromStatus?: OrderStatus;
  toStatus?: OrderStatus;
  timestamp: string;
};

export type Authorization = {
  id: string;
  orderId: string;
  amount: number;
  createdAt: string;
  comment?: string;
};

export type Component = {
  id: string;
  serviceId: string;
  name: string;
  description?: string;
  estimated: number;
  real: number;
};

export type Service = {
  id: string;
  orderId: string;
  name: string;
  description?: string;
  laborEstimated: number;
  laborReal: number;
  components: Component[];
};

export type RepairOrder = {
  id: string;
  orderId: string;
  customerId: string;
  vehicleId: string;
  status: OrderStatus;

  subtotalEstimated: number;
  authorizedAmount: number;
  realTotal: number;

  authorizations: Authorization[];
  services: Service[];
  events: Event[];
  errors: BusinessError[];
  source: OrderSource;
};
