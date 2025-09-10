import api from './api';

const settingsService = {
  /**
   * Obtém todas as configurações do sistema
   * @returns {Promise<Object>} - Objeto com as configurações
   */
  getSystemSettings: async () => {
    try {
      const response = await api.get('/api/settings');
      return response;
    } catch (error) {
      console.error('Erro ao obter configurações do sistema:', error);
      throw error;
    }
  },

  /**
   * Salva configurações do sistema
   * @param {Object} settings - Objeto com as configurações a serem salvas
   * @returns {Promise<Object>} - Resposta da API
   */
  saveSystemSettings: async (settings) => {
    try {
      const response = await api.post('/api/settings', settings);
      return response;
    } catch (error) {
      console.error('Erro ao salvar configurações do sistema:', error);
      throw error;
    }
  },

  /**
   * Obtém a chave da API OpenAI
   * @returns {Promise<Object>} - Objeto com a chave da API (mascarada)
   */
  getOpenAIKey: async () => {
    try {
      const response = await api.get('/api/settings/openai-key');
      return response;
    } catch (error) {
      console.error('Erro ao obter chave da API OpenAI:', error);
      throw error;
    }
  },

  /**
   * Salva a chave da API OpenAI
   * @param {string} apiKey - Chave da API OpenAI
   * @returns {Promise<Object>} - Resposta da API
   */
  saveOpenAIKey: async (apiKey) => {
    try {
      const response = await api.post('/api/settings/openai-key', { apiKey });
      return response;
    } catch (error) {
      console.error('Erro ao salvar chave da API OpenAI:', error);
      throw error;
    }
  },

  /**
   * Valida a chave da API OpenAI
   * @returns {Promise<Object>} - Resposta da validação
   */
  validateOpenAIKey: async () => {
    try {
      const response = await api.get('/api/openai/validate-openai-key');
      return response;
    } catch (error) {
      console.error('Erro ao validar chave da API OpenAI:', error);
      return {
        valid: false,
        message: error.response?.data?.detail || 'Erro ao validar a chave da API'
      };
    }
  }
};

export default settingsService;
