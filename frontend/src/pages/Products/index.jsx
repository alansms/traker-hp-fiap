import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Grid,
  IconButton,
  Paper,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Divider,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Fab,
  useMediaQuery,
  useTheme,
  alpha,
  Alert,
  Checkbox,
  Badge,
  Link,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
  SyncAlt as SyncAltIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { createExampleExcelFile, parseExcelFile } from '../../utils/excelUtils';
import { getAllProducts, createProduct, updateProduct, deleteProduct, createBulkProducts, mapToApiModel, mapFromApiModel } from '../../services/products';

const Products = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [openBulkDeleteDialog, setOpenBulkDeleteDialog] = useState(false);
  const [deletedProductIds, setDeletedProductIds] = useState(() => {
    // Carregar produtos excluídos do localStorage ao inicializar
    const savedDeletedIds = localStorage.getItem('deletedProductIds');
    return savedDeletedIds ? JSON.parse(savedDeletedIds) : [];
  });
  // Novo estado para produtos adicionados manualmente
  const [addedProducts, setAddedProducts] = useState(() => {
    // Carregar produtos adicionados do localStorage ao inicializar
    const savedAddedProducts = localStorage.getItem('addedProducts');
    return savedAddedProducts ? JSON.parse(savedAddedProducts) : [];
  });
  // Estados para o diálogo de adição de produto
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    code: '',
    category: 'cartuchos',
    currentPrice: '',
    referencePrice: '',
    seller: '',
    authorized: false,
    status: 'active'
  });
  // Estado para o diálogo de importação em lote
  const [openBatchImportDialog, setOpenBatchImportDialog] = useState(false);
  const [batchFile, setBatchFile] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Categorias disponíveis para filtro
  const categories = [
    { value: 'all', label: 'Todas Categorias' },
    { value: 'cartuchos', label: 'Cartuchos' },
    { value: 'toners', label: 'Toners' },
    { value: 'impressoras', label: 'Impressoras' },
    { value: 'outros', label: 'Outros' }
  ];

  useEffect(() => {
    // Verificar autenticação
    if (!user) {
      navigate('/auth/login');
      return;
    }
    
    // Carregar produtos
    fetchProducts();
  }, [user, navigate]);

  // Buscar produtos da API
  const fetchProducts = async () => {
    setRefreshing(true);
    try {
      // Buscar produtos da API backend
      const apiProducts = await getAllProducts();

      // Converter o formato da API para o formato usado na interface
      const formattedProducts = apiProducts.map(apiProduct => mapFromApiModel(apiProduct));

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setSnackbar({
        open: true,
        message: `Erro ao carregar produtos: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Função para ordenar produtos
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Filtragem e ordenação de produtos
  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        // Filtro de busca
        if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !product.code.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }

        // Filtro de categoria
        if (selectedCategory !== 'all' && product.category !== selectedCategory) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Ordenação
        const isAsc = order === 'asc';

        if (orderBy === 'name') {
          return isAsc
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else if (orderBy === 'price') {
          return isAsc
            ? a.currentPrice - b.currentPrice
            : b.currentPrice - a.currentPrice;
        } else if (orderBy === 'lastUpdate') {
          return isAsc
            ? new Date(a.lastUpdate) - new Date(b.lastUpdate)
            : new Date(b.lastUpdate) - new Date(a.lastUpdate);
        }

        return 0;
      });
  }, [products, searchTerm, selectedCategory, orderBy, order]);

  // Cálculo para paginação
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredProducts, page, rowsPerPage]);

  // Manipuladores de eventos
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Resetar para a primeira página ao buscar
  };

  // Handlers for bulk selection
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredProducts.map(product => product.id);
      setSelectedProducts(newSelected);
      return;
    }
    setSelectedProducts([]);
  };

  const handleSelectProduct = (event, productId) => {
    const selectedIndex = selectedProducts.indexOf(productId);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = [...selectedProducts, productId];
    } else {
      newSelected = selectedProducts.filter(id => id !== productId);
    }

    setSelectedProducts(newSelected);
  };

  const isProductSelected = (productId) => selectedProducts.indexOf(productId) !== -1;

  const handleBulkDeleteClick = () => {
    setOpenBulkDeleteDialog(true);
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      // Show loading state
      setLoading(true);

      // In a real environment, this would be an API call
      // Simulating API call with delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Remove selected products from list
      setProducts(prevProducts =>
        prevProducts.filter(p => !selectedProducts.includes(p.id))
      );

      // Persist deleted product IDs in localStorage
      const newDeletedIds = [...deletedProductIds, ...selectedProducts];
      setDeletedProductIds(newDeletedIds);
      localStorage.setItem('deletedProductIds', JSON.stringify(newDeletedIds));

      setOpenBulkDeleteDialog(false);
      setSelectedProducts([]);

      // Feedback for user
      setSnackbar({
        open: true,
        message: `${selectedProducts.length} produtos excluídos com sucesso!`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao excluir produtos em massa:', error);

      // Error feedback
      setSnackbar({
        open: true,
        message: `Erro ao excluir produtos: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    setPage(0); // Resetar para a primeira página ao mudar categoria
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, product) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAddProduct = () => {
    // Abrir o diálogo de adição de produtos em vez de navegar para outra página
    setOpenAddDialog(true);
  };

  // Função para adicionar um novo produto manualmente
  const saveNewProduct = async (productData) => {
    try {
      setLoading(true);

      // Preparar o produto para a API no formato esperado
      const productForAPI = mapToApiModel({
        name: productData.name || 'Novo Produto',
        code: productData.code || `PROD-${Date.now()}`,
        category: productData.category || 'outros',
        currentPrice: parseFloat(productData.currentPrice) || 0,
        referencePrice: parseFloat(productData.referencePrice) || 0,
        seller: productData.seller || 'Não especificado',
        authorized: productData.authorized || false,
        status: productData.status || 'active'
      });

      // Chamar a API para criar o produto no banco de dados
      const apiResponse = await createProduct(productForAPI);

      // Converter a resposta da API para o formato usado na interface
      const newProduct = mapFromApiModel(apiResponse);

      // Atualizar lista de produtos na tela
      setProducts(prevProducts => [...prevProducts, newProduct]);

      // Mostrar feedback
      setSnackbar({
        open: true,
        message: 'Produto adicionado com sucesso!',
        severity: 'success'
      });

      return newProduct;
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      setSnackbar({
        open: true,
        message: `Erro ao salvar produto: ${error.message}`,
        severity: 'error'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Função para adicionar múltiplos produtos de uma vez
  const saveBulkProducts = async (productsDataArray) => {
    try {
      setLoading(true);

      if (!Array.isArray(productsDataArray) || productsDataArray.length === 0) {
        throw new Error('Nenhum produto válido para importação');
      }

      // Preparar os produtos para a API no formato esperado
      const productsForAPI = productsDataArray.map(productData => mapToApiModel({
        name: productData.name || 'Novo Produto',
        code: productData.code || `PROD-${Date.now()}`,
        category: productData.category || 'outros',
        currentPrice: parseFloat(productData.currentPrice) || 0,
        referencePrice: parseFloat(productData.referencePrice) || 0,
        status: 'active'
      }));

      // Chamar a API para criar os produtos em lote
      const apiResponse = await createBulkProducts(productsForAPI);

      // Atualizar a lista de produtos na interface
      // Recarregar todos os produtos para ter certeza de que temos os dados mais atualizados
      await fetchProducts();

      // Mostrar feedback
      setSnackbar({
        open: true,
        message: `${productsDataArray.length} produtos importados com sucesso!`,
        severity: 'success'
      });

      return apiResponse;
    } catch (error) {
      console.error('Erro ao importar produtos em lote:', error);
      setSnackbar({
        open: true,
        message: `Erro ao importar produtos: ${error.message}`,
        severity: 'error'
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleViewProduct = (productId) => {
    navigate(`/products/${productId}`);
    handleMenuClose();
  };

  const handleEditProduct = (productId) => {
    navigate(`/products/${productId}/edit`);
    handleMenuClose();
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setOpenDeleteDialog(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    try {
      // Mostrar carregamento
      setLoading(true);

      // Como estamos usando dados mockados para demonstração, vamos simular uma exclusão bem-sucedida
      // Em um ambiente real, esta seria a chamada à API:
      /*
      const response = await fetch(`/api/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao excluir o produto');
      }
      */

      // Simular uma chamada de API bem-sucedida
      await new Promise(resolve => setTimeout(resolve, 800));

      // Remover produto da lista
      setProducts(prevProducts =>
        prevProducts.filter(p => p.id !== productToDelete.id)
      );

      // Persistir ID do produto excluído no localStorage
      const newDeletedIds = [...deletedProductIds, productToDelete.id];
      setDeletedProductIds(newDeletedIds);
      localStorage.setItem('deletedProductIds', JSON.stringify(newDeletedIds));

      setOpenDeleteDialog(false);
      setProductToDelete(null);

      // Feedback para o usuário
      setSnackbar({
        open: true,
        message: 'Produto excluído com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao excluir produto:', error);

      // Feedback de erro para o usuário
      setSnackbar({
        open: true,
        message: `Erro ao excluir produto: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false);
    setProductToDelete(null);
  };

  // Exclusão em massa
  const handleBulkDeleteOpen = () => {
    setOpenBulkDeleteDialog(true);
  };

  const handleBulkDeleteCancel = () => {
    setOpenBulkDeleteDialog(false);
  };

  // Formatação de datas
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Formatar valor monetário
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar varia��ão de preço
  const formatPriceVariation = (variation) => {
    if (variation === 0) return 'Sem alteração';
    const prefix = variation > 0 ? '+' : '';
    return `${prefix}${variation.toFixed(2)}%`;
  };

  // Verificar se um produto foi adicionado recentemente (últimos 7 dias)
  const isRecentlyAdded = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const handleSyncWithDatabase = async () => {
    setLoading(true);
    setSnackbar({ open: true, message: 'Sincronizando produtos com o banco de dados...', severity: 'info' });

    try {
      // Obter os produtos que vamos sincronizar
      const productsToSync = [...products];

      // Preparar os produtos para o formato esperado pela API
      const productsForAPI = productsToSync.map(product => ({
        name: product.name,
        pn: product.code,
        searchTerms: product.searchTerms || product.name,
        family: product.category,
        reference_price: product.currentPrice || product.referencePrice,
        is_active: product.status === 'active'
      }));

      // Enviar para a API
      const response = await fetch('http://localhost:8000/api/products/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(productsForAPI)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro na sincronização com o banco de dados');
      }

      const result = await response.json();

      setSnackbar({
        open: true,
        message: `Sincronização concluída com sucesso! ${result.imported} produtos adicionados, ${result.updated} produtos atualizados.`,
        severity: 'success'
      });

    } catch (error) {
      console.error('Erro ao sincronizar com o banco de dados:', error);
      setSnackbar({
        open: true,
        message: `Erro na sincronização: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 3 }}>
      <Container maxWidth="xl">
        {/* Cabeçalho da Página */}
        <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Gestão de Produtos
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gerencie os produtos que deseja monitorar no Mercado Livre
            </Typography>
          </Box>

          {/* Botão de Adicionar (versão desktop) */}
          {user && (user.role === 'admin' || user.role === 'analyst') && !isMobile && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddProduct}
                sx={{
                  height: 40,
                  px: 2
                }}
              >
                Adicionar Produto
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setOpenBatchImportDialog(true)}
                sx={{
                  height: 40,
                  px: 2
                }}
              >
                Importar em Lote
              </Button>
            </Box>
          )}
        </Box>

        {/* Painel de Filtros e Busca */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Buscar por nome ou código..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  label="Categoria"
                >
                  {categories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' }, gap: 1 }}>
              <Tooltip title="Atualizar lista">
                <IconButton
                  onClick={fetchProducts}
                  disabled={refreshing}
                  color="primary"
                >
                  {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
                </IconButton>
              </Tooltip>

              <Tooltip title={`Ordenar por ${orderBy === 'name' ? 'Nome' : orderBy === 'price' ? 'Preço' : 'Data'}`}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SortIcon />}
                  endIcon={order === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                  onClick={() => {
                    const nextOrderBy = orderBy === 'name'
                      ? 'price'
                      : orderBy === 'price'
                        ? 'lastUpdate'
                        : 'name';
                    handleRequestSort(nextOrderBy);
                  }}
                >
                  {orderBy === 'name' ? 'Nome' : orderBy === 'price' ? 'Preço' : 'Data'}
                </Button>
              </Tooltip>
            </Grid>
          </Grid>
        </Paper>

        {/* Resultados e Tabela */}
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : filteredProducts.length === 0 ? (
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhum produto encontrado
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm ? 'Tente ajustar seus filtros de busca' : 'Adicione produtos para começar a monitorar'}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddProduct}
                sx={{ mt: 3 }}
              >
                Adicionar Produto
              </Button>
            </Box>
          ) : (
            <>
              {/* Status da busca */}
              <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Exibindo {paginatedProducts.length} de {filteredProducts.length} produtos
                  {searchTerm && ` (filtrado por "${searchTerm}")`}
                  {selectedCategory !== 'all' && ` na categoria "${categories.find(c => c.value === selectedCategory)?.label}"`}
                </Typography>

                {/* Botão de exclusão em massa */}
                {selectedProducts.length > 0 && user && (user.role === 'admin' || user.role === 'analyst') && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={handleBulkDeleteClick}
                  >
                    Excluir {selectedProducts.length} {selectedProducts.length === 1 ? 'produto' : 'produtos'}
                  </Button>
                )}
              </Box>

              {/* Tabela de Produtos */}
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        {/* Checkbox para seleção em massa */}
                        {user && (user.role === 'admin' || user.role === 'analyst') && (
                          <Checkbox
                            color="primary"
                            indeterminate={selectedProducts.length > 0 && selectedProducts.length < paginatedProducts.length}
                            checked={paginatedProducts.length > 0 && selectedProducts.length === paginatedProducts.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                // Selecionar todos os produtos da página
                                const allProductIds = paginatedProducts.map(p => p.id);
                                setSelectedProducts(allProductIds);
                              } else {
                                // Desmarcar todos os produtos
                                setSelectedProducts([]);
                              }
                            }}
                          />
                        )}
                        Produto
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Código</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Categoria</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Preço Atual</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Variação</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Últ. Atualização</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedProducts.map((product) => (
                      <TableRow
                        key={product.id}
                        hover
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          backgroundColor: isRecentlyAdded(product.createdAt)
                            ? alpha(theme.palette.primary.light, 0.1)
                            : 'inherit'
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {/* Checkbox para seleção individual */}
                            {user && (user.role === 'admin' || user.role === 'analyst') && (
                              <Checkbox
                                color="primary"
                                checked={selectedProducts.includes(product.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    // Adicionar produto à seleção
                                    setSelectedProducts(prev => [...prev, product.id]);
                                  } else {
                                    // Remover produto da seleção
                                    setSelectedProducts(prev => prev.filter(id => id !== product.id));
                                  }
                                }}
                              />
                            )}

                            <Typography variant="body2" fontWeight="medium">
                              {product.name}
                            </Typography>
                            {isRecentlyAdded(product.createdAt) && (
                              <Chip
                                label="Novo"
                                size="small"
                                color="primary"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                            {product.hasAlert && (
                              <Tooltip title="Este produto tem alertas ativos">
                                <WarningIcon color="warning" fontSize="small" />
                              </Tooltip>
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {product.seller}
                            {product.authorized ? (
                              <Chip
                                label="Oficial"
                                size="small"
                                color="success"
                                sx={{ ml: 1, height: 16, fontSize: '0.65rem' }}
                              />
                            ) : (
                              <Chip
                                label="Não Oficial"
                                size="small"
                                color="default"
                                sx={{ ml: 1, height: 16, fontSize: '0.65rem' }}
                              />
                            )}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {product.code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                            size="small"
                            color={
                              product.category === 'cartuchos' ? 'primary' :
                              product.category === 'toners' ? 'secondary' :
                              product.category === 'impressoras' ? 'info' : 'default'
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(product.currentPrice)}
                          </Typography>
                          {product.referencePrice !== product.currentPrice && (
                            <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                              {formatCurrency(product.referencePrice)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color={
                              product.priceVariation > 0 ? 'error.main' :
                              product.priceVariation < 0 ? 'success.main' : 'text.secondary'
                            }
                            fontWeight="medium"
                          >
                            {formatPriceVariation(product.priceVariation)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(product.lastUpdate)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {product.status === 'active' ? (
                            <Chip
                              label="Ativo"
                              size="small"
                              color="success"
                              icon={<CheckCircleIcon />}
                            />
                          ) : (
                            <Chip
                              label="Inativo"
                              size="small"
                              color="default"
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            {/* Botões de ação para desktop */}
                            {!isMobile && (
                              <>
                                <Tooltip title="Visualizar">
                                  <IconButton
                                    size="small"
                                    color="info"
                                    onClick={() => handleViewProduct(product.id)}
                                  >
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {user && (user.role === 'admin' || user.role === 'analyst') && (
                                  <>
                                    <Tooltip title="Editar">
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => handleEditProduct(product.id)}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Excluir">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteClick(product)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                              </>
                            )}

                            {/* Menu para dispositivos móveis */}
                            {isMobile && (
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuOpen(e, product)}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Paginação */}
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredProducts.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Itens por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </>
          )}
        </Paper>
      </Container>

      {/* FAB para dispositivos móveis */}
      {user && (user.role === 'admin' || user.role === 'analyst') && isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleAddProduct}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Menu de ações (para dispositivos móveis) */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewProduct(selectedProduct?.id)}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          Visualizar
        </MenuItem>
        {user && (user.role === 'admin' || user.role === 'analyst') && (
          <>
            <MenuItem onClick={() => handleEditProduct(selectedProduct?.id)}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Editar
            </MenuItem>
            <MenuItem onClick={() => handleDeleteClick(selectedProduct)}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Excluir
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Diálogo de confirmação de exclusão */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirmar exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o produto "{productToDelete?.name}"?
            Esta a��ão não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancelar</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            autoFocus
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmação de exclusão em massa */}
      <Dialog
        open={openBulkDeleteDialog}
        onClose={handleBulkDeleteCancel}
      >
        <DialogTitle>Confirmar exclusão em massa</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir os produtos selecionados?
            Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBulkDeleteCancel}>Cancelar</Button>
          <Button
            onClick={handleBulkDeleteConfirm}
            color="error"
            variant="contained"
            autoFocus
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para feedback */}
      <Alert
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        severity={snackbar.severity}
        sx={{ position: 'fixed', bottom: 20, right: 20 }}
      >
        {snackbar.message}
      </Alert>

      {/* Diálogo de Adição de Produto */}
      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Adicionar Novo Produto</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Preencha as informações abaixo para adicionar um novo produto.
          </DialogContentText>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Nome do Produto"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                fullWidth
                variant="outlined"
                size="small"
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Código do Produto"
                value={newProduct.code}
                onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
                fullWidth
                variant="outlined"
                size="small"
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  label="Categoria"
                >
                  {categories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Preço Atual"
                value={newProduct.currentPrice}
                onChange={(e) => setNewProduct({ ...newProduct, currentPrice: e.target.value })}
                fullWidth
                variant="outlined"
                size="small"
                type="number"
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Preço de Referência"
                value={newProduct.referencePrice}
                onChange={(e) => setNewProduct({ ...newProduct, referencePrice: e.target.value })}
                fullWidth
                variant="outlined"
                size="small"
                type="number"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Vendedor"
                value={newProduct.seller}
                onChange={(e) => setNewProduct({ ...newProduct, seller: e.target.value })}
                fullWidth
                variant="outlined"
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={newProduct.status}
                  onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="active">Ativo</MenuItem>
                  <MenuItem value="inactive">Inativo</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Produto Autorizado</InputLabel>
                <Select
                  value={newProduct.authorized}
                  onChange={(e) => setNewProduct({ ...newProduct, authorized: e.target.value === 'true' })}
                  label="Produto Autorizado"
                >
                  <MenuItem value={true}>Sim</MenuItem>
                  <MenuItem value={false}>Não</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancelar</Button>
          <Button
            onClick={async () => {
              // Validação simples
              if (!newProduct.name || !newProduct.code || !newProduct.currentPrice) {
                setSnackbar({
                  open: true,
                  message: 'Preencha todos os campos obrigatórios!',
                  severity: 'warning'
                });
                return;
              }

              // Salvar novo produto
              await saveNewProduct(newProduct);

              // Fechar diálogo
              setOpenAddDialog(false);

              // Limpar formulário
              setNewProduct({
                name: '',
                code: '',
                category: 'cartuchos',
                currentPrice: '',
                referencePrice: '',
                seller: '',
                authorized: false,
                status: 'active'
              });
            }}
            color="primary"
            variant="contained"
          >
            Adicionar Produto
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Importação em Lote */}
      <Dialog
        open={openBatchImportDialog}
        onClose={() => setOpenBatchImportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Importar Produtos em Lote</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Selecione um arquivo Excel (.xlsx) para importar múltiplos produtos de uma vez.
            O arquivo deve conter as seguintes colunas:
          </DialogContentText>

          {/* Exemplo de estrutura do arquivo Excel */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.primary.light, 0.1) }}>
            <Typography variant="body2" fontWeight="medium" gutterBottom>
              Colunas necessárias:
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2">PN</Typography>
              <Typography component="li" variant="body2">Familia</Typography>
              <Typography component="li" variant="body2">Produto</Typography>
              <Typography component="li" variant="body2">Média de Páginas Impressas</Typography>
              <Typography component="li" variant="body2">Preço Sugerido</Typography>
            </Box>
          </Paper>

          {/* Botão para baixar o modelo */}
          <Button
            variant="outlined"
            color="primary"
            startIcon={<DownloadIcon />}
            fullWidth
            sx={{ mb: 3 }}
            onClick={() => {
              try {
                // Criar o arquivo de exemplo
                const excelBlob = createExampleExcelFile();

                // Criar um URL para o blob
                const url = URL.createObjectURL(excelBlob);

                // Criar um elemento <a> para o download
                const link = document.createElement('a');
                link.href = url;
                link.download = 'modelo_importacao_produtos.xlsx';

                // Adicionar o link ao DOM, clicar nele e removê-lo
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Revogar o URL para liberar memória
                setTimeout(() => URL.revokeObjectURL(url), 100);

                setSnackbar({
                  open: true,
                  message: 'Arquivo modelo baixado com sucesso!',
                  severity: 'success'
                });
              } catch (error) {
                console.error('Erro ao gerar arquivo modelo:', error);
                setSnackbar({
                  open: true,
                  message: `Erro ao gerar arquivo modelo: ${error.message}`,
                  severity: 'error'
                });
              }
            }}
          >
            Baixar Arquivo Modelo
          </Button>

          <Divider sx={{ my: 2 }} />

          <Button
            variant="outlined"
            component="label"
            fullWidth
            size="medium"
            sx={{ mb: 2 }}
          >
            Selecionar Arquivo Excel
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setBatchFile(file);
                  setSnackbar({
                    open: true,
                    message: `Arquivo "${file.name}" selecionado.`,
                    severity: 'info'
                  });
                }
              }}
              hidden
            />
          </Button>

          {batchFile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Typography variant="body2" color="text.primary">
                {batchFile.name}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => setBatchFile(null)}
              >
                Remover
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenBatchImportDialog(false);
            setBatchFile(null);
          }}>
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              if (!batchFile) {
                setSnackbar({
                  open: true,
                  message: 'Selecione um arquivo Excel para importação.',
                  severity: 'warning'
                });
                return;
              }

              try {
                setLoading(true);

                // Processar o arquivo Excel usando a função utilitária
                const productsData = await parseExcelFile(batchFile);

                if (productsData.length === 0) {
                  throw new Error('Não foi possível encontrar produtos válidos no arquivo.');
                }

                // Salvar produtos em lote
                await saveBulkProducts(productsData);

                // Feedback para o usuário
                setSnackbar({
                  open: true,
                  message: `${productsData.length} produtos importados com sucesso!`,
                  severity: 'success'
                });

                // Fechar diálogo
                setOpenBatchImportDialog(false);

                // Limpar arquivo selecionado
                setBatchFile(null);
              } catch (error) {
                console.error('Erro ao importar produtos em lote:', error);
                setSnackbar({
                  open: true,
                  message: `Erro ao importar produtos: ${error.message}`,
                  severity: 'error'
                });
              } finally {
                setLoading(false);
              }
            }}
            color="primary"
            variant="contained"
            disabled={!batchFile || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Importar Produtos'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;
