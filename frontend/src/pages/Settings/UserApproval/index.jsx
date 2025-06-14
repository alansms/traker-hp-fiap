import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Divider,
  Alert,
  Paper
} from '@mui/material';
import { Check, Close, HourglassEmpty } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../../hooks/useAuth';

// Função para obter o token movida para fora do componente
const getTokenFromStorage = (authToken) => {
  // Tenta usar o token do contexto primeiro
  if (authToken) {
    return authToken;
  }
  // Se não existir, tenta pegar diretamente do localStorage
  return localStorage.getItem('token');
};

const UserApproval = () => {
  const { token: authToken } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado para diálogo de aprovação
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('visitor');

  // Estado para diálogo de rejeição
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Buscar usuários pendentes
  const fetchPendingUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Obter o token mais recente
      const token = getTokenFromStorage(authToken);

      if (!token) {
        setError('Sessão expirada. Por favor, faça login novamente.');
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || ''}/api/users/pending-approval`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setPendingUsers(response.data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar usuários pendentes:', err);
      setError('Não foi possível carregar os usuários pendentes. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  // Abrir diálogo de aprovação
  const handleOpenApproveDialog = (user) => {
    setSelectedUser(user);
    setSelectedRole('visitor'); // Papel padrão
    setApproveDialogOpen(true);
  };

  // Abrir diálogo de rejeição
  const handleOpenRejectDialog = (user) => {
    setSelectedUser(user);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  // Aprovar usuário
  const handleApproveUser = async () => {
    try {
      const token = getTokenFromStorage(authToken);

      if (!token) {
        setError('Sessão expirada. Por favor, faça login novamente.');
        return;
      }

      await axios.post(
        `${process.env.REACT_APP_API_URL || ''}/api/users/${selectedUser.id}/approve`,
        { role: selectedRole },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Atualizar lista após aprovação
      fetchPendingUsers();
      setApproveDialogOpen(false);

      // Mostrar feedback
      setError({ severity: 'success', message: `Usuário ${selectedUser.full_name} aprovado com sucesso!` });
    } catch (err) {
      console.error('Erro ao aprovar usuário:', err);
      setError({ severity: 'error', message: 'Erro ao aprovar usuário. Por favor, tente novamente.' });
    }
  };

  // Rejeitar usuário
  const handleRejectUser = async () => {
    try {
      const token = getTokenFromStorage(authToken);

      if (!token) {
        setError('Sessão expirada. Por favor, faça login novamente.');
        return;
      }

      await axios.post(
        `${process.env.REACT_APP_API_URL || ''}/api/users/${selectedUser.id}/reject`,
        { reason: rejectionReason },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Atualizar lista após rejeição
      fetchPendingUsers();
      setRejectDialogOpen(false);

      // Mostrar feedback
      setError({ severity: 'success', message: `Cadastro de ${selectedUser.full_name} rejeitado.` });
    } catch (err) {
      console.error('Erro ao rejeitar usuário:', err);
      setError({ severity: 'error', message: 'Erro ao rejeitar usuário. Por favor, tente novamente.' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Aprovação de Usuários
      </Typography>

      {/* Banner para identificar a página */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          bgcolor: 'success.light',
          color: 'success.contrastText',
          borderLeft: '6px solid',
          borderColor: 'success.main',
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          Aprovação de Usuários
        </Typography>
        <Typography variant="body1">
          Gerencie solicitações de novos usuários para acesso ao sistema. Você pode aprovar novos usuários
          e definir seus níveis de permissão ou rejeitar solicitações inadequadas.
        </Typography>
      </Paper>

      {error && typeof error === 'object' && (
        <Alert
          severity={error.severity}
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error.message}
        </Alert>
      )}

      {error && typeof error === 'string' && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : pendingUsers.length === 0 ? (
        <Alert severity="info">
          Não há usuários pendentes de aprovação no momento.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {pendingUsers.map((user) => (
            <Grid item xs={12} md={6} key={user.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">{user.full_name}</Typography>
                    <Chip
                      icon={<HourglassEmpty />}
                      label="Pendente"
                      color="warning"
                      size="small"
                    />
                  </Box>

                  <Typography variant="body1" color="text.secondary">
                    Email: {user.email}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Data de cadastro: {new Date(user.created_at).toLocaleString()}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Close />}
                      onClick={() => handleOpenRejectDialog(user)}
                    >
                      Rejeitar
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<Check />}
                      onClick={() => handleOpenApproveDialog(user)}
                    >
                      Aprovar
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Diálogo de Aprovação */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)}>
        <DialogTitle>Aprovar Usuário</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Você está prestes a aprovar o cadastro de <strong>{selectedUser?.full_name}</strong>.
            Por favor, selecione o nível de acesso que este usuário terá no sistema.
          </DialogContentText>

          <FormControl fullWidth margin="normal">
            <InputLabel id="role-select-label">Nível de Acesso</InputLabel>
            <Select
              labelId="role-select-label"
              value={selectedRole}
              label="Nível de Acesso"
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <MenuItem value="visitor">Visitante (acesso básico)</MenuItem>
              <MenuItem value="user">Usuário (acesso padrão)</MenuItem>
              <MenuItem value="editor">Editor (acesso intermediário)</MenuItem>
              <MenuItem value="admin">Administrador (acesso completo)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleApproveUser} variant="contained" color="success">
            Confirmar Aprovação
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Rejeição */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Rejeitar Cadastro</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Você está prestes a rejeitar o cadastro de <strong>{selectedUser?.full_name}</strong>.
            Por favor, forneça um motivo para a rejeição (opcional).
          </DialogContentText>

          <TextField
            autoFocus
            margin="dense"
            id="reason"
            label="Motivo da Rejeição"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleRejectUser} variant="contained" color="error">
            Confirmar Rejeição
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserApproval;
