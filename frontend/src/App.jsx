import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import { SidebarProvider } from './components/Layout/Sidebar';
import Layout from './components/Layout/Layout';
import { ThemeProvider } from './contexts/ThemeContext';

// Páginas de autenticação
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ResetPassword from './pages/Auth/ResetPassword';
import AccountVerification from './pages/Auth/AccountVerification';

// Páginas principais
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetail from './pages/Products/Detail';
import ProductNew from './pages/Products/New';
import ProductSearch from './pages/Products/Search';
import Sellers from './pages/Sellers';
import SellerDetail from './pages/Sellers/Detail';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Chat from './pages/Chat';
// Importando o componente de aprovação de usuários
import UserApproval from './pages/Settings/UserApproval';
// Importando as novas páginas
import Users from './pages/Users';
import SystemLogs from './pages/Logs';
// Importando o dashboard de análise da nova localização
import DataAnalysisDashboard from './pages/DataAnalysis';

const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <SidebarProvider>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/verify/:token" element={<AccountVerification />} />

            {/* Rotas protegidas */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            } />

            {/* Rota de Pesquisa */}
            <Route path="/search" element={
              <PrivateRoute>
                <Layout>
                  <ProductSearch />
                </Layout>
              </PrivateRoute>
            } />

            {/* Rotas de Produtos */}
            <Route path="/products" element={
              <PrivateRoute>
                <Layout>
                  <Products />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/products/search" element={
              <PrivateRoute>
                <Layout>
                  <ProductSearch />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/products/new" element={
              <PrivateRoute>
                <Layout>
                  <ProductNew />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/products/:id" element={
              <PrivateRoute>
                <Layout>
                  <ProductDetail />
                </Layout>
              </PrivateRoute>
            } />

            {/* Outras rotas */}
            <Route path="/sellers" element={
              <PrivateRoute>
                <Layout>
                  <Sellers />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/sellers/:id" element={
              <PrivateRoute>
                <Layout>
                  <SellerDetail />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/alerts" element={
              <PrivateRoute>
                <Layout>
                  <Alerts />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/settings" element={
              <PrivateRoute>
                <Layout>
                  <Settings />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/chat" element={
              <PrivateRoute>
                <Layout>
                  <Chat />
                </Layout>
              </PrivateRoute>
            } />

            {/* Nova rota para aprovação de usuários */}
            <Route path="/admin/users" element={
              <PrivateRoute adminOnly={true}>
                <Layout>
                  <UserApproval />
                </Layout>
              </PrivateRoute>
            } />

            {/* Rota alternativa para aprovação de usuários (através das configurações) */}
            <Route path="/settings/user-approval" element={
              <PrivateRoute adminOnly={true}>
                <Layout>
                  <UserApproval />
                </Layout>
              </PrivateRoute>
            } />

            {/* Novas rotas para Usuários e Logs do Sistema */}
            <Route path="/users" element={
              <PrivateRoute adminOnly={true}>
                <Layout>
                  <Users />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/logs" element={
              <PrivateRoute adminOnly={true}>
                <Layout>
                  <SystemLogs />
                </Layout>
              </PrivateRoute>
            } />

            {/* Rota para o dashboard de análise */}
            <Route path="/data-analysis" element={
              <PrivateRoute>
                <Layout>
                  <DataAnalysisDashboard />
                </Layout>
              </PrivateRoute>
            } />
          </Routes>
        </SidebarProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
