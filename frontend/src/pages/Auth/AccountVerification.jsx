import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';
import axios from 'axios';

const AccountVerification = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState({
    success: false,
    message: '',
    user: null
  });

  useEffect(() => {
    const verifyAccount = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/verify-account/${token}`);

        setVerificationStatus({
          success: true,
          message: response.data.detail,
          user: response.data.user
        });
      } catch (error) {
        console.error('Erro ao verificar conta:', error);
        setVerificationStatus({
          success: false,
          message: error.response?.data?.detail || 'Erro ao verificar sua conta. O link pode ser inválido ou expirado.',
          user: null
        });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyAccount();
    }
  }, [token]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Verificação de Conta
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Sistema Mercado Livre Tracker
        </Typography>

        <Paper
          elevation={3}
          sx={{
            p: 4,
            mt: 3,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={60} />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Verificando sua conta...
              </Typography>
            </Box>
          ) : verificationStatus.success ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {verificationStatus.message}
              </Typography>

              {verificationStatus.user && (
                <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Email:</strong> {verificationStatus.user.email}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Nome:</strong> {verificationStatus.user.full_name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Função:</strong> {
                      verificationStatus.user.role === 'admin' ? 'Administrador' :
                      verificationStatus.user.role === 'analyst' ? 'Analista' : 'Visitante'
                    }
                  </Typography>
                </Alert>
              )}

              <Button
                component={Link}
                to="/auth/login"
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
              >
                Fazer Login
              </Button>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Error color="error" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {verificationStatus.message}
              </Typography>
              <Alert severity="warning" sx={{ mt: 2, mb: 3, textAlign: 'left' }}>
                <Typography variant="body2">
                  O link de verificação pode ter expirado ou ser inválido.
                  Se você acabou de se registrar, tente fazer login para solicitar
                  um novo link de verificação.
                </Typography>
              </Alert>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center' }}>
                <Button
                  component={Link}
                  to="/auth/login"
                  variant="contained"
                  color="primary"
                >
                  Fazer Login
                </Button>
                <Button
                  component={Link}
                  to="/auth/register"
                  variant="outlined"
                  color="primary"
                >
                  Criar Nova Conta
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default AccountVerification;
