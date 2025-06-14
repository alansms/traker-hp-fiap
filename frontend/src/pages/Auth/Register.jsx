import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [openResendDialog, setOpenResendDialog] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');

  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validações básicas
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Todos os campos são obrigatórios');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      console.log('Enviando dados:', {
        email: formData.email,
        name: formData.name,
        password: formData.password
      });

      // Chamada para o hook de registro - Corrigindo a forma de passar os parâmetros
      const response = await register(
        formData.name,
        formData.email,
        formData.password
      );

      console.log('Resposta:', response);
      setSuccess(response.message || 'Cadastro realizado com sucesso!');
      setOpenModal(true);
    } catch (error) {
      console.error('Erro detalhado:', error);

      // Melhorando o tratamento de erros para diferentes formatos
      if (typeof error === 'string') {
        setError(error);
      } else if (typeof error.message === 'string') {
        setError(error.message);
      } else if (error.response && error.response.data) {
        // Tratando respostas da API
        const responseData = error.response.data;

        if (typeof responseData.detail === 'string') {
          setError(responseData.detail);
        } else if (Array.isArray(responseData.detail)) {
          // Tratando array de erros da API
          const errorMessages = responseData.detail
            .map(err => {
              if (typeof err === 'string') return err;
              if (err.msg) return err.msg;
              return JSON.stringify(err);
            })
            .filter(Boolean)
            .join(", ");
          setError(errorMessages || 'Erro ao realizar cadastro');
        } else {
          setError('Erro ao realizar cadastro. Tente novamente.');
        }
      } else {
        setError('Erro ao realizar cadastro. Tente novamente.');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Função para fechar o modal e redirecionar para o login
  const handleCloseModal = () => {
    setOpenModal(false);
    navigate('/auth/login');
  };

  const handleResendVerification = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resendEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Erro ao reenviar verificação');
      }

      setResendStatus('success');
      setTimeout(() => {
        setOpenResendDialog(false);
        navigate('/auth/login');
      }, 3000);
    } catch (error) {
      setResendStatus('error');
      setError(error.message || 'Erro ao reenviar o email de verificação. Tente novamente mais tarde.');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Cadastro
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ width: '100%', mt: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Nome completo"
            name="name"
            autoComplete="name"
            autoFocus
            value={formData.name}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Senha"
            type="password"
            id="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirmar senha"
            type="password"
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              Já tem uma conta?{' '}
              <Link to="/auth/login">
                Faça login
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Modal de reenvio de verificação */}
      <Dialog open={openResendDialog} onClose={() => setOpenResendDialog(false)}>
        <DialogTitle>Email já cadastrado</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Este email já está cadastrado no sistema. Se você não recebeu ou perdeu o email de verificação, podemos enviar um novo.
          </DialogContentText>
          {resendStatus === 'success' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Email de verificação reenviado com sucesso! Redirecionando para a página de login...
            </Alert>
          )}
          {resendStatus === 'error' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResendDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleResendVerification}
            variant="contained"
            disabled={resendStatus === 'success'}
          >
            Reenviar Email de Verificação
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de sucesso existente */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Cadastro Recebido"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Analisaremos sua solicitação e, em breve, você receberá nosso feedback.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} autoFocus variant="contained">
            Entendi
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Register;
