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

        const responseData = await response.json();
        console.log('Dados recebidos da API:', responseData);

        if (!response.ok) {
            const errorMessage = responseData.detail ||
                               (responseData.message ? responseData.message :
                               (typeof responseData === 'string' ? responseData : 'Erro na requisição'));
            throw new Error(errorMessage);
        }

        return responseData;
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
            const errorMessage = responseData.detail ||
                                (responseData.message ? responseData.message :
                                (typeof responseData === 'string' ? responseData : 'Erro na requisição'));
            throw new Error(errorMessage);
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

        const responseData = await response.json();
        console.log('Resposta PUT recebida:', responseData);

        if (!response.ok) {
            const errorMessage = responseData.detail ||
                               (responseData.message ? responseData.message :
                               (typeof responseData === 'string' ? responseData : 'Erro na requisição'));
            throw new Error(errorMessage);
        }

        return responseData;
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

        // Verifica se há conteúdo na resposta antes de tentar converter para JSON
        const contentType = response.headers.get('content-type');
        let responseData = {};

        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
            console.log('Resposta DELETE recebida:', responseData);
        }

        if (!response.ok) {
            const errorMessage = responseData.detail ||
                               (responseData.message ? responseData.message :
                               (typeof responseData === 'string' ? responseData : 'Erro na requisição'));
            throw new Error(errorMessage);
        }

        return responseData;
    } catch (error) {
        console.error('Erro na requisição DELETE:', error);
        throw error;
    }
};

// Método específico para upload de arquivos
const uploadFile = async (url, file, additionalData = {}) => {
    try {
        // Criar um FormData para enviar o arquivo
        const formData = new FormData();
        formData.append('file', file);

        // Adicionar dados extras, se necessário
        Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, value);
        });

        console.log('Enviando arquivo:', file.name);

        // Não incluir o Content-Type no cabeçalho, o navegador define automaticamente para multipart/form-data
        const headers = {};
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}${url}`, {
            method: 'POST',
            headers: headers,
            body: formData
        });

        // Verificar se a resposta contém dados JSON
        const contentType = response.headers.get('content-type');
        let responseData = {};

        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
            console.log('Resposta de upload recebida:', responseData);
        }

        if (!response.ok) {
            // Tratamento específico para diferentes tipos de erro
            let errorMessage = 'Erro ao fazer upload do arquivo';

            if (responseData) {
                // Tratamento para diferentes formatos de erro
                if (typeof responseData === 'string') {
                    errorMessage = responseData;
                } else if (responseData.detail) {
                    errorMessage = responseData.detail;
                } else if (responseData.message) {
                    errorMessage = responseData.message;
                } else if (responseData.error) {
                    errorMessage = responseData.error;
                } else if (Array.isArray(responseData.errors)) {
                    errorMessage = responseData.errors.join(', ');
                } else if (typeof responseData === 'object' && Object.keys(responseData).length > 0) {
                    // Tentar extrair mensagens de erro de um objeto
                    const messages = [];
                    for (const key in responseData) {
                        const value = responseData[key];
                        if (Array.isArray(value)) {
                            messages.push(`${key}: ${value.join(', ')}`);
                        } else if (typeof value === 'string') {
                            messages.push(`${key}: ${value}`);
                        }
                    }
                    if (messages.length > 0) {
                        errorMessage = messages.join('; ');
                    }
                }
            }

            throw new Error(errorMessage);
        }

        return responseData;
    } catch (error) {
        console.error('Erro no upload de arquivo:', error);
        throw error;
    }
};

const apiService = {
    get,
    post,
    put,
    delete: del,
    uploadFile
};

export {
    get,
    post,
    put,
    del,
    uploadFile
};

export default apiService;
