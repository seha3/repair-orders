import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
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
  Card,
  CardContent,
  Alert
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));


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
        <Button size="small" onClick={() => nav(-1)}>
          ← Volver
        </Button>

        <Typography variant="h6" fontWeight={800}>
          Cliente — Mis órdenes
        </Typography>

        {isMobile ? (
          <Stack spacing={1}>
            {sorted.map((o) => {
              const needsAction = requiresClientAction(o);

              return (
                <Card
                  key={o.id}
                  variant="outlined"
                  sx={{
                    borderWidth: 2,
                    borderColor: needsAction ? "warning.main" : "divider",
                    bgcolor: needsAction ? "warning.light" : "background.paper",
                  }}
                >
                  <CardContent>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography fontWeight={900}>{o.orderId}</Typography>
                        <Chip
                          size="small"
                          label={o.status}
                          color={needsAction ? "warning" : "default"}
                          variant={needsAction ? "filled" : "outlined"}
                        />
                      </Stack>

                      <Typography variant="body2" color="text.secondary">
                        Vehículo: {o.vehicleId}
                      </Typography>

                      {needsAction && (
                        <Alert severity="warning" sx={{ py: 0.5 }}>
                          Requiere tu autorización para continuar.
                        </Alert>
                      )}

                      <Stack direction="row" spacing={1}>
                        <Box sx={{ flex: 1, p: 1, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                          <Typography variant="caption" color="text.secondary">
                            Estimado
                          </Typography>
                          <Typography fontWeight={800}>{o.subtotalEstimated.toFixed(2)}</Typography>
                        </Box>

                        <Box sx={{ flex: 1, p: 1, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                          <Typography variant="caption" color="text.secondary">
                            Autorizado
                          </Typography>
                          <Typography fontWeight={800}>{o.authorizedAmount.toFixed(2)}</Typography>
                        </Box>
                      </Stack>

                      <Button
                        fullWidth
                        size="large"
                        variant={needsAction ? "contained" : "outlined"}
                        onClick={() => nav(`/cliente/ordenes/${o.id}`)}
                        sx={{ mt: 0.5, fontWeight: 900 }}
                      >
                        Ver detalle
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}


            {sorted.length === 0 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    No tienes órdenes aún.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Stack>
        ) : (
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
                  <TableCell align="right" />
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
        )}

      </Stack>
    </Box>
  );
}
