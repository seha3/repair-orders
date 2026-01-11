import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Button
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { listOrders } from "../../application/order.usecases";
import type { RepairOrder } from "../../domain/orders/order.types";

const statusOptions: Array<RepairOrder["status"] | "ALL"> = [
  "ALL",
  "CREATED",
  "DIAGNOSED",
  "AUTHORIZED",
  "IN_PROGRESS",
  "WAITING_FOR_APPROVAL",
  "COMPLETED",
  "DELIVERED",
  "CANCELLED",
];

export function WorkshopOrdersPage() {
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("ALL");
  const [q, setQ] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    const res = listOrders();
    if (res.ok) {
      Promise.resolve().then(() => setOrders(res.data));
    }
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return orders.filter((o) => {
      const statusOk = status === "ALL" ? true : o.status === status;
      const queryOk = query.length === 0 ? true : o.orderId.toLowerCase().includes(query);
      return statusOk && queryOk;
    });
  }, [orders, status, q]);

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6" fontWeight={800}>
          Taller — Órdenes
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel id="status-label">Estado</InputLabel>
            <Select
              labelId="status-label"
              label="Estado"
              onChange={(e: SelectChangeEvent<typeof statusOptions[number]>) => setStatus(e.target.value as typeof statusOptions[number])}
            >
              {statusOptions.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Buscar por folio (RO-001)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            fullWidth
          />
        </Stack>

        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Folio</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Autorizado</TableCell>
                <TableCell align="right">Real</TableCell>
                <TableCell>Origen</TableCell>
                <TableCell align="right">Detalle</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell>{o.orderId}</TableCell>
                  <TableCell>
                    <Chip size="small" label={o.status} />
                  </TableCell>
                  <TableCell align="right">{o.authorizedAmount.toFixed(2)}</TableCell>
                  <TableCell align="right">{o.realTotal.toFixed(2)}</TableCell>
                  <TableCell>{o.source}</TableCell>

                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => nav(`/taller/ordenes/${o.id}`)}
                    >
                      Ver detalle
                    </Button>
                  </TableCell>
                </TableRow>

              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary">
                      No hay órdenes que coincidan con el filtro/búsqueda.
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
