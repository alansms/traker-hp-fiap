import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
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
  Grid,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalLogs, setTotalLogs] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    level: '',
    category: '',
    userId: '',
    searchTerm: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/logs/?skip=${page * rowsPerPage}&limit=${rowsPerPage}`;

      // Adicionar filtros à URL se estiverem definidos
      if (filters.startDate) url += `&start_date=${filters.startDate}`;
      if (filters.endDate) url += `&end_date=${filters.endDate}`;
      if (filters.level) url += `&level=${filters.level}`;
      if (filters.category) url += `&category=${filters.category}`;
      if (filters.userId) url += `&user_id=${filters.userId}`;
      if (filters.searchTerm) url += `&search_term=${filters.searchTerm}`;

      const response = await axios.get(url);
      setLogs(response.data.items);
      setTotalLogs(response.data.total);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      setError('Não foi possível carregar os logs do sistema. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = () => {
    setPage(0); // Reset para a primeira página ao aplicar filtros
    fetchLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      level: '',
      category: '',
      userId: '',
      searchTerm: ''
    });
    setPage(0);
    fetchLogs();
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'info';
      default:
        return 'default';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'SECURITY':
        return 'error';
      case 'SYSTEM':
        return 'primary';
      case 'USER':
        return 'success';
      case 'API':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <IconButton
            color={showFilters ? "primary" : "default"}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ mr: 1 }}
          >
            <FilterIcon />
          </IconButton>
          <IconButton
            color="primary"
            onClick={() => fetchLogs()}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {showFilters && (
        <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Filtros</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6} lg={3}>
              <TextField
                label="Data Inicial"
                type="datetime-local"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                fullWidth
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <TextField
                label="Data Final"
                type="datetime-local"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                fullWidth
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6} lg={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="level-select-label">Nível</InputLabel>
                <Select
                  labelId="level-select-label"
                  id="level-select"
                  name="level"
                  value={filters.level}
                  label="Nível"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="HIGH">Alto</MenuItem>
                  <MenuItem value="MEDIUM">Médio</MenuItem>
                  <MenuItem value="LOW">Baixo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6} lg={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="category-select-label">Categoria</InputLabel>
                <Select
                  labelId="category-select-label"
                  id="category-select"
                  name="category"
                  value={filters.category}
                  label="Categoria"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="SECURITY">Segurança</MenuItem>
                  <MenuItem value="SYSTEM">Sistema</MenuItem>
                  <MenuItem value="USER">Usuário</MenuItem>
                  <MenuItem value="API">API</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6} lg={2}>
              <TextField
                fullWidth
                size="small"
                label="ID do Usuário"
                name="userId"
                value={filters.userId}
                onChange={handleFilterChange}
                variant="outlined"
                type="number"
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <TextField
                fullWidth
                size="small"
                label="Termo de Busca"
                name="searchTerm"
                value={filters.searchTerm}
                onChange={handleFilterChange}
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={12} lg={8} display="flex" justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                startIcon={<CloseIcon />}
                sx={{ mr: 1 }}
              >
                Limpar
              </Button>
              <Button
                variant="contained"
                onClick={handleApplyFilters}
                startIcon={<FilterIcon />}
              >
                Aplicar Filtros
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Paper elevation={3}>
        {loading && (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box p={2}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Box>
        )}

        {!loading && !error && (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Nível</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell>Ação</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell>Usuário</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.id}</TableCell>
                      <TableCell>{formatDate(log.timestamp)}</TableCell>
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
                        />
                      </TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>{log.description}</TableCell>
                      <TableCell>{log.ip_address}</TableCell>
                      <TableCell>{log.user_email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalLogs}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default SystemLogs;
