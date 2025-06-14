import React from 'react';
import {
  Grid,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const VendorsTab = ({ analysisData }) => {
  return (
    <Grid container spacing={3}>
      {/* Reputação dos Vendedores */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Reputação dos Vendedores</Typography>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={analysisData.sellerPerformance}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 5]} />
              <Tooltip formatter={(value, name) => name === 'reputation' ? `${value} ★` : value} />
              <Legend />
              <Bar dataKey="reputation" fill="#FFD700" name="Reputação (1-5 ★)" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Preço Médio por Vendedor */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Preço Médio por Vendedor</Typography>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={analysisData.sellerPerformance}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => value && typeof value === 'number' ? `R$ ${value.toFixed(2)}` : value} />
              <Legend />
              <Bar dataKey="avgPrice" fill="#8884d8" name="Preço Médio (R$)" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Volume de Produtos por Vendedor */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Volume de Produtos por Vendedor</Typography>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={analysisData.sellerPerformance}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="products" fill="#82ca9d" name="Quantidade de Produtos" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Vendas Estimadas por Vendedor */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Vendas Estimadas por Vendedor</Typography>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={analysisData.sellerPerformance}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#8884d8" name="Vendas Estimadas" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Tabela de Vendedores */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Detalhes dos Vendedores</Typography>
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Vendedor</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Reputação</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Produtos</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Preço Médio</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Vendas Estimadas</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analysisData.sellerPerformance.map((seller, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{seller.name}</TableCell>
                    <TableCell align="center">
                      {seller.reputation.toFixed(1)} ★
                    </TableCell>
                    <TableCell align="center">{seller.products}</TableCell>
                    <TableCell align="right">
                      {seller.avgPrice ? `R$ ${seller.avgPrice.toFixed(2)}` : 'N/A'}
                    </TableCell>
                    <TableCell align="right">{seller.sales}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default VendorsTab;
