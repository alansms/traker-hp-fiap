import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
  Divider,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Save as SaveIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Lock as LockIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import settingsService from '../../services/settingsService';
import { useAuth } from '../../hooks/useAuth';

const ApiKeySettings = () => {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isEditable, setIsEditable] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [sentimentAnalysisEnabled, setSentimentAnalysisEnabled] = useState(true);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');

  // Verificar se o usuário tem permissões de administrador
  const isAdmin = user && (user.role === 'admin' || user.is_superuser || user.is_admin);

  // Função para verificar se um usuário tem permissão para editar configurações da API
  const canEditApiSettings = () => {
    return isAdmin;
  };

  // Carregar configuração existente
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        setLoading(true);
        const response = await settingsService.getOpenAIKey();

        if (response.apiKey) {
          setApiKey(response.apiKey);
        }

        setIsConfigured(response.isConfigured);
        setIsEditable(response.isEditable !== false && canEditApiSettings()); // Verifica permissões

        // Carregar outras configurações
        try {
          const systemSettings = await settingsService.getSystemSettings();
          setSentimentAnalysisEnabled(
            systemSettings?.openai_settings?.sentiment_analysis_enabled !== false
          );
          setSelectedModel(
            systemSettings?.openai_settings?.model || 'gpt-4o'
          );
        } catch (settingsError) {
          console.warn('Não foi possível carregar configurações adicionais:', settingsError);
        }
      } catch (error) {
        console.error('Erro ao carregar chave da API:', error);

        if (error.response && error.response.status === 403) {
          setErrorMessage('Você não tem permissões para visualizar as configurações da API OpenAI.');
        } else {
          setErrorMessage('Não foi possível carregar a configuração da API. Verifique sua conexão ou tente novamente.');
        }

        // Desabilitar edição se não tiver permissões
        setIsEditable(false);
      } finally {
        setLoading(false);
      }
    };

    loadApiKey();
  }, [user]);

  // Salvar chave da API
  const handleSaveApiKey = async () => {
    try {
      setValidating(true);
      setSaveSuccess(null);
      setErrorMessage(null);

      // Primeiro salva a chave da API
      const response = await settingsService.saveOpenAIKey(apiKey);

      // Depois salva as configurações adicionais
      const settingsResponse = await settingsService.saveSystemSettings({
        openai_settings: {
          sentiment_analysis_enabled: sentimentAnalysisEnabled,
          model: selectedModel
        }
      });

      if (response.success) {
        setSaveSuccess('Configurações da API OpenAI salvas e validadas com sucesso!');
        setApiKey(response.apiKey);
        setIsConfigured(true);
      } else {
        setErrorMessage(response.message);
      }
    } catch (error) {
      console.error('Erro ao salvar chave da API:', error);

      // Verificar se é um erro de permissão (403)
      if (error.response && error.response.status === 403) {
        setErrorMessage('Você não tem permissões de administrador para gerenciar chaves de API. Entre em contato com um administrador do sistema.');
      } else {
        setErrorMessage('Erro ao salvar a chave da API. Verifique sua conexão ou tente novamente mais tarde.');
      }
    } finally {
      setValidating(false);
    }
  };

  // Se o usuário não tiver permissões, mostrar mensagem apropriada
  if (!canEditApiSettings() && !loading) {
    return (
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <LockIcon color="action" sx={{ mr: 1 }} />
          <Typography variant="h6">
            Configuração da API OpenAI
          </Typography>
        </Box>

        <Alert severity="info" icon={<AdminIcon />}>
          As configurações da API OpenAI só podem ser gerenciadas por administradores.
          {isConfigured
            ? ' O sistema está configurado para usar a API OpenAI.'
            : ' O sistema não está configurado para usar a API OpenAI.'}
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Configuração da API OpenAI
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        Configure sua chave de API da OpenAI para utilizar funcionalidades como análise de sentimento,
        detecção de vendedores suspeitos e assistente virtual.
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <>
          {!isEditable ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              A chave da API está configurada via variável de ambiente. Para modificá-la, edite o arquivo .env ou atualize as variáveis de ambiente do servidor.
            </Alert>
          ) : (
            <Box mt={2}>
              <TextField
                fullWidth
                label="Chave da API OpenAI"
                variant="outlined"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type={showApiKey ? 'text' : 'password'}
                placeholder="Comece com sk-..."
                disabled={validating || !isEditable}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle key visibility"
                        onClick={() => setShowApiKey(!showApiKey)}
                        edge="end"
                      >
                        {showApiKey ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText="Sua chave será armazenada de forma segura no banco de dados"
              />

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle1" gutterBottom>
                Configurações Adicionais
              </Typography>

              <Box my={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={sentimentAnalysisEnabled}
                      onChange={(e) => setSentimentAnalysisEnabled(e.target.checked)}
                      color="primary"
                      disabled={validating || !isEditable}
                    />
                  }
                  label="Habilitar Análise de Sentimento e Detecção de Vendedores Suspeitos"
                />

                <Tooltip title="Esta funcionalidade usa a API da OpenAI para analisar comentários e avaliar a reputação de vendedores.">
                  <Chip
                    label="Recurso Avançado"
                    size="small"
                    color="primary"
                    sx={{ ml: 1 }}
                  />
                </Tooltip>
              </Box>

              <Box mb={3}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Modelo da OpenAI</InputLabel>
                  <Select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    label="Modelo da OpenAI"
                    disabled={validating || !isEditable}
                  >
                    <MenuItem value="gpt-4o">GPT-4o (Recomendado)</MenuItem>
                    <MenuItem value="gpt-4">GPT-4</MenuItem>
                    <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Mais econômico)</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box mt={2} display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={validating ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  onClick={handleSaveApiKey}
                  disabled={validating || !apiKey}
                >
                  {validating ? 'Validando...' : 'Salvar e Validar'}
                </Button>
              </Box>
            </Box>
          )}

          {saveSuccess && (
            <Alert
              severity="success"
              icon={<CheckIcon />}
              sx={{ mt: 2 }}
            >
              {saveSuccess}
            </Alert>
          )}

          {errorMessage && (
            <Alert
              severity="error"
              icon={<ErrorIcon />}
              sx={{ mt: 2 }}
            >
              {errorMessage}
            </Alert>
          )}

          {isConfigured && !errorMessage && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Status: {saveSuccess ? 'Chave configurada e validada' : 'Chave configurada'}
              {sentimentAnalysisEnabled
                ? ' - Análise de sentimento está habilitada.'
                : ' - Análise de sentimento está desabilitada.'}
            </Alert>
          )}

          <Box mt={2}>
            <Typography variant="caption" color="text.secondary">
              Para obter uma chave da API, acesse <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">platform.openai.com/api-keys</a>
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default ApiKeySettings;
