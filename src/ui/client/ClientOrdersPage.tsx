import { Box, Typography } from "@mui/material";

export function ClientOrdersPage() {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={700}>
        Cliente — Mis órdenes
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Placeholder: customerId.
      </Typography>
    </Box>
  );
}
