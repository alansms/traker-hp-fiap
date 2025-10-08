import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Chip,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Badge,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  CircularProgress,
  Fab,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Notifications as BellIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  Security as SecurityIcon,
  TrendingDown as TrendingDownIcon,
  Store as StoreIcon,
  Star as StarIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import AlertSettingsModal from '../../components/Alerts/AlertSettingsModal';

const API_URL = process.env.REACT_APP_API_URL || '';

const Alerts = () => {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all',
    timeframe: '7days',
    onlyUnread: false,
    productName: '',
    sellerName: ''
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  // Contadores de estatísticas
  const [criticalAlerts, setCriticalAlerts] = useState(0);
  const [highRiskAlerts, setHighRiskAlerts] = useState(0);
  const [possibleCounterfeit, setPossibleCounterfeit] = useState(0);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  // Seleção e watchlist
  const [selectedIds, setSelectedIds] = useState([]);
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('alerts_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [openReport, setOpenReport] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Verificar autenticação
    if (!user) {
      navigate('/auth/login');
      return;
    }
    
    // Carregar alertas + estatísticas (usando dados mockados)
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        
        // Sempre usar dados mockados por enquanto
        console.log('🔄 Usando dados mockados para alertas');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAlerts();
  }, [user, navigate]);
  
  // Aplicar filtros
  useEffect(() => {
    let filtered = [...alerts];
    
    if (filters.type !== 'all') {
      filtered = filtered.filter(alert => alert.type === filters.type);
    }

    if (filters.onlyUnread) {
      filtered = filtered.filter(alert => !alert.read);
    }
    
    if (filters.productName) {
      filtered = filtered.filter(alert => 
        alert.product.name.toLowerCase().includes(filters.productName.toLowerCase())
      );
    }
    
    if (filters.sellerName) {
      filtered = filtered.filter(alert => 
        alert.seller.toLowerCase().includes(filters.sellerName.toLowerCase())
      );
    }
    
    setFilteredAlerts(filtered);
  }, [alerts, filters]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const addSelectedToWatchlist = () => {
    const source = selectedIds.length ? alerts.filter(a => selectedIds.includes(a.id)) : filteredAlerts;
    const items = source.map(a => ({
      id: a.id,
      productId: a.product?.id,
      productName: a.product?.name,
      pn: a.product?.pn,
      seller: a.seller,
      riskLevel: a.riskLevel,
      currentPrice: a.currentPrice,
      referencePrice: a.product?.referencePrice,
      percentChange: a.percentChange,
      productUrl: a.productUrl,
      createdAt: a.createdAt
    }));
    const merged = [...watchlist];
    items.forEach(it => { if (!merged.find(m => m.id === it.id)) merged.push(it); });
    setWatchlist(merged);
    localStorage.setItem('alerts_watchlist', JSON.stringify(merged));
    setSelectedIds([]);
  };

  const exportCsv = () => {
    const data = selectedIds.length ? alerts.filter(a => selectedIds.includes(a.id)) : filteredAlerts;
    const headers = ['ID','Produto','PN','Vendedor','Nivel','PrecoAtual','PrecoRef','VariacaoPercent','URL','CriadoEm'];
    const rows = data.map(a => [
      a.id,
      a.product?.name || '',
      a.product?.pn || '',
      a.seller || '',
      a.riskLevel || '',
      a.currentPrice ?? '',
      a.product?.referencePrice ?? '',
      a.percentChange ?? '',
      a.productUrl || '',
      a.createdAt || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alertas_suspeitos_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPdf = () => window.print();

  const handleMarkAsRead = async (alertId) => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/alerts/${alertId}/mark-read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Atualizar estado local
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, read: true } : alert
        ));
        setFilteredAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
        // Atualizar contador de não lidos
        setUnreadAlerts(prev => Math.max(0, prev - 1));
      } else {
        console.error('Erro ao marcar alerta como lido:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao marcar alerta como lido:', error);
    }
  };
  
  const handleDeleteAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // Função para filtrar por tipo de alerta
  const handleFilterByType = (type) => {
    let filtered = [];
    switch (type) {
      case 'critical':
        filtered = alerts.filter(alert => alert.riskLevel === 'CRÍTICO');
        break;
      case 'high':
        filtered = alerts.filter(alert => alert.riskLevel === 'ALTO');
        break;
      case 'medium':
        filtered = alerts.filter(alert => alert.riskLevel === 'MÉDIO');
        break;
      case 'unread':
        filtered = alerts.filter(alert => !alert.read);
        break;
      default:
        filtered = alerts;
    }
    setFilteredAlerts(filtered);
  };

  // Função para limpar filtros e mostrar todos os alertas
  const clearFilters = () => {
    setFilteredAlerts(alerts);
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
  };

  // Estatísticas dos alertas vêm da API e são mantidas em estado

  const getAlertIcon = (type) => {
    switch (type) {
      case 'fake_product':
        return <ErrorIcon color="error" />;
      case 'price_drop':
        return <TrendingDownIcon color="warning" />;
      case 'unauthorized_seller':
        return <SecurityIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'CRÍTICO':
        return 'error';
      case 'ALTO':
        return 'warning';
      case 'MÉDIO':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
  };

  return (
    <Box sx={{ py: 3 }}>
      <Container maxWidth="xl">
        {/* Cabeçalho da Página */}
        <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              🚨 Detecção de Falsificação
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sistema inteligente de alertas para produtos suspeitos
            </Typography>
          </Box>

          {/* Botões de Ação */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={async () => {
                try {
                  setLoading(true);
                  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
                  // Atualiza estatísticas e lista
                  const [statsRes, listRes] = await Promise.all([
                    fetch(`${API_URL}/api/alerts/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URL}/api/alerts`, { headers: { 'Authorization': `Bearer ${token}` } })
                  ]);
                  if (statsRes.ok) {
                    const s = await statsRes.json();
                    const st = s.stats || {};
                    setCriticalAlerts(st.critical || 0);
                    setHighRiskAlerts(st.highRisk || 0);
                    setPossibleCounterfeit(st.possibleCounterfeit || 0);
                    setUnreadAlerts(st.unread || 0);
                  }
                  if (listRes.ok) {
                    const d = await listRes.json();
                    const normalizeRisk = (value) => {
                      if (!value) return 'MÉDIO';
                      switch (value.toUpperCase()) {
                        case 'CRITICAL': return 'CRÍTICO';
                        case 'HIGH': return 'ALTO';
                        case 'MEDIUM': return 'MÉDIO';
                        default: return value;
                      }
                    };
                    const normalized = (d.alerts || []).map(a => ({
                      ...a,
                      riskLevel: normalizeRisk(a.riskLevel || a.suspicion_level),
                      product: {
                        ...(a.product || {}),
                        referencePrice: a.product?.referencePrice ?? a.referencePrice ?? a.product?.reference_price ?? 0
                      },
                      currentPrice: a.currentPrice ?? a.price ?? 0,
                      percentChange: typeof a.percentChange === 'number' ? a.percentChange : (a.price_difference_percentage ?? 0),
                      createdAt: a.createdAt || a.timestamp || new Date().toISOString(),
                      read: a.read ?? a.isVerified ?? false
                    }));
                    setAlerts(normalized);
                    setFilteredAlerts(normalized);
                  }
                } finally {
                  setLoading(false);
                }
              }}
            >
              Atualizar
            </Button>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setShowSettingsModal(true)}
            >
              Configurações
            </Button>
          <Button variant="contained" color="primary" onClick={() => setOpenReport(true)}>
            Relatório
          </Button>
            <Button variant="outlined" onClick={addSelectedToWatchlist} disabled={filteredAlerts.length === 0}>
              {selectedIds.length > 0 ? `Adicionar ${selectedIds.length} à Lista de Verificação` : 'Adicionar filtrados à Lista de Verificação'}
            </Button>
            <Button variant="outlined" onClick={exportCsv} disabled={filteredAlerts.length === 0}>
              Exportar CSV
            </Button>
            <Button variant="outlined" onClick={printPdf} disabled={filteredAlerts.length === 0}>
              Exportar PDF
            </Button>
          </Box>
        </Box>

        {/* Estatísticas dos Alertas */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                bgcolor: 'error.light', 
                color: 'error.contrastText',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                }
              }}
              onClick={() => handleFilterByType('critical')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'error.main' }}>
                    <ErrorIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {criticalAlerts}
                    </Typography>
                    <Typography variant="body2">
                      Críticos
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                bgcolor: 'warning.light', 
                color: 'warning.contrastText',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                }
              }}
              onClick={() => handleFilterByType('high')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <WarningIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {highRiskAlerts}
                    </Typography>
                    <Typography variant="body2">
                      Alto Risco
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                bgcolor: 'info.light', 
                color: 'info.contrastText',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                }
              }}
              onClick={() => handleFilterByType('medium')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <SecurityIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {possibleCounterfeit}
                    </Typography>
                    <Typography variant="body2">
                      Possível Falsificação
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                bgcolor: 'primary.light', 
                color: 'primary.contrastText',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                }
              }}
              onClick={() => handleFilterByType('unread')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <BellIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {unreadAlerts}
                    </Typography>
                    <Typography variant="body2">
                      Não Lidos
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Botão Limpar Filtros */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="outlined" 
            onClick={clearFilters}
            startIcon={<ClearIcon />}
            sx={{ 
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.light',
                color: 'primary.dark'
              }
            }}
          >
            Limpar Filtros
          </Button>
        </Box>

        {/* Alertas */}
            {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredAlerts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhum alerta de falsificação detectado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              O sistema está monitorando continuamente por produtos suspeitos
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredAlerts.map((alert) => (
              <Grid item xs={12} md={6} lg={4} key={alert.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    border: alert.riskLevel === 'CRÍTICO' ? '2px solid' : '1px solid',
                    borderColor: alert.riskLevel === 'CRÍTICO' ? 'error.main' : 'divider',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.3s ease'
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Checkbox size="small" checked={selectedIds.includes(alert.id)} onChange={() => toggleSelect(alert.id)} />
                      {getAlertIcon(alert.type)}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" fontWeight="bold">
                          {alert.product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          PN: {alert.product.pn}
                        </Typography>
                      </Box>
                      <Chip
                        label={alert.riskLevel}
                        color={getRiskColor(alert.riskLevel)}
                        size="small"
                        variant="filled"
                      />
                      {/* Badge de anúncio removido */}
                      {!alert.productUrl && (
                        <Chip label="Sem URL" color="default" size="small" sx={{ ml: 1 }} />
                      )}
                    </Box>

                    <Alert severity={alert.riskLevel === 'CRÍTICO' ? 'error' : 'warning'} sx={{ mb: 2 }}>
                      {alert.description}
                    </Alert>

                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <AttachMoneyIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Preço Atual"
                          secondary={`R$ ${alert.currentPrice.toFixed(2)}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <AttachMoneyIcon color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Preço de Referência"
                          secondary={`R$ ${alert.product.referencePrice.toFixed(2)}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <TrendingDownIcon color="error" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Variação"
                          secondary={`${alert.percentChange}%`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <StoreIcon color="info" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Vendedor"
                          secondary={alert.seller}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <StarIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Avaliação"
                          secondary={`${alert.sellerRating}/5.0`}
                        />
                      </ListItem>
                    </List>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(alert.createdAt)}
                      </Typography>
                      {!alert.read && (
                        <Chip
                          label="Novo"
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
                          if (alert.productUrl) {
                            // Validar no backend se a URL ainda está ativa
                            const res = await fetch(`${API_URL}/api/alerts/${alert.id}/validate-url`, { headers: { 'Authorization': `Bearer ${token}` }});
                            if (res.ok) {
                              const d = await res.json();
                              if (d.available && d.url) {
                                window.open(d.url, '_blank', 'noopener');
                              } else {
                                const msg = d.status_ml ? `Anúncio ${d.status_ml}` : (d.status ? `Status ${d.status}` : 'Indisponível');
                                alert(`${msg}. Abrirei a pesquisa por nome + PN.`);
                                window.open(`https://www.mercadolivre.com.br/jm/search?as_word=${encodeURIComponent((alert.product?.name||'') + ' ' + (alert.product?.pn||''))}`, '_blank', 'noopener');
                              }
                            } else {
                              window.open(alert.productUrl, '_blank', 'noopener');
                            }
                          } else {
                            // Sem URL salva → abrir busca específica
                            window.open(`https://www.mercadolivre.com.br/jm/search?as_word=${encodeURIComponent((alert.product?.name||'') + ' ' + (alert.product?.pn||''))}`, '_blank', 'noopener');
                          }
                        } catch (e) {
                          console.error('Erro ao validar URL do anúncio', e);
                          window.open(alert.productUrl || `https://www.mercadolivre.com.br/jm/search?as_word=${encodeURIComponent((alert.product?.name||'') + ' ' + (alert.product?.pn||''))}`, '_blank', 'noopener');
                        }
                      }}
                    >
                      Ver anúncio
                    </Button>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => handleMarkAsRead(alert.id)}
                    >
                      {alert.read ? 'Marcar como não lido' : 'Marcar como lido'}
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDeleteAlert(alert.id)}
                    >
                      Excluir
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {showSettingsModal && (
        <AlertSettingsModal 
          onClose={() => setShowSettingsModal(false)}
          onSave={(values) => {
            console.log('Configurações de alertas salvas:', values);
            setShowSettingsModal(false);
          }}
        />
      )}

      <Dialog open={openReport} onClose={() => setOpenReport(false)} maxWidth="md" fullWidth>
        <DialogTitle>Relatório de Produtos Suspeitos</DialogTitle>
        <DialogContent>
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight="bold">Resumo</Typography>
                <Typography variant="body2" color="text.secondary">
                  Período: últimos 30 dias • Total: {filteredAlerts.length}
                </Typography>
              </Box>
              <Box>
                <Chip label={`Críticos: ${criticalAlerts}`} color="error" sx={{ mr: 1 }} />
                <Chip label={`Alto Risco: ${highRiskAlerts}`} color="warning" sx={{ mr: 1 }} />
                <Chip label={`Possível Falsificação: ${possibleCounterfeit}`} color="info" sx={{ mr: 1 }} />
                <Chip label={`Não Lidos: ${unreadAlerts}`} color="primary" />
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {(selectedIds.length ? alerts.filter(a => selectedIds.includes(a.id)) : filteredAlerts).map((a) => (
                <Grid item xs={12} key={a.id}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">{a.product?.name}</Typography>
                      <Typography variant="caption" color="text.secondary">PN: {a.product?.pn} • {a.riskLevel}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                      <Typography variant="body2">Preço Atual: R$ {a.currentPrice?.toFixed(2)}</Typography>
                      <Typography variant="body2">Ref.: R$ {a.product?.referencePrice?.toFixed(2)}</Typography>
                      <Typography variant="body2">Variação: {a.percentChange}%</Typography>
                      <Button size="small" href={a.productUrl || `https://www.mercadolivre.com.br/jm/search?as_word=${encodeURIComponent((a.product?.name||'') + ' ' + (a.product?.pn||''))}`} target="_blank">Abrir</Button>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReport(false)}>Fechar</Button>
          <Button variant="outlined" onClick={exportCsv}>Exportar CSV</Button>
          <Button variant="contained" onClick={printPdf}>Imprimir/Salvar PDF</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Alerts;