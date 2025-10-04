import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  CircularProgress,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import BackupIcon from '@mui/icons-material/Backup';
import RestoreIcon from '@mui/icons-material/Restore';
import { useAuth } from '../../../hooks/useAuth';

const SystemSettings = () => {
  const { token: authToken, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Estado para configurações do sistema
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    debugMode: false,
    logLevel: 'info',
    maxProductsPerUser: 50,
    maxApiRequestsPerDay: 1000,
    emailNotifications: true,
    autoBackupEnabled: true,
    autoBackupInterval: 'daily',
    theme: 'light'
  });

  // Carregar configurações
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token') || authToken;
        if (!token) {
          setError('Sessão expirada. Por favor, faça login novamente.');
          setLoading(false);
          return;
        }

        // Simulação de carregamento (remover quando conectar a API real)
        setTimeout(() => {
          // Aqui seria feita a chamada real à API
          // const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/settings/system`, {
          //   headers: { Authorization: `Bearer ${token}` }
          // });
          // setSettings(response.data);
          setLoading(false);
        }, 1000);

      } catch (err) {
        console.error('Erro ao carregar configurações do sistema:', err);
        setError('Não foi possível carregar as configurações. Por favor, tente novamente.');
        setLoading(false);
      }
    };

    fetchSettings();
  }, [authToken]);

  // Atualizar configurações
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: e.target.type === 'checkbox' ? checked : value
    }));
  };

  // Salvar configurações
  const handleSaveSettings = async () => {
    setLoading(true);
    setSaveSuccess(false);

    try {
      const token = localStorage.getItem('token') || authToken;
      if (!token) {
        setError('Sessão expirada. Por favor, faça login novamente.');
        setLoading(false);
        return;
      }

      // Simulação de salvamento (remover quando conectar a API real)
      setTimeout(() => {
        // Aqui seria feita a chamada real à API
        // await axios.post(`${process.env.REACT_APP_API_URL}/api/settings/system`, settings, {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        setSaveSuccess(true);
        setLoading(false);

        // Limpar mensagem de sucesso após 3 segundos
        setTimeout(() => setSaveSuccess(false), 3000);
      }, 1000);

    } catch (err) {
      console.error('Erro ao salvar configurações do sistema:', err);
      setError('Não foi possível salvar as configurações. Por favor, tente novamente.');
      setLoading(false);
    }
  };

  // Backup do sistema
  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      // Simulação de backup
      setTimeout(() => {
        setLoading(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }, 1500);
    } catch (err) {
      setError('Erro ao criar backup do sistema');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Configurações do Sistema
      </Typography>

      {/* Banner para identificar a página */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          bgcolor: 'primary.light',
          color: 'primary.contrastText',
          borderLeft: '6px solid',
          borderColor: 'primary.main',
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          Configurações Gerais
        </Typography>
        <Typography variant="body1">
          Gerencie as configurações globais do sistema, incluindo modo de manutenção,
          limites operacionais e configurações de backup.
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaveSuccess(false)}>
          Configurações salvas com sucesso!
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Configurações gerais */}
          <Grid item xs={12}>
            <Accordion defaultExpanded>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <SettingsIcon sx={{ mr: 1 }} /> Configurações Gerais
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.maintenanceMode}
                          onChange={handleChange}
                          name="maintenanceMode"
                          color="warning"
                        />
                      }
                      label="Modo de Manutenção"
                    />
                    <Typography variant="caption" color="text.secondary" display="block">
                      Quando ativado, o sistema ficará indisponível para usuários normais
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.debugMode}
                          onChange={handleChange}
                          name="debugMode"
                          color="primary"
                        />
                      }
                      label="Modo de Depuração"
                    />
                    <Typography variant="caption" color="text.secondary" display="block">
                      Ativa logs detalhados para ajudar na resolução de problemas
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel>Nível de Logs</InputLabel>
                      <Select
                        name="logLevel"
                        value={settings.logLevel}
                        label="Nível de Logs"
                        onChange={handleChange}
                      >
                        <MenuItem value="error">Apenas Erros</MenuItem>
                        <MenuItem value="warn">Avisos e Erros</MenuItem>
                        <MenuItem value="info">Informações</MenuItem>
                        <MenuItem value="debug">Detalhado (Debug)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel>Tema do Sistema</InputLabel>
                      <Select
                        name="theme"
                        value={settings.theme}
                        label="Tema do Sistema"
                        onChange={handleChange}
                      >
                        <MenuItem value="light">Claro</MenuItem>
                        <MenuItem value="dark">Escuro</MenuItem>
                        <MenuItem value="auto">Automático (Baseado no sistema)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Limites e Restrições */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel2a-content"
                id="panel2a-header"
              >
                <Typography variant="h6">Limites e Restrições</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Máximo de Produtos por Usuário"
                      type="number"
                      name="maxProductsPerUser"
                      value={settings.maxProductsPerUser}
                      onChange={handleChange}
                      InputProps={{ inputProps: { min: 1 } }}
                    />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Quantidade máxima de produtos que cada usuário pode rastrear
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Máximo de Requisições de API por Dia"
                      type="number"
                      name="maxApiRequestsPerDay"
                      value={settings.maxApiRequestsPerDay}
                      onChange={handleChange}
                      InputProps={{ inputProps: { min: 100 } }}
                    />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Limite diário de requisições à API por usuário
                    </Typography>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Backup e Restauração */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel3a-content"
                id="panel3a-header"
              >
                <Typography variant="h6">Backup e Restauração</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.autoBackupEnabled}
                          onChange={handleChange}
                          name="autoBackupEnabled"
                          color="primary"
                        />
                      }
                      label="Backup Automático"
                    />
                    <Typography variant="caption" color="text.secondary" display="block">
                      Realiza backups automaticamente no intervalo definido
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel>Intervalo de Backup</InputLabel>
                      <Select
                        name="autoBackupInterval"
                        value={settings.autoBackupInterval}
                        label="Intervalo de Backup"
                        onChange={handleChange}
                        disabled={!settings.autoBackupEnabled}
                      >
                        <MenuItem value="daily">Diário</MenuItem>
                        <MenuItem value="weekly">Semanal</MenuItem>
                        <MenuItem value="monthly">Mensal</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Ações de Backup
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<BackupIcon />}
                      onClick={handleCreateBackup}
                      sx={{ mr: 2 }}
                    >
                      Criar Backup Manual
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<RestoreIcon />}
                    >
                      Restaurar Backup
                    </Button>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Botão Salvar */}
          <Grid item xs={12} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSaveSettings}
              disabled={loading}
            >
              Salvar Configurações
            </Button>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default SystemSettings;
