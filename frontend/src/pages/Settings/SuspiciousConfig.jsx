import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Store as StoreIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

const SuspiciousConfig = () => {
  const { user } = useAuth();
  const [thresholds, setThresholds] = useState([]);
  const [trustedSellers, setTrustedSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Estados para modais
  const [thresholdDialog, setThresholdDialog] = useState(false);
  const [sellerDialog, setSellerDialog] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState(null);
  const [editingSeller, setEditingSeller] = useState(null);
  
  // Estados para formulários
  const [thresholdForm, setThresholdForm] = useState({
    name: '',
    threshold_percentage: 10,
    description: '',
    is_active: true
  });
  
  const [sellerForm, setSellerForm] = useState({
    name: '',
    store_name: '',
    seller_id: '',
    email: '',
    phone: '',
    address: '',
    rating: '',
    notes: '',
    is_active: true
  });

  // Verificar se o usuário tem permissões
  const isAuthorized = user && (user.role === 'admin' || user.role === 'manager');

  useEffect(() => {
    if (isAuthorized) {
      loadData();
    }
  }, [isAuthorized]);

  const loadData = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const [thresholdsRes, sellersRes] = await Promise.all([
        fetch(`${API_URL}/api/suspicious/thresholds`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}`
          }
        }),
        fetch(`${API_URL}/api/suspicious/trusted-sellers`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}`
          }
        })
      ]);

      if (thresholdsRes.ok) {
        const thresholdsData = await thresholdsRes.json();
        setThresholds(thresholdsData);
      }

      if (sellersRes.ok) {
        const sellersData = await sellersRes.json();
        setTrustedSellers(sellersData);
      }
    } catch (error) {
      setError('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveThreshold = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const url = editingThreshold 
        ? `${API_URL}/api/suspicious/thresholds/${editingThreshold.id}`
        : `${API_URL}/api/suspicious/thresholds`;
      
      const method = editingThreshold ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify(thresholdForm)
      });

      if (response.ok) {
        setSuccess('Configuração salva com sucesso!');
        setThresholdDialog(false);
        setEditingThreshold(null);
        setThresholdForm({
          name: '',
          threshold_percentage: 10,
          description: '',
          is_active: true
        });
        loadData();
      } else {
        const error = await response.json();
        setError(error.detail || 'Erro ao salvar configuração');
      }
    } catch (error) {
      setError('Erro ao salvar configuração');
    }
  };

  const handleSaveSeller = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const url = editingSeller 
        ? `${API_URL}/api/suspicious/trusted-sellers/${editingSeller.id}`
        : `${API_URL}/api/suspicious/trusted-sellers`;
      
      const method = editingSeller ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify(sellerForm)
      });

      if (response.ok) {
        setSuccess('Vendedor salvo com sucesso!');
        setSellerDialog(false);
        setEditingSeller(null);
        setSellerForm({
          name: '',
          store_name: '',
          seller_id: '',
          email: '',
          phone: '',
          address: '',
          rating: '',
          notes: '',
          is_active: true
        });
        loadData();
      } else {
        const error = await response.json();
        setError(error.detail || 'Erro ao salvar vendedor');
      }
    } catch (error) {
      setError('Erro ao salvar vendedor');
    }
  };

  const handleEditThreshold = (threshold) => {
    setEditingThreshold(threshold);
    setThresholdForm({
      name: threshold.name,
      threshold_percentage: threshold.threshold_percentage,
      description: threshold.description || '',
      is_active: threshold.is_active
    });
    setThresholdDialog(true);
  };

  const handleEditSeller = (seller) => {
    setEditingSeller(seller);
    setSellerForm({
      name: seller.name,
      store_name: seller.store_name || '',
      seller_id: seller.seller_id,
      email: seller.email || '',
      phone: seller.phone || '',
      address: seller.address || '',
      rating: seller.rating || '',
      notes: seller.notes || '',
      is_active: seller.is_active
    });
    setSellerDialog(true);
  };

  const handleDeleteThreshold = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta configuração?')) {
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_URL}/api/suspicious/thresholds/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          setSuccess('Configuração excluída com sucesso!');
          loadData();
        } else {
          setError('Erro ao excluir configuração');
        }
      } catch (error) {
        setError('Erro ao excluir configuração');
      }
    }
  };

  const handleDeleteSeller = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este vendedor?')) {
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_URL}/api/suspicious/trusted-sellers/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          setSuccess('Vendedor excluído com sucesso!');
          loadData();
        } else {
          setError('Erro ao excluir vendedor');
        }
      } catch (error) {
        setError('Erro ao excluir vendedor');
      }
    }
  };

  if (!isAuthorized) {
    return (
      <Alert severity="warning">
        Apenas administradores e gerentes podem acessar as configurações de suspeitos.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Configuração de Detecção de Suspeitos
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

      <Grid container spacing={3}>
        {/* Configurações de Margem */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<SecurityIcon color="primary" />}
              title="Margens de Suspeita"
              subheader="Configure as margens para detectar produtos suspeitos"
              action={
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setEditingThreshold(null);
                    setThresholdForm({
                      name: '',
                      threshold_percentage: 10,
                      description: '',
                      is_active: true
                    });
                    setThresholdDialog(true);
                  }}
                >
                  Nova Margem
                </Button>
              }
            />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell>Margem (%)</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {thresholds.map((threshold) => (
                      <TableRow key={threshold.id}>
                        <TableCell>{threshold.name}</TableCell>
                        <TableCell>{threshold.threshold_percentage}%</TableCell>
                        <TableCell>
                          <Chip
                            label={threshold.is_active ? 'Ativo' : 'Inativo'}
                            color={threshold.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEditThreshold(threshold)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteThreshold(threshold.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Vendedores de Confiança */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<StoreIcon color="primary" />}
              title="Vendedores de Confiança"
              subheader="Gerencie vendedores que não devem ser analisados"
              action={
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setEditingSeller(null);
                    setSellerForm({
                      name: '',
                      store_name: '',
                      seller_id: '',
                      email: '',
                      phone: '',
                      address: '',
                      rating: '',
                      notes: '',
                      is_active: true
                    });
                    setSellerDialog(true);
                  }}
                >
                  Novo Vendedor
                </Button>
              }
            />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell>Loja</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trustedSellers.map((seller) => (
                      <TableRow key={seller.id}>
                        <TableCell>{seller.name}</TableCell>
                        <TableCell>{seller.store_name || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={seller.is_active ? 'Ativo' : 'Inativo'}
                            color={seller.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEditSeller(seller)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteSeller(seller.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Modal para Configuração de Margem */}
      <Dialog open={thresholdDialog} onClose={() => setThresholdDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingThreshold ? 'Editar Margem' : 'Nova Margem de Suspeita'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nome da Configuração"
              value={thresholdForm.name}
              onChange={(e) => setThresholdForm({...thresholdForm, name: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Margem de Suspeita (%)"
              type="number"
              value={thresholdForm.threshold_percentage}
              onChange={(e) => setThresholdForm({...thresholdForm, threshold_percentage: parseFloat(e.target.value)})}
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Descrição"
              multiline
              rows={3}
              value={thresholdForm.description}
              onChange={(e) => setThresholdForm({...thresholdForm, description: e.target.value})}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={thresholdForm.is_active}
                onChange={(e) => setThresholdForm({...thresholdForm, is_active: e.target.value})}
              >
                <MenuItem value={true}>Ativo</MenuItem>
                <MenuItem value={false}>Inativo</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setThresholdDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveThreshold} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para Vendedor de Confiança */}
      <Dialog open={sellerDialog} onClose={() => setSellerDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSeller ? 'Editar Vendedor' : 'Novo Vendedor de Confiança'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nome do Vendedor"
                  value={sellerForm.name}
                  onChange={(e) => setSellerForm({...sellerForm, name: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nome da Loja"
                  value={sellerForm.store_name}
                  onChange={(e) => setSellerForm({...sellerForm, store_name: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ID do Vendedor (ML)"
                  value={sellerForm.seller_id}
                  onChange={(e) => setSellerForm({...sellerForm, seller_id: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={sellerForm.email}
                  onChange={(e) => setSellerForm({...sellerForm, email: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Telefone"
                  value={sellerForm.phone}
                  onChange={(e) => setSellerForm({...sellerForm, phone: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Avaliação"
                  value={sellerForm.rating}
                  onChange={(e) => setSellerForm({...sellerForm, rating: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Endereço"
                  value={sellerForm.address}
                  onChange={(e) => setSellerForm({...sellerForm, address: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observações"
                  multiline
                  rows={3}
                  value={sellerForm.notes}
                  onChange={(e) => setSellerForm({...sellerForm, notes: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={sellerForm.is_active}
                    onChange={(e) => setSellerForm({...sellerForm, is_active: e.target.value})}
                  >
                    <MenuItem value={true}>Ativo</MenuItem>
                    <MenuItem value={false}>Inativo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSellerDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveSeller} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SuspiciousConfig;
