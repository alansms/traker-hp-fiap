import api from './api';

const dashboardService = {
  /**
   * Obtém os produtos mais encontrados nas buscas
   * @param {number} size - Quantidade de produtos a retornar
   * @param {number} periodDays - Período em dias para análise
   * @returns {Promise} - Promise com os resultados
   */
  getTopProducts: async (size = 10, periodDays = 30) => {
    try {
      const response = await api.get(`/api/dashboard/top-products?size=${size}&period_days=${periodDays}`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar top produtos:', error);
      throw error;
    }
  },

  /**
   * Obtém a evolução de preço de um produto específico
   * @param {string} product - Nome do produto para análise
   * @param {number} periodDays - Período em dias para análise
   * @returns {Promise} - Promise com os resultados
   */
  getPriceEvolution: async (product, periodDays = 30) => {
    try {
      const response = await api.get(`/api/dashboard/price-evolution?product=${encodeURIComponent(product)}&period_days=${periodDays}`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar evolução de preço:', error);
      throw error;
    }
  },

  /**
   * Obtém os termos mais buscados
   * @param {number} periodDays - Período em dias para análise
   * @returns {Promise} - Promise com os resultados
   */
  getSearchTrends: async (periodDays = 30) => {
    try {
      const response = await api.get(`/api/dashboard/search-trends?period_days=${periodDays}`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar tendências de busca:', error);
      throw error;
    }
  },

  /**
   * Obtém a contagem de buscas por dia
   * @param {number} periodDays - Período em dias para análise
   * @returns {Promise} - Promise com os resultados
   */
  getDailySearches: async (periodDays = 30) => {
    try {
      const response = await api.get(`/api/dashboard/daily-searches?period_days=${periodDays}`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar buscas diárias:', error);
      throw error;
    }
  },

  /**
   * Obtém os produtos com melhores avaliações
   * @param {number} size - Quantidade de produtos a retornar
   * @param {number} periodDays - Período em dias para análise
   * @returns {Promise} - Promise com os resultados
   */
  getTopRatedProducts: async (size = 10, periodDays = 30) => {
    try {
      const response = await api.get(`/api/dashboard/top-rated-products?size=${size}&period_days=${periodDays}`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar produtos melhor avaliados:', error);
      throw error;
    }
  },

  /**
   * Obtém dados completos para a página de Análise de Dados
   * @param {string} timeRange - Período de tempo para análise (ex: '30d', '90d')
   * @returns {Promise} - Promise com os dados de análise
   */
  getAnalysisData: async (timeRange = '30d') => {
    try {
      // Converter o formato de período (ex: '30d' para 30)
      const periodDays = parseInt(timeRange.replace('d', ''));

      // Buscar todos os dados necessários para a análise em paralelo
      const [priceDistribution, priceEvolution, categoryDistribution, stockAvailability, sellerPerformance] = await Promise.all([
        api.get(`/api/dashboard/price-distribution?period_days=${periodDays}`),
        api.get(`/api/dashboard/price-evolution?product=all&period_days=${periodDays}`),
        api.get(`/api/dashboard/category-distribution?period_days=${periodDays}`),
        api.get(`/api/dashboard/stock-availability?period_days=${periodDays}`),
        api.get(`/api/dashboard/seller-performance?period_days=${periodDays}`)
      ]);

      // Organizar os dados no formato esperado pela interface
      return {
        priceDistribution: priceDistribution.data,
        priceHistory: priceEvolution.data,
        categoryDistribution: categoryDistribution.data,
        stockAvailability: stockAvailability.data,
        sellerPerformance: sellerPerformance.data
      };
    } catch (error) {
      console.error('Erro ao buscar dados de análise:', error);
      throw error;
    }
  }
};

// Função auxiliar para processar dados de categoria
function processCategoryData(products) {
  // Agrupa produtos por categoria
  const categories = {};
  products.forEach(product => {
    const category = product.titulo.includes('HP') ? 'Cartuchos HP' :
                     product.titulo.includes('Cartucho') ? 'Outros Cartuchos' :
                     product.titulo.includes('Kit') ? 'Kits' : 'Outros';

    if (!categories[category]) {
      categories[category] = 0;
    }
    categories[category] += 1;
  });

  // Converte para o formato esperado pelo gráfico
  return Object.keys(categories).map(name => ({
    name,
    value: categories[name]
  }));
}

// Função auxiliar para processar dados de vendedor
function processSellerData(products) {
  // Agrupa produtos por vendedor
  const sellers = {};
  products.forEach(product => {
    const seller = product.vendedor || 'Desconhecido';

    if (!sellers[seller]) {
      sellers[seller] = {
        name: seller,
        reputation: 0,
        sales: 0,
        products: 0
      };
    }

    sellers[seller].products += 1;
    sellers[seller].reputation = product.avaliacao || 4.0; // Usa a avaliação do produto como reputação do vendedor
    sellers[seller].sales += 1; // Incrementa contagem de vendas (estimativa)
  });

  // Converte para array e ordena por número de produtos
  return Object.values(sellers)
    .sort((a, b) => b.products - a.products)
    .slice(0, 5); // Retorna os 5 principais vendedores
}

export default dashboardService;
