import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Warning as WarningIcon,
  GetApp as GetAppIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import sentimentAnalysisService from '../../services/sentimentAnalysisService';

// Cores para os gráficos de sentimento
const SENTIMENT_COLORS = {
  positivo: '#4CAF50',
  neutro: '#FFC107',
  negativo: '#F44336'
};

// Componente TabPanel para exibir conteúdo das abas
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`sentiment-tabpanel-${index}`}
      aria-labelledby={`sentiment-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SentimentAnalysis = () => {
  // Estados para armazenar dados
  const [riskReport, setRiskReport] = useState(null);
  const [commentAnalysis, setCommentAnalysis] = useState(null);
  const [loading, setLoading] = useState({
    riskReport: false,
    commentAnalysis: false
  });
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [periodDays, setPeriodDays] = useState(30);
  const [threshold, setThreshold] = useState(3.0);
  const [sellerDetailsOpen, setSellerDetailsOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);

  // Função para carregar o relatório de risco
  const loadRiskReport = async () => {
    setLoading(prev => ({ ...prev, riskReport: true }));
    setError(null);

    try {
      const response = await sentimentAnalysisService.generateRiskReport(periodDays, threshold);
      setRiskReport(response.data);
    } catch (err) {
      console.error('Erro ao carregar relatório de risco:', err);
      setError('Falha ao carregar o relatório de risco. Por favor, tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, riskReport: false }));
    }
  };

  // Função para carregar a análise de comentários
  const loadCommentAnalysis = async () => {
    setLoading(prev => ({ ...prev, commentAnalysis: true }));
    setError(null);

    try {
      const response = await sentimentAnalysisService.analyzeComments(periodDays);
      setCommentAnalysis(response.data);
    } catch (err) {
      console.error('Erro ao carregar análise de comentários:', err);
      setError('Falha ao carregar a análise de comentários. Por favor, tente novamente.');
    } finally {
      setLoading(prev => ({ ...prev, commentAnalysis: false }));
    }
  };

  // Exportar relatório de risco
  const handleExportRiskReport = (format) => {
    if (!riskReport) return;

    try {
      if (format === 'json') {
        sentimentAnalysisService.exportRiskReport(riskReport);
      } else if (format === 'csv') {
        sentimentAnalysisService.exportRiskReportCSV(riskReport);
      }
    } catch (err) {
      console.error('Erro ao exportar relatório:', err);
      setError('Falha ao exportar o relatório. Por favor, tente novamente.');
    }
  };

  // Abrir detalhes do vendedor
  const handleOpenSellerDetails = (seller) => {
    setSelectedSeller(seller);
    setSellerDetailsOpen(true);
  };

  // Fechar detalhes do vendedor
  const handleCloseSellerDetails = () => {
    setSellerDetailsOpen(false);
  };

  // Carregar dados ao montar o componente ou quando os filtros mudarem
  useEffect(() => {
    loadRiskReport();
    loadCommentAnalysis();
  }, [periodDays, threshold]);

  // Prepara dados para o gráfico de distribuição de sentimentos
  const prepareSentimentDistributionData = () => {
    if (!commentAnalysis || !commentAnalysis.statistics) return [];

    const { sentiment_distribution } = commentAnalysis.statistics;

    return [
      { name: 'Positivo', value: sentiment_distribution.positivo, color: SENTIMENT_COLORS.positivo },
      { name: 'Neutro', value: sentiment_distribution.neutro, color: SENTIMENT_COLORS.neutro },
      { name: 'Negativo', value: sentiment_distribution.negativo, color: SENTIMENT_COLORS.negativo }
    ];
  };

  // Formatador para porcentagens
  const formatPercentage = (value) => `${value.toFixed(1)}%`;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Análise de Sentimento e Detecção de Vendedores Suspeitos
      </Typography>

      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
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
            <FormControl fullWidth>
              <InputLabel>Limiar para Suspeitos</InputLabel>
              <Select
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                label="Limiar para Suspeitos"
              >
                <MenuItem value={2.0}>Muito Baixo (2.0)</MenuItem>
                <MenuItem value={2.5}>Baixo (2.5)</MenuItem>
                <MenuItem value={3.0}>Médio (3.0)</MenuItem>
                <MenuItem value={3.5}>Alto (3.5)</MenuItem>
                <MenuItem value={4.0}>Muito Alto (4.0)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<RefreshIcon />}
              onClick={() => {
                loadRiskReport();
                loadCommentAnalysis();
              }}
              disabled={loading.riskReport || loading.commentAnalysis}
            >
              {(loading.riskReport || loading.commentAnalysis) ? 'Carregando...' : 'Atualizar Dados'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} aria-label="sentiment analysis tabs">
          <Tab label="Relatório de Risco" />
          <Tab label="Análise de Comentários" />
        </Tabs>
      </Box>

      {/* Tab: Relatório de Risco */}
      <TabPanel value={selectedTab} index={0}>
        {loading.riskReport ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="300px">
            <CircularProgress />
          </Box>
        ) : riskReport ? (
          <>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Vendedores Suspeitos ({riskReport.statistics?.total_suspicious_sellers || 0})
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<GetAppIcon />}
                  onClick={() => handleExportRiskReport('json')}
                  sx={{ mr: 1 }}
                >
                  Exportar JSON
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<GetAppIcon />}
                  onClick={() => handleExportRiskReport('csv')}
                >
                  Exportar CSV
                </Button>
              </Box>
            </Box>

            {riskReport.statistics?.total_suspicious_sellers > 0 ? (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Vendedor</TableCell>
                      <TableCell align="center">Avaliação</TableCell>
                      <TableCell align="center">Score Final</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Confiança</TableCell>
                      <TableCell align="center">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {riskReport.suspicious_sellers.map((seller) => (
                      <TableRow key={seller.seller_id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {seller.seller_name || 'Vendedor ' + seller.seller_id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {seller.seller_id}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {seller.rating.toFixed(1)}
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={seller.reputation?.score < threshold ? 'error.main' : 'success.main'}
                          >
                            {seller.reputation?.score.toFixed(1) || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={seller.reputation?.classification || 'DESCONHECIDO'}
                            color={seller.reputation?.classification === 'SUSPEITO' ? 'error' : 'success'}
                            size="small"
                            icon={seller.reputation?.classification === 'SUSPEITO' ? <WarningIcon /> : null}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {(seller.reputation?.confidence * 100).toFixed(0)}%
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenSellerDetails(seller)}
                            title="Ver detalhes"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                Nenhum vendedor suspeito encontrado com o limiar atual.
              </Alert>
            )}

            <Box mt={4}>
              <Typography variant="h6" gutterBottom>
                Estatísticas do Relatório
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Total de Vendedores Suspeitos
                      </Typography>
                      <Typography variant="h4" component="div">
                        {riskReport.statistics?.total_suspicious_sellers || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Avaliação Média
                      </Typography>
                      <Typography variant="h4" component="div">
                        {riskReport.statistics?.average_rating.toFixed(1) || 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Limiar Utilizado
                      </Typography>
                      <Typography variant="h4" component="div">
                        {riskReport.statistics?.threshold_used || threshold}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </>
        ) : (
          <Alert severity="info">
            Nenhum dado disponível. Tente atualizar os dados.
          </Alert>
        )}
      </TabPanel>

      {/* Tab: Análise de Comentários */}
      <TabPanel value={selectedTab} index={1}>
        {loading.commentAnalysis ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="300px">
            <CircularProgress />
          </Box>
        ) : commentAnalysis ? (
          <>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Distribuição de Sentimentos
                </Typography>
                <Paper sx={{ p: 2, height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prepareSentimentDistributionData()}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        labelLine={true}
                        label={({name, percent}) => `${name}: ${formatPercentage(percent * 100)}`}
                      >
                        {prepareSentimentDistributionData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Quantidade']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Estatísticas de Comentários
                </Typography>
                <Paper sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body1">
                        Total de Comentários Analisados: <strong>{commentAnalysis.statistics?.total_comments || 0}</strong>
                      </Typography>
                    </Grid>

                    <Grid item xs={4}>
                      <Box textAlign="center" p={2} bgcolor={SENTIMENT_COLORS.positivo + '20'} borderRadius={1}>
                        <Typography variant="h6" color={SENTIMENT_COLORS.positivo}>
                          {commentAnalysis.statistics?.sentiment_percentages?.positivo || 0}%
                        </Typography>
                        <Typography variant="body2">
                          Positivos
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({commentAnalysis.statistics?.sentiment_distribution?.positivo || 0} comentários)
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={4}>
                      <Box textAlign="center" p={2} bgcolor={SENTIMENT_COLORS.neutro + '20'} borderRadius={1}>
                        <Typography variant="h6" color={SENTIMENT_COLORS.neutro}>
                          {commentAnalysis.statistics?.sentiment_percentages?.neutro || 0}%
                        </Typography>
                        <Typography variant="body2">
                          Neutros
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({commentAnalysis.statistics?.sentiment_distribution?.neutro || 0} comentários)
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={4}>
                      <Box textAlign="center" p={2} bgcolor={SENTIMENT_COLORS.negativo + '20'} borderRadius={1}>
                        <Typography variant="h6" color={SENTIMENT_COLORS.negativo}>
                          {commentAnalysis.statistics?.sentiment_percentages?.negativo || 0}%
                        </Typography>
                        <Typography variant="body2">
                          Negativos
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({commentAnalysis.statistics?.sentiment_distribution?.negativo || 0} comentários)
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Interpretação
                </Typography>
                <Paper sx={{ p: 2 }}>
                  <Alert severity={
                    commentAnalysis.statistics?.sentiment_percentages?.negativo > 30 ? 'error' :
                    commentAnalysis.statistics?.sentiment_percentages?.negativo > 15 ? 'warning' : 'success'
                  }>
                    {commentAnalysis.statistics?.sentiment_percentages?.negativo > 30 ?
                      'Alta taxa de comentários negativos detectada. Recomenda-se investigação detalhada dos vendedores e produtos.' :
                      commentAnalysis.statistics?.sentiment_percentages?.negativo > 15 ?
                      'Taxa moderada de comentários negativos. Atenção recomendada aos vendedores listados no relatório de risco.' :
                      'Taxa saudável de comentários. Maioria dos clientes reportando experiências positivas.'
                    }
                  </Alert>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Comentários Recentes
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Produto</TableCell>
                        <TableCell>Comentário</TableCell>
                        <TableCell align="center">Sentimento</TableCell>
                        <TableCell align="center">Score</TableCell>
                        <TableCell align="center">Data</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {commentAnalysis.comments.slice(0, 100).map((comment, index) => (
                        <TableRow key={index} hover>
                          <TableCell width="20%">
                            <Typography variant="body2" noWrap>
                              {comment.produto}
                            </Typography>
                          </TableCell>
                          <TableCell width="50%">
                            <Typography variant="body2">
                              {comment.comentario}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={comment.sentiment || 'Neutro'}
                              size="small"
                              sx={{
                                bgcolor: SENTIMENT_COLORS[comment.sentiment || 'neutro'] + '20',
                                color: SENTIMENT_COLORS[comment.sentiment || 'neutro'],
                                fontWeight: 'bold'
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            {comment.sentiment_score ? comment.sentiment_score.toFixed(2) : 'N/A'}
                          </TableCell>
                          <TableCell align="center">
                            {new Date(comment.data).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </>
        ) : (
          <Alert severity="info">
            Nenhum dado disponível. Tente atualizar os dados.
          </Alert>
        )}
      </TabPanel>

      {/* Dialog para detalhes do vendedor */}
      <Dialog
        open={sellerDetailsOpen}
        onClose={handleCloseSellerDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Detalhes do Vendedor: {selectedSeller?.seller_name || 'Vendedor ' + selectedSeller?.seller_id}
            </Typography>
            <IconButton onClick={handleCloseSellerDetails} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedSeller && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Informações do Vendedor
                    </Typography>
                    <Typography variant="body1">
                      <strong>ID:</strong> {selectedSeller.seller_id}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Nome:</strong> {selectedSeller.seller_name || 'Não disponível'}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Avaliação média:</strong> {selectedSeller.rating.toFixed(1)}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Número de avaliações:</strong> {selectedSeller.rating_count}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Score de reputação:</strong> {selectedSeller.reputation?.score.toFixed(1) || 'N/A'}
                    </Typography>
                    <Box mt={2}>
                      <Chip
                        label={selectedSeller.reputation?.classification || 'DESCONHECIDO'}
                        color={selectedSeller.reputation?.classification === 'SUSPEITO' ? 'error' : 'success'}
                        icon={selectedSeller.reputation?.classification === 'SUSPEITO' ? <WarningIcon /> : <InfoIcon />}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Produtos Vendidos
                    </Typography>
                    {selectedSeller.products && selectedSeller.products.length > 0 ? (
                      <ul>
                        {selectedSeller.products.map((product, index) => (
                          <li key={index}>
                            <Typography variant="body2">
                              {product}
                            </Typography>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Nenhum produto encontrado.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Comentários Negativos
                </Typography>
                {selectedSeller.top_negative_comments && selectedSeller.top_negative_comments.length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Comentário</TableCell>
                          <TableCell align="center">Sentimento</TableCell>
                          <TableCell align="center">Score</TableCell>
                          <TableCell align="center">Confiança</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedSeller.top_negative_comments.map((comment, index) => (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Typography variant="body2">
                                {comment.comment}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={comment.sentiment}
                                size="small"
                                sx={{
                                  bgcolor: SENTIMENT_COLORS[comment.sentiment] + '20',
                                  color: SENTIMENT_COLORS[comment.sentiment],
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              {comment.score.toFixed(2)}
                            </TableCell>
                            <TableCell align="center">
                              {(comment.confidence * 100).toFixed(0)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">
                    Nenhum comentário negativo encontrado.
                  </Alert>
                )}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Análise de Sentimento
                </Typography>
                {selectedSeller.sentiment_analysis && selectedSeller.sentiment_analysis.length > 0 ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Box textAlign="center" p={2} bgcolor={SENTIMENT_COLORS.positivo + '20'} borderRadius={1}>
                        <Typography variant="h6" color={SENTIMENT_COLORS.positivo}>
                          {((selectedSeller.sentiment_analysis.filter(s => s.sentiment === 'positivo').length / selectedSeller.sentiment_analysis.length) * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="body2">
                          Positivos
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box textAlign="center" p={2} bgcolor={SENTIMENT_COLORS.neutro + '20'} borderRadius={1}>
                        <Typography variant="h6" color={SENTIMENT_COLORS.neutro}>
                          {((selectedSeller.sentiment_analysis.filter(s => s.sentiment === 'neutro').length / selectedSeller.sentiment_analysis.length) * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="body2">
                          Neutros
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box textAlign="center" p={2} bgcolor={SENTIMENT_COLORS.negativo + '20'} borderRadius={1}>
                        <Typography variant="h6" color={SENTIMENT_COLORS.negativo}>
                          {((selectedSeller.sentiment_analysis.filter(s => s.sentiment === 'negativo').length / selectedSeller.sentiment_analysis.length) * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="body2">
                          Negativos
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                ) : (
                  <Alert severity="info">
                    Nenhuma análise de sentimento disponível.
                  </Alert>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSellerDetails}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SentimentAnalysis;
