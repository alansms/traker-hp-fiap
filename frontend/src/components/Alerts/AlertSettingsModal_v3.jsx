import React, { useState } from 'react';
import PropTypes from 'prop-types';

const AlertSettingsModal = ({ onClose, onSave }) => {
  const [settings, setSettings] = useState({
    priceDropThreshold: 5,
    priceIncreaseThreshold: 10,
    minSellerRating: 4.0,
    checkInterval: 6,
    emailNotifications: true,
    emailDigestFrequency: 'daily',
    pushNotifications: true,
    monitorUnauthorizedSellers: true,
    monitorRatingChanges: true,
    monitorStockIssues: true
  });
  
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simular processamento
    setTimeout(() => {
      onSave(settings);
      setLoading(false);
    }, 1000);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Configurações de Alertas
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Seção de Limites */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
                  Limites de Alerta
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Limite para Queda de Preço (%)
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="priceDropThreshold"
                        value={settings.priceDropThreshold}
                        onChange={handleChange}
                        min="0.1"
                        max="100"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">%</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Alerta quando o preço cair mais que este percentual
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Limite para Aumento de Preço (%)
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="priceIncreaseThreshold"
                        value={settings.priceIncreaseThreshold}
                        onChange={handleChange}
                        min="0.1"
                        max="100"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">%</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Alerta quando o preço subir mais que este percentual
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Avaliação Mínima do Vendedor
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="minSellerRating"
                        value={settings.minSellerRating}
                        onChange={handleChange}
                        min="1"
                        max="5"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">/ 5</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Alerta quando a avaliação do vendedor for menor que este valor
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Intervalo de Verificação (horas)
                    </label>
                    <select
                      name="checkInterval"
                      value={settings.checkInterval}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="1">1 hora</option>
                      <option value="3">3 horas</option>
                      <option value="6">6 horas (padrão)</option>
                      <option value="12">12 horas</option>
                      <option value="24">24 horas</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Frequência padrão para verificação de produtos
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Seção de Notificações */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
                  Notificações
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        name="emailNotifications"
                        checked={settings.emailNotifications}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label className="font-medium text-gray-700 dark:text-gray-300">
                        Notificações por Email
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        Receber alertas por email
                      </p>
                    </div>
                  </div>
                  
                  {settings.emailNotifications && (
                    <div className="ml-7">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Frequência do Resumo por Email
                      </label>
                      <select
                        name="emailDigestFrequency"
                        value={settings.emailDigestFrequency}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="immediate">Imediato (cada alerta)</option>
                        <option value="daily">Diário (resumo)</option>
                        <option value="weekly">Semanal (resumo)</option>
                      </select>
                    </div>
                  )}
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        name="pushNotifications"
                        checked={settings.pushNotifications}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label className="font-medium text-gray-700 dark:text-gray-300">
                        Notificações na Interface
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        Mostrar alertas na interface do sistema
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Seção de Tipos de Alerta */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
                  Tipos de Alerta
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        name="monitorUnauthorizedSellers"
                        checked={settings.monitorUnauthorizedSellers}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label className="font-medium text-gray-700 dark:text-gray-300">
                        Monitorar Vendedores Não Autorizados
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        Alertar quando um vendedor não autorizado for detectado
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        name="monitorRatingChanges"
                        checked={settings.monitorRatingChanges}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label className="font-medium text-gray-700 dark:text-gray-300">
                        Monitorar Mudanças de Avaliação
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        Alertar quando a avaliação de um vendedor cair significativamente
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        name="monitorStockIssues"
                        checked={settings.monitorStockIssues}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label className="font-medium text-gray-700 dark:text-gray-300">
                        Monitorar Problemas de Estoque
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        Alertar quando um produto ficar indisponível ou com estoque baixo
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

AlertSettingsModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

export default AlertSettingsModal;
