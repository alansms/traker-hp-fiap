// Serviço para interagir com as APIs relacionadas a usuários
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Função auxiliar para obter o token de autenticação do localStorage
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token ? `Bearer ${token}` : '';
};

/**
 * Obtém a lista de usuários do sistema.
 * Requer autenticação como administrador.
 *
 * @returns {Promise<Array>} Lista de usuários
 */
export const getUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/api/users/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthToken()
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao obter lista de usuários');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao obter lista de usuários:', error);
    throw error;
  }
};

/**
 * Cria um novo usuário no sistema.
 * Requer autenticação como administrador.
 *
 * @param {Object} userData - Dados do usuário a ser criado
 * @returns {Promise<Object>} Usuário criado
 */
export const createUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/api/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthToken()
      },
      credentials: 'include',
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao criar usuário');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    throw error;
  }
};

/**
 * Atualiza um usuário existente no sistema.
 * Requer autenticação como administrador.
 *
 * @param {number} userId - ID do usuário a ser atualizado
 * @param {Object} userData - Novos dados do usuário
 * @returns {Promise<Object>} Usuário atualizado
 */
export const updateUser = async (userId, userData) => {
  try {
    const response = await fetch(`${API_URL}/api/users/${userId}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthToken()
      },
      credentials: 'include',
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao atualizar usuário');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw error;
  }
};

/**
 * Remove um usuário do sistema.
 * Requer autenticação como administrador.
 *
 * @param {number} userId - ID do usuário a ser removido
 * @returns {Promise<Object>} Confirmação da remoção
 */
export const deleteUser = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/api/users/${userId}/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthToken()
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao remover usuário');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    throw error;
  }
};
