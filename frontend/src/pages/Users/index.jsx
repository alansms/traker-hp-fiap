import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { getUsers, createUser, updateUser, deleteUser } from '../../services/users';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'visitor',
    requires_2fa: false
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Buscando usuários do servidor...');
      const data = await getUsers();
      console.log('Dados recebidos:', data);
      setUsers(data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      setError('Erro ao carregar lista de usuários: ' + (error.message || 'Falha na conexão com o servidor'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewUser({
      email: '',
      full_name: '',
      password: '',
      role: 'visitor',
      requires_2fa: false
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (e) => {
    setNewUser(prev => ({
      ...prev,
      role: e.target.value
    }));
  };

  const handleCreateUser = async () => {
    try {
      await createUser(newUser);
      alert('Usuário criado com sucesso!');
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert('Erro ao criar usuário');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedUser(null);
  };

  const handleUpdateUser = async () => {
    try {
      await updateUser(selectedUser.id, selectedUser);
      alert('Usuário atualizado com sucesso!');
      handleCloseEditDialog();
      fetchUsers();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      alert('Erro ao atualizar usuário');
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedUser(null);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteUser(selectedUser.id);
      alert('Usuário excluído com sucesso!');
      handleCloseDeleteDialog();
      fetchUsers();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Erro ao excluir usuário');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'analyst':
        return 'primary';
      case 'visitor':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Gerenciamento de Usuários
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
          Gerenciamento de Usuários
        </Typography>
        <Typography variant="body1">
          Gerencie todos os usuários da plataforma. Aqui você pode criar novos usuários,
          editar permissões, definir papéis e remover contas quando necessário.
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Novo Usuário
        </Button>
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" mb={3}>
          <CircularProgress />
        </Box>
      )}

      {!loading && !error && (
        <Paper elevation={3}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Função</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>2FA</TableCell>
                  <TableCell>Verificado</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          color={getRoleColor(user.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <Chip label="Ativo" color="success" size="small" />
                        ) : (
                          <Chip label="Inativo" color="default" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {user.requires_2fa ? (
                          <CheckIcon color="success" />
                        ) : (
                          <CloseIcon color="error" />
                        )}
                      </TableCell>
                      <TableCell>
                        {user.is_verified ? (
                          <CheckIcon color="success" />
                        ) : (
                          <CloseIcon color="error" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Editar">
                          <IconButton onClick={() => handleEditUser(user)}>
                            <EditIcon color="primary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton onClick={() => handleDeleteUser(user)}>
                            <DeleteIcon color="error" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={users.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      {/* Dialog para criar novo usuário */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Criar Novo Usuário</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Preencha as informações do novo usuário:
          </DialogContentText>
          <Grid container spacing={2} style={{ marginTop: 8 }}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin="dense"
                name="full_name"
                label="Nome Completo"
                type="text"
                fullWidth
                variant="outlined"
                value={newUser.full_name}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                name="email"
                label="Email"
                type="email"
                fullWidth
                variant="outlined"
                value={newUser.email}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                name="password"
                label="Senha"
                type="password"
                fullWidth
                variant="outlined"
                value={newUser.password}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Função</InputLabel>
                <Select
                  labelId="role-label"
                  id="role"
                  value={newUser.role}
                  label="Função"
                  onChange={handleRoleChange}
                  variant="outlined"
                >
                  <MenuItem value="visitor">Visitante</MenuItem>
                  <MenuItem value="analyst">Analista</MenuItem>
                  <MenuItem value="admin">Administrador</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleCreateUser} color="primary">Criar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para editar usuário */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
        <DialogTitle>Editar Usuário</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={2} style={{ marginTop: 8 }}>
              <Grid item xs={12}>
                <TextField
                  autoFocus
                  margin="dense"
                  name="full_name"
                  label="Nome Completo"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={selectedUser.full_name}
                  onChange={handleEditInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  name="email"
                  label="Email"
                  type="email"
                  fullWidth
                  variant="outlined"
                  value={selectedUser.email}
                  onChange={handleEditInputChange}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="role-edit-label">Função</InputLabel>
                  <Select
                    labelId="role-edit-label"
                    id="role-edit"
                    value={selectedUser.role}
                    label="Função"
                    name="role"
                    onChange={handleEditInputChange}
                    variant="outlined"
                  >
                    <MenuItem value="visitor">Visitante</MenuItem>
                    <MenuItem value="analyst">Analista</MenuItem>
                    <MenuItem value="admin">Administrador</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="status-edit-label">Status</InputLabel>
                  <Select
                    labelId="status-edit-label"
                    id="is_active-edit"
                    value={selectedUser.is_active}
                    label="Status"
                    name="is_active"
                    onChange={handleEditInputChange}
                    variant="outlined"
                  >
                    <MenuItem value={true}>Ativo</MenuItem>
                    <MenuItem value={false}>Inativo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancelar</Button>
          <Button onClick={handleUpdateUser} color="primary">Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para confirmação de exclusão */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o usuário {selectedUser?.full_name}? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button onClick={handleConfirmDelete} color="error">Excluir</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersManagement;
