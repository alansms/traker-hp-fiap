import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '@mui/material/styles';
import logoHpBranco from '../../assets/logo_hp_branco.png';
import AppInfoModal from '../AppInfoModal';

const Topbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [anchorElUser, setAnchorElUser] = useState(null);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleSettings = () => {
    navigate('/settings');
    handleCloseUserMenu();
  };

  const handleProfile = () => {
    // Futuramente, navegar para a página de perfil
    handleCloseUserMenu();
  };

  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const handleOpenInfoModal = () => {
    setInfoModalOpen(true);
  };

  const handleCloseInfoModal = () => {
    setInfoModalOpen(false);
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.primary.main,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          width: '100%',
          height: '64px'
        }}
        className="MuiBox-root css-1vsours"
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '64px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              component="img"
              src={logoHpBranco}
              alt="HP Logo"
              sx={{
                height: '40px', // Aumentado de 30px para 40px
                width: 'auto',
                display: { xs: 'none', sm: 'block' },
                cursor: 'pointer'
              }}
              onClick={() => navigate('/')}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              size="large"
              color="inherit"
              sx={{ ml: 1 }}
              onClick={() => navigate('/alerts')}
            >
              <NotificationsIcon />
            </IconButton>

            <Tooltip title="Opções da conta">
              <IconButton onClick={handleOpenUserMenu} sx={{ ml: 1 }}>
                {user?.avatar_url ? (
                  <Avatar
                    alt={user?.full_name || 'User'}
                    src={user?.avatar_url}
                    sx={{ width: 32, height: 32 }}
                  />
                ) : (
                  <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main }}>
                    {user?.full_name?.charAt(0) || 'U'}
                  </Avatar>
                )}
              </IconButton>
            </Tooltip>

            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem onClick={handleProfile}>
                <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography textAlign="center">Perfil</Typography>
              </MenuItem>
              <MenuItem onClick={handleSettings}>
                <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography textAlign="center">Configurações</Typography>
              </MenuItem>
              <MenuItem onClick={() => {
                handleCloseUserMenu();
                handleOpenInfoModal();
              }}>
                <InfoIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography textAlign="center">About HP Tracker ML</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography textAlign="center">Sair</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <AppInfoModal open={infoModalOpen} onClose={handleCloseInfoModal} />
    </>
  );
};

export default Topbar;
