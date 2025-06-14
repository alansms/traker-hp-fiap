import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Chip,
  Divider,
  Button,
  Card,
  CardMedia,
  CardContent,
  Alert,
  Skeleton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteIcon,
  LocalOffer as PriceIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  Store as StoreIcon,
  DateRange as DateIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        // Em um cenário real, essa seria uma chamada à API
        // Simulando uma chamada para obter dados do produto
        await new Promise(resolve => setTimeout(resolve, 800));

        // Obter produtos do localStorage
        const savedProducts = localStorage.getItem('addedProducts');
        const addedProducts = savedProducts ? JSON.parse(savedProducts) : [];

        // Dados mockados (simulando uma API)
        const mockProducts = [
          {
            id: 1,
            name: 'Cartucho HP 664XL Preto',
            code: 'F6V31AB',
            category: 'cartuchos',
            currentPrice: 89.90,
            referencePrice: 99.90,
            seller: 'Loja Oficial HP',
            authorized: true,
            lastUpdate: '2025-05-23T14:30:00',
            priceVariation: -10.01,
            hasAlert: true,
            status: 'active',
            createdAt: '2025-03-15T10:30:00',
            imageUrl: 'https://http2.mlstatic.com/D_NQ_NP_864310-MLA43764931836_102020-O.webp',
            description: 'Cartucho de tinta original HP 664XL de alto rendimento. Proporciona textos nítidos e gráficos vibrantes. Rendimento aproximado de 480 páginas.',
            avgPages: 480,
            family: 'HP 664',
            priceHistory: [
              { date: '2025-04-23', price: 99.90 },
              { date: '2025-05-10', price: 94.90 },
              { date: '2025-05-23', price: 89.90 }
            ]
          },
          {
            id: 2,
            name: 'Cartucho HP 664 Colorido',
            code: 'F6V28AB',
            category: 'cartuchos',
            currentPrice: 79.90,
            referencePrice: 79.90,
            seller: 'TintasShop',
            authorized: false,
            lastUpdate: '2025-05-23T10:15:00',
            priceVariation: 0,
            hasAlert: true,
            status: 'active',
            createdAt: '2025-04-10T09:45:00',
            imageUrl: 'https://http2.mlstatic.com/D_NQ_NP_944443-MLA43764931884_102020-O.webp',
            description: 'Cartucho de tinta colorido original HP 664. Ideal para impressão de fotos e documentos coloridos. Rendimento aproximado de 330 páginas.',
            avgPages: 330,
            family: 'HP 664',
            priceHistory: [
              { date: '2025-04-15', price: 79.90 },
              { date: '2025-05-01', price: 79.90 },
              { date: '2025-05-23', price: 79.90 }
            ]
          }
        ];

        // Combinar produtos mockados com os adicionados
        const allProducts = [...mockProducts, ...addedProducts];

        // Deletados do localStorage
        const deletedIds = localStorage.getItem('deletedProductIds');
        const deletedProductIds = deletedIds ? JSON.parse(deletedIds) : [];

        // Filtrar produtos que não foram excluídos
        const availableProducts = allProducts.filter(p => !deletedProductIds.includes(p.id));

        // Encontrar o produto pelo ID
        const foundProduct = availableProducts.find(p => p.id === parseInt(id));

        if (foundProduct) {
          setProduct(foundProduct);
        } else {
          setError('Produto não encontrado');
        }
      } catch (err) {
        console.error('Erro ao buscar detalhes do produto:', err);
        setError('Erro ao carregar os detalhes do produto. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const formatPriceVariation = (variation) => {
    if (variation === 0) return 'Sem alteração';
    const prefix = variation > 0 ? '+' : '';
    return `${prefix}${variation.toFixed(2)}%`;
  };

  const handleEdit = () => {
    navigate(`/products/${id}/edit`);
  };

  const handleBack = () => {
    navigate('/products');
  };

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Voltar para lista
        </Button>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Skeleton variant="text" height={60} width="50%" />
          <Skeleton variant="rectangular" height={300} sx={{ mt: 2 }} />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Skeleton variant="text" height={30} />
              <Skeleton variant="text" height={30} />
              <Skeleton variant="text" height={30} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Skeleton variant="text" height={30} />
              <Skeleton variant="text" height={30} />
              <Skeleton variant="rectangular" height={100} />
            </Grid>
          </Grid>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Voltar para lista
        </Button>
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography variant="body1">
            O produto que você está procurando não foi encontrado ou pode ter sido removido.
          </Typography>
          <Button
            variant="contained"
            onClick={handleBack}
            sx={{ mt: 3 }}
          >
            Voltar para a lista de produtos
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <Container sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{ mb: 2 }}
      >
        Voltar para lista
      </Button>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {product.name}
          </Typography>

          <Box>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{ mr: 1 }}
            >
              Editar
            </Button>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {/* Coluna da esquerda */}
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              {product.imageUrl ? (
                <CardMedia
                  component="img"
                  height="280"
                  image={product.imageUrl}
                  alt={product.name}
                  sx={{ objectFit: 'contain', p: 2, bgcolor: '#f5f5f5' }}
                />
              ) : (
                <Box
                  sx={{
                    height: 280,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f5f5f5'
                  }}
                >
                  <InventoryIcon sx={{ fontSize: 80, color: 'text.disabled' }} />
                </Box>
              )}

              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  {formatCurrency(product.currentPrice)}
                </Typography>

                {product.referencePrice !== product.currentPrice && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textDecoration: 'line-through' }}
                  >
                    {formatCurrency(product.referencePrice)}
                  </Typography>
                )}

                <Box sx={{ mt: 1 }}>
                  {product.priceVariation !== 0 && (
                    <Chip
                      label={formatPriceVariation(product.priceVariation)}
                      color={product.priceVariation > 0 ? 'error' : 'success'}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                  )}

                  <Chip
                    label={product.status === 'active' ? 'Ativo' : 'Inativo'}
                    color={product.status === 'active' ? 'success' : 'default'}
                    size="small"
                    sx={{ mr: 1 }}
                  />

                  {product.hasAlert && (
                    <Chip
                      label="Alerta de preço"
                      color="warning"
                      size="small"
                      icon={<WarningIcon />}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Informações do Produto
              </Typography>

              <List disablePadding>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <InventoryIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Código do Produto"
                    secondary={product.code}
                  />
                </ListItem>

                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <CategoryIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Categoria"
                    secondary={product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                  />
                </ListItem>

                {product.family && (
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <InventoryIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Família"
                      secondary={product.family}
                    />
                  </ListItem>
                )}

                {product.avgPages && (
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <InventoryIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Média de Páginas"
                      secondary={`${product.avgPages} páginas`}
                    />
                  </ListItem>
                )}

                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <DateIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Última Atualização"
                    secondary={formatDate(product.lastUpdate)}
                  />
                </ListItem>

                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <DateIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Cadastrado em"
                    secondary={formatDate(product.createdAt)}
                  />
                </ListItem>
              </List>
            </Box>
          </Grid>

          {/* Coluna da direita */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Descrição
            </Typography>
            <Typography variant="body1" paragraph>
              {product.description || 'Nenhuma descrição disponível para este produto.'}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Informações do Vendedor
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <StoreIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body1">
                {product.seller}
                {' '}
                {product.authorized ? (
                  <Chip
                    label="Vendedor Oficial"
                    color="success"
                    size="small"
                    icon={<CheckCircleIcon />}
                    sx={{ ml: 1 }}
                  />
                ) : (
                  <Chip
                    label="Não Oficial"
                    variant="outlined"
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
            </Box>

            {product.priceHistory && product.priceHistory.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Histórico de Preços
                </Typography>

                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                  <Box component="thead" sx={{ bgcolor: 'primary.main', color: 'white' }}>
                    <Box component="tr">
                      <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Data</Box>
                      <Box component="th" sx={{ p: 1, textAlign: 'right' }}>Preço</Box>
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {product.priceHistory.map((item, index) => (
                      <Box
                        component="tr"
                        key={index}
                        sx={{
                          '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                          borderBottom: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <Box component="td" sx={{ p: 1 }}>{item.date}</Box>
                        <Box component="td" sx={{ p: 1, textAlign: 'right' }}>
                          {formatCurrency(item.price)}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ProductDetail;
