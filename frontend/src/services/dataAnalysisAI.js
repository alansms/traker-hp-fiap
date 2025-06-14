// Serviço para análise de dados usando IA
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Função auxiliar para obter o token de autenticação do localStorage
const getAuthToken = () => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  return token ? `Bearer ${token}` : '';
};

/**
 * Solicita análise dos dados de um dashboard específico
 * @param {Object} dashboardData - Dados do dashboard a serem analisados
 * @param {string} question - Pergunta específica sobre os dados (opcional)
 * @returns {Promise<Object>} Análise gerada pela IA
 */
export const analyzeDataWithAI = async (dashboardData, question = null) => {
  try {
    if (!getAuthToken()) {
      throw new Error('Autenticação necessária para usar o serviço de análise');
    }

    const payload = {
      dashboardData,
      question,
      dataType: 'analytics',
    };

    const response = await fetch(`${API_URL}/api/ai/analyze-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthToken()
      },
      body: JSON.stringify(payload),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao obter análise dos dados');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro no serviço de análise de dados:', error);
    throw error;
  }
};

/**
 * Obtém insights automáticos com base nos dados atuais do dashboard
 * @param {Object} dashboardData - Dados do dashboard a serem analisados
 * @returns {Promise<Object>} Lista de insights gerados pela IA
 */
export const getAutoInsights = async (dashboardData) => {
  try {
    if (!getAuthToken()) {
      throw new Error('Autenticação necessária para usar o serviço de insights');
    }

    // Use AbortController to implement timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // Aumentando para 60 segundos devido ao tempo de processamento

    console.log('Enviando requisição para auto-insights com dados:', dashboardData);

    const response = await fetch(`${API_URL}/api/ai/auto-insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthToken()
      },
      // Enviando corpo vazio para compatibilidade com o backend que busca dados automaticamente
      body: JSON.stringify({}),
      credentials: 'include',
      signal: controller.signal
    });

    clearTimeout(timeoutId); // Clear the timeout if the request completes

    console.log('Resposta recebida do servidor:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || 'Erro ao gerar insights automáticos';
      } catch (e) {
        errorMessage = errorText || 'Erro ao gerar insights automáticos';
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Dados recebidos do servidor:', data);
    return data;
  } catch (error) {
    console.error('Erro ao gerar insights automáticos:', error);
    // Provide more specific error messages based on the type of error
    if (error.name === 'AbortError') {
      throw new Error('A solicitação de insights demorou muito tempo e foi cancelada. Por favor, tente novamente.');
    }
    throw error;
  }
};

/**
 * Obtém recomendações baseadas nos dados do dashboard
 * @param {Object} dashboardData - Dados do dashboard
 * @param {string} targetMetric - Métrica alvo para otimização (ex: "vendas", "preço")
 * @returns {Promise<Object>} Recomendações geradas pela IA
 */
export const getDataRecommendations = async (dashboardData, targetMetric) => {
  try {
    if (!getAuthToken()) {
      throw new Error('Autenticação necessária para usar o serviço de recomendações');
    }

    const response = await fetch(`${API_URL}/api/ai/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthToken()
      },
      body: JSON.stringify({ dashboardData, targetMetric }),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao gerar recomendações');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao gerar recomendações:', error);
    throw error;
  }
};
