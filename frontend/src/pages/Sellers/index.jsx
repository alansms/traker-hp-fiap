import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
  InputAdornment,
  CircularProgress,
  Grid,
  Tooltip,
  Checkbox
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileUpload as FileUploadIcon,
  FileDownload as FileDownloadIcon,
  Search as SearchIcon,
  DeleteSweep as DeleteSweepIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';

const Sellers = () => {
  // Estados para gerenciar os dados e a interface
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHPPartners, setShowHPPartners] = useState(false);

  // Estados para gerenciar os diálogos
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [openBulkDeleteDialog, setOpenBulkDeleteDialog] = useState(false);

  // Estado para notificações
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Estado para o novo vendedor
  const [newSeller, setNewSeller] = useState({
    id: '',
    hpReseller: false,
    name: '',
    cnpj: '',
    storeLink: '',
    rating: 0
  });

  // Função para salvar vendedores no localStorage
  const saveSellersToLocalStorage = (sellerData) => {
    localStorage.setItem('sellers', JSON.stringify(sellerData));
  };

  // Carregar dados de vendedores
  useEffect(() => {
    setLoading(true);

    // Tenta recuperar vendedores do localStorage primeiro
    const savedSellers = localStorage.getItem('sellers');

    if (savedSellers) {
      // Se existirem dados no localStorage, usa-os
      setSellers(JSON.parse(savedSellers));
      setLoading(false);
    } else {
      // Se não houver dados no localStorage, carrega os dados de exemplo
      setTimeout(() => {
        const mockSellers = [
          {
            id: 1,
            hpReseller: true,
            name: 'HP Store Brasil',
            cnpj: '42.822.476/0001-27',
            storeLink: 'https://www.mercadolivre.com.br/perfil/HP_STORE',
            rating: 4.8
          },
          {
            id: 2,
            hpReseller: false,
            name: 'Suprimentos Online',
            cnpj: '12.345.678/0001-90',
            storeLink: 'https://www.mercadolivre.com.br/perfil/SUPRIMENTOS_ONLINE',
            rating: 3.5
          },
          {
            id: 3,
            hpReseller: true,
            name: 'Tech & Print',
            cnpj: '33.987.654/0001-21',
            storeLink: 'https://www.mercadolivre.com.br/perfil/TECH_PRINT',
            rating: 4.2
          },
          {
            id: 4,
            hpReseller: false,
            name: 'Mega Supplies',
            cnpj: '23.456.789/0001-12',
            storeLink: 'https://www.mercadolivre.com.br/perfil/MEGA_SUPPLIES',
            rating: 3.9
          },
          {
            id: 5,
            hpReseller: true,
            name: 'Cartuchos Express',
            cnpj: '45.678.901/0001-34',
            storeLink: 'https://www.mercadolivre.com.br/perfil/CARTUCHOS_EXPRESS',
            rating: 4.5
          }
        ];
        setSellers(mockSellers);
        // Salva os dados de exemplo no localStorage para uso futuro
        saveSellersToLocalStorage(mockSellers);
        setLoading(false);
      }, 1000);
    }
  }, []);

  // Funções para manipulação da paginação
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Função para filtrar os vendedores
  const filteredSellers = sellers.filter(seller => {
    const matchesSearch =
      (seller.name && seller.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (seller.cnpj && typeof seller.cnpj === 'string' && seller.cnpj.includes(searchTerm));

    if (showHPPartners) {
      return matchesSearch && seller.hpReseller;
    }
    return matchesSearch;
  });

  // Funções para manipulação dos diálogos
  const handleOpenAddDialog = () => {
    setSelectedSeller(null);
    setNewSeller({
      id: '',
      hpReseller: false,
      name: '',
      cnpj: '',
      storeLink: '',
      rating: 0
    });
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  const handleOpenEditDialog = (seller) => {
    setSelectedSeller(seller);

    // Garantir que o CNPJ esteja formatado corretamente ao abrir o diálogo de edição
    const formattedCNPJ = formatCNPJ(seller.cnpj);

    setNewSeller({
      id: seller.id,
      hpReseller: seller.hpReseller,
      name: seller.name,
      cnpj: formattedCNPJ, // Usar o CNPJ já formatado
      storeLink: seller.storeLink,
      rating: seller.rating
    });
    setOpenAddDialog(true);
  };

  const handleOpenDeleteDialog = (seller) => {
    setSelectedSeller(seller);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleOpenImportDialog = () => {
    setOpenImportDialog(true);
  };

  const handleCloseImportDialog = () => {
    setOpenImportDialog(false);
  };

  const handleOpenBulkDeleteDialog = () => {
    setOpenBulkDeleteDialog(true);
  };

  const handleCloseBulkDeleteDialog = () => {
    setOpenBulkDeleteDialog(false);
  };

  // Funções para ações CRUD de vendedores
  const handleSaveSeller = () => {
    let updatedSellers;

    if (selectedSeller) {
      // Editar vendedor existente
      updatedSellers = sellers.map(seller =>
        seller.id === selectedSeller.id ? { ...newSeller } : seller
      );
      setSellers(updatedSellers);
      setNotification({
        open: true,
        message: 'Vendedor atualizado com sucesso!',
        severity: 'success'
      });
    } else {
      // Adicionar novo vendedor
      const newId = Math.max(0, ...sellers.map(s => s.id)) + 1;
      const sellerToAdd = { ...newSeller, id: newId };
      updatedSellers = [...sellers, sellerToAdd];
      setSellers(updatedSellers);
      setNotification({
        open: true,
        message: 'Vendedor adicionado com sucesso!',
        severity: 'success'
      });
    }

    // Salvar alterações no localStorage
    saveSellersToLocalStorage(updatedSellers);
    handleCloseAddDialog();
  };

  const handleDeleteSeller = () => {
    if (selectedSeller) {
      const updatedSellers = sellers.filter(seller => seller.id !== selectedSeller.id);
      setSellers(updatedSellers);

      // Salvar alterações no localStorage
      saveSellersToLocalStorage(updatedSellers);

      setNotification({
        open: true,
        message: 'Vendedor excluído com sucesso!',
        severity: 'success'
      });
    }
    handleCloseDeleteDialog();
  };

  const handleBulkDeleteSellers = () => {
    const sellersToDelete = sellers.filter(s => s.selected);
    if (sellersToDelete.length > 0) {
      const updatedSellers = sellers.filter(seller => !seller.selected);
      setSellers(updatedSellers);

      // Salvar alterações no localStorage
      saveSellersToLocalStorage(updatedSellers);

      setNotification({
        open: true,
        message: 'Vendedores excluídos com sucesso!',
        severity: 'success'
      });
    }
    handleCloseBulkDeleteDialog();
  };

  // Funções para importação e exportação de dados
  const handleExportTemplate = () => {
    const templateData = [
      { ID: '', 'HP+ Reseller': 'Sim', 'Razão Social': '', CNPJ: '', 'Link Loja': '' }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo');

    // Configurar a largura das colunas
    const wscols = [
      { wch: 5 },  // ID
      { wch: 12 }, // HP+ Reseller
      { wch: 30 }, // Razão Social
      { wch: 20 }, // CNPJ
      { wch: 40 }  // Link Loja
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, 'modelo_vendedores.xlsx');

    setNotification({
      open: true,
      message: 'Modelo de planilha baixado com sucesso!',
      severity: 'success'
    });
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        let jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Processar e validar os dados
        const validatedData = jsonData.map(row => {
          // Formatar CNPJ ao importar dados
          const formattedCNPJ = formatCNPJ(row.CNPJ);

          return {
            id: row.ID || Math.max(0, ...sellers.map(s => s.id)) + 1,
            hpReseller: row['HP+ Reseller'] === 'Sim',
            name: row['Razão Social'],
            cnpj: formattedCNPJ, // Usar CNPJ formatado
            storeLink: row['Link Loja'],
            rating: 0 // Valor padrão
          };
        });

        // Adicionar à lista de vendedores
        const newSellers = [...sellers];
        validatedData.forEach(newSeller => {
          const existingIndex = newSellers.findIndex(s => s.cnpj === newSeller.cnpj);
          if (existingIndex >= 0) {
            newSellers[existingIndex] = newSeller;
          } else {
            newSellers.push(newSeller);
          }
        });

        setSellers(newSellers);

        // Salvar no localStorage para persistir os dados
        saveSellersToLocalStorage(newSellers);

        setNotification({
          open: true,
          message: `${validatedData.length} vendedores importados com sucesso!`,
          severity: 'success'
        });
        handleCloseImportDialog();
      } catch (error) {
        console.error('Erro ao importar arquivo:', error);
        setNotification({
          open: true,
          message: 'Erro ao importar arquivo. Verifique o formato.',
          severity: 'error'
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Função para fechar a notificação
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  // Função para validar CNPJ
  const validateCNPJ = (cnpj) => {
    // Se o CNPJ estiver vazio ou incompleto (menos de 14 dígitos), não validamos ainda
    if (!cnpj || cnpj.replace(/\D/g, '').length < 14) return true;

    // Verifica o formato completo apenas para CNPJs com 14 dígitos
    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
    return cnpjRegex.test(cnpj);
  };

  // Função para formatar CNPJ automaticamente
  const formatCNPJ = (value) => {
    // Se o valor for null ou undefined, retorna uma string vazia
    if (!value) return '';

    // Converte para string caso seja um número
    const valueAsString = String(value);

    // Remove todos os caracteres não numéricos
    const cnpjDigits = valueAsString.replace(/\D/g, '');

    // Limita a 14 dígitos
    const limitedDigits = cnpjDigits.slice(0, 14);

    // Aplica a máscara: XX.XXX.XXX/XXXX-XX
    if (limitedDigits.length <= 2) {
      return limitedDigits;
    } else if (limitedDigits.length <= 5) {
      return `${limitedDigits.slice(0, 2)}.${limitedDigits.slice(2)}`;
    } else if (limitedDigits.length <= 8) {
      return `${limitedDigits.slice(0, 2)}.${limitedDigits.slice(2, 5)}.${limitedDigits.slice(5)}`;
    } else if (limitedDigits.length <= 12) {
      return `${limitedDigits.slice(0, 2)}.${limitedDigits.slice(2, 5)}.${limitedDigits.slice(5, 8)}/${limitedDigits.slice(8)}`;
    } else {
      return `${limitedDigits.slice(0, 2)}.${limitedDigits.slice(2, 5)}.${limitedDigits.slice(5, 8)}/${limitedDigits.slice(8, 12)}-${limitedDigits.slice(12)}`;
    }
  };

  // Função para validar URL
  const validateURL = (url) => {
    // Se o URL estiver vazio, é considerado válido (não é mais obrigatório)
    if (!url) return true;

    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Renderização do componente
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 2 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              Vendedores
            </Typography>
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenAddDialog}
              >
                Novo Vendedor
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<FileUploadIcon />}
                onClick={handleOpenImportDialog}
              >
                Importar
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportTemplate}
              >
                Baixar Modelo
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={8}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar por Razão Social ou CNPJ"
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
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showHPPartners}
                    onChange={(e) => setShowHPPartners(e.target.checked)}
                  />
                }
                label="Apenas Revendedores HP+"
              />

              {/* Botão de exclusão em massa - visível apenas quando há itens selecionados */}
              {sellers.filter(s => s.selected).length > 0 && (
                <Tooltip title={`Excluir ${sellers.filter(s => s.selected).length} itens selecionados`}>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteSweepIcon />}
                    onClick={handleOpenBulkDeleteDialog}
                    size="small"
                  >
                    Excluir ({sellers.filter(s => s.selected).length})
                  </Button>
                </Tooltip>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabela de Vendedores */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="tabela de vendedores">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={
                      sellers.filter(s => s.selected).length > 0 &&
                      sellers.filter(s => s.selected).length < sellers.length
                    }
                    checked={
                      sellers.length > 0 &&
                      sellers.filter(s => s.selected).length === sellers.length
                    }
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSellers(sellers.map(seller => ({
                        ...seller,
                        selected: checked
                      })));
                    }}
                  />
                </TableCell>
                <TableCell>ID</TableCell>
                <TableCell>HP+ Reseller</TableCell>
                <TableCell>Razão Social</TableCell>
                <TableCell>CNPJ</TableCell>
                <TableCell>Link da Loja</TableCell>
                <TableCell>Nota de Avaliação</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredSellers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Nenhum vendedor encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredSellers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((seller) => (
                    <TableRow hover key={seller.id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={seller.selected || false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSellers(sellers.map(s =>
                              s.id === seller.id ? { ...s, selected: checked } : s
                            ));
                          }}
                        />
                      </TableCell>
                      <TableCell>{seller.id}</TableCell>
                      <TableCell>{seller.hpReseller ? 'Sim' : 'Não'}</TableCell>
                      <TableCell>{seller.name}</TableCell>
                      <TableCell>{seller.cnpj}</TableCell>
                      <TableCell>
                        <a href={seller.storeLink} target="_blank" rel="noopener noreferrer">
                          {seller.storeLink}
                        </a>
                      </TableCell>
                      <TableCell>{seller.rating.toFixed(1)}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenEditDialog(seller)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton
                            color="error"
                            onClick={() => handleOpenDeleteDialog(seller)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredSellers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Itens por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      {/* Diálogo para Adicionar/Editar Vendedor */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedSeller ? 'Editar Vendedor' : 'Novo Vendedor'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Razão Social"
                value={newSeller.name}
                onChange={(e) => setNewSeller({ ...newSeller, name: e.target.value })}
                required
                margin="normal"
                error={!newSeller.name}
                helperText={!newSeller.name ? 'Campo obrigatório' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CNPJ"
                value={newSeller.cnpj}
                onChange={(e) => {
                  // Aplica a formatação automaticamente enquanto o usuário digita
                  const formattedCNPJ = formatCNPJ(e.target.value);
                  setNewSeller({ ...newSeller, cnpj: formattedCNPJ });
                }}
                required
                margin="normal"
                placeholder="00.000.000/0001-00"
                error={newSeller.cnpj && !validateCNPJ(newSeller.cnpj)}
                helperText={newSeller.cnpj && !validateCNPJ(newSeller.cnpj) ? 'CNPJ inválido' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Link da Loja"
                value={newSeller.storeLink}
                onChange={(e) => setNewSeller({ ...newSeller, storeLink: e.target.value })}
                margin="normal"
                placeholder="https://www.exemplo.com"
                error={newSeller.storeLink && !validateURL(newSeller.storeLink)}
                helperText={newSeller.storeLink && !validateURL(newSeller.storeLink) ? 'URL inválida' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nota de Avaliação"
                type="number"
                InputProps={{
                  inputProps: { min: 0, max: 5, step: 0.1 }
                }}
                value={newSeller.rating}
                onChange={(e) => setNewSeller({ ...newSeller, rating: parseFloat(e.target.value) || 0 })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newSeller.hpReseller}
                    onChange={(e) => setNewSeller({ ...newSeller, hpReseller: e.target.checked })}
                  />
                }
                label="Revendedor HP+ Autorizado"
                sx={{ mt: 2 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleSaveSeller}
            color="primary"
            variant="contained"
            disabled={
              !newSeller.name ||
              !newSeller.cnpj ||
              !validateCNPJ(newSeller.cnpj) ||
              (newSeller.storeLink && !validateURL(newSeller.storeLink))
            }
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para Excluir Vendedor */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o vendedor{' '}
            <strong>{selectedSeller?.name}</strong>?
            Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleDeleteSeller} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para Exclusão em Massa de Vendedores */}
      <Dialog open={openBulkDeleteDialog} onClose={handleCloseBulkDeleteDialog}>
        <DialogTitle>Confirmar Exclusão em Massa</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir os vendedores selecionados?
            Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBulkDeleteDialog} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleBulkDeleteSellers} color="error" variant="contained">
            Excluir Selecionados
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para Importar Vendedores */}
      <Dialog open={openImportDialog} onClose={handleCloseImportDialog}>
        <DialogTitle>Importar Vendedores</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Faça upload de uma planilha Excel (.xlsx) com a lista de vendedores.
            A planilha deve seguir o modelo disponível para download.
          </DialogContentText>
          <Button
            variant="outlined"
            component="label"
            startIcon={<FileUploadIcon />}
            fullWidth
          >
            Selecionar Arquivo
            <input
              type="file"
              accept=".xlsx"
              hidden
              onChange={handleFileImport}
            />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportDialog} color="inherit">
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notificações */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Sellers;
