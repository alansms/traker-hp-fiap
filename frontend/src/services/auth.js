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

export const login = async (email, password) => {
    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Falha na autenticação');
        }

        const data = await response.json();

        // Salvar o token no localStorage para uso posterior nas requisições
        if (data.access_token) {
            localStorage.setItem('token', data.access_token);
        }

        return data;
    } catch (error) {
        console.error('Erro no login:', error);
        throw error;
    }
};

export const verify2FA = async (email, code) => {
    try {
        const response = await fetch(`${API_URL}/api/auth/verify-2fa`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, code }),
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Código de verificação inválido');
        }

        const data = await response.json();

        // Salvar o token no localStorage quando o 2FA for verificado com sucesso
        if (data.access_token) {
            localStorage.setItem('token', data.access_token);
        }

        return data;
    } catch (error) {
        console.error('Erro na verificação 2FA:', error);
        throw error;
    }
};

export const logout = async () => {
    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            },
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao fazer logout');
        }

        // Remover o token do localStorage ao fazer logout
        localStorage.removeItem('token');

    } catch (error) {
        console.error('Erro no logout:', error);
        throw error;
    }
};

export const requestPasswordReset = async (email) => {
    try {
        const response = await fetch(`${API_URL}/api/auth/request-password-reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao solicitar redefinição de senha');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro na solicitação de redefinição de senha:', error);
        throw error;
    }
};

export const verifyResetCode = async (email, code) => {
    try {
        const response = await fetch(`${API_URL}/api/auth/verify-reset-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, code }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Código de verificação inválido');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro na verificação do código:', error);
        throw error;
    }
};

export const resetPassword = async (email, code, password) => {
    try {
        const response = await fetch(`${API_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, code, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao redefinir a senha');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro na redefinição de senha:', error);
        throw error;
    }
};

// Verificar se o usuário está autenticado
export const getCurrentUser = async () => {
    console.log("📡 Chamando API para verificar autenticação...");
    try {
        // Obter o token do localStorage
        const token = localStorage.getItem('token');

        if (!token) {
            console.log("❌ Nenhum token encontrado no localStorage");
            throw new Error('Usuário não autenticado');
        }

        console.log("��� Token encontrado, enviando requisição com autorização");

        // Implementando retry com atraso exponencial (até 3 tentativas)
        let retries = 0;
        const maxRetries = 3;

        while (retries < maxRetries) {
            try {
                const response = await fetch(`${API_URL}/api/auth/me`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include'
                });

                console.log(`📥 Resposta da API (tentativa ${retries + 1}):`, { status: response.status, ok: response.ok });

                if (response.ok) {
                    const data = await response.json();
                    console.log("✅ Dados do usuário obtidos:", data);

                    // Garantir que o papel do usuário esteja disponível
                    if (data.user && !data.user.role) {
                        console.warn("⚠️ Papel do usuário não encontrado na resposta da API. Verificando na raiz dos dados.");
                        if (data.role) {
                            data.user.role = data.role;
                        }
                    }

                    // Log adicional para depuração do papel do usuário
                    console.log("👤 Papel do usuário:", data.user?.role || "não definido");

                    // Verificar se o usuário é admin e registrar no console
                    if (data.user?.role === 'admin') {
                        console.log("🔐 Usuário é administrador - deve ter acesso aos menus administrativos");
                    } else {
                        console.log("🚫 Usuário não é administrador - papel atual:", data.user?.role);
                    }

                    return data.user;
                }

                // Se o erro for específico de autenticação (401), não tente novamente
                if (response.status === 401) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error("❌ Erro de autenticação:", errorData);
                    localStorage.removeItem('token'); // Remover token inválido
                    throw new Error('Usuário não autenticado');
                }

                // Para outros erros, tentar novamente
                const errorData = await response.json().catch(() => ({}));
                console.error(`❌ Erro de resposta da API (tentativa ${retries + 1}):`, errorData);

                // Incrementar contagem de tentativas
                retries++;

                // Esperar antes de tentar novamente (atraso exponencial)
                if (retries < maxRetries) {
                    const delay = Math.pow(2, retries) * 1000; // 2s, 4s, 8s...
                    console.log(`⏱️ Aguardando ${delay}ms antes da próxima tentativa...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            } catch (error) {
                console.error(`❌ Erro na tentativa ${retries + 1}:`, error);
                retries++;

                if (retries < maxRetries) {
                    const delay = Math.pow(2, retries) * 1000;
                    console.log(`⏱️ Aguardando ${delay}ms antes da próxima tentativa...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    throw error;
                }
            }
        }

        // Se chegou aqui, todas as tentativas falharam
        throw new Error('Falha ao obter dados do usuário após várias tentativas');
    } catch (error) {
        console.error("❌ Erro ao verificar autenticação:", error);
        throw error;
    }
};

export const register = async (formData) => {
    console.log('Iniciando registro com dados:', formData);
    try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: formData.email,
                name: formData.name,
                password: formData.password
            })
        });

        const data = await response.json();
        console.log('Resposta do servidor:', data);

        if (!response.ok) {
            if (response.status === 422) {
                console.error('Erro de validação:', data);
                throw new Error(data.detail || 'Erro de validação nos dados enviados');
            }
            throw new Error(data.detail || 'Erro ao realizar cadastro');
        }

        return data;
    } catch (error) {
        console.error('Erro completo no registro:', error);
        throw error;
    }
};
