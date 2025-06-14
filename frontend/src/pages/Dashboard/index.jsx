import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import dashboardService from '../../services/dashboardService';
import SentimentAnalysis from './SentimentAnalysis';

// Cores para os gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFF', '#FF6B6B', '#4CAF50', '#9C27B0', '#795548', '#607D8B'];

const Dashboard = () => {
  // Estados para armazenar dados dos gráficos
  const [topProducts, setTopProducts] = useState([]);
  const [searchTrends, setSearchTrends] = useState([]);
  const [dailySearches, setDailySearches] = useState([]);
  const [priceDistribution, setPriceDistribution] = useState([]);
  const [topRatedProducts, setTopRatedProducts] = useState([]);

  // Estado para controle de carregamento e erros
  const [loading, setLoading] = useState({
    topProducts: true,
    searchTrends: true,
    dailySearches: true,
    priceDistribution: true,
    topRatedProducts: true
  });
  const [error, setError] = useState(null);

  // Estado para controle de filtros
  const [periodDays, setPeriodDays] = useState(30);
  const [productCount, setProductCount] = useState(10);

  // Formatar preço em reais
  const formatPrice = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Truncar texto longo
  const truncateText = (text, maxLength = 30) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Função para carregar todos os dados
  const loadDashboardData = async () => {
    setError(null);

    try {
      // Carregar top produtos
      setLoading(prev => ({ ...prev, topProducts: true }));
      const topProductsData = await dashboardService.getTopProducts(productCount, periodDays);
      setTopProducts(topProductsData.data || []);
      setLoading(prev => ({ ...prev, topProducts: false }));

      // Carregar tendências de busca
      setLoading(prev => ({ ...prev, searchTrends: true }));
      const searchTrendsData = await dashboardService.getSearchTrends(periodDays);
      setSearchTrends(searchTrendsData.data || []);
      setLoading(prev => ({ ...prev, searchTrends: false }));

      // Carregar buscas diárias
      setLoading(prev => ({ ...prev, dailySearches: true }));
      const dailySearchesData = await dashboardService.getDailySearches(periodDays);
      setDailySearches(dailySearchesData.data || []);
      setLoading(prev => ({ ...prev, dailySearches: false }));

      // Carregar distribuição de preços
      setLoading(prev => ({ ...prev, priceDistribution: true }));
      const priceDistributionData = await dashboardService.getPriceDistribution(periodDays);
      setPriceDistribution(priceDistributionData.data || []);
      setLoading(prev => ({ ...prev, priceDistribution: false }));

      // Carregar produtos melhor avaliados
      setLoading(prev => ({ ...prev, topRatedProducts: true }));
      const topRatedProductsData = await dashboardService.getTopRatedProducts(productCount, periodDays);
      setTopRatedProducts(topRatedProductsData.data || []);
      setLoading(prev => ({ ...prev, topRatedProducts: false }));

    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError('Ocorreu um erro ao carregar os dados. Por favor, tente novamente.');

      // Marcar todos como não carregando
      setLoading({
        topProducts: false,
        searchTrends: false,
        dailySearches: false,
        priceDistribution: false,
        topRatedProducts: false
      });
    }
  };

  // Carregar dados ao montar o componente ou quando os filtros mudarem
  useEffect(() => {
    loadDashboardData();
  }, [periodDays, productCount]);

  // Componente de loading
  const LoadingIndicator = () => (
    <Box display="flex" justifyContent="center" alignItems="center" height="200px">
      <CircularProgress />
    </Box>
  );

  return (
    <Container maxWidth="xl">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Dashboard de Análise de Produtos
        </Typography>

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Período de Análise</InputLabel>
                <Select
                  value={periodDays}
                  onChange={(e) => setPeriodDays(e.target.value)}
                  label="Período de Análise"
                >
                  <MenuItem value={7}>Últimos 7 dias</MenuItem>
                  <MenuItem value={15}>Últimos 15 dias</MenuItem>
                  <MenuItem value={30}>Últimos 30 dias</MenuItem>
                  <MenuItem value={60}>Últimos 60 dias</MenuItem>
                  <MenuItem value={90}>Últimos 90 dias</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Quantidade de Produtos</InputLabel>
                <Select
                  value={productCount}
                  onChange={(e) => setProductCount(e.target.value)}
                  label="Quantidade de Produtos"
                >
                  <MenuItem value={5}>Top 5</MenuItem>
                  <MenuItem value={10}>Top 10</MenuItem>
                  <MenuItem value={15}>Top 15</MenuItem>
                  <MenuItem value={20}>Top 20</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={loadDashboardData}
              >
                Atualizar Dados
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Exibir mensagem de erro se houver */}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {/* Gráficos */}
        <Grid container spacing={4}>
          {/* Top Produtos */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Produtos Mais Encontrados
              </Typography>
              {loading.topProducts ? (
                <LoadingIndicator />
              ) : topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={topProducts}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="produto"
                      width={150}
                      tickFormatter={(value) => truncateText(value, 20)}
                    />
                    <Tooltip
                      formatter={(value, name) => [value, name === "ocorrencias" ? "Ocorrências" : "Preço Médio"]}
                      labelFormatter={(value) => `Produto: ${value}`}
                    />
                    <Legend />
                    <Bar dataKey="ocorrencias" name="Ocorrências" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body1" color="textSecondary" align="center">
                  Nenhum dado disponível
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Tendências de Busca */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Termos Mais Buscados
              </Typography>
              {loading.searchTrends ? (
                <LoadingIndicator />
              ) : searchTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={searchTrends}
                      dataKey="buscas"
                      nameKey="termo"
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      fill="#8884d8"
                      label={({termo, buscas, percent}) =>
                        `${truncateText(termo, 15)} (${buscas})`
                      }
                    >
                      {searchTrends.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [value, 'Quantidade de Buscas']}
                      labelFormatter={(value, entry) => `Termo: ${entry && entry.payload ? entry.payload.termo : value}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body1" color="textSecondary" align="center">
                  Nenhum dado disponível
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Buscas Diárias */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Evolução de Buscas por Dia
              </Typography>
              {loading.dailySearches ? (
                <LoadingIndicator />
              ) : dailySearches.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart
                    data={dailySearches}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="data"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('pt-BR');
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => `Data: ${new Date(value).toLocaleDateString('pt-BR')}`}
                      formatter={(value) => [value, 'Quantidade de Buscas']}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="buscas"
                      name="Buscas"
                      stroke="#8884d8"
                      fill="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body1" color="textSecondary" align="center">
                  Nenhum dado disponível
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Distribuição de Preços */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Distribuição por Faixa de Preço
              </Typography>
              {loading.priceDistribution ? (
                <LoadingIndicator />
              ) : priceDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={priceDistribution}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="faixa_preco"
                      tick={{ angle: -45, textAnchor: 'end' }}
                      height={80}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [value, 'Quantidade de Produtos']}
                      labelFormatter={(value) => `Faixa: ${value}`}
                    />
                    <Legend />
                    <Bar
                      dataKey="quantidade"
                      name="Quantidade de Produtos"
                      fill="#FF8042"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body1" color="textSecondary" align="center">
                  Nenhum dado disponível
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Produtos Melhor Avaliados */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Produtos Melhor Avaliados
              </Typography>
              {loading.topRatedProducts ? (
                <LoadingIndicator />
              ) : topRatedProducts.length > 0 ? (
                <Box sx={{ height: 400, overflowY: 'auto' }}>
                  {topRatedProducts.map((product, index) => (
                    <Card key={index} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" component="div">
                          {product.produto}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Grid container spacing={1}>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">
                              Avaliação:
                            </Typography>
                            <Typography variant="body1" color="primary">
                              {product.avaliacao_media !== undefined ? product.avaliacao_media.toFixed(1) : 'N/A'} / 5
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">
                              Avaliações:
                            </Typography>
                            <Typography variant="body1">
                              {product.num_avaliacoes !== undefined ? Math.round(product.num_avaliacoes) : 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">
                              Preço Médio:
                            </Typography>
                            <Typography variant="body1">
                              {product.preco_medio !== undefined ? formatPrice(product.preco_medio) : 'N/A'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography variant="body1" color="textSecondary" align="center">
                  Nenhum dado disponível
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Análise de Sentimentos */}
        <Paper sx={{ p: 2, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Análise de Sentimentos dos Produtos
          </Typography>
          <SentimentAnalysis />
        </Paper>
      </Box>
    </Container>
  );
};

export default Dashboard;
