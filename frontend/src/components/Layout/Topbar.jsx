import React, { useState, useEffect } from "react";
import { 
  AppBar, Toolbar, Typography, IconButton, Badge, 
  Menu, MenuItem, Avatar, Box, Tooltip,
  useTheme, useMediaQuery
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  AccountCircle,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Menu as MenuIcon
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const Topbar = ({ onMenuToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const [alerts, setAlerts] = useState([]);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);

  // Buscar alertas reais da API
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch("/api/alerts/");
        if (response.ok) {
          const data = await response.json();
          setAlerts(data.alerts || []);
        } else {
          setAlerts([]);
        }
      } catch (error) {
        console.error("Erro ao carregar alertas:", error);
        setAlerts([]);
      }
    };

    fetchAlerts();
  }, []);

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getPageTitle = () => {
    const path = location.pathname;
    const titles = {
      "/": "Dashboard",
      "/dashboard": "Dashboard",
      "/analysis": "Análise de Dados",
      "/products": "Produtos",
      "/alerts": "Alertas",
      "/settings": "Configurações",
      "/logs": "Logs do Sistema",
      "/users": "Usuários"
    };
    return titles[path] || "Sistema";
  };

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={onMenuToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {getPageTitle()}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Notificações">
            <IconButton color="inherit" onClick={handleNotificationClick}>
              <Badge badgeContent={alerts.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Configurações">
            <IconButton color="inherit" onClick={() => navigate("/settings")}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={user?.name || user?.email || "Usuário"}>
            <IconButton color="inherit" onClick={() => {}}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* Menu de Notificações */}
        <Menu
          anchorEl={notificationAnchorEl}
          open={Boolean(notificationAnchorEl)}
          onClose={handleNotificationClose}
          PaperProps={{
            sx: { maxHeight: 300, width: 350 }
          }}
        >
          {alerts.length === 0 ? (
            <MenuItem disabled>Nenhuma notificação</MenuItem>
          ) : (
            alerts.slice(0, 5).map((alert, index) => (
              <MenuItem key={index} onClick={handleNotificationClose}>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {alert.title || "Alerta"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {alert.message || "Nova atividade detectada"}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
