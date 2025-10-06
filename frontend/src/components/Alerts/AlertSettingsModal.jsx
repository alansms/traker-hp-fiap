import React, { useState } from 'react';

const AlertSettingsModal = ({ onClose, onSave }) => {
  const [settings, setSettings] = useState({
    priceDropThreshold: 10,
    priceIncreaseThreshold: 15,
    lowRatingThreshold: 3.0,
    enableEmailNotifications: true,
    enablePushNotifications: false,
    notificationFrequency: 'immediate',
    alertTypes: {
      priceDrop: true,
      priceIncrease: true,
      unauthorizedSeller: true,
      lowRating: true,
      stockIssue: true,
      newSeller: true
    }
  });

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAlertTypeChange = (type, checked) => {
    setSettings(prev => ({
      ...prev,
      alertTypes: {
        ...prev.alertTypes,
        [type]: checked
      }
    }));
  };

  const handleSave = () => {
    onSave(settings);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Configurações de Alertas
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Limiares de Preço */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Limiares de Preço
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Queda de Preço (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.priceDropThreshold}
                    onChange={(e) => handleChange('priceDropThreshold', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Alerta quando o preço cair mais que este percentual
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Aumento de Preço (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.priceIncreaseThreshold}
                    onChange={(e) => handleChange('priceIncreaseThreshold', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Alerta quando o preço subir mais que este percentual
                  </p>
                </div>
              </div>
            </div>

            {/* Limiar de Avaliação */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Limiar de Avaliação
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Avaliação Mínima do Vendedor
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={settings.lowRatingThreshold}
                  onChange={(e) => handleChange('lowRatingThreshold', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Alerta quando a avaliação do vendedor ficar abaixo deste valor
                </p>
              </div>
            </div>

            {/* Tipos de Alertas */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Tipos de Alertas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(settings.alertTypes).map(([type, enabled]) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => handleAlertTypeChange(type, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {type === 'priceDrop' && 'Queda de Preço'}
                      {type === 'priceIncrease' && 'Aumento de Preço'}
                      {type === 'unauthorizedSeller' && 'Vendedor Não Autorizado'}
                      {type === 'lowRating' && 'Avaliação Baixa'}
                      {type === 'stockIssue' && 'Problema de Estoque'}
                      {type === 'newSeller' && 'Novo Vendedor'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notificações */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Notificações
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.enableEmailNotifications}
                    onChange={(e) => handleChange('enableEmailNotifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Notificações por Email
                  </span>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.enablePushNotifications}
                    onChange={(e) => handleChange('enablePushNotifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Notificações Push
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frequência das Notificações
                  </label>
                  <select
                    value={settings.notificationFrequency}
                    onChange={(e) => handleChange('notificationFrequency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="immediate">Imediata</option>
                    <option value="hourly">A cada hora</option>
                    <option value="daily">Diária</option>
                    <option value="weekly">Semanal</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
            >
              Salvar Configurações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertSettingsModal;
