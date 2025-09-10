const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const sendChatMessage = async (message, context = null) => {
    try {
        // Obter o token de acesso do localStorage - verificando ambos os nomes possíveis
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        if (!token) {
            throw new Error('Você precisa estar logado para usar o assistente virtual');
        }

        const response = await fetch(`${API_URL}/api/chat/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message, context }),
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao comunicar com o assistente virtual');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao enviar mensagem para o assistente:', error);
        throw error;
    }
};
