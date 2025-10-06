import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Tooltip,
  Popover,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Chip,
  Avatar
} from '@mui/material';
import {
  Notifications as BellIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const NotificationBell = ({ alerts = [] }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [criticalAlerts, setCriticalAlerts] = useState([]);

  const open = Boolean(anchorEl);

  useEffect(() => {
    console.log('🔔 NotificationBell recebeu alertas:', alerts);
    
    // Contar alertas não lidos
    const unread = alerts.filter(alert => !alert.read).length;
    setUnreadCount(unread);

    // Filtrar alertas críticos (possível falsificação)
    const critical = alerts.filter(alert => 
      alert.type === 'fake_product' || 
      (alert.type === 'price_drop' && alert.percentChange < -30) ||
      (alert.type === 'unauthorized_seller' && alert.sellerRating < 3.0)
    );
    console.log('🔔 Alertas críticos filtrados:', critical);
    setCriticalAlerts(critical);
  }, [alerts]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'fake_product':
        return <ErrorIcon color="error" />;
      case 'price_drop':
        return <WarningIcon color="warning" />;
      case 'unauthorized_seller':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'fake_product':
        return 'error';
      case 'price_drop':
        return 'warning';
      case 'unauthorized_seller':
        return 'warning';
      default:
        return 'info';
    }
  };

  const formatAlertMessage = (alert) => {
    switch (alert.type) {
      case 'fake_product':
        return `🚨 POSSÍVEL FALSIFICAÇÃO: ${alert.product.name}`;
      case 'price_drop':
        return `💰 Preço caiu ${Math.abs(alert.percentChange)}%: ${alert.product.name}`;
      case 'unauthorized_seller':
        return `⚠️ Vendedor não autorizado: ${alert.seller}`;
      default:
        return `ℹ️ ${alert.product.name}`;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    console.log('🔔 Formatando tempo:', { dateString, date, now, diffInHours });
    
    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
  };

  return (
    <>
      <Tooltip title={`${unreadCount} alertas não lidos`}>
        <IconButton
          onClick={handleClick}
          sx={{
            color: 'inherit',
            position: 'relative',
            '&:hover': {
              bgcolor: 'rgba(0,0,0,0.04)',
            }
          }}
        >
          <Badge 
            badgeContent={unreadCount} 
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
              }
            }}
          >
            <BellIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
            mt: 1
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Alertas do Sistema
            </Typography>
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          {criticalAlerts.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="error" fontWeight="bold" gutterBottom>
                🚨 Alertas Críticos ({criticalAlerts.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {criticalAlerts.slice(0, 3).map((alert) => (
                  <Chip
                    key={alert.id}
                    label={`${alert.product.name}`}
                    color={getAlertColor(alert.type)}
                    size="small"
                    variant="filled"
                  />
                ))}
                {criticalAlerts.length > 3 && (
                  <Chip
                    label={`+${criticalAlerts.length - 3} mais`}
                    color="error"
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          )}

          <Divider sx={{ mb: 2 }} />

          {alerts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <BellIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Nenhum alerta no momento
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {alerts.slice(0, 5).map((alert, index) => (
                <React.Fragment key={alert.id}>
                  <ListItem
                    sx={{
                      py: 1.5,
                      px: 0,
                      bgcolor: !alert.read ? 'action.hover' : 'transparent',
                      borderRadius: 1,
                      mb: 0.5
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getAlertIcon(alert.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={!alert.read ? 'bold' : 'normal'}>
                          {formatAlertMessage(alert)}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(alert.createdAt)}
                          </Typography>
                          {!alert.read && (
                            <Chip
                              label="Novo"
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ height: 16, fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < alerts.slice(0, 5).length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}

          {alerts.length > 5 && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  handleClose();
                  // Navegar para página de alertas
                  window.location.href = '/alerts';
                }}
              >
                Ver todos os alertas ({alerts.length})
              </Button>
            </Box>
          )}
        </Box>
      </Popover>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </>
  );
};

export default NotificationBell;
