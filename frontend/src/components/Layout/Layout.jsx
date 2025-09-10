import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Sidebar, { useSidebar } from './Sidebar';
import Topbar from './Topbar';

const Layout = ({ children }) => {
  const { expanded } = useSidebar();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery('(max-width:768px)');

  // Usar os mesmos cálculos de largura da Sidebar para manter consistência
  const baseExpandedWidth = 240;
  const baseCollapsedWidth = 64;

  // Função para calcular largura responsiva
  const getResponsiveWidth = (baseWidth) => {
    if (isSmallScreen) {
      // Em telas pequenas, usar porcentagens
      return expanded ? '60%' : '15%';
    }
    return `${baseWidth}px`;
  };

  const drawerWidth = expanded ?
    getResponsiveWidth(baseExpandedWidth) :
    getResponsiveWidth(baseCollapsedWidth);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Topbar />
      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', marginTop: '64px' }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: {
              xs: 1,
              sm: 1.5
            },
            ml: 0,
            overflow: 'auto',
            width: {
              xs: `calc(100% - ${isSmallScreen ? (expanded ? '180px' : '50px') : drawerWidth})`,
              sm: `calc(100% - ${drawerWidth})`
            },
            marginLeft: 0,
            transition: theme.transitions.create(['width', 'margin-left'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
