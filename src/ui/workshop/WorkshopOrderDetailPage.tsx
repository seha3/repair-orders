import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
  Alert,
  Snackbar,
  TextField,
} from "@mui/material";
import { getOrderById } from "../../infrastructure/storage/orders.repo";
import type { RepairOrder } from "../../domain/orders/order.types";
import { calculateLimit110 } from "../../domain/orders/order.rules";
import { authorizeOrder, transitionOrder, registerReauthorization } from "../../application/order.usecases";

export function WorkshopOrderDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [order, setOrder] = useState<RepairOrder | null>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "error" | "success" | "info";
  }>({ open: false, message: "", severity: "info" });

  // Reautorización
  const [reauthAmount, setReauthAmount] = useState("");
  const [reauthComment, setReauthComment] = useState("");

  useEffect(() => {
    if (!id) return;
    setOrder(getOrderById(id) ?? null);
  }, [id]);

  const refresh = () => {
    if (!id) return;
    setOrder(getOrderById(id) ?? null);
  };

  const limit110 = useMemo(() => (order ? calculateLimit110(order.authorizedAmount) : 0), [order]);
  const lastEvents = useMemo(() => (order ? order.events.slice(0, 8) : []), [order]);
  const lastErrors = useMemo(() => (order ? order.errors.slice(0, 8) : []), [order]);

  if (!order) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Orden no encontrada.
        </Typography>
        <Button sx={{ mt: 2 }} onClick={() => nav("/taller/ordenes")}>
          Volver
        </Button>
      </Box>
    );
  }

  const canStartRepair =
  order.status === "AUTHORIZED" && order.authorizedAmount > 0;

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Button size="small" onClick={() => nav("/taller/ordenes")}>
          ← Volver
        </Button>

        <Typography variant="h6" fontWeight={800}>
          {order.orderId} — Taller
        </Typography>

        {/* CARD 1: Resumen / Montos */}
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip size="small" label={order.status} />
                <Chip size="small" label={`Origen: ${order.source}`} />
                {order.status === "WAITING_FOR_APPROVAL" && (
                  <Chip size="small" label="Pendiente de reautorización" />
                )}
              </Stack>

              <Divider sx={{ my: 1 }} />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Subtotal estimado
                  </Typography>
                  <Typography fontWeight={700}>{order.subtotalEstimated.toFixed(2)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Monto autorizado
                  </Typography>
                  <Typography fontWeight={700}>{order.authorizedAmount.toFixed(2)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Límite 110%
                  </Typography>
                  <Typography fontWeight={700}>{limit110.toFixed(2)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total real
                  </Typography>
                  <Typography fontWeight={700}>{order.realTotal.toFixed(2)}</Typography>
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* CARD 2: Acciones del taller */}
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography fontWeight={800}>Acciones del taller</Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
                <Button
                  disabled={order.status !== "CREATED"}
                  variant="outlined"
                  onClick={() => {
                    const res = transitionOrder(order.id, "DIAGNOSED");
                    if (!res.ok) {
                      setSnackbar({ open: true, severity: "error", message: res.error.message });
                      refresh();
                      return;
                    }
                    setSnackbar({ open: true, severity: "success", message: "Orden diagnosticada." });
                    refresh();
                  }}
                >
                  Diagnosticar
                </Button>

                <Button
                  disabled={order.status !== "DIAGNOSED"}
                  variant="contained"
                  onClick={() => {
                    const res = authorizeOrder(order.id);
                    if (!res.ok) {
                      setSnackbar({ open: true, severity: "error", message: res.error.message });
                      refresh();
                      return;
                    }
                    setSnackbar({ open: true, severity: "success", message: "Orden autorizada." });
                    refresh();
                  }}
                >
                  Autorizar
                </Button>

                <Button
                  disabled={!canStartRepair}
                  variant="outlined"
                  onClick={() => {
                    const res = transitionOrder(order.id, "IN_PROGRESS");
                    if (!res.ok) {
                      setSnackbar({ open: true, severity: "error", message: res.error.message });
                      refresh();
                      return;
                    }
                    setSnackbar({ open: true, severity: "success", message: "Reparación iniciada." });
                    refresh();
                  }}
                >
                  Iniciar reparación
                </Button>

                <Button
                  disabled={order.status !== "IN_PROGRESS"}
                  variant="outlined"
                  onClick={() => {
                    const res = transitionOrder(order.id, "COMPLETED");
                    if (!res.ok) {
                      setSnackbar({ open: true, severity: "error", message: res.error.message });
                      refresh();
                      return;
                    }
                    setSnackbar({ open: true, severity: "success", message: "Reparación completada." });
                    refresh();
                  }}
                >
                  Completar
                </Button>

                <Button
                  disabled={order.status !== "COMPLETED"}
                  variant="outlined"
                  onClick={() => {
                    const res = transitionOrder(order.id, "DELIVERED");
                    if (!res.ok) {
                      setSnackbar({ open: true, severity: "error", message: res.error.message });
                      refresh();
                      return;
                    }
                    setSnackbar({ open: true, severity: "success", message: "Orden entregada." });
                    refresh();
                  }}
                >
                  Entregar
                </Button>

                <Button
                  color="error"
                  variant="outlined"
                  disabled={order.status === "CANCELLED"}
                  onClick={() => {
                    const res = transitionOrder(order.id, "CANCELLED");
                    if (!res.ok) {
                      setSnackbar({ open: true, severity: "error", message: res.error.message });
                      refresh();
                      return;
                    }
                    setSnackbar({ open: true, severity: "info", message: "Orden cancelada." });
                    refresh();
                  }}
                >
                  Cancelar
                </Button>
              </Stack>

              <Typography variant="body2" color="text.secondary">
                Nota: “Autorizar” requiere que existan servicios (regla de negocio).
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* ✅ CARD 3: Reautorización */}
        {order.status === "WAITING_FOR_APPROVAL" && (
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Typography fontWeight={800}>Reautorización</Typography>

                <Typography variant="body2" color="text.secondary">
                  La orden excedió el límite del 110% y requiere reautorización para continuar.
                </Typography>

                <TextField
                  label="Nuevo monto autorizado (incluye IVA)"
                  value={reauthAmount}
                  onChange={(e) => setReauthAmount(e.target.value)}
                  inputMode="decimal"
                />

                <TextField
                  label="Comentario (opcional)"
                  value={reauthComment}
                  onChange={(e) => setReauthComment(e.target.value)}
                  multiline
                  minRows={2}
                />

                <Button
                  variant="contained"
                  onClick={() => {
                    const amt = Number(reauthAmount);
                    if (!Number.isFinite(amt) || amt <= 0) {
                      setSnackbar({ open: true, severity: "error", message: "Ingresa un monto válido mayor a 0." });
                      return;
                    }

                    const res = registerReauthorization(order.id, amt, reauthComment || undefined);
                    if (!res.ok) {
                      setSnackbar({ open: true, severity: "error", message: res.error.message });
                      refresh();
                      return;
                    }

                    setSnackbar({ open: true, severity: "success", message: "Reautorización registrada." });
                    setReauthAmount("");
                    setReauthComment("");
                    refresh();
                  }}
                >
                  Registrar reautorización
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* CARD 4: Servicios */}
        <Card variant="outlined">
          <CardContent>
            <Typography fontWeight={800}>Servicios</Typography>
            {order.services.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                    No hay servicios registrados.
                </Typography>
                )}

                {order.services.map((s) => {
                const labor = s.laborEstimated;
                const componentsTotal = s.components.reduce((sum, c) => sum + c.estimated, 0);
                const serviceTotal = labor + componentsTotal;

                return (
                    <Card key={s.id} variant="outlined" sx={{ mt: 2 }}>
                    <CardContent>
                        <Stack spacing={1}>
                        <Typography fontWeight={700}>{s.name}</Typography>

                        <Typography variant="body2" color="text.secondary">
                            {s.description}
                        </Typography>

                        <Divider />

                        <Stack direction="row" spacing={3}>
                            <Box>
                            <Typography variant="caption" color="text.secondary">
                                Mano de obra
                            </Typography>
                            <Typography>{labor.toFixed(2)}</Typography>
                            </Box>

                            <Box>
                            <Typography variant="caption" color="text.secondary">
                                Componentes
                            </Typography>
                            <Typography>{componentsTotal.toFixed(2)}</Typography>
                            </Box>

                            <Box>
                            <Typography variant="caption" color="text.secondary">
                                Total servicio
                            </Typography>
                            <Typography fontWeight={700}>{serviceTotal.toFixed(2)}</Typography>
                            </Box>
                        </Stack>

                        <Divider />

                        <Typography variant="subtitle2">Refacciones</Typography>

                        {s.components.length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                            Sin componentes.
                            </Typography>
                        )}

                        {s.components.map((c) => (
                            <Stack key={c.id} direction="row" justifyContent="space-between">
                            <Typography variant="body2">{c.name}</Typography>
                            <Typography variant="body2">{c.estimated.toFixed(2)}</Typography>
                            </Stack>
                        ))}
                        </Stack>
                    </CardContent>
                    </Card>
                );
                })}
          </CardContent>
        </Card>

        {/* CARD 5: Historial y errores */}
        <Card variant="outlined">
          <CardContent>
            <Typography fontWeight={800}>Historial y errores</Typography>

            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Eventos recientes
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {lastEvents.map((e) => (
                <Typography key={e.id} variant="body2" color="text.secondary">
                  {e.type} — {new Date(e.timestamp).toLocaleString()}
                </Typography>
              ))}
              {lastEvents.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Sin eventos.
                </Typography>
              )}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2">Errores / notas recientes</Typography>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {lastErrors.map((er) => (
                <Typography key={er.id} variant="body2" color="text.secondary">
                  {er.code}: {er.message}
                </Typography>
              ))}
              {lastErrors.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Sin errores.
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
