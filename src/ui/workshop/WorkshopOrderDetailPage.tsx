import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Snackbar,
  Stack,
  TextField,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

import { getOrderById } from "../../infrastructure/storage/orders.repo";
import type { RepairOrder } from "../../domain/orders/order.types";
import { calculateLimit110 } from "../../domain/orders/order.rules";
import { authorizeOrder, transitionOrder, registerReauthorization } from "../../application/order.usecases";

import {
  addService,
  updateServiceEstimated,
  deleteService,
  addComponentEstimated,
  updateComponentEstimated,
  deleteComponent,
} from "../../application/services.usecases";

export function WorkshopOrderDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();

  // State hooks
  const [order, setOrder] = useState<RepairOrder | null>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "error" | "success" | "info";
  }>({ open: false, message: "", severity: "info" });

  // Reautorización
  const [reauthAmount, setReauthAmount] = useState("");
  const [reauthComment, setReauthComment] = useState("");

  // Dialog
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceDraft, setServiceDraft] = useState<{
    name: string;
    laborEstimated: string;
    description: string;
  }>({ name: "", laborEstimated: "0", description: "" });

  const [componentDialogOpen, setComponentDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<{ serviceId: string; componentId: string } | null>(null);
  const [componentDraft, setComponentDraft] = useState<{ name: string; estimated: string }>({
    name: "",
    estimated: "0",
  });

  useEffect(() => {
    if (!id) return;
    setOrder(getOrderById(id) ?? null);
  }, [id]);

  const refresh = () => {
    if (!id) return;
    setOrder(getOrderById(id) ?? null);
  };


  const canEditServices = order?.status === "CREATED" || order?.status === "DIAGNOSED";

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
                  disabled={!(order.status === "AUTHORIZED" && order.authorizedAmount > 0)}
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

        {/* CARD 3: Reautorización (WAITING_FOR_APPROVAL) */}
        {order.status === "WAITING_FOR_APPROVAL" && (
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Typography fontWeight={800}>Reautorización</Typography>

                <Typography variant="body2" color="text.secondary">
                  Esta orden requiere un nuevo monto autorizado para continuar.
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
                      setSnackbar({ open: true, severity: "error", message: "Ingresa un monto mayor a 0." });
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
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                <Typography fontWeight={800}>Servicios</Typography>

                <Button
                  size="small"
                  variant="outlined"
                  disabled={!canEditServices}
                  onClick={() => {
                    setEditingServiceId(null);
                    setServiceDraft({ name: "", laborEstimated: "0", description: "" });
                    setServiceDialogOpen(true);
                  }}
                >
                  + Agregar servicio
                </Button>
              </Stack>

              {!canEditServices && (
                <Typography variant="body2" color="text.secondary">
                  Solo se pueden editar en CREATED o DIAGNOSED.
                </Typography>
              )}

              {order.services.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No hay servicios registrados.
                </Typography>
              )}

              {order.services.map((s) => {
                const labor = s.laborEstimated ?? 0;
                const componentsTotal = s.components.reduce((sum, c) => sum + (c.estimated ?? 0), 0);
                const serviceTotal = labor + componentsTotal;

                return (
                  <Card key={s.id} variant="outlined">
                    <CardContent>
                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                          <Typography fontWeight={700}>{s.name}</Typography>

                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              disabled={!canEditServices}
                              onClick={() => {
                                setEditingServiceId(s.id);
                                setServiceDraft({
                                  name: s.name,
                                  laborEstimated: String(s.laborEstimated ?? 0),
                                  description: s.description ?? "",
                                });
                                setServiceDialogOpen(true);
                              }}
                            >
                              Editar
                            </Button>

                            <Button
                              size="small"
                              color="error"
                              disabled={!canEditServices}
                              onClick={() => {
                                const res = deleteService(order.id, s.id);
                                if (!res.ok) {
                                  setSnackbar({ open: true, severity: "error", message: res.error.message });
                                  refresh();
                                  return;
                                }
                                setSnackbar({ open: true, severity: "info", message: "Servicio eliminado." });
                                refresh();
                              }}
                            >
                              Eliminar
                            </Button>
                          </Stack>
                        </Stack>

                        {s.description && (
                          <Typography variant="body2" color="text.secondary">
                            {s.description}
                          </Typography>
                        )}

                        <Divider />

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
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

                        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                          <Typography variant="subtitle2">Refacciones</Typography>

                          <Button
                            size="small"
                            variant="outlined"
                            disabled={!canEditServices}
                            onClick={() => {
                              setEditingComponent({ serviceId: s.id, componentId: "" });
                              setComponentDraft({ name: "", estimated: "0" });
                              setComponentDialogOpen(true);
                            }}
                          >
                            + Agregar componente
                          </Button>
                        </Stack>

                        {s.components.length === 0 && (
                          <Typography variant="body2" color="text.secondary">
                            Sin componentes.
                          </Typography>
                        )}

                        <Stack spacing={1}>
                          {s.components.map((c) => (
                            <Stack
                              key={c.id}
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              spacing={2}
                            >
                              <Typography variant="body2">{c.name}</Typography>

                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2">{(c.estimated ?? 0).toFixed(2)}</Typography>

                                <Button
                                  size="small"
                                  disabled={!canEditServices}
                                  onClick={() => {
                                    setEditingComponent({ serviceId: s.id, componentId: c.id });
                                    setComponentDraft({ name: c.name, estimated: String(c.estimated ?? 0) });
                                    setComponentDialogOpen(true);
                                  }}
                                >
                                  Editar
                                </Button>

                                <Button
                                  size="small"
                                  color="error"
                                  disabled={!canEditServices}
                                  onClick={() => {
                                    const res = deleteComponent(order.id, s.id, c.id);
                                    if (!res.ok) {
                                      setSnackbar({ open: true, severity: "error", message: res.error.message });
                                      refresh();
                                      return;
                                    }
                                    setSnackbar({ open: true, severity: "info", message: "Componente eliminado." });
                                    refresh();
                                  }}
                                >
                                  X
                                </Button>
                              </Stack>
                            </Stack>
                          ))}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          </CardContent>
        </Card>

        {/* CARD 5: Historial */}
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

      {/* Dialog Servicio */}
      <Dialog open={serviceDialogOpen} onClose={() => setServiceDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingServiceId ? "Editar servicio" : "Agregar servicio"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre"
              value={serviceDraft.name}
              onChange={(e) => setServiceDraft((d) => ({ ...d, name: e.target.value }))}
            />
            <TextField
              label="Descripción (opcional)"
              value={serviceDraft.description}
              onChange={(e) => setServiceDraft((d) => ({ ...d, description: e.target.value }))}
            />
            <TextField
              label="Mano de obra estimada"
              inputMode="decimal"
              value={serviceDraft.laborEstimated}
              onChange={(e) => setServiceDraft((d) => ({ ...d, laborEstimated: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setServiceDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              const labor = Number(serviceDraft.laborEstimated);
              if (!Number.isFinite(labor) || labor < 0) {
                setSnackbar({ open: true, severity: "error", message: "Mano de obra inválida." });
                return;
              }

              const res = editingServiceId
                ? updateServiceEstimated(order.id, editingServiceId, {
                    name: serviceDraft.name,
                    description: serviceDraft.description,
                    laborEstimated: labor,
                  })
                : addService(order.id, {
                    name: serviceDraft.name,
                    description: serviceDraft.description,
                    laborEstimated: labor,
                  });

              if (!res.ok) {
                setSnackbar({ open: true, severity: "error", message: res.error.message });
                refresh();
                return;
              }

              setSnackbar({ open: true, severity: "success", message: "Servicio guardado." });
              setServiceDialogOpen(false);
              refresh();
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Componente */}
      <Dialog open={componentDialogOpen} onClose={() => setComponentDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingComponent?.componentId ? "Editar componente" : "Agregar componente"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre"
              value={componentDraft.name}
              onChange={(e) => setComponentDraft((d) => ({ ...d, name: e.target.value }))}
            />
            <TextField
              label="Costo estimado"
              inputMode="decimal"
              value={componentDraft.estimated}
              onChange={(e) => setComponentDraft((d) => ({ ...d, estimated: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComponentDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!editingComponent) return;

              const estimated = Number(componentDraft.estimated);
              if (!Number.isFinite(estimated) || estimated < 0) {
                setSnackbar({ open: true, severity: "error", message: "Costo estimado inválido." });
                return;
              }

              const isEdit = Boolean(editingComponent.componentId);

              const res = isEdit
                ? updateComponentEstimated(order.id, editingComponent.serviceId, editingComponent.componentId, {
                    name: componentDraft.name,
                    estimated,
                  })
                : addComponentEstimated(order.id, editingComponent.serviceId, {
                    name: componentDraft.name,
                    estimated,
                  });

              if (!res.ok) {
                setSnackbar({ open: true, severity: "error", message: res.error.message });
                refresh();
                return;
              }

              setSnackbar({ open: true, severity: "success", message: "Componente guardado." });
              setComponentDialogOpen(false);
              refresh();
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>


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
