// Determina dinamicamente a URL base para API
const determineApiUrl = () => {
  // Se a variável de ambiente está definida, use-a
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Detecta o host atual para usar como base da API
  const currentHost = window.location.hostname;

  // Se estamos acessando por IP ou domínio específico, use o mesmo para a API
  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    return `http://${currentHost}`;
  }

  // Use o IP específico como fallback
  return 'http://173.21.101.62';
};

const API_URL = determineApiUrl();

const getToken = () => {
    return localStorage.getItem('token');
};

const getHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
    };

    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

const get = async (url, params = {}) => {
    try {
        // Verifica se a URL já contém parâmetros de consulta
        const hasQueryParams = url.includes('?');

        // Se a URL já tem parâmetros, não adicione os params extras
        // para evitar duplicação de parâmetros
        const queryParams = Object.keys(params).length > 0
            ? new URLSearchParams(params).toString()
            : '';

        // Monta a URL final com cuidado para não duplicar o '?'
        let fullUrl = `${API_URL}${url}`;
        if (!hasQueryParams && queryParams) {
            fullUrl += `?${queryParams}`;
        } else if (queryParams) {
            fullUrl += `&${queryParams}`;
        }

        console.log('Fazendo requisição GET para:', fullUrl);

        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erro na requisição');
        }

        const data = await response.json();
        console.log('Dados recebidos da API:', data);
        return data;
    } catch (error) {
        console.error('Erro na requisição GET:', error);
        throw error;
    }
};

const post = async (url, data) => {
    try {
        console.log('Enviando dados:', data);
        const response = await fetch(`${API_URL}${url}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        const responseData = await response.json();
        console.log('Resposta recebida:', responseData);

        if (!response.ok) {
            throw new Error(responseData.detail || 'Erro na requisição');
        }

        return responseData;
    } catch (error) {
        console.error('Erro na requisição POST:', error);
        throw error;
    }
};

const put = async (url, data) => {
    try {
        const response = await fetch(`${API_URL}${url}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erro na requisição');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro na requisição PUT:', error);
        throw error;
    }
};

const del = async (url) => {
    try {
        const response = await fetch(`${API_URL}${url}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erro na requisição');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro na requisição DELETE:', error);
        throw error;
    }
};

const apiService = {
    get,
    post,
    put,
    delete: del
};

export {
    get,
    post,
    put,
    del
};

export default apiService;
