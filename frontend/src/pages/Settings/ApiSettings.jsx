import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  Paper,
  InputAdornment,
  IconButton
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import settingsService from '../../services/settingsService';
import { useAuth } from '../../hooks/useAuth';

const ApiSettings = () => {
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

  useEffect(() => {
    // Carregar a configuração da API
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    setIsLoading(true);
    try {
      const response = await settingsService.getOpenAIKey();
      if (response.data && response.data.apiKey) {
        setMaskedApiKey(response.data.apiKey);
        setIsKeyConfigured(response.data.isConfigured);
      }
    } catch (error) {
      console.error('Erro ao carregar chave da API:', error);
      setMessage('Não foi possível carregar a configuração da API. Verifique sua conexão ou tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateKey = async () => {
    setValidating(true);
    setIsValid(null);
    try {
      const response = await settingsService.validateOpenAIKey();
      setIsValid(response.data.valid);
      setMessage(response.data.message);
    } catch (error) {
      setIsValid(false);
      setMessage('Erro ao validar a chave da API. Verifique se a chave é válida e tente novamente.');
    } finally {
      setValidating(false);
    }
  };

  const handleSaveKey = async () => {
    setIsLoading(true);
    setSaveSuccess(false);
    try {
      await settingsService.saveOpenAIKey(apiKey);
      setMessage('Chave da API salva com sucesso!');
      setSaveSuccess(true);
      loadApiKey(); // Recarregar a chave mascarada
    } catch (error) {
      setMessage('Erro ao salvar a chave da API. Tente novamente.');
      setSaveSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = user && user.role === 'admin';

  if (!isAdmin) {
    return (
      <Box sx={{ padding: 3 }}>
        <Alert severity="warning">
          Apenas administradores podem acessar as configurações da API.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Configurações da API
      </Typography>

      <Paper elevation={3} sx={{ padding: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Configuração da API OpenAI
        </Typography>
        <Typography variant="body1" paragraph>
          Configure sua chave de API da OpenAI para utilizar funcionalidades como análise de sentimento,
          detecção de vendedores suspeitos e assistente virtual.
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {isKeyConfigured && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Status atual:
            </Typography>
            <Alert severity="info" icon={<CheckCircleIcon />}>
              A chave da API está configurada: {maskedApiKey}
            </Alert>
            <Button
              variant="outlined"
              color="primary"
              sx={{ mt: 1 }}
              onClick={handleValidateKey}
              disabled={validating}
            >
              {validating ? <CircularProgress size={24} /> : 'Validar Chave'}
            </Button>

            {isValid !== null && (
              <Alert
                severity={isValid ? "success" : "error"}
                sx={{ mt: 2 }}
                icon={isValid ? <CheckCircleIcon /> : <ErrorIcon />}
              >
                {message}
              </Alert>
            )}
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            {isKeyConfigured ? 'Atualizar chave da API:' : 'Adicionar chave da API:'}
          </Typography>

          <TextField
            fullWidth
            label="Chave da API OpenAI"
            variant="outlined"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            type={showApiKey ? 'text' : 'password'}
            placeholder="sk-..."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle key visibility"
                    onClick={() => setShowApiKey(!showApiKey)}
                    edge="end"
                  >
                    {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2}>
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveKey}
                disabled={isLoading || !apiKey.trim()}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Salvar Chave'}
              </Button>
            </Grid>
          </Grid>

          {saveSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {message}
            </Alert>
          )}

          {!isKeyConfigured && !saveSuccess && message !== 'Chave da API salva com sucesso!' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Nenhuma chave configurada. Adicione uma chave para utilizar as funcionalidades da OpenAI.
            </Alert>
          )}
        </Box>

        {isKeyConfigured || saveSuccess ? (
          <Typography variant="body2" color="textSecondary">
            A chave da API será armazenada de forma segura no servidor e utilizada apenas para
            comunicação com os serviços da OpenAI. A chave nunca é compartilhada com terceiros.
          </Typography>
        ) : null}
      </Paper>
    </Box>
  );
};

export default ApiSettings;
