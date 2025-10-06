import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import UnifiedApiSettings from './UnifiedApiSettings';
import UserApproval from './UserApproval';
import SystemSettings from './SystemSettings';
import NotificationSettings from './NotificationSettings';
import UsersManagement from '../Users';
import SystemLogs from './SystemLogs';
import SuspiciousConfig from './SuspiciousConfig';
import DataCleanup from './DataCleanup';
import ScrapingControl from './ScrapingControl';
import { useAuth } from '../../hooks/useAuth';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const Settings = () => {
  const [tabValue, setTabValue] = useState(0);
  const [userData, setUserData] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Efeito para verificar permissões do usuário usando o hook useAuth
  useEffect(() => {
    try {
      setLoading(true);

      if (user) {
        // Definir manualmente o usuário sistemas@smstecnologia.com.br como superusuário
        // independentemente das permissões do banco de dados
        if (user.email === 'sistemas@smstecnologia.com.br') {
          const superUser = {
            ...user,
            role: 'admin',
            is_superuser: true
          };
          setUserData(superUser);
          setIsAuthorized(true);
          console.log('Usuário sistemas@smstecnologia.com.br elevado a superusuário manualmente no frontend');
        } else {
          setUserData(user);

          // Verificar se o usuário é administrador
          const isAdmin = user.is_superuser === true || user.role === 'admin';
          setIsAuthorized(isAdmin);
        }
      } else {
        setIsAuthorized(false);
      }
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Configurações do Sistema
      </Typography>

      {!isAuthorized && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Acesso Restrito
          </Typography>
          <Typography variant="body2">
            As funcionalidades desta página são restritas aos administradores do sistema.
            Você pode visualizar as opções disponíveis, mas não poderá realizar alterações.
            Entre em contato com o administrador do sistema para solicitar acesso.
          </Typography>
        </Alert>
      )}

      {userData && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Status do usuário: {isAuthorized ? 'Administrador' : 'Usuário regular'}
          (email: {userData.email}, role: {userData.role || 'não definido'},
          is_superuser: {String(!!userData.is_superuser)})
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="configurações do sistema"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Chaves de API" {...a11yProps(0)} />
            <Tab label="Aprovação de Usuários" {...a11yProps(1)} />
            <Tab label="Gerenciar Usuários" {...a11yProps(2)} />
            <Tab label="Logs do Sistema" {...a11yProps(3)} />
            <Tab label="Detecção de Suspeitos" {...a11yProps(4)} />
            <Tab label="Limpeza de Dados" {...a11yProps(5)} />
            <Tab label="Controle de Scraping" {...a11yProps(6)} />
            <Tab label="Configurações" {...a11yProps(7)} />
            <Tab label="Notificações" {...a11yProps(8)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {isAuthorized ? (
            <UnifiedApiSettings />
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
              Configurações de Chaves de API estão disponíveis apenas para administradores do sistema.
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {isAuthorized ? (
            <UserApproval />
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
              Aprovação de Usuários está disponível apenas para administradores do sistema.
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {isAuthorized ? (
            <UsersManagement />
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
              Gerenciamento de Usuários está disponível apenas para administradores do sistema.
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {isAuthorized ? (
            <SystemLogs />
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
              Logs do Sistema estão disponíveis apenas para administradores do sistema.
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          {isAuthorized ? (
            <SuspiciousConfig />
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
              Configurações de Detecção de Suspeitos estão disponíveis apenas para administradores do sistema.
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          {isAuthorized ? (
            <DataCleanup />
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
              Limpeza de Dados está disponível apenas para administradores do sistema.
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={6}>
          {isAuthorized ? (
            <ScrapingControl />
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
              Controle de Scraping está disponível apenas para administradores do sistema.
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={7}>
          {isAuthorized ? (
            <SystemSettings />
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
              Configurações do Sistema estão disponíveis apenas para administradores do sistema.
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={8}>
          {isAuthorized ? (
            <NotificationSettings />
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
              Configurações de Notificações estão disponíveis apenas para administradores do sistema.
            </Typography>
          )}
        </TabPanel>
      </Paper>

      {!isAuthorized && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/dashboard')}
          >
            Voltar para o Dashboard
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default Settings;
