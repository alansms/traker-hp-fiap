import React, { useState, useEffect } from "react";
import api from "../../../services/api";
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
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from "@mui/icons-material";

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filters, setFilters] = useState({
    level: "all",
    category: "all",
    search: ""
  });

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("skip", page * rowsPerPage);
      params.append("limit", rowsPerPage);
      if (filters.level && filters.level !== "all") params.append("level", filters.level);
      if (filters.category && filters.category !== "all") params.append("category", filters.category);
      if (filters.search) params.append("search_term", filters.search);

      const response = await api.get(`/api/logs/?${params.toString()}`);
      setLogs(response.data.items || []);
      setTotalLogs(response.data.total || 0);
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
      setError("Erro ao carregar logs do sistema. Verifique sua conexão.");
      setLogs([]);
      setTotalLogs(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, rowsPerPage, filters.level, filters.category]);

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
      level: "all",
      category: "all",
      search: ""
    });
    setPage(0);
  };

  const getLevelColor = (level) => {
    switch (level?.toUpperCase()) {
      case "HIGH":
      case "ERROR":
        return "error";
      case "MEDIUM":
      case "WARNING":
        return "warning";
      case "LOW":
      case "INFO":
        return "info";
      default:
        return "default";
    }
  };

  const getCategoryColor = (category) => {
    switch (category?.toUpperCase()) {
      case "SECURITY":
      case "AUTH":
        return "error";
      case "PRODUCT":
        return "primary";
      case "SYSTEM":
      case "API":
        return "secondary";
      case "USER":
        return "info";
      case "SCRAPING":
        return "warning";
      default:
        return "default";
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      return new Date(timestamp).toLocaleString("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h5" component="h2">
              Logs do Sistema
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Atualizar">
                <IconButton onClick={fetchLogs} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Nível</InputLabel>
                <Select
                  value={filters.level}
                  label="Nível"
                  onChange={(e) => handleFilterChange("level", e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="HIGH">Alto</MenuItem>
                  <MenuItem value="MEDIUM">Médio</MenuItem>
                  <MenuItem value="LOW">Baixo</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={filters.category}
                  label="Categoria"
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                >
                  <MenuItem value="all">Todas</MenuItem>
                  <MenuItem value="SECURITY">Segurança</MenuItem>
                  <MenuItem value="PRODUCT">Produto</MenuItem>
                  <MenuItem value="SYSTEM">Sistema</MenuItem>
                  <MenuItem value="USER">Usuário</MenuItem>
                  <MenuItem value="SCRAPING">Scraping</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Buscar"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: "action.active" }} />,
                  endAdornment: filters.search && (
                    <IconButton size="small" onClick={() => handleFilterChange("search", "")}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  )
                }}
              />
            </Grid>
          </Grid>

          {(filters.level !== "all" || filters.category !== "all" || filters.search) && (
            <Box sx={{ mb: 2 }}>
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
              >
                Limpar Filtros
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : logs.length === 0 ? (
        <Alert severity="info">
          Nenhum log encontrado. {filters.level !== "all" || filters.category !== "all" || filters.search ? "Tente ajustar os filtros." : ""}
        </Alert>
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
                {logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {formatTimestamp(log.timestamp)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.level || "N/A"}
                        color={getLevelColor(log.level)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.category || "N/A"}
                        color={getCategoryColor(log.category)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.description || log.message || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {log.user_id ? `ID: ${log.user_id}` : "Sistema"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {log.ip_address || "N/A"}
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
            count={totalLogs}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Registros por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`}
          />
        </Paper>
      )}
    </Box>
  );
};

export default SystemLogs;
