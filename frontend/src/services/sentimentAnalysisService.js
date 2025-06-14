import api from './api';

const sentimentAnalysisService = {
  /**
   * Analisa a reputação de um vendedor específico ou retorna a lista de vendedores suspeitos
   * @param {string} sellerId - ID do vendedor (opcional)
   * @param {number} periodDays - Período em dias para análise
   * @returns {Promise} - Promise com os resultados
   */
  analyzeSellerReputation: async (sellerId = null, periodDays = 30) => {
    try {
      let url = `/api/dashboard/seller-analysis?period_days=${periodDays}`;
      if (sellerId) {
        url += `&seller_id=${encodeURIComponent(sellerId)}`;
      }

      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('Erro ao analisar reputação do vendedor:', error);
      throw error;
    }
  },

  /**
   * Analisa sentimentos dos comentários
   * @param {number} periodDays - Período em dias para análise
   * @param {string} productFilter - Filtro de produto (opcional)
   * @returns {Promise} - Promise com os resultados
   */
  analyzeComments: async (periodDays = 30, productFilter = null) => {
    try {
      let url = `/api/dashboard/comment-analysis?period_days=${periodDays}`;
      if (productFilter) {
        url += `&product_filter=${encodeURIComponent(productFilter)}`;
      }

      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('Erro ao analisar comentários:', error);
      throw error;
    }
  },

  /**
   * Gera relatório de risco com vendedores e produtos suspeitos
   * @param {number} periodDays - Período em dias para análise
   * @param {number} threshold - Limiar para classificação como suspeito
   * @returns {Promise} - Promise com os resultados
   */
  generateRiskReport: async (periodDays = 30, threshold = 3.0) => {
    try {
      const url = `/api/dashboard/risk-report?period_days=${periodDays}&threshold=${threshold}`;

      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('Erro ao gerar relatório de risco:', error);
      throw error;
    }
  },

  /**
   * Exporta relatório de risco em formato JSON
   * @param {Object} data - Dados do relatório
   * @returns {void} - Inicia o download do arquivo
   */
  exportRiskReport: (data) => {
    try {
      // Converter para string JSON formatada
      const jsonString = JSON.stringify(data, null, 2);

      // Criar blob e link para download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Criar elemento para download e clicar nele
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_risco_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();

      // Limpar
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao exportar relatório de risco:', error);
      throw error;
    }
  },

  /**
   * Exporta relatório de risco em formato CSV
   * @param {Object} data - Dados do relatório
   * @returns {void} - Inicia o download do arquivo
   */
  exportRiskReportCSV: (data) => {
    try {
      // Preparar os dados no formato CSV
      const suspicious_sellers = data.suspicious_sellers || [];

      // Cabeçalhos
      let csvContent = "ID,Nome,Avaliação,Comentários,Score,Classificação\n";

      // Linhas de dados
      suspicious_sellers.forEach(seller => {
        const id = seller.seller_id;
        const name = seller.seller_name.replace(/,/g, ' ');
        const rating = seller.rating;
        const commentCount = seller.comments ? seller.comments.length : 0;
        const score = seller.reputation ? seller.reputation.score : 0;
        const classification = seller.reputation ? seller.reputation.classification : 'DESCONHECIDO';

        csvContent += `${id},${name},${rating},${commentCount},${score},${classification}\n`;
      });

      // Criar blob e link para download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      // Criar elemento para download e clicar nele
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_risco_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();

      // Limpar
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao exportar relatório de risco como CSV:', error);
      throw error;
    }
  }
};

export default sentimentAnalysisService;
