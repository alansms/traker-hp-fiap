/* global process */  // Adiciona a definição global do process para o ESLint
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar se o usuário está autenticado quando o componente for montado
  useEffect(() => {
    const checkAuthStatus = async () => {
      let userResult = null;
      console.log("🔍 Verificando estado de autenticação...");
      try {
        userResult = await authService.getCurrentUser();
        console.log("✅ Usuário autenticado:", userResult);
        setUser(userResult);
      } catch (error) {
        console.error("❌ Erro ao verificar estado de autenticação:", error);
        setUser(null);
      } finally {
        setLoading(false);
        console.log("🔄 Estado de autenticação inicializado:", { user: userResult, isAuthenticated: !!userResult });
      }
    };

    checkAuthStatus();
  }, []); // Mantendo o array de dependências vazio

  const register = async (name, email, password) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: name,
          email: email,
          password: password,
          role: 'visitor' // Papel padrão para novos usuários
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Erro ao registrar usuário');
      }

      return {
        success: true,
        message: 'Cadastro realizado com sucesso! Aguarde a aprovação do administrador.',
        data: data
      };
    } catch (error) {
      console.error('Erro ao registrar:', error);
      throw new Error(error.message || 'Ocorreu um erro durante o cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const result = await authService.login(email, password);
      if (!result.requires2FA) {
        setUser(result.user);
      }
      return result;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async (email, code) => {
    try {
      setLoading(true);
      const result = await authService.verify2FA(email, code);
      setUser(result.user);
      return result;
    } catch (error) {
      console.error('Erro na verificação 2FA:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Funções para redefinição de senha
  const requestPasswordReset = async (email) => {
    try {
      setLoading(true);
      return await authService.requestPasswordReset(email);
    } catch (error) {
      console.error('Erro ao solicitar redefinição de senha:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyResetCode = async (email, code) => {
    try {
      setLoading(true);
      return await authService.verifyResetCode(email, code);
    } catch (error) {
      console.error('Erro na verificação do código:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email, code, password) => {
    try {
      setLoading(true);
      return await authService.resetPassword(email, code, password);
    } catch (error) {
      console.error('Erro ao redefinir a senha:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função para obter o token JWT do localStorage
  const getToken = () => {
    return localStorage.getItem('token');
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    token: getToken(), // Adicionando o token ao contexto
    register,
    login,
    verify2FA,
    logout,
    requestPasswordReset,
    verifyResetCode,
    resetPassword
  };

  return (
    <React.Fragment>
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </React.Fragment>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
