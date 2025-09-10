import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  CircularProgress,
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
  InputLabel,
  TextField
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EmailIcon from '@mui/icons-material/Email';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import SaveIcon from '@mui/icons-material/Save';
import TelegramIcon from '@mui/icons-material/Telegram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useAuth } from '../../../hooks/useAuth';

const NotificationSettings = () => {
  const { token: authToken, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Estado para configurações de notificações
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    telegramNotifications: false,
    whatsappNotifications: false,
    priceDropNotification: true,
    priceRiseNotification: false,
    stockChangeNotification: true,
    newReviewNotification: true,
    dailyDigest: true,
    weeklyReport: true,
    notificationEmail: '',
    phoneNumber: '',
    telegramChatId: '',
    whatsappNumber: '',
    emailFrequency: 'instant',
    notificationTime: '08:00'
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
          // const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/settings/notifications`, {
          //   headers: { Authorization: `Bearer ${token}` }
          // });

          // Se o usuário estiver disponível, preencha o email automaticamente
          if (user && user.email) {
            setSettings(prev => ({
              ...prev,
              notificationEmail: user.email
            }));
          }

          setLoading(false);
        }, 1000);

      } catch (err) {
        console.error('Erro ao carregar configurações de notificações:', err);
        setError('Não foi possível carregar as configurações. Por favor, tente novamente.');
        setLoading(false);
      }
    };

    fetchSettings();
  }, [authToken, user]);

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
        // await axios.post(`${process.env.REACT_APP_API_URL}/api/settings/notifications`, settings, {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        setSaveSuccess(true);
        setLoading(false);

        // Limpar mensagem de sucesso após 3 segundos
        setTimeout(() => setSaveSuccess(false), 3000);
      }, 1000);

    } catch (err) {
      console.error('Erro ao salvar configurações de notificações:', err);
      setError('Não foi possível salvar as configurações. Por favor, tente novamente.');
      setLoading(false);
    }
  };

  // Função para testar notificações
  const handleTestNotification = async (type) => {
    setLoading(true);
    try {
      // Simulação de teste de notificação
      setTimeout(() => {
        setLoading(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }, 1000);
    } catch (err) {
      setError(`Erro ao enviar notificação de teste para ${type}`);
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Configurações de Notificações
      </Typography>

      {/* Banner para identificar a página */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          bgcolor: 'info.light',
          color: 'info.contrastText',
          borderLeft: '6px solid',
          borderColor: 'info.main',
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          Centro de Notificações
        </Typography>
        <Typography variant="body1">
          Configure como e quando deseja receber notificações sobre mudanças de preços, estoque
          e outras atualizações importantes dos produtos monitorados.
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
          {/* Canais de Notificação */}
          <Grid item xs={12}>
            <Accordion defaultExpanded>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <NotificationsIcon sx={{ mr: 1 }} /> Canais de Notificação
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {/* Email */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.emailNotifications}
                            onChange={handleChange}
                            name="emailNotifications"
                            color="primary"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EmailIcon sx={{ mr: 1 }} /> Notificações por Email
                          </Box>
                        }
                      />

                      {settings.emailNotifications && (
                        <Box sx={{ mt: 2 }}>
                          <TextField
                            fullWidth
                            label="Email para notificações"
                            name="notificationEmail"
                            value={settings.notificationEmail}
                            onChange={handleChange}
                            placeholder="seu@email.com"
                            sx={{ mb: 2 }}
                          />

                          <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Frequência de emails</InputLabel>
                            <Select
                              name="emailFrequency"
                              value={settings.emailFrequency}
                              label="Frequência de emails"
                              onChange={handleChange}
                            >
                              <MenuItem value="instant">Instantâneo</MenuItem>
                              <MenuItem value="daily">Resumo Diário</MenuItem>
                              <MenuItem value="weekly">Resumo Semanal</MenuItem>
                            </Select>
                          </FormControl>

                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleTestNotification('email')}
                          >
                            Enviar email de teste
                          </Button>
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* WhatsApp */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, borderLeft: '4px solid', borderColor: 'success.main' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.whatsappNotifications}
                            onChange={handleChange}
                            name="whatsappNotifications"
                            color="success"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <WhatsAppIcon sx={{ mr: 1 }} /> Notificações por WhatsApp
                          </Box>
                        }
                      />

                      {settings.whatsappNotifications && (
                        <Box sx={{ mt: 2 }}>
                          <TextField
                            fullWidth
                            label="Número do WhatsApp"
                            name="whatsappNumber"
                            value={settings.whatsappNumber}
                            onChange={handleChange}
                            placeholder="+55 (11) 99999-9999"
                            sx={{ mb: 2 }}
                          />

                          <Button
                            variant="outlined"
                            size="small"
                            color="success"
                            onClick={() => handleTestNotification('whatsapp')}
                          >
                            Enviar mensagem de teste
                          </Button>
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* Telegram */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, borderLeft: '4px solid', borderColor: 'info.main' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.telegramNotifications}
                            onChange={handleChange}
                            name="telegramNotifications"
                            color="info"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TelegramIcon sx={{ mr: 1 }} /> Notificações pelo Telegram
                          </Box>
                        }
                      />

                      {settings.telegramNotifications && (
                        <Box sx={{ mt: 2 }}>
                          <TextField
                            fullWidth
                            label="Chat ID do Telegram"
                            name="telegramChatId"
                            value={settings.telegramChatId}
                            onChange={handleChange}
                            placeholder="ID do Chat ou @usuario"
                            sx={{ mb: 2 }}
                          />

                          <Button
                            variant="outlined"
                            size="small"
                            color="info"
                            onClick={() => handleTestNotification('telegram')}
                          >
                            Enviar mensagem de teste
                          </Button>
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* Push e SMS */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, borderLeft: '4px solid', borderColor: 'warning.main' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.pushNotifications}
                            onChange={handleChange}
                            name="pushNotifications"
                            color="warning"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <NotificationsIcon sx={{ mr: 1 }} /> Notificações Push
                          </Box>
                        }
                      />

                      <Box sx={{ mt: 2 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.smsNotifications}
                              onChange={handleChange}
                              name="smsNotifications"
                              color="secondary"
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <SmartphoneIcon sx={{ mr: 1 }} /> Notificações por SMS
                            </Box>
                          }
                        />

                        {settings.smsNotifications && (
                          <TextField
                            fullWidth
                            label="Número de celular"
                            name="phoneNumber"
                            value={settings.phoneNumber}
                            onChange={handleChange}
                            placeholder="+55 (11) 99999-9999"
                            sx={{ mt: 2 }}
                          />
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Eventos para notificação */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel2a-content"
                id="panel2a-header"
              >
                <Typography variant="h6">Eventos para Notificação</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.priceDropNotification}
                          onChange={handleChange}
                          name="priceDropNotification"
                          color="success"
                        />
                      }
                      label="Queda de Preço"
                    />
                    <Typography variant="caption" color="text.secondary" display="block">
                      Receba notificações quando os preços dos produtos caírem
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.priceRiseNotification}
                          onChange={handleChange}
                          name="priceRiseNotification"
                          color="error"
                        />
                      }
                      label="Aumento de Preço"
                    />
                    <Typography variant="caption" color="text.secondary" display="block">
                      Receba notificações quando os preços dos produtos subirem
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.stockChangeNotification}
                          onChange={handleChange}
                          name="stockChangeNotification"
                          color="warning"
                        />
                      }
                      label="Mudança de Estoque"
                    />
                    <Typography variant="caption" color="text.secondary" display="block">
                      Receba notificações quando o estoque dos produtos for alterado
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.newReviewNotification}
                          onChange={handleChange}
                          name="newReviewNotification"
                          color="info"
                        />
                      }
                      label="Novas Avaliações"
                    />
                    <Typography variant="caption" color="text.secondary" display="block">
                      Receba notificações quando os produtos receberem novas avaliações
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle1" gutterBottom>
                  Relatórios Periódicos
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.dailyDigest}
                          onChange={handleChange}
                          name="dailyDigest"
                          color="primary"
                        />
                      }
                      label="Resumo Diário"
                    />
                    <Typography variant="caption" color="text.secondary" display="block">
                      Receba um resumo diário das alterações de preço e estoque
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.weeklyReport}
                          onChange={handleChange}
                          name="weeklyReport"
                          color="primary"
                        />
                      }
                      label="Relatório Semanal"
                    />
                    <Typography variant="caption" color="text.secondary" display="block">
                      Receba uma análise semanal detalhada com histórico de preços
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6} sx={{ mt: 1 }}>
                    <TextField
                      label="Hora preferida para notificações"
                      type="time"
                      name="notificationTime"
                      value={settings.notificationTime}
                      onChange={handleChange}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      inputProps={{
                        step: 300, // 5 min
                      }}
                      fullWidth
                    />
                    <Typography variant="caption" color="text.secondary" display="block">
                      Horário preferencial para receber relatórios periódicos
                    </Typography>
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

export default NotificationSettings;
