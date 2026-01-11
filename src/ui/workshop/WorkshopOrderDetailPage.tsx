import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";
import { getOrderById } from "../../infrastructure/storage/orders.repo";
import type { RepairOrder } from "../../domain/orders/order.types";
import { calculateLimit110 } from "../../domain/orders/order.rules";

export function WorkshopOrderDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [order, setOrder] = useState<RepairOrder | null>(null);

  useEffect(() => {
    if (!id) return;
    setOrder(getOrderById(id) ?? null);
  }, [id]);

  const limit110 = useMemo(() => (order ? calculateLimit110(order.authorizedAmount) : 0), [order]);

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

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip size="small" label={order.status} />
                <Chip size="small" label={`Origen: ${order.source}`} />
              </Stack>

              <Divider sx={{ my: 1 }} />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Subtotal estimado</Typography>
                  <Typography fontWeight={700}>{order.subtotalEstimated.toFixed(2)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Monto autorizado</Typography>
                  <Typography fontWeight={700}>{order.authorizedAmount.toFixed(2)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Límite 110%</Typography>
                  <Typography fontWeight={700}>{limit110.toFixed(2)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total real</Typography>
                  <Typography fontWeight={700}>{order.realTotal.toFixed(2)}</Typography>
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography fontWeight={800}>Servicios</Typography>
            <Typography variant="body2" color="text.secondary">
              Placeholder: aquí mostraremos servicios/refacciones y edición cuando aplique.
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography fontWeight={800}>Historial y errores</Typography>
            <Typography variant="body2" color="text.secondary">
              Placeholder: aquí mostraremos events/errors.
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
