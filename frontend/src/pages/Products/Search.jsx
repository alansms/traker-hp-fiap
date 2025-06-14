// Movido de /pages/Search/index.jsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  CircularProgress,
  Paper,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon, MonitorHeart } from '@mui/icons-material';
import scrapingService from '../../services/scrapingService';

const Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [snackbarState, setSnackbarState] = useState({ open: false, message: '', type: 'success' });

  // Monitoramento de preço
  const [monitorDialog, setMonitorDialog] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [email, setEmail] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setProducts([]);

    try {
      const results = await scrapingService.searchProducts(searchTerm);
      // Garantir que products seja sempre um array, mesmo quando a API retornar undefined
      setProducts(Array.isArray(results) ? results : []);
    } catch (error) {
      setSnackbarState({
        open: true,
        message: 'Erro ao buscar produtos: ' + (error.message || 'Falha na conexão'),
        type: 'error'
      });
      // Definir products como array vazio em caso de erro
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setProducts([]);
  };

  const handleAddProduct = (product) => {
    setSelectedProduct(product);
    setShowAddDialog(true);
  };

  const confirmAddProduct = async () => {
    try {
      // Implementar a lógica de adicionar produto aqui
      setSnackbarState({
        open: true,
        message: 'Produto adicionado com sucesso!',
        type: 'success'
      });
      setShowAddDialog(false);
    } catch (err) {
      setSnackbarState({
        open: true,
        message: 'Erro ao adicionar produto.',
        type: 'error'
      });
    }
  };

  const handleMonitorOpen = (product) => {
    setSelectedProduct(product);
    setMonitorDialog(true);
  };

  const handleMonitorClose = () => {
    setMonitorDialog(false);
    setTargetPrice('');
    setEmail('');
  };

  const handleStartMonitoring = async () => {
    if (!selectedProduct || !targetPrice || !email) return;

    try {
      await scrapingService.monitorProduct({
        url: selectedProduct.link,
        target_price: parseFloat(targetPrice),
        email: email,
        check_interval: 3600 // 1 hora em segundos
      });

      setSnackbarState({
        open: true,
        message: 'Monitoramento iniciado com sucesso! Você receberá um email quando o preço atingir o valor desejado.',
        type: 'success'
      });
      handleMonitorClose();
    } catch (err) {
      setSnackbarState({
        open: true,
        message: 'Erro ao iniciar monitoramento: ' + (err.message || 'Falha na conexão'),
        type: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarState({ ...snackbarState, open: false });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Pesquisar Produtos no Mercado Livre
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSearch}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={9}>
              <TextField
                fullWidth
                label="O que você está procurando?"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton onClick={handleClear} edge="end">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={loading || !searchTerm.trim()}
                sx={{ height: '56px' }}
              >
                {loading ? <CircularProgress size={24} /> : 'Buscar'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      )}

      {!loading && products.length === 0 && searchTerm && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Nenhum produto encontrado para "{searchTerm}".
        </Alert>
      )}

      {!loading && products.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Resultados da busca: {products.length} produtos encontrados
          </Typography>

          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      boxShadow: 6,
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom noWrap>
                      {product.title}
                    </Typography>

                    <Typography
                      variant="h5"
                      color="primary"
                      sx={{ my: 2, fontWeight: 'bold' }}
                    >
                      {formatPrice(product.price)}
                    </Typography>

                    <Box display="flex" alignItems="center" mb={1}>
                      <Rating
                        value={product.rating || 0}
                        readOnly
                        precision={0.1}
                        size="small"
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        ({product.review_count || 0})
                      </Typography>
                    </Box>

                    {product.reviews && product.reviews.length > 0 && (
                      <Box mt={2}>
                        <Typography variant="body2" fontWeight="bold">
                          Comentários:
                        </Typography>
                        {product.reviews.slice(0, 2).map((review, index) => (
                          <Typography
                            key={index}
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mt: 1,
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            "{review}"
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </CardContent>

                  <Divider />

                  <CardActions>
                    <Button
                      size="small"
                      href={product.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver no Mercado Livre
                    </Button>
                    <Button
                      size="small"
                      onClick={() => handleAddProduct(product)}
                      color="primary"
                    >
                      Adicionar
                    </Button>
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={() => handleMonitorOpen(product)}
                      title="Monitorar preço"
                    >
                      <MonitorHeart />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Dialog para adicionar produto */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)}>
        <DialogTitle>Adicionar Produto</DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Box>
              <Typography variant="h6">{selectedProduct.title}</Typography>
              <Typography variant="body1">
                Preço: {formatPrice(selectedProduct.price)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Deseja adicionar este produto ao seu catálogo?
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancelar</Button>
          <Button onClick={confirmAddProduct} color="primary" variant="contained">
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para configurar monitoramento */}
      <Dialog open={monitorDialog} onClose={handleMonitorClose}>
        <DialogTitle>Monitorar Preço</DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <>
              <Typography variant="body1" gutterBottom>
                Produto: {selectedProduct.title}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Preço atual: {formatPrice(selectedProduct.price)}
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="Preço alvo (R$)"
                type="number"
                fullWidth
                variant="outlined"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                sx={{ my: 2 }}
              />
              <TextField
                margin="dense"
                label="Seu email"
                type="email"
                fullWidth
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleMonitorClose}>Cancelar</Button>
          <Button
            onClick={handleStartMonitoring}
            variant="contained"
            color="primary"
            disabled={!targetPrice || !email}
          >
            Iniciar Monitoramento
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para feedbacks */}
      <Snackbar
        open={snackbarState.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarState.type}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarState.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Search;
