import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Alerts = () => {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    dateRange: 'all',
    onlyUnread: false
  });
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Verificar autenticação
    if (!user) {
      navigate('/auth/login');
      return;
    }
    
    // Carregar alertas
    const fetchAlerts = async () => {
      try {
        // Aqui seriam as chamadas reais para a API
        // Simulando dados para exemplo
        const mockAlerts = [
          { 
            id: 1, 
            type: 'price_drop',
            product: 'Cartucho HP 664XL Preto',
            productId: 1,
            oldPrice: 99.90,
            newPrice: 89.90,
            seller: 'Loja Oficial HP',
            sellerId: 1,
            date: '2025-05-23T14:30:00',
            read: false
          },
          { 
            id: 2, 
            type: 'unauthorized_seller',
            product: 'Cartucho HP 664 Colorido',
            productId: 2,
            price: 79.90,
            seller: 'TintasShop',
            sellerId: 2,
            date: '2025-05-23T10:15:00',
            read: true
          },
          { 
            id: 3, 
            type: 'price_increase',
            product: 'Cartucho Epson 544 Preto',
            productId: 3,
            oldPrice: 49.90,
            newPrice: 59.90,
            seller: 'Epson Brasil',
            sellerId: 3,
            date: '2025-05-22T16:45:00',
            read: false
          },
          { 
            id: 4, 
            type: 'price_drop',
            product: 'Cartucho Canon PG-210XL Preto',
            productId: 4,
            oldPrice: 129.90,
            newPrice: 119.90,
            seller: 'Canon Store',
            sellerId: 4,
            date: '2025-05-21T09:30:00',
            read: true
          },
          { 
            id: 5, 
            type: 'stock_issue',
            product: 'Cartucho Brother LC103 Preto',
            productId: 5,
            seller: 'Suprimentos Online',
            sellerId: 5,
            date: '2025-05-20T11:20:00',
            read: true,
            message: 'Produto indisponível há mais de 7 dias'
          }
        ];
        
        setAlerts(mockAlerts);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar alertas:', error);
        setLoading(false);
      }
    };
    
    fetchAlerts();
  }, [user, navigate]);

  // Filtrar alertas
  const filteredAlerts = alerts.filter(alert => {
    // Filtro de busca
    if (filters.search && !alert.product.toLowerCase().includes(filters.search.toLowerCase()) && 
        !alert.seller.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Filtro de tipo
    if (filters.type !== 'all' && alert.type !== filters.type) {
      return false;
    }
    
    // Filtro de data
    const alertDate = new Date(alert.date);

    if (filters.dateRange === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (alertDate < today) {
        return false;
      }
    } else if (filters.dateRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (alertDate < weekAgo) {
        return false;
      }
    } else if (filters.dateRange === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      if (alertDate < monthAgo) {
        return false;
      }
    }
    
    // Filtro de não lidos
    if (filters.onlyUnread && alert.read) {
      return false;
    }
    
    return true;
  });

  // Manipular mudanças nos filtros
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Marcar alerta como lido
  const handleMarkAsRead = (alertId, e) => {
    e.stopPropagation();
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
    // Aqui seria a chamada real para a API
  };

  // Navegar para detalhes do produto
  const handleAlertClick = (alert) => {
    navigate(`/products/${alert.productId}`);
  };

  // Formatar data relativa
  const formatRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) {
      return 'agora';
    } else if (diffMin < 60) {
      return `${diffMin} min atrás`;
    } else if (diffHour < 24) {
      return `${diffHour} h atrás`;
    } else if (diffDay < 30) {
      return `${diffDay} dias atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Removendo a renderização redundante do Topbar */}

        <main className="flex-1 overflow-y-auto p-4">
          <div className="container mx-auto">
            {/* Cabeçalho */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Alertas</h1>
              <div className="flex items-center">
                <span className="mr-2 text-sm text-gray-600 dark:text-gray-400">
                  {alerts.filter(a => !a.read).length} não lidos
                </span>
                <button
                  onClick={() => setAlerts(prev => prev.map(alert => ({ ...alert, read: true })))}
                  className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400"
                >
                  Marcar todos como lidos
                </button>
              </div>
            </div>
            
            {/* Filtros */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Filtros</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Busca */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Buscar
                  </label>
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Produto ou vendedor"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                {/* Tipo de alerta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Alerta
                  </label>
                  <select
                    name="type"
                    value={filters.type}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">Todos</option>
                    <option value="price_drop">Queda de Preço</option>
                    <option value="price_increase">Aumento de Preço</option>
                    <option value="unauthorized_seller">Vendedor Não Autorizado</option>
                    <option value="stock_issue">Problema de Estoque</option>
                  </select>
                </div>
                
                {/* Período */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Período
                  </label>
                  <select
                    name="dateRange"
                    value={filters.dateRange}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">Todos</option>
                    <option value="today">Hoje</option>
                    <option value="week">Última semana</option>
                    <option value="month">Último mês</option>
                  </select>
                </div>
                
                {/* Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="onlyUnread"
                    name="onlyUnread"
                    checked={filters.onlyUnread}
                    onChange={handleFilterChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="onlyUnread" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Apenas não lidos
                  </label>
                </div>
              </div>
            </div>
            
            {/* Lista de alertas */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">Nenhum alerta encontrado com os filtros selecionados.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    onClick={() => handleAlertClick(alert)}
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${!alert.read ? 'border-l-4 border-yellow-500' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        {/* Ícone do tipo de alerta */}
                        <div className={`p-1.5 rounded-full mr-2 flex items-center justify-center w-8 h-8 ${
                          alert.type === 'price_drop' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' :
                          alert.type === 'price_increase' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' :
                          alert.type === 'unauthorized_seller' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300' :
                          'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                        }`}>
                          {alert.type === 'price_drop' && (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path>
                            </svg>
                          )}
                          {alert.type === 'price_increase' && (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                            </svg>
                          )}
                          {alert.type === 'unauthorized_seller' && (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                          )}
                          {alert.type === 'stock_issue' && (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                            </svg>
                          )}
                        </div>
                        
                        {/* Conteúdo do alerta */}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{alert.product}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {alert.type === 'price_drop' && (
                              <>Queda de preço: <span className="text-green-600 dark:text-green-400">R$ {alert.oldPrice.toFixed(2)} → R$ {alert.newPrice.toFixed(2)}</span></>
                            )}
                            {alert.type === 'price_increase' && (
                              <>Aumento de preço: <span className="text-red-600 dark:text-red-400">R$ {alert.oldPrice.toFixed(2)} → R$ {alert.newPrice.toFixed(2)}</span></>
                            )}
                            {alert.type === 'unauthorized_seller' && (
                              <>Vendedor não autorizado: <span className="font-medium">{alert.seller}</span></>
                            )}
                            {alert.type === 'stock_issue' && (
                              <>{alert.message}</>
                            )}
                          </p>
                          <div className="mt-1 flex items-center">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeDate(alert.date)}</span>
                            <span className="mx-2 text-gray-400">•</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{alert.seller}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Botão de marcar como lido */}
                      {!alert.read && (
                        <button
                          onClick={(e) => handleMarkAsRead(alert.id, e)}
                          className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400"
                        >
                          Marcar como lido
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Alerts;
