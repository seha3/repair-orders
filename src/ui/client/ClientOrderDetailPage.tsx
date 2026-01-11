import { Box, Typography } from "@mui/material";
import { useParams } from "react-router-dom";

export function ClientOrderDetailPage() {
  const { id } = useParams();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={800}>
        Cliente — Detalle de orden
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Placeholder. Orden interna: {id}
      </Typography>
    </Box>
  );
}
