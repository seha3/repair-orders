import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useAuthStore } from "./auth.store";

export function LoginPage() {
  const nav = useNavigate();
  const loginAsWorkshop = useAuthStore((s) => s.loginAsWorkshop);
  const loginAsClient = useAuthStore((s) => s.loginAsClient);

  // por ahora: cliente fijo (luego lo conectas a seed)
  const [customerId, setCustomerId] = useState("CUST-001");

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}>
      <Card sx={{ width: "100%", maxWidth: 420 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={700}>
              Login simulado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Selecciona el rol para entrar a la vista correspondiente.
            </Typography>

            <Button
              variant="contained"
              onClick={() => {
                loginAsWorkshop();
                nav("/taller/ordenes");
              }}
            >
              Entrar como Taller / Mecánico
            </Button>

            <FormControl fullWidth>
              <InputLabel id="customer-label">Cliente</InputLabel>
              <Select
                labelId="customer-label"
                label="Cliente"
                value={customerId}
                onChange={(e) => setCustomerId(String(e.target.value))}
              >
                <MenuItem value="CUST-001">CUST-001 (Demo)</MenuItem>
                <MenuItem value="CUST-002">CUST-002 (Demo)</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              onClick={() => {
                loginAsClient(customerId);
                nav("/cliente/ordenes");
              }}
            >
              Entrar como Cliente
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
