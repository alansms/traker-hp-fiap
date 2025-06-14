import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  CircularProgress,
  Divider,
  Rating,
  Chip,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material';
import { Search as SearchIcon, Bookmark, Share, MonitorHeart } from '@mui/icons-material';
import scrapingService from '../../services/scrapingService';

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [monitorDialog, setMonitorDialog] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [email, setEmail] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const results = await scrapingService.searchProducts(searchTerm);
      console.log(`Recebidos ${results.length} produtos do backend para "${searchTerm}"`);
      setSearchResults(results || []);

      // Se não há resultados mas deveria haver (segundo o log do backend)
      if (!results || results.length === 0) {
        console.warn("Backend encontrou produtos, mas o frontend recebeu um array vazio");
      }
    } catch (err) {
      setError(err.message || 'Erro ao buscar produtos. Tente novamente.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
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

      // Feedback de sucesso
      setError({
        type: 'success',
        message: 'Monitoramento iniciado com sucesso! Você receberá um email quando o preço atingir o valor desejado.'
      });
      handleMonitorClose();
    } catch (err) {
      setError({
        type: 'error',
        message: err.message || 'Erro ao iniciar monitoramento. Tente novamente.'
      });
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Busca de Produtos no Mercado Livre
        </Typography>

        <Box component="form" onSubmit={handleSearch} sx={{ mt: 3, mb: 5 }}>
          <Grid container spacing={2}>
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
                sx={{ height: '56px' }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Buscar'}
              </Button>
            </Grid>
          </Grid>
        </Box>

        {error && error.type !== 'success' && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error.message || error}
          </Alert>
        )}

        {error && error.type === 'success' && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {error.message}
          </Alert>
        )}

        {loading && (
          <Box display="flex" justifyContent="center" my={5}>
            <CircularProgress />
          </Box>
        )}

        {!loading && searchResults.length === 0 && searchTerm && (
          <Alert severity="info">
            Nenhum produto encontrado para "{searchTerm}".
          </Alert>
        )}

        {!loading && searchResults.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Resultados da busca: {searchResults.length} produtos encontrados
            </Typography>

            <Grid container spacing={3}>
              {searchResults.map((product) => (
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
                      <IconButton
                        size="small"
                        color="primary"
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
          </>
        )}
      </Box>

      {/* Dialog para configurar monitoramento */}
      <Dialog open={monitorDialog} onClose={handleMonitorClose}>
        <DialogTitle>Monitorar Preço</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Produto: {selectedProduct?.title}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Preço atual: {selectedProduct ? formatPrice(selectedProduct.price) : ''}
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
    </Container>
  );
};

export default SearchPage;
