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

// Cores para os gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFF', '#FF6B6B', '#4CAF50', '#9C27B0', '#795548', '#607D8B'];

const DataAnalysisDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Buscar dados reais da API usando o serviço de dashboard
        const data = await dashboardService.getAnalysisData(timeRange);
        setAnalysisData(data);
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar dados de análise:", err);
        setError("Falha ao carregar dados de análise. Tente novamente mais tarde.");

        // Usar dados simulados como fallback em caso de erro
        const mockData = {
          priceDistribution: [
            { range: "R$ 0-100", count: 42 },
            { range: "R$ 101-200", count: 89 },
            { range: "R$ 201-300", count: 63 },
            { range: "R$ 301-400", count: 37 },
            { range: "R$ 401-500", count: 21 },
            { range: "R$ 500+", count: 14 }
          ],
          priceHistory: [
            { date: '2025-01', avgPrice: 250, minPrice: 180, maxPrice: 320 },
            { date: '2025-02', avgPrice: 245, minPrice: 175, maxPrice: 315 },
            { date: '2025-03', avgPrice: 260, minPrice: 190, maxPrice: 330 },
            { date: '2025-04', avgPrice: 255, minPrice: 185, maxPrice: 325 },
            { date: '2025-05', avgPrice: 270, minPrice: 200, maxPrice: 340 },
            { date: '2025-06', avgPrice: 280, minPrice: 210, maxPrice: 350 }
          ],
          categoryDistribution: [
            { name: 'Cartuchos', value: 45 },
            { name: 'Impressoras', value: 30 },
            { name: 'Acessórios', value: 15 },
            { name: 'Outros', value: 10 }
          ],
          stockAvailability: [
            { status: 'Em Estoque', count: 75 },
            { status: 'Esgotado', count: 12 },
            { status: 'Pré-venda', count: 8 },
            { status: 'Descontinuado', count: 5 }
          ],
          sellerPerformance: [
            { name: 'HP Brasil', reputation: 4.8, sales: 1250, products: 45 },
            { name: 'Suprimentos Online', reputation: 4.5, sales: 870, products: 32 },
            { name: 'Distribuidora Tech', reputation: 4.2, sales: 650, products: 28 },
            { name: 'InfoShop', reputation: 4.6, sales: 920, products: 36 },
            { name: 'Mega Supplies', reputation: 4.0, sales: 580, products: 25 }
          ]
        };
        setAnalysisData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !analysisData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Análise de Dados
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Explore tendências, distribuições de preço e desempenho de vendedores em diferentes períodos.
        </Typography>

        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error} Mostrando dados de exemplo como fallback.
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="análise tabs">
            <Tab label="Visão Geral" />
            <Tab label="Preços" />
            <Tab label="Categorias" />
            <Tab label="Vendedores" />
          </Tabs>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={timeRange}
              label="Período"
              onChange={handleTimeRangeChange}
            >
              <MenuItem value="7d">Última Semana</MenuItem>
              <MenuItem value="30d">Último Mês</MenuItem>
              <MenuItem value="90d">Último Trimestre</MenuItem>
              <MenuItem value="180d">Último Semestre</MenuItem>
              <MenuItem value="365d">Último Ano</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Conteúdo baseado na tab selecionada */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
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
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Histórico de Preços */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Evolução de Preços</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analysisData.priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${value}`} />
                  <Legend />
                  <Line type="monotone" dataKey="avgPrice" stroke="#8884d8" name="Preço Médio" />
                  <Line type="monotone" dataKey="minPrice" stroke="#82ca9d" name="Preço Mínimo" />
                  <Line type="monotone" dataKey="maxPrice" stroke="#ff7300" name="Preço Máximo" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Disponibilidade de Estoque */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Disponibilidade de Estoque</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analysisData.stockAvailability}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    label={({status, percent}) => `${status} ${(percent * 100).toFixed(0)}%`}
                  >
                    {analysisData.stockAvailability.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [value, props.payload.status]} />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Desempenho de Vendedores */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Desempenho de Vendedores</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analysisData.sellerPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="sales" fill="#8884d8" name="Vendas" />
                  <Bar yAxisId="right" dataKey="products" fill="#82ca9d" name="Produtos" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          {/* Detalhes de Preços */}
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
                  <Area type="monotone" dataKey="minPrice" stackId="1" stroke="#8884d8" fill="#8884d8" name="Preço Mínimo" />
                  <Area type="monotone" dataKey="avgPrice" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Preço Médio" />
                  <Area type="monotone" dataKey="maxPrice" stackId="3" stroke="#ffc658" fill="#ffc658" name="Preço Máximo" />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          {/* Detalhes de Categorias */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Análise por Categoria</Typography>
              {/* Conteúdo específico para análise de categorias */}
              <Typography variant="body1" color="text.secondary">
                Conteúdo detalhado da análise por categoria será implementado em breve.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 3 && (
        <Grid container spacing={3}>
          {/* Detalhes de Vendedores */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Análise de Vendedores</Typography>
              {/* Conteúdo específico para análise de vendedores */}
              <Typography variant="body1" color="text.secondary">
                Conteúdo detalhado da análise de vendedores será implementado em breve.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default DataAnalysisDashboard;
