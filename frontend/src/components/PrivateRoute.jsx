import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PrivateRoute = ({ children, requiredRole = null }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Efeito para tentar novamente em caso de falha temporária de conexão
  useEffect(() => {
    let retryTimer;

    if (connectionError && retryCount < 3) {
      console.log(`🔄 Tentativa ${retryCount + 1} de reconexão em ${(retryCount + 1) * 2} segundos...`);

      retryTimer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setConnectionError(false);
        // O useAuth irá tentar verificar o usuário novamente no próximo ciclo de renderização
      }, (retryCount + 1) * 2000); // Atraso exponencial: 2s, 4s, 6s
    }

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [connectionError, retryCount]);

  // Se ainda está carregando, mostrar indicador de carregamento ou nada
  if (loading) {
    return (
      <React.Fragment>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </React.Fragment>
    );
  }

  // Se não está autenticado, mas há erro de conexão e ainda estamos dentro das tentativas
  if (!isAuthenticated && connectionError && retryCount < 3) {
    return (
      <React.Fragment>
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="text-xl mb-4">Reconectando ao servidor...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <div className="mt-4">Tentativa {retryCount + 1} de 3</div>
        </div>
      </React.Fragment>
    );
  }

  // Se não está autenticado, redirecionar para login
  if (!isAuthenticated) {
    // Verificar se há token no localStorage, pode ser falha temporária
    const hasToken = localStorage.getItem('token');

    if (hasToken && !connectionError && retryCount < 3) {
      // Marcar como erro de conexão e tentar novamente
      setConnectionError(true);

      return (
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="text-xl mb-4">Verificando conexão com o servidor...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Verificar permissão de papel (role)
  if (requiredRole && (!user?.role || !hasRequiredPermission(user.role, requiredRole, user?.is_superuser))) {
    return <Navigate to="/dashboard" replace />;
  }

  // Tudo ok, renderizar componente filho
  return <React.Fragment>{children}</React.Fragment>;
}

// Função auxiliar para verificar se o usuário tem permissão adequada
// baseada na hierarquia de papéis: admin > analyst > visitor
const hasRequiredPermission = (userRole, requiredRole, isSuperuser) => {
  // Define a hierarquia de papéis e seus níveis de acesso
  const roleHierarchy = {
    'admin': 3,    // Nível mais alto
    'analyst': 2,  // Nível intermediário
    'visitor': 1   // Nível mais baixo
  };

  // Se o usuário é um superusuário, conceder acesso total
  if (isSuperuser) {
    return true;
  }

  // Verifica se o papel do usuário tem nível igual ou superior ao requerido
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export default PrivateRoute;
