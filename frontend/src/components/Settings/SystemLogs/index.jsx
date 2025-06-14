import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Button,
  Tooltip,
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FileDownload as FileDownloadIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { logService } from '../../../services/logs';

// Função para obter a cor baseada no nível do log
const getLevelColor = (level) => {
  switch (level) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'success';
    default:
      return 'default';
  }
};

// Função para obter o label do nível em português
const getLevelLabel = (level) => {
  switch (level) {
    case 'critical':
      return 'Crítico';
    case 'high':
      return 'Alto';
    case 'medium':
      return 'Médio';
    case 'low':
      return 'Baixo';
    default:
      return level;
  }
};

// Função para obter o label da categoria em português
const getCategoryLabel = (category) => {
  switch (category) {
    case 'security':
      return 'Segurança';
    case 'user':
      return 'Usuário';
    case 'product':
      return 'Produto';
    case 'search':
      return 'Busca';
    case 'system':
      return 'Sistema';
    case 'other':
      return 'Outro';
    default:
      return category;
  }
};

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    level: '',
    category: '',
    searchTerm: ''
  });
  const [openFilters, setOpenFilters] = useState(false);
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    log: null
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        skip: page * rowsPerPage,
        limit: rowsPerPage,
        search_term: filters.searchTerm || undefined
      };

      if (filters.startDate) {
        params.start_date = filters.startDate.toISOString();
      }

      if (filters.endDate) {
        params.end_date = filters.endDate.toISOString();
      }

      if (filters.level) {
        params.level = filters.level;
      }

      if (filters.category) {
        params.category = filters.category;
      }

      const response = await logService.getLogs(params);
      setLogs(response.items);
      setTotalLogs(response.total);
      setTotalPages(response.pages);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, rowsPerPage, filters]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value
    }));
    setPage(0);
  };

  const handleFilterToggle = () => {
    setOpenFilters(!openFilters);
  };

  const clearFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      level: '',
      category: '',
      searchTerm: ''
    });
    setPage(0);
  };

  const handleExportLogs = async () => {
    try {
      const params = { ...filters };
      if (params.startDate) {
        params.start_date = params.startDate.toISOString();
        delete params.startDate;
      }
      if (params.endDate) {
        params.end_date = params.endDate.toISOString();
        delete params.endDate;
      }
      if (params.searchTerm) {
        params.search_term = params.searchTerm;
        delete params.searchTerm;
      }

      await logService.exportLogs(params);
    } catch (error) {
      console.error('Erro ao exportar logs:', error);
    }
  };

  const handleOpenDetailDialog = (log) => {
    setDetailDialog({
      open: true,
      log
    });
  };

  const handleCloseDetailDialog = () => {
    setDetailDialog({
      open: false,
      log: null
    });
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom>
          Logs do Sistema
        </Typography>
        <Box>
          <Tooltip title="Exportar logs para CSV">
            <IconButton
              color="primary"
              onClick={handleExportLogs}
              disabled={loading}
            >
              <FileDownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Atualizar logs">
            <IconButton
              color="primary"
              onClick={() => fetchLogs()}
              disabled={loading}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Filtros avançados">
            <IconButton
              color={openFilters ? 'primary' : 'default'}
              onClick={handleFilterToggle}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Filtros */}
      {openFilters && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Data inicial"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : null)}
                fullWidth
                size="small"
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Data final"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value) : null)}
                fullWidth
                size="small"
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Nível</InputLabel>
                <Select
                  value={filters.level}
                  label="Nível"
                  onChange={(e) => handleFilterChange('level', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="critical">Crítico</MenuItem>
                  <MenuItem value="high">Alto</MenuItem>
                  <MenuItem value="medium">Médio</MenuItem>
                  <MenuItem value="low">Baixo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={filters.category}
                  label="Categoria"
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="security">Segurança</MenuItem>
                  <MenuItem value="user">Usuário</MenuItem>
                  <MenuItem value="product">Produto</MenuItem>
                  <MenuItem value="search">Busca</MenuItem>
                  <MenuItem value="system">Sistema</MenuItem>
                  <MenuItem value="other">Outro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={clearFilters}
                  size="small"
                >
                  Limpar
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => fetchLogs()}
                  size="small"
                >
                  Aplicar
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Buscar nos logs"
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      size="small"
                      onClick={() => fetchLogs()}
                    >
                      <SearchIcon />
                    </IconButton>
                  )
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    fetchLogs();
                  }
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Tabela de logs */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data/Hora</TableCell>
              <TableCell>Nível</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Ação</TableCell>
              <TableCell>Usuário</TableCell>
              <TableCell>Detalhes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Nenhum log encontrado
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                  <TableCell>
                    <Chip
                      label={getLevelLabel(log.level)}
                      size="small"
                      color={getLevelColor(log.level)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getCategoryLabel(log.category)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.user_email || '-'}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDetailDialog(log)}
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalLogs}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Itens por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </TableContainer>

      {/* Diálogo de detalhes do log */}
      <Dialog open={detailDialog.open} onClose={handleCloseDetailDialog} maxWidth="md" fullWidth>
        <DialogTitle>Detalhes do Log</DialogTitle>
        <DialogContent dividers>
          {detailDialog.log && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary">
                      ID do Log
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {detailDialog.log.id}
                    </Typography>

                    <Typography variant="subtitle2" color="textSecondary">
                      Data e Hora
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatDateTime(detailDialog.log.timestamp)}
                    </Typography>

                    <Typography variant="subtitle2" color="textSecondary">
                      Nível
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <Chip
                        label={getLevelLabel(detailDialog.log.level)}
                        size="small"
                        color={getLevelColor(detailDialog.log.level)}
                      />
                    </Typography>

                    <Typography variant="subtitle2" color="textSecondary">
                      Categoria
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <Chip
                        label={getCategoryLabel(detailDialog.log.category)}
                        size="small"
                        variant="outlined"
                      />
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary">
                      Usuário
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {detailDialog.log.user_email || '-'}
                    </Typography>

                    <Typography variant="subtitle2" color="textSecondary">
                      ID do Usuário
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {detailDialog.log.user_id || '-'}
                    </Typography>

                    <Typography variant="subtitle2" color="textSecondary">
                      Endereço IP
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {detailDialog.log.ip_address || '-'}
                    </Typography>

                    <Typography variant="subtitle2" color="textSecondary">
                      Ação
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {detailDialog.log.action}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary">
                      Descrição
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {detailDialog.log.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemLogs;
