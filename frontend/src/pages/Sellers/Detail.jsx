import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Paper, Box } from '@mui/material';

const SellerDetail = () => {
  const { id } = useParams();

  return (
    <Container>
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" gutterBottom>
          Detalhes do Vendedor
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography>ID do Vendedor: {id}</Typography>
          {/* TODO: Implementar visualização detalhada do vendedor */}
        </Box>
      </Paper>
    </Container>
  );
};

export default SellerDetail;
