import React, { useState, useContext, createContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  Notifications,
  Store,
  PeopleAlt,
  Settings,
  Chat,
  ChevronLeft,
  ChevronRight,
  Search,
  People as PeopleIcon,
  List as ListIcon,
  BarChart,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

// Criando um contexto para compartilhar o estado da sidebar
const SidebarContext = createContext();

export const useSidebar = () => {
  return useContext(SidebarContext);
};

export const SidebarProvider = ({ children }) => {
  // Determina o estado inicial com base no tamanho da tela
  const isSmallScreen = useMediaQuery('(max-width:1200px)');
  const [expanded, setExpanded] = useState(!isSmallScreen);

  // Atualiza o estado quando o tamanho da tela muda
  useEffect(() => {
    setExpanded(!isSmallScreen);
  }, [isSmallScreen]);

  const toggleSidebar = () => {
    setExpanded(prev => !prev);
  };

  return (
    <SidebarContext.Provider value={{ expanded, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

const Sidebar = () => {
  const { expanded, toggleSidebar } = useSidebar();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery('(max-width:768px)');
  const { user } = useAuth(); // Obtendo o usuário atual

  // Verificar se o usuário é administrador
  const isAdmin = user && (user.role === 'admin' || user.is_superuser || user.is_admin);

  // Log para depurar informações do usuário
  console.log("Usuário atual:", user);
  console.log("Papel do usuário:", user?.role);
  console.log("É superusuário?", user?.is_superuser);
  console.log("É administrador?", isAdmin);

  // Larguras responsivas baseadas no tamanho da tela
  const baseExpandedWidth = 240;
  const baseCollapsedWidth = 64;

  // Calcula largura proporcional à tela
  const getResponsiveWidth = (baseWidth) => {
    if (isSmallScreen) {
      return expanded ? '60%' : '15%';
    }
    return baseWidth;
  };

  const drawerWidth = expanded ? getResponsiveWidth(baseExpandedWidth) : getResponsiveWidth(baseCollapsedWidth);

  // Itens de menu comuns a todos os usuários
  const commonMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/' },
    { text: 'Análise de Dados', icon: <BarChart />, path: '/data-analysis' },
    { text: 'Pesquisas', icon: <Search />, path: '/search' },
    { text: 'Alertas', icon: <Notifications />, path: '/alerts' },
    { text: 'Produtos', icon: <Store />, path: '/products' },
    {
      text: 'Vendedores',
      icon: <PeopleAlt />,
      path: '/sellers',
      badge: user && (user.role === 'admin' || user.is_superuser || user.is_admin) ? 'Novo' : null
    },
    { text: 'Assistente', icon: <Chat />, path: '/chat' },
    { text: 'Configurações', icon: <Settings />, path: '/settings' },
  ];

  // Itens de menu apenas para administradores
  const adminMenuItems = [
    { text: 'Usuários', icon: <PeopleIcon />, path: '/users' },
    { text: 'Aprovação de Usuários', icon: <PeopleIcon />, path: '/settings/user-approval' },
    { text: 'Logs do Sistema', icon: <ListIcon />, path: '/logs' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          position: 'relative',
          width: drawerWidth,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          // Garantir que a sidebar se comporte bem em telas muito pequenas
          [theme.breakpoints.down('sm')]: {
            width: expanded ? '180px' : '50px',
          },
        },
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
    >
      {/* Botão para expandir/recolher a sidebar */}
      <Box
        sx={{
          position: 'absolute',
          right: -1, // Aumentado para deslocar mais para a esquerda, garantindo visibilidade total
          bottom: 20, // Posicionado na parte inferior da barra de menus
          zIndex: 1500, // Z-index alto para garantir que fique acima de outros elementos
          width: 50,
          height: 50,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
          borderRadius: '50%',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          border: '1px solid #e0e0e0',
          cursor: 'pointer',
          transition: theme.transitions.create(['right'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          '&:hover': {
            backgroundColor: theme.palette.primary.main,
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            '& .MuiSvgIcon-root': {
              color: 'white',
            },
          },
        }}
        onClick={toggleSidebar}
      >
        <Tooltip title={expanded ? "Esconder menu" : "Mostrar menu"} placement="right">
          <IconButton
            size="small"
            sx={{
              p: 0,
              '&:hover': {
                backgroundColor: 'transparent'
              }
            }}
            aria-label={expanded ? "Esconder menu" : "Mostrar menu"}
          >
            {expanded ? <ChevronLeft /> : <ChevronRight />}
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{
        overflow: 'auto',
        mt: 8,
        position: 'relative'
      }}>
        {/* Itens de menu comuns */}
        <List>
          {commonMenuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              component={Link}
              to={item.path}
              sx={{
                minHeight: 48,
                px: 2.5,
                justifyContent: expanded ? 'initial' : 'center',
              }}
            >
              <Tooltip title={expanded ? "" : (item.badge ? `${item.text} (Novo!)` : item.text)} placement="right">
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: expanded ? 3 : 'auto',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {item.icon}
                  {item.badge && !expanded && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: theme.palette.error.main,
                      }}
                    />
                  )}
                </ListItemIcon>
              </Tooltip>
              {expanded && <ListItemText primary={item.text} />}
              {/* Indicador "Novo" para administradores no item de menu Vendedores */}
              {item.badge && expanded && (
                <Box
                  sx={{
                    ml: 1,
                    p: '2px 6px',
                    borderRadius: 4,
                    backgroundColor: theme.palette.secondary.main,
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  {item.badge}
                </Box>
              )}
            </ListItem>
          ))}
        </List>

        {/* Separador e menus de administrador */}
        {isAdmin && (
          <>
            <Divider sx={{ my: 1 }} />
            <List>
              {adminMenuItems.map((item) => (
                <ListItem
                  button
                  key={item.text}
                  component={Link}
                  to={item.path}
                  sx={{
                    minHeight: 48,
                    px: 2.5,
                    justifyContent: expanded ? 'initial' : 'center',
                  }}
                >
                  <Tooltip title={expanded ? "" : item.text} placement="right">
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: expanded ? 3 : 'auto',
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                  </Tooltip>
                  {expanded && <ListItemText primary={item.text} />}
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;
