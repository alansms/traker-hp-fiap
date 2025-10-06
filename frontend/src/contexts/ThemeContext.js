import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Definições dos temas
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

// Contexto de tema
const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Verificar preferência salva ou usar 'system' como padrão
  const savedTheme = localStorage.getItem('theme') || 'system';
  const [themeMode, setThemeMode] = useState(savedTheme);
  const [currentTheme, setCurrentTheme] = useState(lightTheme);

  // Detectar preferência do sistema
  const prefersDarkMode = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;

  useEffect(() => {
    // Função para detectar mudanças na preferência do sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeMode === 'system') {
        setCurrentTheme(mediaQuery.matches ? darkTheme : lightTheme);
      }
    };

    // Adicionar listener para mudanças na preferência do sistema
    mediaQuery.addEventListener('change', handleChange);

    // Determinar o tema atual baseado na preferência
    console.log('🎨 Aplicando tema:', { themeMode, prefersDarkMode });
    if (themeMode === 'light') {
      console.log('🎨 Aplicando tema claro');
      setCurrentTheme(lightTheme);
    } else if (themeMode === 'dark') {
      console.log('🎨 Aplicando tema escuro');
      setCurrentTheme(darkTheme);
    } else {
      // 'system' - usar preferência do sistema
      console.log('🎨 Aplicando tema do sistema:', prefersDarkMode ? 'escuro' : 'claro');
      setCurrentTheme(prefersDarkMode ? darkTheme : lightTheme);
    }

    // Cleanup
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode, prefersDarkMode]);

  // Função para alterar o tema
  const changeTheme = (newTheme) => {
    console.log('🎨 Mudando tema para:', newTheme);
    setThemeMode(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ themeMode, changeTheme }}>
      <MuiThemeProvider theme={currentTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
