// Serviço para gerenciar configurações do sistema
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Buscar todas as configurações do sistema
export const getSystemSettings = async () => {
    try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

        const response = await fetch(`${API_URL}/api/settings`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao buscar configurações do sistema');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        throw error;
    }
};

// Salvar configurações do sistema
export const saveSystemSettings = async (settings) => {
    try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

        const response = await fetch(`${API_URL}/api/settings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings),
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao salvar configurações do sistema');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        throw error;
    }
};

// Atualizar apenas a chave da API
export const updateApiKey = async (apiKey) => {
    try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

        const response = await fetch(`${API_URL}/api/settings/api-key`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ apiKey }),
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao atualizar chave da API');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao atualizar chave da API:', error);
        throw error;
    }
};

// Obter apenas a chave da API
export const getApiKey = async () => {
    try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

        const response = await fetch(`${API_URL}/api/settings/api-key`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao buscar chave da API');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar chave da API:', error);
        throw error;
    }
};

// Atualizar o perfil do usuário (nome e configurações)
export const updateUserProfile = async (profileData) => {
    try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!userId) {
            throw new Error('ID do usuário não encontrado');
        }

        const response = await fetch(`${API_URL}/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData),
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao atualizar perfil do usuário');
        }

        const updatedUser = await response.json();

        // Atualiza as informações do usuário no localStorage
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUserData = { ...currentUser, ...updatedUser };
        localStorage.setItem('user', JSON.stringify(updatedUserData));

        return updatedUser;
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        throw error;
    }
};

// Upload da imagem do avatar
export const uploadAvatar = async (file) => {
    try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!userId) {
            throw new Error('ID do usuário não encontrado');
        }

        // Criar um FormData para enviar o arquivo
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch(`${API_URL}/api/users/${userId}/avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Não incluir Content-Type aqui, o navegador vai definir automaticamente para multipart/form-data
            },
            body: formData,
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao fazer upload do avatar');
        }

        const result = await response.json();

        // Atualiza as informações do usuário no localStorage
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        currentUser.avatar_url = result.avatar_url;
        localStorage.setItem('user', JSON.stringify(currentUser));

        return result;
    } catch (error) {
        console.error('Erro ao fazer upload do avatar:', error);
        throw error;
    }
};

