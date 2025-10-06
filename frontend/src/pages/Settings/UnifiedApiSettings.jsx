import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Switch,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Save as SaveIcon,
  Check as CheckIcon,
  Lock as LockIcon,
  Security as SecurityIcon,
  SmartToy as SmartToyIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

const UnifiedApiSettings = () => {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [maskedApiKey, setMaskedApiKey] = useState('');
  const [isKeyConfigured, setIsKeyConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [isValid, setIsValid] = useState(null);
  const [message, setMessage] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [sentimentAnalysisEnabled, setSentimentAnalysisEnabled] = useState(true);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');

  // Verificar se o usuário tem permissões de administrador
  const isAdmin = user && (user.role === 'admin' || user.is_superuser || user.is_admin);

  useEffect(() => {
    loadApiKey();
    loadAdditionalSettings();
  }, []);

  const loadApiKey = async () => {
    setIsLoading(true);
    try {
      // Simular carregamento da chave da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMaskedApiKey('sk-...***...***');
      setIsKeyConfigured(true);
    } catch (error) {
      console.error('Erro ao carregar chave da API:', error);
      setMessage('Não foi possível carregar a configuração da API. Verifique sua conexão ou tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdditionalSettings = async () => {
    try {
      // Carregar configurações adicionais se necessário
      // Por enquanto, vamos usar valores padrão
    } catch (error) {
      console.error('Erro ao carregar configurações adicionais:', error);
    }
  };

  const handleApiKeyChange = (event) => {
    setApiKey(event.target.value);
    setMessage('');
    setSaveSuccess(false);
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setMessage('Por favor, insira uma chave de API válida.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // Simular salvamento da chave da API
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSaveSuccess(true);
      setMessage('Chave da API salva com sucesso!');
      setApiKey('');
      setMaskedApiKey('sk-' + apiKey.substring(3, 8) + '...***...***');
      setIsKeyConfigured(true);
    } catch (error) {
      console.error('Erro ao salvar chave da API:', error);
      setMessage('Erro ao salvar a chave da API. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateApiKey = async () => {
    if (!apiKey.trim()) {
      setMessage('Por favor, insira uma chave de API para validar.');
      return;
    }

    setValidating(true);
    setMessage('');

    try {
      // Simular validação da chave da API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular validação baseada no formato da chave
      if (apiKey.startsWith('sk-') && apiKey.length > 20) {
        setIsValid(true);
        setMessage('Chave da API é válida!');
      } else {
        setIsValid(false);
        setMessage('Chave da API inválida. Verifique se a chave está correta.');
      }
    } catch (error) {
      console.error('Erro ao validar chave da API:', error);
      setIsValid(false);
      setMessage('Erro ao validar a chave da API. Tente novamente.');
    } finally {
      setValidating(false);
    }
  };

  const handleToggleVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  const handleSaveAdditionalSettings = async () => {
    try {
      // Simular salvamento das configurações adicionais
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Configurações adicionais salvas com sucesso!');
      setSaveSuccess(true);
    } catch (error) {
      console.error('Erro ao salvar configurações adicionais:', error);
      setMessage('Erro ao salvar configurações adicionais.');
    }
  };

  const models = [
    { value: 'gpt-4o', label: 'GPT-4o (Recomendado)', description: 'Modelo mais avançado e rápido' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Versão mais econômica' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Modelo padrão' }
  ];

  if (!isAdmin) {
    return (
      <Alert severity="warning">
        Apenas administradores podem acessar as configurações da API.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Configurações da API
      </Typography>

      <Grid container spacing={3}>
        {/* Configuração da API OpenAI */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader
              avatar={<SecurityIcon color="primary" />}
              title="Configuração da API OpenAI"
              subheader="Configure sua chave de API da OpenAI para utilizar funcionalidades como análise de sentimento, detecção de vendedores suspeitos e assistente virtual."
            />
            <CardContent>
              {isLoading ? (
                <Box display="flex" justifyContent="center" py={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {isKeyConfigured && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <Box display="flex" alignItems="center">
                        <CheckIcon sx={{ mr: 1 }} />
                        Chave da API configurada com sucesso!
                      </Box>
                    </Alert>
                  )}

                  <TextField
                    fullWidth
                    label="Chave da API OpenAI"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={handleApiKeyChange}
                    placeholder="sk-..."
                    disabled={false}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleToggleVisibility}
                            edge="end"
                          >
                            {showApiKey ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />

                  {maskedApiKey && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Chave atual:
                      </Typography>
                      <Chip
                        icon={<LockIcon />}
                        label={maskedApiKey}
                        variant="outlined"
                        color="primary"
                      />
                    </Box>
                  )}

                  <Box display="flex" gap={2} mb={2}>
                    <Button
                      variant="contained"
                      onClick={handleSaveApiKey}
                      disabled={isLoading || !apiKey.trim()}
                      startIcon={<SaveIcon />}
                    >
                      {isLoading ? <CircularProgress size={20} /> : 'Salvar Chave'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleValidateApiKey}
                      disabled={validating || !apiKey.trim()}
                      startIcon={validating ? <CircularProgress size={20} /> : <CheckIcon />}
                    >
                      {validating ? 'Validando...' : 'Validar'}
                    </Button>
                  </Box>

                  {isValid !== null && (
                    <Alert severity={isValid ? 'success' : 'error'} sx={{ mb: 2 }}>
                      {isValid ? 'Chave válida!' : 'Chave inválida!'}
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Configurações Adicionais */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader
              avatar={<SmartToyIcon color="primary" />}
              title="Configurações Adicionais"
              subheader="Configure funcionalidades avançadas do sistema de IA"
            />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={sentimentAnalysisEnabled}
                      onChange={(e) => setSentimentAnalysisEnabled(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Habilitar Análise de Sentimento"
                />
                <Typography variant="caption" display="block" color="text.secondary">
                  Analisa o sentimento dos comentários e avaliações dos produtos
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Modelo da OpenAI</InputLabel>
                <Select
                  value={selectedModel}
                  label="Modelo da OpenAI"
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {models.map((model) => (
                    <MenuItem key={model.value} value={model.value}>
                      <Box>
                        <Typography variant="body1">{model.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {model.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                onClick={handleSaveAdditionalSettings}
                startIcon={<SaveIcon />}
                fullWidth
              >
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Status e Informações */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardHeader
              avatar={<AnalyticsIcon color="primary" />}
              title="Status da Integração"
              subheader="Informações sobre o funcionamento da API"
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" color={isKeyConfigured ? 'success.main' : 'error.main'}>
                      {isKeyConfigured ? '✓' : '✗'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Chave Configurada
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" color={sentimentAnalysisEnabled ? 'success.main' : 'warning.main'}>
                      {sentimentAnalysisEnabled ? '✓' : '⚠'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Análise de Sentimento
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="primary.main">
                      <span role="img" aria-label="robô">🤖</span>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Assistente Virtual
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="primary.main">
                      <span role="img" aria-label="gráfico">📊</span>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Análise de Dados
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Mensagens de feedback */}
      {message && (
        <Alert 
          severity={saveSuccess ? 'success' : 'error'} 
          sx={{ mt: 2 }}
          onClose={() => setMessage('')}
        >
          {message}
        </Alert>
      )}
    </Box>
  );
};

export default UnifiedApiSettings;
