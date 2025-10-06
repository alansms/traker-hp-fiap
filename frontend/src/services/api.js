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
    return `http://${currentHost}:8000`; // Adicionando porta 8000 explicitamente
  }

  // Use localhost:8000 como fallback (em vez do IP específico)
  return 'http://localhost:8000';
};

const API_URL = determineApiUrl();

// Funções melhoradas para gerenciamento de token
const setToken = (token) => {
  if (token) {
    console.log('Token armazenado no localStorage');
    localStorage.setItem('token', token);
    // Também armazenamos o token na sessionStorage para redundância
    sessionStorage.setItem('token', token);
  }
};

const getToken = () => {
  // Tenta obter o token do localStorage primeiro
  let token = localStorage.getItem('token');

  // Compatibilidade: alguns fluxos armazenam como "accessToken"
  if (!token) {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      token = accessToken;
      // Sincroniza para a chave padrão
      localStorage.setItem('token', accessToken);
      sessionStorage.setItem('token', accessToken);
    }
  }

  // Se ainda não encontrar, tenta no sessionStorage
  if (!token) {
    token = sessionStorage.getItem('token');
    if (token) {
      localStorage.setItem('token', token);
    }
  }

  return token;
};

const clearToken = () => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  console.log('Token removido do armazenamento');
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

// Função para fazer login e armazenar o token
const login = async (email, password) => {
    try {
        console.log(`Tentando login com email: ${email}`);

        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Importante para manter cookies de sessão
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log('Resposta do login:', data);

        if (!response.ok) {
            const errorMessage = data.detail || 'Falha no login';
            throw new Error(errorMessage);
        }

        // Se o login for bem-sucedido, armazene o token
        if (data.access_token) {
            setToken(data.access_token);
        }

        return data;
    } catch (error) {
        console.error('Erro durante o login:', error);
        throw error;
    }
};

// Função para fazer logout
const logout = () => {
    clearToken();
    console.log('Logout realizado com sucesso');
    // Você pode adicionar redirecionamento aqui se necessário
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
            credentials: 'include', // Adicionado para garantir consistência com cookies
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
            credentials: 'include', // Adicionado para garantir consistência com cookies
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
