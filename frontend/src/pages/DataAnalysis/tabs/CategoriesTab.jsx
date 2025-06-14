import React from 'react';
import {
  Grid,
  Typography,
  Paper,
  Box,
  Card,
  CardContent,
  CardMedia,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// Cores para os gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFF', '#FF6B6B', '#4CAF50', '#9C27B0', '#795548', '#607D8B'];

const CategoriesTab = ({ analysisData }) => {
  // Produtos agrupados por modelo
  const modelGroups = analysisData.modelGroups || [];

  // Detalhes de especificações técnicas dos produtos
  const productSpecs = analysisData.productSpecs || [];

  return (
    <Grid container spacing={3}>
      {/* Gráfico de barras horizontais das categorias */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Distribuição por Categoria</Typography>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={analysisData.categoryDistribution}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip formatter={(value) => `${value} produtos`} />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" name="Quantidade" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Gráfico de pizza das categorias */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Proporção de Categorias</Typography>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={analysisData.categoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
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

      {/* Distribuição por Modelo */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Distribuição por Modelo de Cartucho</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={analysisData.modelDistribution || []}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="model" />
              <YAxis />
              <Tooltip formatter={(value) => `${value} produtos`} />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Quantidade" />
              <Bar dataKey="originalCount" fill="#82ca9d" name="Originais" />
              <Bar dataKey="compatibleCount" fill="#FF8042" name="Compatíveis" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Comparativo Original vs Compatível */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Original vs Compatível</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analysisData.originalVsCompatible || []}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                <Cell fill="#0088FE" />
                <Cell fill="#00C49F" />
              </Pie>
              <Tooltip formatter={(value) => `${value} produtos`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Preço Médio por Modelo de Cartucho */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Preço Médio por Modelo</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={analysisData.modelPriceData || []}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="model" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="originalPrice" fill="#0088FE" name="Preço Original" />
              <Bar dataKey="compatiblePrice" fill="#00C49F" name="Preço Compatível" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Características Técnicas */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Características Técnicas dos Produtos</Typography>
        <Grid container spacing={2}>
          {modelGroups.map((group, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardMedia
                  component="img"
                  height="140"
                  image={group.image || 'https://via.placeholder.com/300x140?text=Sem+Imagem'}
                  alt={group.model}
                />
                <CardContent>
                  <Typography gutterBottom variant="h6" component="div">
                    {group.model}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    {group.isOriginal ? (
                      <Chip label="Original" color="primary" size="small" />
                    ) : (
                      <Chip label="Compatível" color="secondary" size="small" />
                    )}
                    {group.avgRating > 0 && (
                      <Chip
                        label={`${group.avgRating.toFixed(1)}★`}
                        color="warning"
                        size="small"
                      />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Preço médio: R$ {group.avgPrice?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Produtos encontrados: {group.count || 0}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Especificações
                  </Typography>
                  <List dense>
                    {group.specs?.map((spec, i) => (
                      <ListItem key={i} disablePadding>
                        <ListItemText
                          primary={spec.name}
                          secondary={spec.value}
                          primaryTypographyProps={{ variant: 'caption', fontWeight: 'bold' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    )) || (
                      <ListItem disablePadding>
                        <ListItemText
                          primary="Sem especificações disponíveis"
                          primaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {modelGroups.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography>Sem dados de modelos disponíveis</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default CategoriesTab;
