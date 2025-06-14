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
  TableRow,
  Box,
  Rating,
  Chip
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

// Cores para os gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFF', '#FF6B6B', '#4CAF50', '#9C27B0', '#795548', '#607D8B'];

const OverviewTab = ({ analysisData }) => {
  // Pegar os 5 produtos mais recentes
  const recentProducts = analysisData.recentProducts || [];

  return (
    <Grid container spacing={3}>
      {/* Resumo Geral */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Resumo da Análise</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h3" color="primary">{analysisData.totalProducts || 0}</Typography>
                <Typography variant="body1">Produtos Analisados</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h3" color="secondary">
                  {analysisData.priceStats?.avgPrice ?
                    `R$ ${analysisData.priceStats.avgPrice.toFixed(2)}` : 'N/A'}
                </Typography>
                <Typography variant="body1">Preço Médio</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h3" sx={{ color: '#4CAF50' }}>
                  {analysisData.vendorStats?.count || 0}
                </Typography>
                <Typography variant="body1">Vendedores Únicos</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h3" sx={{ color: '#FF8042' }}>
                  {analysisData.discountStats?.avgDiscount ?
                    `${analysisData.discountStats.avgDiscount.toFixed(0)}%` : '0%'}
                </Typography>
                <Typography variant="body1">Desconto Médio</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Produtos Recentes Encontrados */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Produtos Recentes Encontrados</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Preço</TableCell>
                  <TableCell>Vendedor</TableCell>
                  <TableCell>Avaliação</TableCell>
                  <TableCell>Atributos</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentProducts.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                        {product.title}
                      </Typography>
                    </TableCell>
                    <TableCell>{product.id || product.product_id || 'N/A'}</TableCell>
                    <TableCell>
                      {typeof product.price === 'number'
                        ? `R$ ${product.price.toFixed(2)}`
                        : `R$ ${product.price}`}
                    </TableCell>
                    <TableCell>{product.seller || 'Não informado'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating
                          value={product.rating || 0}
                          readOnly
                          precision={0.5}
                          size="small"
                        />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          ({product.review_count || 0})
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {product.free_shipping && (
                          <Chip label="Frete Grátis" size="small" color="success" />
                        )}
                        {product.is_original && (
                          <Chip label="Original" size="small" color="primary" />
                        )}
                        {product.is_compatible && (
                          <Chip label="Compatível" size="small" color="secondary" />
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {recentProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Nenhum produto recente encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      {/* Distribuição de Preços */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Distribuição de Preços</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analysisData.priceDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#0088FE" name="Número de Produtos" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Distribuição por Categoria */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Distribuição por Categoria</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analysisData.categoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {analysisData.categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} produtos`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default OverviewTab;
