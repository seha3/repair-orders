import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/auth.store";
import { listOrdersForCustomer } from "../../application/order.usecases";
import type { RepairOrder } from "../../domain/orders/order.types";

function requiresClientAction(o: RepairOrder) {
  // - if DIAGNOSED (pending autorization) or WAITING_FOR_APPROVAL (pending reauthorization after changes)
  return o.status === "DIAGNOSED" || o.status === "WAITING_FOR_APPROVAL";
}

export function ClientOrdersPage() {
  const nav = useNavigate();
  const customerId = useAuthStore((s) => s.customerId);

  const [orders, setOrders] = useState<RepairOrder[]>([]);

  useEffect(() => {
    if (!customerId) return;
    const res = listOrdersForCustomer(customerId);
    if (res.ok) {
      Promise.resolve().then(() => setOrders(res.data));
    }
  }, [customerId]);

  const sorted = useMemo(() => {
    return [...orders].sort((a, b) => Number(requiresClientAction(b)) - Number(requiresClientAction(a)));
  }, [orders]);

  if (!customerId) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No hay cliente seleccionado. Vuelve a login.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6" fontWeight={800}>
          Cliente — Mis órdenes
        </Typography>

        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Folio</TableCell>
                <TableCell>Vehículo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acción</TableCell>
                <TableCell align="right">Estimado</TableCell>
                <TableCell align="right">Autorizado</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>

            <TableBody>
              {sorted.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell>{o.orderId}</TableCell>
                  <TableCell>{o.vehicleId}</TableCell>
                  <TableCell>
                    <Chip size="small" label={o.status} />
                  </TableCell>
                  <TableCell>
                    {requiresClientAction(o) ? (
                      <Chip size="small" label="Requiere acción" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">{o.subtotalEstimated.toFixed(2)}</TableCell>
                  <TableCell align="right">{o.authorizedAmount.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => nav(`/cliente/ordenes/${o.id}`)}>
                      Ver detalle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography variant="body2" color="text.secondary">
                      No tienes órdenes aún.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    </Box>
  );
}
