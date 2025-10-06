import React from 'react';
import PropTypes from 'prop-types';

const AlertFilterForm = ({ filters, setFilters }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters({
      ...filters,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleReset = () => {
    setFilters({
      type: 'all',
      timeframe: '7days',
      onlyUnread: false,
      productName: '',
      sellerName: ''
    });
  };
  
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Filtros</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Tipo de alerta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de Alerta
          </label>
          <select
            name="type"
            value={filters.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Todos</option>
            <option value="price_drop">Queda de Preço</option>
            <option value="price_increase">Aumento de Preço</option>
            <option value="unauthorized_seller">Vendedor Não Autorizado</option>
            <option value="low_rating">Avaliação Baixa</option>
            <option value="stock_issue">Problema de Estoque</option>
            <option value="new_seller">Novo Vendedor</option>
          </select>
        </div>
        
        {/* Período */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Período
          </label>
          <select
            name="timeframe"
            value={filters.timeframe}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Todo o período</option>
            <option value="today">Hoje</option>
            <option value="7days">Últimos 7 dias</option>
            <option value="30days">Últimos 30 dias</option>
          </select>
        </div>
        
        {/* Nome do produto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Produto
          </label>
          <input
            type="text"
            name="productName"
            value={filters.productName}
            onChange={handleChange}
            placeholder="Nome ou PN do produto"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        {/* Nome do vendedor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Vendedor
          </label>
          <input
            type="text"
            name="sellerName"
            value={filters.sellerName}
            onChange={handleChange}
            placeholder="Nome do vendedor"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        {/* Apenas não lidos */}
        <div className="flex items-end">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="onlyUnread"
              checked={filters.onlyUnread}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Apenas não lidos
            </span>
          </label>
        </div>
      </div>
      
      {/* Botão de reset */}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  );
};

AlertFilterForm.propTypes = {
  filters: PropTypes.shape({
    type: PropTypes.string.isRequired,
    timeframe: PropTypes.string.isRequired,
    onlyUnread: PropTypes.bool.isRequired,
    productName: PropTypes.string.isRequired,
    sellerName: PropTypes.string.isRequired
  }).isRequired,
  setFilters: PropTypes.func.isRequired
};

export default AlertFilterForm;
