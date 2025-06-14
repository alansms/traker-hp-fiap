import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Função para obter o token de autenticação do localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Serviço para operações de scraping/pesquisa
 */
const scrapingService = {
  /**
   * Pesquisar produtos no Mercado Livre
   * @param {string} query - Termo de busca
   * @returns {Promise<Array>} - Lista de produtos encontrados
   */
  async searchProducts(query) {
    try {
      const response = await axios.get(
        `${API_URL}/api/scraping/search?query=${encodeURIComponent(query)}`,
        {
          headers: {
            ...getAuthHeader(),
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao pesquisar produtos:', error);
      throw error;
    }
  },

  /**
   * Extrair detalhes de um produto específico
   * @param {string} url - URL do produto no Mercado Livre
   * @returns {Promise<Object>} - Detalhes do produto
   */
  async extractProductDetails(url) {
    try {
      const response = await axios.post(
        `${API_URL}/api/scraping/extract?url=${encodeURIComponent(url)}`,
        {},
        {
          headers: {
            ...getAuthHeader(),
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao extrair detalhes do produto:', error);
      throw error;
    }
  }
};

export default scrapingService;
