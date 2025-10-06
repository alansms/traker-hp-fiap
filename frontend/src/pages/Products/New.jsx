import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Grid,
  MenuItem,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  InputAdornment
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Add as AddIcon,
  FileDownload as FileDownloadIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';

const NewProduct = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [formValues, setFormValues] = useState({
    partNumber: '',
    family: '',
    productName: '',
    averagePages: '',
    suggestedPrice: '',
    url: '',
    category: '',
    yield: '',
    technology: '',
    model: '',
    color: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [fileUploadStatus, setFileUploadStatus] = useState({
    uploading: false,
    error: null,
    success: false,
    filename: ''
  });

  // Categorias disponíveis para seleção
  const categories = [
    { value: 'cartuchos', label: 'Cartuchos' },
    { value: 'impressoras', label: 'Impressoras' },
    { value: 'toners', label: 'Toners' },
    { value: 'outros', label: 'Outros Produtos' }
  ];

  // Handler para mudança de tabs
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Validação do formulário manual
  const validateForm = () => {
    const errors = {};

    if (!formValues.partNumber.trim()) {
      errors.partNumber = 'PN (Part Number) é obrigatório';
    }

    if (!formValues.family.trim()) {
      errors.family = 'Família é obrigatória';
    }

    if (!formValues.productName.trim()) {
      errors.productName = 'Nome do produto é obrigatório';
    }

    if (!formValues.averagePages) {
      errors.averagePages = 'Média de Páginas Impressas é obrigatória';
    } else if (isNaN(parseInt(formValues.averagePages)) || parseInt(formValues.averagePages) <= 0) {
      errors.averagePages = 'Média de páginas deve ser um número positivo';
    }

    if (!formValues.suggestedPrice) {
      errors.suggestedPrice = 'Preço Sugerido é obrigatório';
    } else if (isNaN(parseFloat(formValues.suggestedPrice)) || parseFloat(formValues.suggestedPrice) <= 0) {
      errors.suggestedPrice = 'Preço deve ser um número positivo';
    }

    // Validação da URL caso seja fornecida (campo opcional)
    if (formValues.url.trim() && (!formValues.url.includes('mercadolivre.com.br') && !formValues.url.includes('meli.com'))) {
      errors.url = 'URL deve ser do Mercado Livre';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler para mudanças no formulário
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues({
      ...formValues,
      [name]: value
    });

    // Limpar erro do campo que está sendo editado
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: undefined
      });
    }
  };

  // Handler para envio do formulário manual
  const handleManualSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Simular envio para a API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Aqui seria a chamada real para a API:
      // const response = await fetch('/api/products', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formValues)
      // });

      setSnackbar({
        open: true,
        message: 'Produto cadastrado com sucesso!',
        severity: 'success'
      });

      // Limpar formulário após o cadastro
      setFormValues({
        partNumber: '',
        family: '',
        productName: '',
        averagePages: '',
        suggestedPrice: '',
        url: '',
        category: '',
        yield: '',
        technology: '',
        model: '',
        color: '',
        description: ''
      });
    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao cadastrar produto. Tente novamente.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Configuração do Dropzone para upload de arquivos
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    onDrop: acceptedFiles => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setFileUploadStatus({
        uploading: true,
        error: null,
        success: false,
        filename: file.name
      });

      // Processar o arquivo Excel
      processExcelFile(file);
    },
    onDropRejected: () => {
      setFileUploadStatus({
        uploading: false,
        error: 'Apenas arquivos .xlsx são aceitos',
        success: false,
        filename: ''
      });
    }
  });

  // Processa o arquivo Excel importado
  const processExcelFile = async (file) => {
    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          // Pegar a primeira planilha
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            throw new Error('A planilha está vazia');
          }

          // Validar estrutura da planilha
          validateExcelStructure(jsonData);

          // Simular envio dos dados para a API
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Aqui seria a chamada real para a API:
          // const response = await fetch('/api/products/batch', {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({ products: jsonData })
          // });

          setFileUploadStatus({
            uploading: false,
            error: null,
            success: true,
            filename: file.name
          });

          setSnackbar({
            open: true,
            message: `${jsonData.length} produtos importados com sucesso!`,
            severity: 'success'
          });
        } catch (error) {
          console.error('Erro ao processar planilha:', error);
          setFileUploadStatus({
            uploading: false,
            error: error.message || 'Erro ao processar planilha',
            success: false,
            filename: file.name
          });
        }
      };

      reader.onerror = () => {
        setFileUploadStatus({
          uploading: false,
          error: 'Erro ao ler o arquivo',
          success: false,
          filename: file.name
        });
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Erro ao ler arquivo:', error);
      setFileUploadStatus({
        uploading: false,
        error: 'Erro ao ler o arquivo',
        success: false,
        filename: file.name
      });
    }
  };

  // Validar estrutura da planilha importada
  const validateExcelStructure = (data) => {
    if (!data || data.length === 0) {
      throw new Error('Planilha vazia ou formato inválido');
    }

    // Verificar se todas as colunas obrigatórias existem
    const requiredColumns = [
      'pn',
      'familia',
      'produto',
      'mediapaginasimpressas',
      'precosugerido'
    ];
    const firstRow = data[0];

    const missingColumns = requiredColumns.filter(col =>
      !Object.keys(firstRow).some(key =>
        key.toLowerCase() === col || key.toLowerCase().replace(/\s+/g, '') === col
      )
    );

    if (missingColumns.length > 0) {
      throw new Error(`Colunas obrigatórias ausentes: ${missingColumns.join(', ')}`);
    }

    // Validar valores de cada linha
    const invalidRows = data.reduce((acc, row, index) => {
      // Verificar PN
      const pn = row.pn || row.PN || row['Part Number'];
      if (!pn) {
        acc.push(`Linha ${index + 2}: PN (Part Number) ausente`);
      }

      // Verificar Família
      const family = row.familia || row.Familia || row.FAMILIA;
      if (!family) {
        acc.push(`Linha ${index + 2}: Família ausente`);
      }

      // Verificar Produto
      const product = row.produto || row.Produto || row.PRODUTO;
      if (!product) {
        acc.push(`Linha ${index + 2}: Nome do Produto ausente`);
      }

      // Verificar Média de Páginas
      const pages = parseInt(row.mediapaginasimpressas || row['Média de Páginas Impressas'] || row['Media de Paginas Impressas'] || 0);
      if (isNaN(pages) || pages <= 0) {
        acc.push(`Linha ${index + 2}: Média de Páginas Impressas inválida`);
      }

      // Verificar Preço
      const price = parseFloat(row.precosugerido || row['Preço Sugerido'] || row.preco || 0);
      if (isNaN(price) || price <= 0) {
        acc.push(`Linha ${index + 2}: Preço Sugerido inválido`);
      }

      return acc;
    }, []);

    if (invalidRows.length > 0) {
      throw new Error(`Foram encontrados erros na planilha:\n${invalidRows.slice(0, 5).join('\n')}${invalidRows.length > 5 ? `\n...e ${invalidRows.length - 5} mais.` : ''}`);
    }
  };

  // Download do modelo de planilha
  const handleDownloadTemplate = () => {
    // Criar dados do modelo
    const templateData = [
      {
        pn: 'F6V29AB',
        familia: 'LaserJet',
        produto: 'Cartucho HP 664 Preto Original',
        mediapaginasimpressas: 120,
        precosugerido: 89.90
        // Os campos opcionais foram removidos do modelo
      }
    ];

    // Criar planilha
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos');

    // Adicionar uma aba de instruções
    const instructionsData = [
      ['Instruções para preenchimento do modelo de importação'],
      [''],
      ['1. Não altere o nome das colunas'],
      ['2. Campos obrigatórios: pn, familia, produto, mediapaginasimpressas, precosugerido'],
      ['3. O campo "precosugerido" deve ser um número positivo, usando ponto como separador decimal'],
      ['4. O campo "mediapaginasimpressas" deve ser um número que representa a média de páginas impressas'],
      [''],
      ['Para dúvidas, entre em contato com o suporte.']
    ];

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instruções');

    // Converter para arquivo e fazer download
    XLSX.writeFile(workbook, 'modelo_importacao_produtos.xlsx');
  };

  // Fechar Snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/products')}
          sx={{ mr: 2 }}
        >
          Voltar
        </Button>
        <Typography variant="h4" component="h1">
          Cadastro de Produtos
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab label="Cadastro Manual" />
          <Tab label="Importação em Lote" />
        </Tabs>

        {/* Tab de Cadastro Manual */}
        {activeTab === 0 && (
          <Box component="form" onSubmit={handleManualSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="PN (Part Number)"
                  name="partNumber"
                  value={formValues.partNumber}
                  onChange={handleFormChange}
                  error={Boolean(formErrors.partNumber)}
                  helperText={formErrors.partNumber}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Família"
                  name="family"
                  value={formValues.family}
                  onChange={handleFormChange}
                  error={Boolean(formErrors.family)}
                  helperText={formErrors.family}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label="Produto (Nome completo)"
                  name="productName"
                  value={formValues.productName}
                  onChange={handleFormChange}
                  error={Boolean(formErrors.productName)}
                  helperText={formErrors.productName}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" error={Boolean(formErrors.category)}>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    name="category"
                    value={formValues.category}
                    onChange={handleFormChange}
                    label="Categoria"
                  >
                    {categories.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.category && <FormHelperText>{formErrors.category}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tecnologia"
                  name="technology"
                  value={formValues.technology}
                  onChange={handleFormChange}
                  error={Boolean(formErrors.technology)}
                  helperText={formErrors.technology}
                  margin="normal"
                  placeholder="Ex: Jato de Tinta, Laser, LED"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Modelo compatível"
                  name="model"
                  value={formValues.model}
                  onChange={handleFormChange}
                  error={Boolean(formErrors.model)}
                  helperText={formErrors.model}
                  margin="normal"
                  placeholder="Ex: HP DeskJet 2700"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cor"
                  name="color"
                  value={formValues.color}
                  onChange={handleFormChange}
                  error={Boolean(formErrors.color)}
                  helperText={formErrors.color}
                  margin="normal"
                  placeholder="Ex: Preto, Colorido, Ciano"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Média de Páginas Impressas"
                  name="averagePages"
                  type="number"
                  value={formValues.averagePages}
                  onChange={handleFormChange}
                  error={Boolean(formErrors.averagePages)}
                  helperText={formErrors.averagePages}
                  margin="normal"
                  required
                  InputProps={{
                    endAdornment: <InputAdornment position="end">páginas</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Rendimento"
                  name="yield"
                  value={formValues.yield}
                  onChange={handleFormChange}
                  error={Boolean(formErrors.yield)}
                  helperText={formErrors.yield}
                  margin="normal"
                  placeholder="Ex: 120 páginas"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Preço Sugerido"
                  name="suggestedPrice"
                  type="number"
                  value={formValues.suggestedPrice}
                  onChange={handleFormChange}
                  error={Boolean(formErrors.suggestedPrice)}
                  helperText={formErrors.suggestedPrice}
                  margin="normal"
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URL do Mercado Livre (opcional)"
                  name="url"
                  value={formValues.url}
                  onChange={handleFormChange}
                  error={Boolean(formErrors.url)}
                  helperText={formErrors.url || "Cole aqui a URL do produto no Mercado Livre"}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrição (opcional)"
                  name="description"
                  value={formValues.description}
                  onChange={handleFormChange}
                  margin="normal"
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                disabled={loading}
              >
                {loading ? 'Cadastrando...' : 'Cadastrar Produto'}
                {loading && <CircularProgress size={24} sx={{ ml: 1 }} />}
              </Button>
            </Box>
          </Box>
        )}

        {/* Tab de Importação em Lote */}
        {activeTab === 1 && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Importe vários produtos de uma vez usando nosso modelo de planilha. Certifique-se de seguir o formato exato para evitar erros.
            </Alert>

            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<FileDownloadIcon />}
                onClick={handleDownloadTemplate}
              >
                Baixar Modelo de Planilha
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                '&:hover': {
                  borderColor: theme => theme.palette.primary.main,
                  backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              <input {...getInputProps()} />
              <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Arraste e solte sua planilha aqui
              </Typography>
              <Typography variant="body2" color="textSecondary">
                ou clique para selecionar o arquivo (apenas .xlsx)
              </Typography>
            </Box>

            {fileUploadStatus.filename && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Arquivo:</strong> {fileUploadStatus.filename}
                </Typography>

                {fileUploadStatus.uploading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <Typography variant="body2">Processando planilha...</Typography>
                  </Box>
                )}

                {fileUploadStatus.error && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {fileUploadStatus.error}
                  </Alert>
                )}

                {fileUploadStatus.success && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    Planilha processada com sucesso!
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NewProduct;
