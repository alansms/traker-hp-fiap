import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  LinearProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  NetworkCheck as NetworkCheckIcon
} from '@mui/icons-material';
import scrapingControlService from '../../services/scrapingControlService';

const ScrapingControl = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [interval, setInterval] = useState(6); // 6 horas por padrão
  const [productsLimit, setProductsLimit] = useState(20); // Limite de produtos por execução
  const [lastRun, setLastRun] = useState(null);
  const [nextRun, setNextRun] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, running, success, error
  const [message, setMessage] = useState('');
  const [scrapingHistory, setScrapingHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const pollerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [routeStatus, setRouteStatus] = useState(null);
  const [scrapingEnabled, setScrapingEnabled] = useState(true);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Carregar status
      try {
        const statusData = await scrapingControlService.getStatus();
        setIsRunning(Boolean(statusData.is_running) && statusData.status === 'running');
        setLastRun(statusData.last_run);
        setNextRun(statusData.next_run);
        setStatus(statusData.status);
        setMessage(statusData.message || '');
        setProgress(typeof statusData.progress === 'number' ? statusData.progress : 0);
      } catch (e) {
        console.error('Erro ao obter status do scraping:', e);
        setMessage(`Erro ao carregar status do scraping: ${e.message || e}`);
      }

      // Carregar configuração
      try {
        const configData = await scrapingControlService.getConfig();
        if (configData && typeof configData.interval_hours === 'number') {
          setInterval(configData.interval_hours);
        }
        if (configData && typeof configData.products_limit === 'number') {
          setProductsLimit(configData.products_limit);
        if (configData && typeof configData.is_active !== "undefined") {
          setScrapingEnabled(configData.is_active);
        }
        }
      } catch (e) {
        console.error('Erro ao obter configuração do scraping:', e);
        setMessage(prev => prev || `Erro ao carregar configuração do scraping: ${e.message || e}`);
      }

      // Carregar histórico
      try {
        const historyData = await scrapingControlService.getHistory();
        console.log('Dados do histórico recebidos:', historyData);
        
        // Se não há dados, usar dados simulados
        if (!historyData || historyData.length === 0) {
          const mockHistory = [
          {
            id: 1,
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 horas atrás
            status: 'success',
            products_found: 45,
            suspicious_found: 2,
            duration: '2m 15s'
          },
          {
            id: 2,
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 horas atrás
            status: 'success',
            products_found: 48,
            suspicious_found: 3,
            duration: '2m 30s'
          },
          {
            id: 3,
            timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 horas atrás
            status: 'success',
            products_found: 51,
            suspicious_found: 4,
            duration: '2m 45s'
          }
          ];
          setScrapingHistory(mockHistory);
        } else {
          setScrapingHistory(historyData);
        }
      } catch (e) {
        console.error('Erro ao obter histórico do scraping:', e);
        setMessage(prev => prev || `Erro ao carregar histórico do scraping: ${e.message || e}`);
      }
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      setMessage('Erro ao carregar dados do scraping');
    }
  };

  const handleStartScraping = async () => {
    setLoading(true);
    setMessage('Iniciando scraping...');

    try {
      const response = await scrapingControlService.startScraping();
      
      setStatus('running');
      setMessage(response.message);
      setIsRunning(true);

      // Inicia polling até finalizar
      const startedAt = Date.now();
      if (pollerRef.current) clearInterval(pollerRef.current);
      pollerRef.current = setInterval(async () => {
        try {
          const statusData = await scrapingControlService.getStatus();
          const running = Boolean(statusData.is_running) && statusData.status === 'running';
          setIsRunning(running);
          setStatus(statusData.status);
          setMessage(statusData.message);
          setLastRun(statusData.last_run);
          setNextRun(statusData.next_run);
          setProgress(typeof statusData.progress === 'number' ? statusData.progress : 0);

          // Considere finalizado também por progresso 100% ou status "success"
          const finished = !running || statusData.status === 'success' || (typeof statusData.progress === 'number' && statusData.progress >= 100);
          const timedOut = Date.now() - startedAt > 120000; // 2 minutos

          if (finished || timedOut) {
            if (pollerRef.current) {
              clearInterval(pollerRef.current);
              pollerRef.current = null;
            }
            // Recarrega histórico ao finalizar
            try {
              const historyData = await scrapingControlService.getHistory();
              setScrapingHistory(historyData);
            } catch (e) {
              console.error('Erro ao recarregar histórico:', e);
            }
            if (timedOut) {
              setStatus('error');
              setIsRunning(false);
              setMessage('Tempo limite atingido ao aguardar o término do scraping.');
              setProgress(0);
            }
          }
        } catch (error) {
          console.error('Erro no polling de status:', error);
        }
      }, 2000);
      
      // Salvaguarda: uma checagem final após 7s para garantir sincronismo
      setTimeout(async () => {
        try {
          const statusData = await scrapingControlService.getStatus();
          const running = Boolean(statusData.is_running) && statusData.status === 'running';
          setIsRunning(running);
          setStatus(statusData.status);
          setMessage(statusData.message || '');
          setLastRun(statusData.last_run);
          setNextRun(statusData.next_run);
          setProgress(typeof statusData.progress === 'number' ? statusData.progress : 0);

          if (!running || statusData.status === 'success' || (typeof statusData.progress === 'number' && statusData.progress >= 100)) {
            if (pollerRef.current) {
              clearInterval(pollerRef.current);
              pollerRef.current = null;
            }
            try {
              const historyData = await scrapingControlService.getHistory();
              setScrapingHistory(historyData);
            } catch {}
          }
        } catch {}
      }, 7000);

    } catch (error) {
      setStatus('error');
      setMessage('Erro ao iniciar scraping: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStopScraping = async () => {
    try {
      const response = await scrapingControlService.stopScraping();
      setIsRunning(false);
      setStatus('idle');
      setMessage(response.message);
      if (pollerRef.current) {
        clearInterval(pollerRef.current);
        pollerRef.current = null;
      }
      // Atualiza histórico e status final
      const [statusData, historyData] = await Promise.all([
        scrapingControlService.getStatus(),
        scrapingControlService.getHistory()
      ]);
      setLastRun(statusData.last_run);
      setNextRun(statusData.next_run);
      setScrapingHistory(historyData);
    } catch (error) {
      setMessage('Erro ao parar scraping: ' + error.message);
    }
  };


  const handleToggleScrapingEnabled = async (enabled) => {
    try {
      setLoading(true);
      await scrapingControlService.updateConfig({ is_active: enabled });
      setScrapingEnabled(enabled);
      setMessage(enabled ? "Scraping automático ativado!" : "Scraping automático desativado!");
      await loadInitialData();
    } catch (error) {
      console.error("Erro ao atualizar configuração:", error);
      setMessage("Erro ao atualizar configuração");
    } finally {
      setLoading(false);
    }
  };
  // Cleanup do polling ao desmontar
  useEffect(() => {
    return () => {
      if (pollerRef.current) clearInterval(pollerRef.current);
    };
  }, []);

  const handleIntervalChange = async (event) => {
    const newInterval = event.target.value;
    setInterval(newInterval);
    
    try {
      await scrapingControlService.updateConfig({
        interval_hours: newInterval,
        is_active: true,
        products_limit: productsLimit
      });
      setMessage('Configuração atualizada com sucesso!');
    } catch (error) {
      setMessage('Erro ao atualizar configuração: ' + error.message);
    }
  };

  const handleProductsLimitChange = async (event) => {
    const newLimit = event.target.value;
    setProductsLimit(newLimit);
    
    try {
      await scrapingControlService.updateConfig({
        interval_hours: interval,
        is_active: true,
        products_limit: newLimit
      });
      setMessage('Limite de produtos atualizado com sucesso!');
    } catch (error) {
      setMessage('Erro ao atualizar limite de produtos: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'running': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckIcon />;
      case 'error': return <ErrorIcon />;
      case 'running': return <CircularProgress size={20} />;
      default: return <ScheduleIcon />;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // Remover a função calculateNextRun pois agora vem da API

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon />
        Controle de Scraping
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure e gerencie o scraping automático de produtos no Mercado Livre
      </Typography>

      <Grid container spacing={3}>
        {/* Controles Principais */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="Execução de Scraping"
              subheader="Execute scraping manualmente ou configure execução automática"
            />
            <CardContent>
              <Grid container spacing={3}>

                {/* Alerta quando scraping está desativado */}
                {!scrapingEnabled && (
                  <Grid item xs={12}>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <strong>Scraping Automático Desativado!</strong> Para iniciar o scraping, ative o switch "Scraping Automático" acima.
                    </Alert>
                  </Grid>
                )}
                {/* Botões de Controle */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={isRunning ? <CircularProgress size={20} /> : <PlayIcon />}
                      onClick={handleStartScraping}
                      disabled={isRunning || loading || !scrapingEnabled}
                      size="large"
                    >
                      {isRunning ? 'Executando...' : 'Iniciar Scraping'}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<StopIcon />}
                      onClick={handleStopScraping}
                      disabled={!isRunning}
                      size="large"
                    >
                      Parar
                    </Button>
                  </Box>
                </Grid>


                {/* Toggle Scraping Automático */}
                <Grid item xs={12}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, bgcolor: "background.default", borderRadius: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={scrapingEnabled}
                          onChange={(e) => handleToggleScrapingEnabled(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {scrapingEnabled ? "Scraping Automático Ativo" : "Scraping Automático Desativado"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {scrapingEnabled 
                              ? "O scraping será executado automaticamente no intervalo configurado" 
                              : "O scraping automático está pausado. Apenas execuções manuais serão permitidas."}
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                </Grid>
                {/* Configuração de Intervalo */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Intervalo de Execução</InputLabel>
                    <Select
                      value={interval}
                      onChange={handleIntervalChange}
                      label="Intervalo de Execução"
                    >
                      <MenuItem value={3}>A cada 3 horas</MenuItem>
                      <MenuItem value={6}>A cada 6 horas</MenuItem>
                      <MenuItem value={12}>A cada 12 horas</MenuItem>
                      <MenuItem value={24}>A cada 24 horas</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Configuração de Limite de Produtos */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Produtos por Execução</InputLabel>
                    <Select
                      value={productsLimit}
                      onChange={handleProductsLimitChange}
                      label="Produtos por Execução"
                    >
                      <MenuItem value={5}>5 produtos (~15s)</MenuItem>
                      <MenuItem value={10}>10 produtos (~30s)</MenuItem>
                      <MenuItem value={20}>20 produtos (~1min)</MenuItem>
                      <MenuItem value={30}>30 produtos (~1.5min)</MenuItem>
                      <MenuItem value={50}>50 produtos (~2.5min)</MenuItem>
                      <MenuItem value={68}>Todos os produtos (~3.4min)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Status Atual */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Status:
                    </Typography>
                    <Chip
                      icon={getStatusIcon(status)}
                      label={status === 'idle' ? 'Aguardando' : status === 'running' ? 'Executando' : status === 'success' ? 'Sucesso' : 'Erro'}
                      color={getStatusColor(status)}
                      size="small"
                    />
                  </Box>
                  {isRunning && (
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress variant="determinate" value={progress} />
                      <Typography variant="caption" color="text.secondary">{progress}%</Typography>
                    </Box>
                  )}
                </Grid>

                {/* Informações de Execução */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {lastRun && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Última execução:</strong> {formatDateTime(lastRun)}
                      </Typography>
                    )}
                    {nextRun && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Próxima execução:</strong> {formatDateTime(nextRun)}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      <strong>Configuração atual:</strong> {productsLimit} produtos por execução
                    </Typography>
                  </Box>
                </Grid>

                {/* Mensagem de Status */}
                {message && (
                  <Grid item xs={12}>
                    <Alert 
                      severity={status === 'error' ? 'error' : status === 'success' ? 'success' : 'info'}
                      onClose={() => setMessage('')}
                    >
                      {message}
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        
        {/* Status de Rotas IPv4/IPv6 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader 
              title="Status de Rotas"
              subheader="Monitoramento IPv4/IPv6"
              avatar={<NetworkCheckIcon color="primary" />}
            />
            <CardContent>
              {routeStatus ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {/* Rota Atual */}
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Rota Atual:</strong>
                    </Typography>
                    <Chip 
                      label={routeStatus.current_route?.toUpperCase() || "IPv6"}
                      color="primary"
                      sx={{ fontWeight: "bold" }}
                    />
                  </Box>

                  {/* Status IPv4 */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" sx={{ minWidth: 80 }}>
                      <strong>IPv4:</strong>
                    </Typography>
                    {routeStatus.ipv4_status === "blocked" ? (
                      <>
                        <Chip label="BLOQUEADO" color="error" size="small" />
                        <Typography variant="caption" color="error">
                          ({routeStatus.ipv4_blocks || 0} bloqueios)
                        </Typography>
                      </>
                    ) : (
                      <Chip label="ATIVO" color="success" size="small" />
                    )}
                  </Box>

                  {/* Status IPv6 */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" sx={{ minWidth: 80 }}>
                      <strong>IPv6:</strong>
                    </Typography>
                    {routeStatus.ipv6_status === "blocked" ? (
                      <>
                        <Chip label="BLOQUEADO" color="error" size="small" />
                        <Typography variant="caption" color="error">
                          ({routeStatus.ipv6_blocks || 0} bloqueios)
                        </Typography>
                      </>
                    ) : (
                      <Chip label="ATIVO" color="success" size="small" />
                    )}
                  </Box>

                  <Divider />

                  {/* Próxima Troca */}
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Próxima troca em:</strong> {routeStatus.next_switch_in || 3} requisições
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({routeStatus.requests_count || 0} requisições na rota atual)
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Carregando status das rotas...
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

{/* Histórico de Execuções */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader 
              title="Histórico de Execuções"
              subheader="Últimas execuções de scraping"
              action={
                <Tooltip title="Atualizar histórico">
                  <IconButton size="small" onClick={loadInitialData}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent>
              <List dense>
                {scrapingHistory.map((entry) => (
                  <ListItem key={entry.id} divider>
                    <ListItemIcon>
                      {getStatusIcon(entry.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {formatDateTime(entry.timestamp)}
                          </Typography>
                          <Chip
                            label={entry.status === 'success' ? 'Sucesso' : 'Erro'}
                            color={entry.status === 'success' ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            Produtos encontrados: {entry.products_found || entry.productsFound}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Suspeitos detectados: {entry.suspicious_found || entry.suspiciousFound}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Duração: {entry.duration}
                          </Typography>
                          {entry.error && (
                            <Typography variant="caption" color="error" display="block">
                              Erro: {entry.error}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ScrapingControl;
