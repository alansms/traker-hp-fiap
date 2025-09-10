import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const SettingsTest = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Página de Configurações de Teste
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Box>
          <Typography variant="h6">
            Esta é uma página de configurações de teste
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Se você está vendo esta página, significa que você tem permissões de administrador
            e o redirecionamento está funcionando corretamente.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default SettingsTest;
