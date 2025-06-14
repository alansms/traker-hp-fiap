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
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, ZAxis
} from 'recharts';

const PricesTab = ({ analysisData }) => {
  // Preparar dados de produtos com desconto
  const discountProducts = analysisData.productDetails?.filter(p =>
    p.price && p.old_price && p.old_price > p.price
  ).sort((a, b) =>
    ((b.old_price - b.price) / b.old_price) - ((a.old_price - a.price) / a.old_price)
  ).slice(0, 10) || [];

  return (
    <Grid container spacing={3}>
      {/* Análise Detalhada de Preços */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Análise Detalhada de Preços</Typography>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={analysisData.priceHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${value}`} />
              <Legend />
              <Area
                type="monotone"
                dataKey="minPrice"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                name="Preço Mínimo"
              />
              <Area
                type="monotone"
                dataKey="avgPrice"
                stackId="2"
                stroke="#82ca9d"
                fill="#82ca9d"
                name="Preço Médio"
              />
              <Area
                type="monotone"
                dataKey="maxPrice"
                stackId="3"
                stroke="#ffc658"
                fill="#ffc658"
                name="Preço Máximo"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Estatísticas de Preço */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Estatísticas de Preço</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>Preço Mínimo</Typography>
                  <Typography variant="h5" component="div" color="primary">
                    R$ {analysisData.priceStats?.minPrice?.toFixed(2) || '0.00'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>Preço Médio</Typography>
                  <Typography variant="h5" component="div" color="secondary">
                    R$ {analysisData.priceStats?.avgPrice?.toFixed(2) || '0.00'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>Preço Máximo</Typography>
                  <Typography variant="h5" component="div" sx={{ color: '#FF8042' }}>
                    R$ {analysisData.priceStats?.maxPrice?.toFixed(2) || '0.00'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>Desconto Médio</Typography>
                  <Typography variant="h5" component="div" sx={{ color: '#4CAF50' }}>
                    {analysisData.discountStats?.avgDiscount?.toFixed(0) || '0'}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Relação Preço x Avaliação */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Relação Preço x Avaliação</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid />
              <XAxis
                type="number"
                dataKey="price"
                name="Preço"
                unit="R$"
                domain={['auto', 'auto']}
                label={{ value: 'Preço (R$)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                type="number"
                dataKey="rating"
                name="Avaliação"
                domain={[0, 5.5]}
                label={{ value: 'Avaliação (0-5)', angle: -90, position: 'insideLeft' }}
              />
              <ZAxis
                type="number"
                dataKey="review_count"
                range={[50, 500]}
                name="Número de Avaliações"
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value, name) => {
                  if (name === 'Preço') return `R$ ${value.toFixed(2)}`;
                  if (name === 'Avaliação') return `${value.toFixed(1)} ★`;
                  return value;
                }}
              />
              <Legend />
              <Scatter
                name="Produtos"
                data={analysisData.priceRatingData || []}
                fill="#8884d8"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Top Produtos com Desconto */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Top 10 Produtos com Maior Desconto</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Produto</TableCell>
                  <TableCell>Preço Original</TableCell>
                  <TableCell>Preço Atual</TableCell>
                  <TableCell>Desconto</TableCell>
                  <TableCell>Vendedor</TableCell>
                  <TableCell>Parcelamento</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {discountProducts.map((product, index) => {
                  const discountPercent = product.old_price && product.price
                    ? ((product.old_price - product.price) / product.old_price * 100).toFixed(0)
                    : 0;

                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 250, fontWeight: 'bold' }}>
                            {product.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {product.product_id}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                        >
                          R$ {product.old_price?.toFixed(2) || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          R$ {product.price?.toFixed(2) || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                          {discountPercent}%
                        </Typography>
                      </TableCell>
                      <TableCell>{product.seller || 'Não informado'}</TableCell>
                      <TableCell>
                        {product.installments ? (
                          <Typography variant="body2">
                            {product.installments.quantity}x de R$ {product.installments.amount?.toFixed(2)}
                            {product.installments.rate === 0 && ' sem juros'}
                          </Typography>
                        ) : (
                          'Não informado'
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {discountProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Nenhum produto com desconto encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default PricesTab;
