import api from './api';

const API_URL = process.env.REACT_APP_API_URL || '';

const scrapingControlService = {
  /**
   * Obtém o status atual do scraping
   */
  getStatus: async () => {
    try {
      const response = await api.get('/api/scraping-control/status');
      return response;
    } catch (error) {
      console.error('Erro ao obter status do scraping:', error);
      throw error;
    }
  },

  /**
   * Inicia o scraping manualmente
   */
  startScraping: async () => {
    try {
      const response = await api.post('/api/scraping-control/start');
      return response;
    } catch (error) {
      console.error('Erro ao iniciar scraping:', error);
      throw error;
    }
  },

  /**
   * Para o scraping em execução
   */
  stopScraping: async () => {
    try {
      const response = await api.post('/api/scraping-control/stop');
      return response;
    } catch (error) {
      console.error('Erro ao parar scraping:', error);
      throw error;
    }
  },

  /**
   * Obtém a configuração atual do scraping
   */
  getConfig: async () => {
    try {
      const response = await api.get('/api/scraping-control/config');
      return response;
    } catch (error) {
      console.error('Erro ao obter configuração do scraping:', error);
      throw error;
    }
  },

  /**
   * Atualiza a configuração do scraping
   */
  updateConfig: async (config) => {
    try {
      const response = await api.put('/api/scraping-control/config', config);
      return response;
    } catch (error) {
      console.error('Erro ao atualizar configuração do scraping:', error);
      throw error;
    }
  },

  /**
   * Obtém o histórico de execuções de scraping
   */
  getHistory: async (limit = 10) => {
    try {
      const response = await api.get(`/api/scraping-control/history?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Erro ao obter histórico de scraping:', error);
      throw error;
    }
  }
};

export default scrapingControlService;
