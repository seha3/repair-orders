import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  TextField,
  Typography,
  Chip,
  Alert,
  Snackbar
} from "@mui/material";
import { getOrderById } from "../../infrastructure/storage/orders.repo";
import { authorizeOrder, transitionOrder, clientReject, clientRequestChanges } from "../../application/order.usecases";
import type { RepairOrder } from "../../domain/orders/order.types";

export function ClientOrderDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [comment, setComment] = useState("");
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "error" | "success" | "info";
  }>({ open: false, message: "", severity: "info" });


  const canAcceptProposal = order?.status === "DIAGNOSED";
  const canAcceptReauth = order?.status === "WAITING_FOR_APPROVAL";

  useEffect(() => {
    if (!id) return;
    setOrder(getOrderById(id) ?? null);
  }, [id]);

  const refresh = () => {
    if (!id) return;
    setOrder(getOrderById(id) ?? null);
  };

  const lastEvents = useMemo(() => (order ? order.events.slice(0, 6) : []), [order]);
  const lastErrors = useMemo(() => (order ? order.errors.slice(0, 6) : []), [order]);
  const lastReauthEvent = useMemo(() => {
    if (!order) return null;
    return order.events.find((e) => e.type === "REAUTORIZADA") ?? null;
  }, [order]);


  if (!order) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Orden no encontrada.
        </Typography>
        <Button sx={{ mt: 2 }} onClick={() => nav("/cliente/ordenes")}>
          Volver
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Button size="small" onClick={() => nav("/cliente/ordenes")}>
          ← Volver
        </Button>

        <Typography variant="h6" fontWeight={800}>
          {order.orderId} — Detalle
        </Typography>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip size="small" label={order.status} />
                {order.status === "DIAGNOSED" && <Chip size="small" label="Pendiente de autorización" />}
                {order.status === "WAITING_FOR_APPROVAL" && <Chip size="small" label="Pendiente de reautorización" />}
              </Stack>

              <Typography variant="body2" color="text.secondary">
                Vehículo: {order.vehicleId}
              </Typography>

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
                    Total real
                  </Typography>
                  <Typography fontWeight={700}>{order.realTotal.toFixed(2)}</Typography>
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {order.status === "WAITING_FOR_APPROVAL" && (
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={1}>
                <Typography fontWeight={800}>Reautorización solicitada</Typography>

                <Typography variant="body2" color="text.secondary">
                  El taller registró un nuevo monto autorizado para continuar con la reparación.
                </Typography>

                <Divider sx={{ my: 1 }} />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total real</Typography>
                    <Typography fontWeight={700}>{order.realTotal.toFixed(2)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Nuevo monto autorizado</Typography>
                    <Typography fontWeight={700}>{order.authorizedAmount.toFixed(2)}</Typography>
                  </Box>
                </Stack>

                {lastReauthEvent && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Evento: {lastReauthEvent.type} — {new Date(lastReauthEvent.timestamp).toLocaleString()}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}


        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography fontWeight={800}>Acciones del cliente</Typography>

              {canAcceptProposal && (
                <Button
                  variant="contained"
                  onClick={() => {
                    const res = authorizeOrder(order.id);
                      if (!res.ok) {
                        setSnackbar({
                          open: true,
                          severity: "error",
                          message: res.error.message,
                        });
                        return;
                      }

                    setSnackbar({
                    open: true,
                    severity: "success",
                    message: "Propuesta aceptada correctamente.",
                    });
                    refresh();

                  }}
                >
                  Aceptar propuesta
                </Button>
              )}

              {canAcceptReauth && (
                <Button
                  variant="contained"
                  onClick={() => {
                    const hasReauth = order.events.some((e) => e.type === "REAUTORIZADA");
                    if (!hasReauth) {
                      setSnackbar({
                        open: true,
                        severity: "error",
                        message: "Aún no hay una reautorización registrada por el taller.",
                      });
                      return;
                    }

                    const res = transitionOrder(order.id, "AUTHORIZED");
                    if (!res.ok) {
                      setSnackbar({ open: true, severity: "error", message: res.error.message });
                      return;
                    }
                    setSnackbar({ open: true, severity: "success", message: "Reautorización aceptada correctamente." });
                    refresh();
                  }}
                >
                  Aceptar reautorización
                </Button>
              )}

              <TextField
                label="Comentario (opcional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                multiline
                minRows={2}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    const res = clientRequestChanges(order.id, comment || "Solicito aclaración");
                    if (!res.ok) {
                        setSnackbar({
                          open: true,
                          severity: "error",
                          message: res.error.message,
                        });
                        return;
                    }
                    setSnackbar({
                      open: true,
                      severity: "success",
                      message: "Solicitud de cambios enviada correctamente.",
                    });
                    setComment("");
                    refresh();
                  }}
                >
                  Solicitar cambios
                </Button>

                <Button
                  color="error"
                  variant="outlined"
                  onClick={() => {
                    const res = clientReject(order.id, comment || "Rechazo sin comentario");
                    if (!res.ok) {
                        setSnackbar({
                          open: true,
                          severity: "error",
                          message: res.error.message,
                        });
                        return;
                    }
                    setSnackbar({
                      open: true,
                      severity: "success",
                      message: "Orden rechazada correctamente.",
                    });
                    setComment("");
                    refresh();
                  }}
                >
                  Rechazar
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography fontWeight={800}>Historial reciente</Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
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

            <Typography fontWeight={800}>Errores / notas recientes</Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
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
