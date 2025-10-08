import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  DataUsage as DataUsageIcon,
  Refresh as RefreshIcon,
  ClearAll as ClearAllIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import settingsService from '../../services/settingsService';

const DataCleanup = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [lastCleanup, setLastCleanup] = useState(() => localStorage.getItem('last_cleanup_at'));
  const [stats, setStats] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [operation, setOperation] = useState(null);
  const [dbStats, setDbStats] = useState(null);

  // Verificar se o usuário tem permissões
  const isAuthorized = user && user.role === 'admin';

  useEffect(() => {
    if (isAuthorized) {
      loadStats();
    }
  }, [isAuthorized]);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/cleanup/data-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
      
      // Carregar estatísticas detalhadas do banco
      const dbData = await settingsService.getDatabaseStats();
      setDbStats(dbData);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleClearScrapingData = () => {
    setConfirmDialog({
      title: 'Limpar Dados de Scraping',
      message: 'Tem certeza que deseja limpar todos os dados de scraping? Esta ação irá:',
      details: [
        'Remover todos os produtos suspeitos encontrados',
        'Resetar timestamps de última busca dos produtos',
        'Manter os produtos cadastrados intactos'
      ],
      action: 'clear-scraping',
      severity: 'warning'
    });
  };

  const handleClearAllData = () => {
    setConfirmDialog({
      title: 'Limpar TODOS os Dados',
      message: '⚠️ ATENÇÃO: Esta ação irá remover TODOS os dados do sistema!',
      details: [
        'Remover TODOS os produtos cadastrados',
        'Remover TODOS os produtos suspeitos',
        'Resetar todas as sequências do banco',
        'Esta ação NÃO pode ser desfeita!'
      ],
      action: 'clear-all',
      severity: 'error'
    });
  };

  const handleResetTimestamps = () => {
    setConfirmDialog({
      title: 'Resetar Timestamps de Busca',
      message: 'Deseja resetar os timestamps de última busca dos produtos?',
      details: [
        'Resetar timestamps de última busca',
        'Permitir nova análise de todos os produtos',
        'Manter todos os dados existentes'
      ],
      action: 'reset-timestamps',
      severity: 'info'
    });
  };

  const executeOperation = async (action) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let endpoint = '';
      let operationName = '';

      switch (action) {
        case 'clear-scraping':
          endpoint = '/api/cleanup/clear-scraping-data';
          operationName = 'Limpeza de dados de scraping';
          break;
        case 'clear-all':
          endpoint = '/api/cleanup/clear-all-data';
          operationName = 'Limpeza completa do sistema';
          break;
        case 'reset-timestamps':
          endpoint = '/api/cleanup/reset-product-search-timestamps';
          operationName = 'Reset de timestamps';
          break;
        default:
          throw new Error('Operação inválida');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const now = new Date();
        const hh = now.getHours().toString().padStart(2, '0');
        const mm = now.getMinutes().toString().padStart(2, '0');
        const when = `${hh}:${mm}`;
        setSuccess(`${operationName} concluída! Registros removidos: ${result.records_deleted ?? '-'} • ${when}`);
        localStorage.setItem('last_cleanup_at', now.toISOString());
        setLastCleanup(now.toISOString());
        loadStats(); // Recarregar estatísticas
      } else {
        const error = await response.json();
        setError(error.detail || `Erro ao executar ${operationName}`);
      }
    } catch (error) {
      setError(`Erro ao executar operação: ${error.message}`);
    } finally {
      setLoading(false);
      setConfirmDialog(null);
    }
  };

  const handleConfirm = () => {
    if (confirmDialog) {
      executeOperation(confirmDialog.action);
    }
  };

  if (!isAuthorized) {
    return (
      <Alert severity="error">
        Apenas administradores podem acessar as funções de limpeza de dados.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Limpeza de Dados do Sistema
      </Typography>

      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {lastCleanup && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Última limpeza: {new Date(lastCleanup).toLocaleString()}
        </Alert>
      )}

      {/* Estatísticas Atuais */}
      {stats && (
        <Card sx={{ mb: 3 }}>
          <CardHeader
            avatar={<DataUsageIcon color="primary" />}
            title="Estatísticas Atuais do Sistema"
            action={
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadStats}
                disabled={loading}
              >
                Atualizar
              </Button>
            }
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {stats.total_products}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de Produtos
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {stats.active_products}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Produtos Ativos
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="warning.main">
                    {stats.total_suspicious}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Produtos Suspeitos
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="error.main">
                    {stats.unverified_suspicious}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Não Verificados
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}


      {/* Estatísticas Detalhadas do Banco de Dados */}
      {dbStats && (
        <Card sx={{ mb: 3, border: 2, borderColor: "primary.main" }}>
          <CardHeader
            avatar={<InfoIcon color="info" />}
            title="Dados Armazenados no Banco (Todas as Tabelas)"
            subheader="Visão completa de onde os dados estão armazenados"
          />
          <CardContent>
            <Grid container spacing={3}>
              {/* Produtos */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={2} sx={{ p: 2, textAlign: "center", bgcolor: "primary.light", color: "white" }}>
                  <Typography variant="h3" fontWeight="bold">
                    {dbStats.products.total}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    Produtos
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                    {dbStats.products.description}
                  </Typography>
                  <Chip label={`${dbStats.products.active} ativos`} size="small" sx={{ mt: 1, bgcolor: "success.main", color: "white" }} />
                </Paper>
              </Grid>

              {/* Produtos Suspeitos */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={2} sx={{ p: 2, textAlign: "center", bgcolor: dbStats.suspicious_products.total > 0 ? "warning.light" : "grey.300" }}>
                  <Typography variant="h3" fontWeight="bold">
                    {dbStats.suspicious_products.total}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    Produtos Suspeitos
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                    {dbStats.suspicious_products.description}
                  </Typography>
                </Paper>
              </Grid>

              {/* System Logs */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={2} sx={{ p: 2, textAlign: "center", bgcolor: "info.light", color: "white" }}>
                  <Typography variant="h3" fontWeight="bold">
                    {dbStats.system_logs.total}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    System Logs
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                    {dbStats.system_logs.description}
                  </Typography>
                </Paper>
              </Grid>

              {/* Usuários */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={2} sx={{ p: 2, textAlign: "center", bgcolor: "secondary.light", color: "white" }}>
                  <Typography variant="h3" fontWeight="bold">
                    {dbStats.users.total}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    Usuários
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                    {dbStats.users.description}
                  </Typography>
                  <Chip label={`${dbStats.products.active} ativos`} size="small" sx={{ mt: 1, bgcolor: "success.main", color: "white" }} />
                </Paper>
              </Grid>

              {/* Vendedores Confiáveis */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={2} sx={{ p: 2, textAlign: "center", bgcolor: "grey.300" }}>
                  <Typography variant="h3" fontWeight="bold">
                    {dbStats.trusted_sellers.total}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    Vendedores Confiáveis
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                    {dbStats.trusted_sellers.description}
                  </Typography>
                </Paper>
              </Grid>

              {/* Configurações */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={2} sx={{ p: 2, textAlign: "center", bgcolor: "grey.300" }}>
                  <Typography variant="h3" fontWeight="bold">
                    {dbStats.system_settings.total + dbStats.suspicious_thresholds.total}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    Configurações
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                    Settings + Thresholds
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
      {/* Operações de Limpeza */}
      <Grid container spacing={3}>
        {/* Limpeza de Dados de Scraping */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<DeleteIcon color="warning" />}
              title="Limpar Dados de Scraping"
              subheader="Remove produtos suspeitos e reseta timestamps"
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary" paragraph>
                Esta operação irá limpar todos os dados relacionados ao scraping, mantendo os produtos cadastrados.
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Remove produtos suspeitos" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Reseta timestamps de busca" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Mantém produtos cadastrados" />
                </ListItem>
              </List>
              <Button
                variant="contained"
                color="warning"
                startIcon={<DeleteIcon />}
                onClick={handleClearScrapingData}
                disabled={loading}
                fullWidth
                sx={{ mt: 2 }}
              >
                Limpar Dados de Scraping
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Reset de Timestamps */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<RefreshIcon color="info" />}
              title="Resetar Timestamps"
              subheader="Permite nova análise de todos os produtos"
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary" paragraph>
                Reseta apenas os timestamps de última busca, permitindo que todos os produtos sejam analisados novamente.
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon color="info" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Reseta timestamps de busca" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon color="info" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Mantém todos os dados" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon color="info" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Permite nova análise" />
                </ListItem>
              </List>
              <Button
                variant="contained"
                color="info"
                startIcon={<RefreshIcon />}
                onClick={handleResetTimestamps}
                disabled={loading}
                fullWidth
                sx={{ mt: 2 }}
              >
                Resetar Timestamps
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Limpeza Completa */}
        <Grid item xs={12}>
          <Card sx={{ border: '2px solid', borderColor: 'error.main' }}>
            <CardHeader
              avatar={<ClearAllIcon color="error" />}
              title="Limpeza Completa do Sistema"
              subheader="⚠️ REMOVE TODOS OS DADOS - USE COM CUIDADO!"
              titleTypographyProps={{ color: 'error.main', fontWeight: 'bold' }}
            />
            <CardContent>
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  ⚠️ ATENÇÃO: Esta operação é IRREVERSÍVEL!
                </Typography>
                <Typography variant="body2">
                  Todos os produtos cadastrados, produtos suspeitos e dados relacionados serão permanentemente removidos.
                </Typography>
              </Alert>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="error" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Remove TODOS os produtos cadastrados" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="error" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Remove TODOS os produtos suspeitos" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="error" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Reseta sequências do banco de dados" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="error" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Esta ação NÃO pode ser desfeita!" />
                </ListItem>
              </List>
              <Button
                variant="contained"
                color="error"
                startIcon={<ClearAllIcon />}
                onClick={handleClearAllData}
                disabled={loading}
                fullWidth
                sx={{ mt: 2 }}
              >
                LIMPAR TUDO (PERIGOSO!)
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Loading */}
      {loading && (
        <Box sx={{ mt: 3 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
            Executando operação...
          </Typography>
        </Box>
      )}

      {/* Dialog de Confirmação */}
      <Dialog
        open={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {confirmDialog?.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog?.message}
          </DialogContentText>
          {confirmDialog?.details && (
            <List dense sx={{ mt: 2 }}>
              {confirmDialog.details.map((detail, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {confirmDialog.severity === 'error' ? (
                      <WarningIcon color="error" fontSize="small" />
                    ) : confirmDialog.severity === 'warning' ? (
                      <WarningIcon color="warning" fontSize="small" />
                    ) : (
                      <InfoIcon color="info" fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText primary={detail} />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            color={confirmDialog?.severity === 'error' ? 'error' : confirmDialog?.severity === 'warning' ? 'warning' : 'primary'}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataCleanup;
