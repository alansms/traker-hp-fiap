import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  Paper,
} from '@mui/material';
import hpLogo from '../../assets/HP.png';
import loginImage1 from '../../assets/tela_login1.png';
import loginImage2 from '../../assets/tela_login2.png';
import loginImage3 from '../../assets/tela_login3.png';
import loginImage4 from '../../assets/tela_login4.png';
import loginImage5 from '../../assets/tela_login5.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { login, verify2FA } = useAuth();

  // Seleção aleatória de imagem de fundo no carregamento do componente
  useEffect(() => {
    const loginImages = [loginImage1, loginImage2, loginImage3, loginImage4, loginImage5];
    const randomIndex = Math.floor(Math.random() * loginImages.length);
    setBackgroundImage(loginImages[randomIndex]);
  }, []);

  // Verificar se há uma mensagem de redirecionamento
  useEffect(() => {
    if (location.state?.message) {
      setError(location.state.message);
    }
  }, [location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result?.requires2FA) {
        setStep(2);
      } else if (result?.user) {
        navigate('/dashboard');
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (err) {
      if (err.response?.data?.detail) {
        // Se for um array de erros
        if (Array.isArray(err.response.data.detail)) {
          const errorMessages = err.response.data.detail.map(e => e.msg || e.message).join(", ");
          setError(errorMessages);
        } else {
          // Se for um único erro
          setError(err.response.data.detail);
        }
      } else {
        setError(err.message || 'Falha na autenticação. Verifique suas credenciais.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verify2FA(email, code);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.detail) {
        // Se for um array de erros
        if (Array.isArray(err.response.data.detail)) {
          const errorMessages = err.response.data.detail.map(e => e.msg || e.message).join(", ");
          setError(errorMessages);
        } else {
          // Se for um único erro
          setError(err.response.data.detail);
        }
      } else {
        setError(err.message || 'Código de verificação inválido.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container component="main" sx={{ height: '100vh' }}>
      {/* Metade esquerda - imagem de fundo */}
      <Grid
        item
        xs={false}
        sm={4}
        md={6}
        sx={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: { xs: 'none', sm: 'block' } // Esconde em telas muito pequenas (xs)
        }}
      />

      {/* Metade direita - formulário */}
      <Grid
        item
        xs={12}
        sm={8}
        md={6}
        component={Paper}
        elevation={0}
        square
        sx={{
          bgcolor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: { xs: '100%', sm: 'auto' } // Em mobile, ocupa 100% da largura
        }}
      >
        <Box
          sx={{
            width: '100%',
            py: { xs: 6, md: 6 },
            px: { xs: 3, md: 4 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Logo HP centralizado com efeito de pulsação e brilho */}
          <Box
            component="img"
            src={hpLogo}
            alt="HP Logo"
            sx={{
              height: { xs: 100, md: 200 },
              mb: { xs: 4, md: 4 },
              display: 'block',
              mx: 'auto',
              animation: 'pulse 2s infinite ease-in-out',
              filter: 'drop-shadow(0 0 10px rgba(25, 118, 210, 0.5))',
              transition: 'all 0.3s ease-in-out',
              '@keyframes pulse': {
                '0%': {
                  transform: 'scale(1) rotate(0deg)',
                  filter: 'drop-shadow(0 0 5px rgba(25, 118, 210, 0.5))'
                },
                '50%': {
                  transform: 'scale(1.05) rotate(1deg)',
                  filter: 'drop-shadow(0 0 15px rgba(25, 118, 210, 0.7))'
                },
                '100%': {
                  transform: 'scale(1) rotate(0deg)',
                  filter: 'drop-shadow(0 0 5px rgba(25, 118, 210, 0.5))'
                }
              },
              '&:hover': {
                transform: 'scale(1.1) rotate(2deg)',
                filter: 'drop-shadow(0 0 20px rgba(25, 118, 210, 0.8))'
              }
            }}
          />

          {/* Título e subtítulo - Alterando a cor para preto */}
          <Box
            sx={{
              width: '100%',
              mb: { xs: 4, md: 4 },
              display: 'block !important',
              visibility: 'visible !important',
              opacity: '1 !important'
            }}
          >
            <Typography
              component="h1"
              variant="h5"
              sx={{
                fontWeight: 'bold',
                fontSize: { xs: '1.5rem', md: '1.5rem' },
                textAlign: 'center',
                display: 'block !important',
                visibility: 'visible !important',
                opacity: '1 !important',
                mb: 1,
                color: '#000000' // Texto em preto
              }}
            >
              TRACKER DE PREÇOS
            </Typography>

            <Typography
              variant="body1"
              sx={{
                textAlign: 'center',
                display: 'block !important',
                visibility: 'visible !important',
                opacity: '1 !important',
                fontSize: { xs: '1rem', md: '1rem' },
                color: '#000000' // Texto em preto
              }}
            >
              Acompanhe preços e descubra oportunidades
            </Typography>
          </Box>

          {step === 1 ? (
            <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%', maxWidth: 400 }} autoComplete="off">
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email"
                placeholder="Email *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="off"
                inputProps={{
                  autoComplete: 'new-email',
                  style: { color: '#000000' } // Texto do input em preto
                }}
                InputLabelProps={{
                  style: { color: '#000000' } // Label em preto
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#bbbbbb',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#000000', // Texto do input em preto
                  },
                  '& .MuiInputLabel-root': {
                    color: '#000000', // Label em preto
                  }
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Senha"
                placeholder="Senha *"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="off"
                inputProps={{
                  autoComplete: 'new-password',
                  style: { color: '#000000' } // Texto do input em preto
                }}
                InputLabelProps={{
                  style: { color: '#000000' } // Label em preto
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#bbbbbb',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#000000', // Texto do input em preto
                  },
                  '& .MuiInputLabel-root': {
                    color: '#000000', // Label em preto
                  }
                }}
              />
              <Box textAlign="right" sx={{ mt: 1 }}>
                <Link to="/auth/reset-password" style={{ textDecoration: 'none', fontSize: 14, color: '#1976d2' }}>
                  Esqueceu a senha?
                </Link>
              </Box>

              {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.2,
                  borderRadius: 2,
                  backgroundColor: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#1565c0',
                  },
                  fontWeight: 'bold'
                }}
                disabled={loading}
              >
                {loading ? 'ENTRANDO...' : 'ENTRAR'}
              </Button>

              <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                Não tem uma conta?{' '}
                <Link to="/auth/register" style={{ color: '#1976d2', fontWeight: 500, textDecoration: 'none' }}>
                  Cadastre-se
                </Link>
              </Typography>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleVerify2FA} sx={{ mt: 1, width: '100%', maxWidth: 400 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Código de Verificação"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Digite o código de verificação"
                disabled={loading}
                inputProps={{
                  style: { color: '#000000' } // Texto do input em preto
                }}
                InputLabelProps={{
                  style: { color: '#000000' } // Label em preto
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#bbbbbb',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#000000', // Texto do input em preto
                  },
                  '& .MuiInputLabel-root': {
                    color: '#000000', // Label em preto
                  }
                }}
              />

              {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 1,
                  py: 1.2,
                  borderRadius: 2,
                  backgroundColor: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#1565c0',
                  },
                  fontWeight: 'bold'
                }}
                disabled={loading}
              >
                {loading ? 'VERIFICANDO...' : 'VERIFICAR'}
              </Button>

              <Button
                fullWidth
                onClick={() => setStep(1)}
                disabled={loading}
                sx={{
                  mt: 1,
                  py: 1.2,
                  borderRadius: 2,
                  color: '#1976d2',
                  border: '1px solid #1976d2',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  }
                }}
                variant="outlined"
              >
                VOLTAR PARA O LOGIN
              </Button>
            </Box>
          )}
        </Box>
      </Grid>
    </Grid>
  );
};

export default Login;
