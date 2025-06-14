import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Container, Box, Typography, TextField, Button, Alert } from '@mui/material';
import { Link } from 'react-router-dom';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { requestPasswordReset, verifyResetCode, resetPassword } = useAuth();

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSuccess('Código enviado para seu email.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Erro ao solicitar reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyResetCode(email, code);
      setSuccess('Código verificado.');
      setStep(3);
    } catch (err) {
      setError(err.message || 'Código inválido.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, code, password);
      setSuccess('Senha redefinida. Redirecionando...');
      setTimeout(() => { window.location.href = '/auth/login'; }, 2000);
    } catch (err) {
      setError(err.message || 'Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, p: 4, bgcolor: 'background.paper', boxShadow: 3, borderRadius: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">Recuperar Senha</Typography>
        {step === 1 && (
          <Box component="form" onSubmit={handleRequestReset} sx={{ width: '100%', mt: 2 }}>
            <TextField fullWidth label="Email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }} disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Código'}
            </Button>
            <Button component={Link} to="/auth/login" fullWidth variant="text" sx={{ mt: 1 }}>Voltar</Button>
          </Box>
        )}
        {step === 2 && (
          <Box component="form" onSubmit={handleVerifyCode} sx={{ width: '100%', mt: 2 }}>
            <TextField fullWidth label="Código" value={code} onChange={e => setCode(e.target.value)} required autoFocus />
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }} disabled={loading}>
              {loading ? 'Verificando...' : 'Verificar Código'}
            </Button>
            <Button onClick={() => setStep(1)} fullWidth variant="text" sx={{ mt: 1 }}>Voltar</Button>
          </Box>
        )}
        {step === 3 && (
          <Box component="form" onSubmit={handleResetPassword} sx={{ width: '100%', mt: 2 }}>
            <TextField fullWidth label="Nova Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required inputProps={{ minLength: 8 }} autoFocus helperText="Min 8 caracteres" />
            <TextField fullWidth label="Confirmar Senha" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required sx={{ mt: 2 }} />
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }} disabled={loading}>
              {loading ? 'Redefinindo...' : 'Redefinir Senha'}
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default ResetPassword;
