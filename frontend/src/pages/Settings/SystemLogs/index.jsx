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
  TablePagination,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filters, setFilters] = useState({
    level: 'all',
    category: 'all',
    search: ''
  });

  // Dados mockados para demonstração
  const mockLogs = [
    {
      id: 1,
      timestamp: '2025-01-05T10:30:00Z',
      level: 'ERROR',
      category: 'AUTH',
      message: 'Falha na autenticação do usuário alan@smstecnologia.com.br',
      user_id: 1,
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    {
      id: 2,
      timestamp: '2025-01-05T10:25:00Z',
      level: 'INFO',
      category: 'PRODUCT',
      message: 'Produto "Cartucho HP 664XL" cadastrado com sucesso',
      user_id: 1,
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    {
      id: 3,
      timestamp: '2025-01-05T10:20:00Z',
      level: 'WARNING',
      category: 'SCRAPING',
      message: 'Timeout na busca de produtos no Mercado Livre',
      user_id: null,
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    {
      id: 4,
      timestamp: '2025-01-05T10:15:00Z',
      level: 'INFO',
      category: 'USER',
      message: 'Usuário aprovado: maria@empresa.com',
      user_id: 1,
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    {
      id: 5,
      timestamp: '2025-01-05T10:10:00Z',
      level: 'ERROR',
      category: 'API',
      message: 'Falha na conexão com Elasticsearch',
      user_id: null,
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  ];

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simular carregamento com dados mockados atualizados
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dados mockados atualizados com os valores corretos do enum
      const updatedMockLogs = [
        {
          id: 1,
          timestamp: '2025-01-05T10:30:00Z',
          level: 'HIGH',
          category: 'SECURITY',
          action: 'login_attempt',
          description: 'Tentativa de login falhada para usuário admin@hp.com',
          user_id: 1,
          ip_address: '192.168.1.100'
        },
        {
          id: 2,
          timestamp: '2025-01-05T10:25:00Z',
          level: 'MEDIUM',
          category: 'PRODUCT',
          action: 'product_created',
          description: 'Produto "Cartucho HP 664XL" cadastrado com sucesso',
          user_id: 1,
          ip_address: '192.168.1.100'
        },
        {
          id: 3,
          timestamp: '2025-01-05T10:20:00Z',
          level: 'HIGH',
          category: 'SYSTEM',
          action: 'scraping_error',
          description: 'Erro no scraping: Timeout na conexão com Mercado Livre',
          user_id: null,
          ip_address: '192.168.1.100'
        },
        {
          id: 4,
          timestamp: '2025-01-05T10:15:00Z',
          level: 'LOW',
          category: 'USER',
          action: 'user_approved',
          description: 'Usuário maria@empresa.com aprovado pelo administrador',
          user_id: 1,
          ip_address: '192.168.1.100'
        },
        {
          id: 5,
          timestamp: '2025-01-05T10:10:00Z',
          level: 'HIGH',
          category: 'SYSTEM',
          action: 'database_error',
          description: 'Erro na conexão com o banco de dados PostgreSQL',
          user_id: null,
          ip_address: '192.168.1.100'
        }
      ];
      
      setLogs(updatedMockLogs);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      setError('Erro ao carregar logs do sistema');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      level: 'all',
      category: 'all',
      search: ''
    });
    setPage(0);
  };

  const handleExportCSV = () => {
    try {
      // Criar CSV dos logs filtrados
      const csvHeaders = ['ID', 'Timestamp', 'Level', 'Category', 'Action', 'Description', 'User ID', 'IP Address'];
      const csvRows = [csvHeaders.join(',')];
      
      filteredLogs.forEach(log => {
        const row = [
          log.id,
          log.timestamp,
          log.level,
          log.category,
          log.action || '',
          `"${(log.description || '').replace(/"/g, '""')}"`, // Escapar aspas
          log.user_id || '',
          log.ip_address || ''
        ];
        csvRows.push(row.join(','));
      });
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `logs_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao exportar logs:', error);
      setError('Erro ao exportar logs em CSV');
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'info';
      case 'CRITICAL':
        return 'error';
      default:
        return 'default';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'SECURITY':
        return 'primary';
      case 'PRODUCT':
        return 'success';
      case 'USER':
        return 'secondary';
      case 'SYSTEM':
        return 'warning';
      case 'SEARCH':
        return 'info';
      case 'OTHER':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filters.level === 'all' || log.level === filters.level;
    const matchesCategory = filters.category === 'all' || log.category === filters.category;
    const matchesSearch = !filters.search || 
      (log.description && log.description.toLowerCase().includes(filters.search.toLowerCase())) ||
      (log.action && log.action.toLowerCase().includes(filters.search.toLowerCase())) ||
      (log.ip_address && log.ip_address.includes(filters.search));
    
    return matchesLevel && matchesCategory && matchesSearch;
  });

  const paginatedLogs = filteredLogs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Logs do Sistema
      </Typography>

      {/* Banner informativo */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          bgcolor: 'info.light',
          color: 'info.contrastText',
          borderLeft: '6px solid',
          borderColor: 'info.main',
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          Logs do Sistema
        </Typography>
        <Typography variant="body1">
          Monitore todas as atividades do sistema, erros, avisos e informações importantes.
          Use os filtros para encontrar logs específicos.
        </Typography>
      </Paper>

      {/* Filtros */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtros
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Nível</InputLabel>
              <Select
                value={filters.level}
                label="Nível"
                onChange={(e) => handleFilterChange('level', e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="CRITICAL">Crítico</MenuItem>
                <MenuItem value="HIGH">Alto</MenuItem>
                <MenuItem value="MEDIUM">Médio</MenuItem>
                <MenuItem value="LOW">Baixo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Categoria</InputLabel>
              <Select
                value={filters.category}
                label="Categoria"
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value="SECURITY">Segurança</MenuItem>
                <MenuItem value="PRODUCT">Produtos</MenuItem>
                <MenuItem value="USER">Usuários</MenuItem>
                <MenuItem value="SYSTEM">Sistema</MenuItem>
                <MenuItem value="SEARCH">Busca</MenuItem>
                <MenuItem value="OTHER">Outros</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Buscar"
              placeholder="Digite para buscar..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
            >
              Limpar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Estatísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total de Logs
              </Typography>
              <Typography variant="h4">
                {filteredLogs.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Erros
              </Typography>
              <Typography variant="h4" color="error">
                {filteredLogs.filter(log => log.level === 'HIGH' || log.level === 'CRITICAL').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avisos
              </Typography>
              <Typography variant="h4" color="warning.main">
                {filteredLogs.filter(log => log.level === 'MEDIUM').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Informações
              </Typography>
              <Typography variant="h4" color="info.main">
                {filteredLogs.filter(log => log.level === 'LOW').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Ações */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Logs ({filteredLogs.length} registros)
        </Typography>
        <Box>
          <Tooltip title="Atualizar">
            <IconButton onClick={fetchLogs} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Exportar CSV">
            <IconButton onClick={handleExportCSV}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Nível</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Mensagem</TableCell>
                  <TableCell>Usuário</TableCell>
                  <TableCell>IP</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {formatTimestamp(log.timestamp)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.level}
                        color={getLevelColor(log.level)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.category}
                        color={getCategoryColor(log.category)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 300 }}>
                        {log.description || log.action}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.user_id ? `ID: ${log.user_id}` : 'Sistema'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {log.ip_address}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredLogs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Logs por página:"
          />
        </Paper>
      )}
    </Box>
  );
};

export default SystemLogs;
