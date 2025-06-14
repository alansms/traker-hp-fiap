// Serviço para interagir com as APIs relacionadas à OpenAI
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Função auxiliar para obter o token de autenticação do localStorage
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token ? `Bearer ${token}` : '';
};

/**
 * Valida se a chave da API da OpenAI está funcionando corretamente.
 * Requer autenticação como administrador.
 *
 * @returns {Promise<Object>} Objeto contendo o status da validação
 */
export const validateOpenAIKey = async () => {
  try {
    const response = await fetch(`${API_URL}/api/openai/validate-openai-key`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthToken()
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao validar a chave da OpenAI');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao validar a chave da OpenAI:', error);
    throw error;
  }
};
