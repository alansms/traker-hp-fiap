import { useState, useEffect } from 'react';

export const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    // Carregar usuário e token do localStorage na inicialização
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                // Mostrar informações do usuário no console para depuração
                console.log('Usuário logado:', parsedUser);
                console.log('Papel do usuário:', parsedUser.role);
                console.log('É administrador?', parsedUser.role === 'admin' || parsedUser.is_superuser);
            } catch (error) {
                console.error('Erro ao processar dados do usuário:', error);
                localStorage.removeItem('user');
            }
        }

        if (storedToken) {
            setToken(storedToken);
        }
    }, []);

    // Função auxiliar para lidar com erros da API
    const handleApiError = (response, data) => {
        const error = new Error();
        error.status = response.status;
        error.response = { data };

        // Se for um erro 422 e detail for um array, cria uma mensagem formatada
        if (response.status === 422 && Array.isArray(data.detail)) {
            error.message = data.detail.map(err => err.msg || JSON.stringify(err)).join(", ");
        } else {
            error.message = data.detail || 'Erro ao processar a solicitação';
        }

        return error;
    };

    const register = async (formData) => {
        setLoading(true);
        try {
            // Mapeamento correto de campos para o backend
            const requestData = {
                email: formData.email,
                full_name: formData.name, // Mapeia 'name' para 'full_name'
                password: formData.password
            };

            console.log('Enviando para o backend:', requestData);

            const response = await fetch('http://localhost:8000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw handleApiError(response, data);
            }

            return data;
        } catch (error) {
            console.error('Erro durante o registro:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw handleApiError(response, data);
            }

            // Se login bem-sucedido e não requer 2FA, salva os dados
            if (data.user && !data.requires2FA) {
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('token', data.access_token);
                setUser(data.user);
                setToken(data.access_token);
            }

            return data;
        } catch (error) {
            console.error('Erro durante o login:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const verify2FA = async (email, code) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/auth/verify-2fa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, code })
            });

            const data = await response.json();

            if (!response.ok) {
                throw handleApiError(response, data);
            }

            // Salva os dados do usuário e token
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.access_token);
            setUser(data.user);
            setToken(data.access_token);

            return data;
        } catch (error) {
            console.error('Erro na verificação 2FA:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
    };

    const requestPasswordReset = async (email) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/auth/request-password-reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw handleApiError(response, data);
            }

            return data;
        } catch (error) {
            console.error('Erro ao solicitar redefinição de senha:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const verifyResetCode = async (email, code) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/auth/verify-reset-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, code })
            });

            const data = await response.json();

            if (!response.ok) {
                throw handleApiError(response, data);
            }

            return data;
        } catch (error) {
            console.error('Erro ao verificar código de redefinição:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (email, code, newPassword) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, code, new_password: newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                throw handleApiError(response, data);
            }

            return data;
        } catch (error) {
            console.error('Erro ao redefinir senha:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        user,
        token,
        loading,
        register,
        login,
        verify2FA,
        logout,
        requestPasswordReset,
        verifyResetCode,
        resetPassword
    };
};

export default useAuth;
