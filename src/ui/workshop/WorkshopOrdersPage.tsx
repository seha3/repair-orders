import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
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
  Button,
  Card,
  CardContent,
  Alert
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

type ChipColor = "default" | "success" | "warning" | "error" | "info";

const statusColors: Record<RepairOrder["status"], { bg: string; border: string; chip: ChipColor }> = {
  CREATED: { bg: "grey.50", border: "grey.300", chip: "default" },
  DIAGNOSED: { bg: "info.light", border: "info.main", chip: "info" },
  AUTHORIZED: { bg: "success.light", border: "success.main", chip: "success" },
  IN_PROGRESS: { bg: "primary.light", border: "primary.main", chip: "info" },
  WAITING_FOR_APPROVAL: { bg: "warning.light", border: "warning.main", chip: "warning" },
  COMPLETED: { bg: "success.light", border: "success.dark", chip: "success" },
  DELIVERED: { bg: "grey.100", border: "grey.400", chip: "default" },
  CANCELLED: { bg: "error.light", border: "error.main", chip: "error" },
};


export function WorkshopOrdersPage() {
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("ALL");
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));


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
        <Button size="small" onClick={() => nav("/taller")}>
          ← Volver
        </Button>

        <Typography variant="h6" fontWeight={800}>
          Taller — Órdenes
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <FormControl sx={{ minWidth: { xs: "100%", sm: 220 } }}>
            <InputLabel id="status-label">Estado</InputLabel>
            <Select
              value={status}
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

        {isMobile ? (
          <Stack spacing={1}>
            {filtered.map((o) => {
              const colors = statusColors[o.status];
              const detailBtnVariant: "contained" | "outlined" =
                o.status === "WAITING_FOR_APPROVAL" ||
                o.status === "DIAGNOSED" ||
                o.status === "CANCELLED"
                  ? "contained"
                  : "outlined";

              const detailBtnColor: "primary" | "warning" | "error" | "info" | "success" =
                o.status === "WAITING_FOR_APPROVAL"
                  ? "warning"
                  : o.status === "DIAGNOSED"
                  ? "info"
                  : o.status === "CANCELLED"
                  ? "error"
                  : "primary";


              return (
                <Card
                  key={o.id}
                  variant="outlined"
                  sx={{
                    borderWidth: 2,
                    borderColor: colors.border,
                    bgcolor:  colors.bg,
                  }}
                >
                  <CardContent>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography fontWeight={900}>{o.orderId}</Typography>
                        <Chip
                          size="small"
                          label={o.status}
                          color={colors.chip}
                          variant="filled"
                        />
                      </Stack>

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Origen
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {o.source}
                        </Typography>
                      </Stack>

                      {o.status === "WAITING_FOR_APPROVAL" && (
                        <Alert severity="warning" sx={{ py: 0.5 }}>
                          Requiere reautorización.
                        </Alert>
                      )}

                      <Stack direction="row" spacing={1}>
                        <Box sx={{ flex: 1, p: 1, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                          <Typography variant="caption" color="text.secondary">
                            Autorizado
                          </Typography>
                          <Typography fontWeight={800}>{o.authorizedAmount.toFixed(2)}</Typography>
                        </Box>

                        <Box sx={{ flex: 1, p: 1, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                          <Typography variant="caption" color="text.secondary">
                            Real
                          </Typography>
                          <Typography fontWeight={800}>{o.realTotal.toFixed(2)}</Typography>
                        </Box>
                      </Stack>

                      <Button
                        fullWidth
                        size="large"
                        variant={detailBtnVariant}
                        color={detailBtnColor}
                        onClick={() => nav(`/taller/ordenes/${o.id}`)}
                        sx={{ mt: 0.5, fontWeight: 900 }}
                      >
                        Ver detalle
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}

            {filtered.length === 0 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    No hay órdenes que coincidan con el filtro/búsqueda.
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
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Autorizado</TableCell>
                  <TableCell align="right">Real</TableCell>
                  <TableCell>Origen</TableCell>
                  <TableCell align="right" />
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
                      <Button size="small" onClick={() => nav(`/taller/ordenes/${o.id}`)}>
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
        )}
      </Stack>
    </Box>
  );
}
