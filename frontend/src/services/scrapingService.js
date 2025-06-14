// Serviços para gerenciar rastreamento e configurações de scraping

// Recuperar cabeçalhos de autenticação
const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Buscar configurações de rastreamento
export const getScrapingSettings = async () => {
    try {
        const headers = getAuthHeaders();

        const response = await fetch(`${API_URL}/api/settings/scraping`, {
            method: 'GET',
            headers,
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao buscar configurações de rastreamento');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar configurações de rastreamento:', error);
        throw error;
    }
};

// Salvar configurações de rastreamento
export const saveScrapingSettings = async (settings) => {
    try {
        const headers = getAuthHeaders();

        const response = await fetch(`${API_URL}/api/settings/scraping`, {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings),
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao salvar configurações de rastreamento');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao salvar configurações de rastreamento:', error);
        throw error;
    }
};

// Iniciar rastreamento manualmente
export const startScraping = async () => {
    try {
        const headers = getAuthHeaders();

        const response = await fetch(`${API_URL}/api/scraping/start`, {
            method: 'POST',
            headers,
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao iniciar rastreamento');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao iniciar rastreamento:', error);
        throw error;
    }
};

// Verificar status do rastreamento
export const getScrapingStatus = async () => {
    try {
        const headers = getAuthHeaders();

        const response = await fetch(`${API_URL}/api/scraping/status`, {
            method: 'GET',
            headers,
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao verificar status do rastreamento');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao verificar status do rastreamento:', error);
        throw error;
    }
};

// Buscar produtos no Mercado Livre (para a página de pesquisa)
export const searchProducts = async (searchTerm) => {
    try {
        const headers = getAuthHeaders();

        const response = await fetch(`${API_URL}/api/scraping/search?term=${encodeURIComponent(searchTerm)}`, {
            method: 'GET',
            headers,
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao buscar produtos');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        throw error;
    }
};

// Exportar como default também para compatibilidade
export default {
    getScrapingSettings,
    saveScrapingSettings,
    startScraping,
    getScrapingStatus,
    searchProducts
};
