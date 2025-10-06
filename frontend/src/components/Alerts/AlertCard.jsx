import React from 'react';
import PropTypes from 'prop-types';

const AlertCard = ({ alert, onMarkAsRead }) => {
  // Formatar data de criação
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Determinar ícone e cor com base no tipo de alerta
  const getAlertTypeInfo = (type) => {
    switch (type) {
      case 'price_drop':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path>
            </svg>
          ),
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          label: 'Queda de Preço'
        };
      case 'price_increase':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
          ),
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          label: 'Aumento de Preço'
        };
      case 'unauthorized_seller':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          ),
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          label: 'Vendedor Não Autorizado'
        };
      case 'low_rating':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
            </svg>
          ),
          color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
          label: 'Avaliação Baixa'
        };
      case 'stock_issue':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
            </svg>
          ),
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
          label: 'Problema de Estoque'
        };
      case 'new_seller':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          ),
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          label: 'Novo Vendedor'
        };
      default:
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          ),
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          label: 'Alerta'
        };
    }
  };
  
  const { icon, color, label } = getAlertTypeInfo(alert.type);
  
  // Renderizar conteúdo específico do alerta com base no tipo
  const renderAlertContent = () => {
    switch (alert.type) {
      case 'price_drop':
        return (
          <div>
            <p className="text-gray-700 dark:text-gray-300">
              O preço caiu de <span className="line-through">R$ {alert.oldPrice.toFixed(2)}</span> para{' '}
              <span className="font-semibold text-green-600 dark:text-green-400">
                R$ {alert.newPrice.toFixed(2)}
              </span>{' '}
              ({Math.abs(alert.percentChange)}% de redução)
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Vendedor: {alert.seller}
            </p>
          </div>
        );
      case 'price_increase':
        return (
          <div>
            <p className="text-gray-700 dark:text-gray-300">
              O preço aumentou de <span className="line-through">R$ {alert.oldPrice.toFixed(2)}</span> para{' '}
              <span className="font-semibold text-red-600 dark:text-red-400">
                R$ {alert.newPrice.toFixed(2)}
              </span>{' '}
              ({alert.percentChange}% de aumento)
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Vendedor: {alert.seller}
            </p>
          </div>
        );
      case 'unauthorized_seller':
        return (
          <div>
            <p className="text-gray-700 dark:text-gray-300">
              Vendedor não autorizado detectado: <span className="font-semibold">{alert.seller}</span>
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Avaliação do vendedor: {alert.sellerRating} / 5
            </p>
          </div>
        );
      case 'low_rating':
        return (
          <div>
            <p className="text-gray-700 dark:text-gray-300">
              A avaliação do vendedor <span className="font-semibold">{alert.seller}</span> caiu para{' '}
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                {alert.sellerRating} / 5
              </span>{' '}
              (anteriormente {alert.previousRating} / 5)
            </p>
          </div>
        );
      case 'stock_issue':
        return (
          <div>
            <p className="text-gray-700 dark:text-gray-300">
              {alert.issue === 'out_of_stock' ? 'Produto esgotado' : 'Problema de estoque'} no vendedor{' '}
              <span className="font-semibold">{alert.seller}</span>
            </p>
          </div>
        );
      case 'new_seller':
        return (
          <div>
            <p className="text-gray-700 dark:text-gray-300">
              Novo vendedor detectado: <span className="font-semibold">{alert.seller}</span>
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Avaliação: {alert.sellerRating} / 5 • 
              {alert.authorized ? (
                <span className="text-green-600 dark:text-green-400 ml-1">Autorizado</span>
              ) : (
                <span className="text-yellow-600 dark:text-yellow-400 ml-1">Não autorizado</span>
              )}
            </p>
          </div>
        );
      default:
        return (
          <p className="text-gray-700 dark:text-gray-300">
            Alerta para o produto
          </p>
        );
    }
  };
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden ${
      !alert.read ? 'border-l-4 border-blue-500 dark:border-blue-400' : ''
    }`}>
      <div className="p-4">
        <div className="flex items-start">
          {/* Ícone do alerta */}
          <div className={`flex-shrink-0 rounded-full p-2 mr-4 ${color}`}>
            {icon}
          </div>
          
          {/* Conteúdo do alerta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
                  {label}
                </span>
                {!alert.read && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Novo
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(alert.createdAt)}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
              {alert.product.name}
            </h3>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              PN: {alert.product.pn}
            </p>
            
            {renderAlertContent()}
          </div>
        </div>
      </div>
      
      {/* Ações do alerta */}
      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => onMarkAsRead(alert.id)}
            className={`text-sm font-medium ${
              alert.read 
                ? 'text-gray-500 dark:text-gray-400 cursor-default' 
                : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
            }`}
            disabled={alert.read}
          >
            {alert.read ? 'Lido' : 'Marcar como lido'}
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
            Ver produto
          </button>
          <button className="text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300">
            Detalhes
          </button>
        </div>
      </div>
    </div>
  );
};

AlertCard.propTypes = {
  alert: PropTypes.shape({
    id: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    product: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      pn: PropTypes.string.isRequired
    }).isRequired,
    seller: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    read: PropTypes.bool.isRequired,
    oldPrice: PropTypes.number,
    newPrice: PropTypes.number,
    percentChange: PropTypes.number,
    sellerRating: PropTypes.number,
    previousRating: PropTypes.number,
    authorized: PropTypes.bool,
    issue: PropTypes.string
  }).isRequired,
  onMarkAsRead: PropTypes.func.isRequired
};

export default AlertCard;
