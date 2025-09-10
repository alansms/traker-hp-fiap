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
import SettingsTest from './pages/SettingsTest';
import Chat from './pages/Chat';
import UserApproval from './pages/Settings/UserApproval';
import Users from './pages/Users';
import SystemLogs from './pages/Logs';
import DataAnalysisDashboard from './pages/DataAnalysis';

const App = () => {
  return (
    <ThemeProvider>
      <Router basename="/">
        <SidebarProvider>
          <Routes>
            {/* Rota raiz redireciona para login se não autenticado */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Rotas públicas de autenticação */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/verify/:token" element={<AccountVerification />} />

            {/* Rotas protegidas dentro do Layout */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/products" element={
              <PrivateRoute>
                <Layout>
                  <Products />
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

            <Route path="/products/new" element={
              <PrivateRoute>
                <Layout>
                  <ProductNew />
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

            <Route path="/settings/user-approval" element={
              <PrivateRoute>
                <Layout>
                  <UserApproval />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/users" element={
              <PrivateRoute>
                <Layout>
                  <Users />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/logs" element={
              <PrivateRoute>
                <Layout>
                  <SystemLogs />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/analysis" element={
              <PrivateRoute>
                <Layout>
                  <DataAnalysisDashboard />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/settings-test" element={
              <PrivateRoute>
                <Layout>
                  <SettingsTest />
                </Layout>
              </PrivateRoute>
            } />

            {/* Rota de fallback para páginas não encontradas */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </SidebarProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
