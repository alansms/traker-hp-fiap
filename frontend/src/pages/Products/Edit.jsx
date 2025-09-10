import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'cartuchos',
    currentPrice: '',
    referencePrice: '',
    seller: '',
    authorized: false,
    status: 'active',
    family: '',
    avgPages: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Categorias disponíveis
  const categories = [
    { value: 'cartuchos', label: 'Cartuchos' },
    { value: 'toners', label: 'Toners' },
    { value: 'impressoras', label: 'Impressoras' },
    { value: 'outros', label: 'Outros' }
  ];

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
            family: 'HP 664'
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
            family: 'HP 664'
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
          // Inicializar formData com os dados do produto
          setFormData({
            name: foundProduct.name || '',
            code: foundProduct.code || '',
            category: foundProduct.category || 'cartuchos',
            currentPrice: foundProduct.currentPrice || '',
            referencePrice: foundProduct.referencePrice || '',
            seller: foundProduct.seller || '',
            authorized: foundProduct.authorized || false,
            status: foundProduct.status || 'active',
            family: foundProduct.family || '',
            avgPages: foundProduct.avgPages || '',
            description: foundProduct.description || ''
          });
        } else {
          setError('Produto não encontrado');
        }
      } catch (err) {
        console.error('Erro ao buscar dados do produto:', err);
        setError('Erro ao carregar os dados do produto. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpar erro do campo quando o usuário modifica o valor
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'O nome do produto é obrigatório';
    }

    if (!formData.code.trim()) {
      errors.code = 'O código do produto é obrigatório';
    }

    if (!formData.currentPrice) {
      errors.currentPrice = 'O preço atual é obrigatório';
    } else if (isNaN(formData.currentPrice) || formData.currentPrice <= 0) {
      errors.currentPrice = 'O preço deve ser um número maior que zero';
    }

    if (formData.referencePrice && (isNaN(formData.referencePrice) || formData.referencePrice < 0)) {
      errors.referencePrice = 'O preço de referência deve ser um número não negativo';
    }

    if (formData.avgPages && (isNaN(formData.avgPages) || formData.avgPages <= 0)) {
      errors.avgPages = 'A média de páginas deve ser um número maior que zero';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar formulário
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      // Em um cenário real, essa seria uma chamada à API para atualizar o produto
      // Simulando uma chamada de API com um timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

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
          imageUrl: 'https://http2.mlstatic.com/D_NQ_NP_864310-MLA43764931836_102020-O.webp'
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
          imageUrl: 'https://http2.mlstatic.com/D_NQ_NP_944443-MLA43764931884_102020-O.webp'
        }
      ];

      // Verificar se o produto está nos dados mockados
      const mockIndex = mockProducts.findIndex(p => p.id === parseInt(id));
      const addedIndex = addedProducts.findIndex(p => p.id === parseInt(id));

      // Atualizar os dados com os valores do formulário
      const updatedProduct = {
        id: parseInt(id),
        name: formData.name,
        code: formData.code,
        category: formData.category,
        currentPrice: parseFloat(formData.currentPrice),
        referencePrice: formData.referencePrice ? parseFloat(formData.referencePrice) : parseFloat(formData.currentPrice),
        seller: formData.seller,
        authorized: formData.authorized === 'true' || formData.authorized === true,
        status: formData.status,
        lastUpdate: new Date().toISOString(),
        family: formData.family,
        avgPages: formData.avgPages ? parseInt(formData.avgPages) : null,
        description: formData.description,
        // Preservar outros campos que possam existir
        ...(mockIndex >= 0 ? mockProducts[mockIndex] :
           addedIndex >= 0 ? addedProducts[addedIndex] : {})
      };

      // Calcular variação de preço se houver um preço de referência
      if (updatedProduct.referencePrice > 0) {
        const variation = ((updatedProduct.currentPrice - updatedProduct.referencePrice) / updatedProduct.referencePrice) * 100;
        updatedProduct.priceVariation = parseFloat(variation.toFixed(2));
      } else {
        updatedProduct.priceVariation = 0;
      }

      // Atualizar os produtos adicionados no localStorage
      if (addedIndex >= 0) {
        addedProducts[addedIndex] = updatedProduct;
        localStorage.setItem('addedProducts', JSON.stringify(addedProducts));
      } else if (mockIndex >= 0) {
        // Simular atualização de produtos mockados
        // Na prática, isso seria uma chamada a uma API real
        // Como não podemos modificar os dados mockados permanentemente,
        // vamos adicionar o produto modificado à lista de produtos adicionados
        addedProducts.push(updatedProduct);
        localStorage.setItem('addedProducts', JSON.stringify(addedProducts));
      }

      // Navegar para a página de detalhes do produto
      navigate(`/products/${id}`);
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      setError('Erro ao salvar as alterações do produto. Tente novamente mais tarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/products/${id}`);
  };

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/products')}
          sx={{ mb: 2 }}
        >
          Voltar para lista
        </Button>
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography variant="body1">
            Não foi possível carregar o produto para edição.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/products')}
            sx={{ mt: 3 }}
          >
            Voltar para a lista de produtos
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/products/${id}`)}
          sx={{ mr: 2 }}
        >
          Voltar
        </Button>
        <Typography variant="h4" component="h1">
          Editar Produto
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Informações Básicas */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Informações Básicas
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Produto"
                name="name"
                value={formData.name}
                onChange={handleChange}
                variant="outlined"
                required
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Código do Produto (PN)"
                name="code"
                value={formData.code}
                onChange={handleChange}
                variant="outlined"
                required
                error={!!formErrors.code}
                helperText={formErrors.code}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Categoria</InputLabel>
                <Select
                  label="Categoria"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {categories.map(category => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Família"
                name="family"
                value={formData.family}
                onChange={handleChange}
                variant="outlined"
                placeholder="Ex: HP 664"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Média de Páginas Impressas"
                name="avgPages"
                type="number"
                value={formData.avgPages}
                onChange={handleChange}
                variant="outlined"
                error={!!formErrors.avgPages}
                helperText={formErrors.avgPages}
                inputProps={{ min: 0 }}
              />
            </Grid>

            {/* Informações de Preço */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Informações de Preço
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Preço Atual"
                name="currentPrice"
                type="number"
                value={formData.currentPrice}
                onChange={handleChange}
                variant="outlined"
                required
                error={!!formErrors.currentPrice}
                helperText={formErrors.currentPrice}
                InputProps={{
                  startAdornment: <Box component="span" sx={{ mr: 1 }}>R$</Box>,
                  inputProps: { step: "0.01", min: 0 }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Preço de Referência"
                name="referencePrice"
                type="number"
                value={formData.referencePrice}
                onChange={handleChange}
                variant="outlined"
                error={!!formErrors.referencePrice}
                helperText={formErrors.referencePrice}
                InputProps={{
                  startAdornment: <Box component="span" sx={{ mr: 1 }}>R$</Box>,
                  inputProps: { step: "0.01", min: 0 }
                }}
              />
              <FormHelperText>
                Deixe em branco para usar o preço atual como referência
              </FormHelperText>
            </Grid>

            {/* Informações do Vendedor */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Informações do Vendedor
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome do Vendedor"
                name="seller"
                value={formData.seller}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Vendedor Autorizado</InputLabel>
                <Select
                  label="Vendedor Autorizado"
                  name="authorized"
                  value={formData.authorized}
                  onChange={handleChange}
                >
                  <MenuItem value={true}>Sim</MenuItem>
                  <MenuItem value={false}>Não</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Status */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <MenuItem value="active">Ativo</MenuItem>
                  <MenuItem value="inactive">Inativo</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Descrição */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Descrição do Produto
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                name="description"
                value={formData.description}
                onChange={handleChange}
                variant="outlined"
                multiline
                rows={4}
                placeholder="Descreva detalhes sobre o produto, como características, rendimento, compatibilidade, etc."
              />
            </Grid>

            {/* Botões */}
            <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleCancel}
                startIcon={<CancelIcon />}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default ProductEdit;
