import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useTheme, useMediaQuery, alpha } from '@mui/material';
import {
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Container,
  Menu,
  MenuItem,
  Checkbox,
  Divider
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import SortIcon from '@mui/icons-material/Sort';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { getAllProducts, createProduct, createBulkProducts, mapFromApiModel } from '../../services/products';
import { createExampleExcelFile, parseExcelFile } from '../../utils/excel';

const Products = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]); // Adicionando state para produtos
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

  // Adicionar produto
  const handleAddProduct = () => {
    setOpenAddDialog(true);
  };

  // Mudar categoria
  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    setPage(0); // Resetar para a primeira página ao mudar categoria
  };

  // Manipulação de menu para dispositivos móveis
  const handleMenuOpen = (event, product) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProduct(null);
  };

  // Visualizar produto
  const handleViewProduct = (productId) => {
    // Redirecionar para a página de detalhes do produto
    navigate(`/products/${productId}`);
  };

  // Editar produto
  const handleEditProduct = (productId) => {
    // Implementação futura: Abrir diálogo de edição ou navegar para página de edição
    console.log(`Editar produto ${productId}`);
  };

  // Exclusão individual
  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setOpenDeleteDialog(true);
  };

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false);
    setProductToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      setLoading(true);
      // Lógica para excluir o produto
      // Implementação futura: Chamar API para excluir o produto
      console.log(`Excluindo produto ${productToDelete.id}`);

      // Atualizar a lista após exclusão
      setProducts(products.filter(p => p.id !== productToDelete.id));

      // Adicionar à lista de produtos excluídos
      const newDeletedIds = [...deletedProductIds, productToDelete.id];
      setDeletedProductIds(newDeletedIds);
      localStorage.setItem('deletedProductIds', JSON.stringify(newDeletedIds));

      setSnackbar({
        open: true,
        message: `Produto "${productToDelete.name}" excluído com sucesso.`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      setSnackbar({
        open: true,
        message: `Erro ao excluir produto: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setOpenDeleteDialog(false);
      setProductToDelete(null);
    }
  };

  // Paginação
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Exclusão em massa
  const handleBulkDeleteClick = () => {
    if (selectedProducts.length === 0) return;
    setOpenBulkDeleteDialog(true);
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      setLoading(true);
      // Lógica para excluir os produtos selecionados
      // Implementação futura: Chamar API para excluir produtos em lote
      console.log(`Excluindo ${selectedProducts.length} produtos`);

      // Atualizar a lista após exclusão
      setProducts(products.filter(p => !selectedProducts.includes(p.id)));

      // Adicionar à lista de produtos excluídos
      const newDeletedIds = [...deletedProductIds, ...selectedProducts];
      setDeletedProductIds(newDeletedIds);
      localStorage.setItem('deletedProductIds', JSON.stringify(newDeletedIds));

      setSnackbar({
        open: true,
        message: `${selectedProducts.length} produtos excluídos com sucesso.`,
        severity: 'success'
      });

      // Limpar seleção
      setSelectedProducts([]);
    } catch (error) {
      console.error('Erro ao excluir produtos em lote:', error);
      setSnackbar({
        open: true,
        message: `Erro ao excluir produtos: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setOpenBulkDeleteDialog(false);
    }
  };

  // Salvar novo produto
  const saveNewProduct = async (product) => {
    try {
      setLoading(true);
      // Lógica para salvar o produto
      const savedProduct = await createProduct({
        ...product,
        currentPrice: parseFloat(product.currentPrice),
        referencePrice: product.referencePrice ? parseFloat(product.referencePrice) : parseFloat(product.currentPrice),
        createdAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        priceVariation: 0 // Novo produto, sem variação
      });

      // Adicionar o produto à lista
      setProducts([savedProduct, ...products]);

      setSnackbar({
        open: true,
        message: `Produto "${product.name}" adicionado com sucesso.`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      setSnackbar({
        open: true,
        message: `Erro ao salvar produto: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Salvar produtos em lote
  const saveBulkProducts = async (productsData) => {
    try {
      // Formatar os dados dos produtos para o formato esperado
      const formattedProducts = productsData.map(product => ({
        name: product.name,
        code: product.code || product.pn || '',
        category: product.category || product.family || 'outros',
        currentPrice: parseFloat(product.price || product.currentPrice || 0),
        referencePrice: parseFloat(product.referencePrice || product.price || product.currentPrice || 0),
        seller: product.seller || '',
        authorized: product.authorized === true || product.authorized === 'true' || false,
        status: product.status === 'active' || product.status === true ? 'active' : 'inactive',
        createdAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        priceVariation: 0
      }));

      // Salvar os produtos em lote
      const savedProducts = await createBulkProducts(formattedProducts);

      // Atualizar a lista de produtos
      setProducts([...savedProducts, ...products]);

      setSnackbar({
        open: true,
        message: `${savedProducts.length} produtos importados com sucesso.`,
        severity: 'success'
      });

      return savedProducts;
    } catch (error) {
      console.error('Erro ao salvar produtos em lote:', error);
      throw error;
    }
  };

  // Funções para importação em lote
  const handleBatchImportClick = () => {
    setOpenBatchImportDialog(true);
  };

  const handleBatchFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setBatchFile(file);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      // Criar o arquivo Excel de exemplo
      const excelBlob = createExampleExcelFile();

      // Criar URL para o blob
      const url = URL.createObjectURL(excelBlob);

      // Criar um link para download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'template_importacao_produtos.xlsx';

      // Adicionar o link ao documento e clicar nele
      document.body.appendChild(link);
      link.click();

      // Limpar
      URL.revokeObjectURL(url);
      document.body.removeChild(link);

      setSnackbar({
        open: true,
        message: 'Template baixado com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao baixar template:', error);
      setSnackbar({
        open: true,
        message: `Erro ao baixar template: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleBatchImportConfirm = async () => {
    if (!batchFile) {
      setSnackbar({
        open: true,
        message: 'Por favor, selecione um arquivo para importação',
        severity: 'warning'
      });
      return;
    }

    try {
      // Processar o arquivo Excel
      const productsData = await parseExcelFile(batchFile);

      if (productsData.length === 0) {
        throw new Error('Nenhum produto encontrado no arquivo');
      }

      // Salvar os produtos em lote
      await saveBulkProducts(productsData);

      // Fechar o diálogo e limpar o arquivo
      setOpenBatchImportDialog(false);
      setBatchFile(null);

    } catch (error) {
      console.error('Erro ao importar produtos:', error);
      setSnackbar({
        open: true,
        message: `Erro ao importar produtos: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleBatchImportCancel = () => {
    setOpenBatchImportDialog(false);
    setBatchFile(null);
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
              <Typography variant="body1" sx={{ mb: 2 }}>
                Nenhum produto encontrado para &quot;{searchTerm}&quot; em &quot;{selectedCategory}&quot;.
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
            Tem certeza que deseja excluir o produto &quot;{productToDelete?.name}&quot;?
            Esta ação não pode ser desfeita.
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
        onClose={handleBatchImportCancel}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Importação em Lote de Produtos
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Importe múltiplos produtos de uma só vez usando uma planilha Excel.
            Baixe o modelo para preencher corretamente os dados.
          </DialogContentText>

          <Box sx={{ mb: 4 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTemplate}
              sx={{ mb: 2 }}
            >
              Baixar Modelo de Planilha
            </Button>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
              Instruções:
            </Typography>
            <Typography variant="body2" component="div">
              <ol>
                <li>Baixe o modelo de planilha</li>
                <li>Preencha os dados dos produtos (não altere os cabeçalhos)</li>
                <li>Salve o arquivo e faça upload abaixo</li>
                <li>Clique em &quot;Importar Produtos&quot; para processar</li>
              </ol>
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ py: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Selecione o arquivo Excel:
            </Typography>

            <Box sx={{
              border: '2px dashed #ccc',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              bgcolor: 'background.paper',
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: alpha('#f0f7ff', 0.5)
              },
              mb: 2
            }}>
              <input
                accept=".xlsx,.xls"
                id="batch-file-upload"
                type="file"
                onChange={handleBatchFileChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="batch-file-upload" style={{ cursor: 'pointer', width: '100%', height: '100%' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <DownloadIcon fontSize="large" color="primary" sx={{ transform: 'rotate(180deg)', mb: 1 }} />
                  {batchFile ? (
                    <>
                      <Typography variant="body1" color="primary.main" fontWeight="medium">
                        {batchFile.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Clique para selecionar outro arquivo
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="body1">
                        Arraste o arquivo Excel ou clique para selecionar
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Formatos suportados: .xlsx, .xls
                      </Typography>
                    </>
                  )}
                </Box>
              </label>
              {batchFile && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Arquivo selecionado: <strong>{batchFile.name}</strong> ({Math.round(batchFile.size / 1024)} KB)
                </Alert>
              )}
            </Box>
          </Box>
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
