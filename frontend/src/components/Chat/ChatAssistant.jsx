import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Avatar,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { sendChatMessage } from '../../services/chat';
import { useAuth } from '../../hooks/useAuth';

const ChatAssistant = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Debug detalhado para verificar o estado de autenticação
  console.log("🔐 ChatAssistant - Estado de autenticação:", {
    user,
    isAuthenticated,
    loading,
    userExists: !!user,
    userInfo: user ? {
      id: user.id,
      email: user.email,
      role: user.role
    } : 'Nenhum usuário encontrado',
    cookies: document.cookie ? 'Cookies presentes' : 'Sem cookies'
  });

  // Verificar se o usuário está autenticado
  useEffect(() => {
    console.log("🔍 ChatAssistant - Verificando autenticação no useEffect");

    // Verificação mais detalhada com logs
    if (!isAuthenticated) {
      console.warn("⚠️ ChatAssistant - Usuário não autenticado, preparando redirecionamento");
      console.log("📊 Detalhes: ", { isLoading: loading, user, auth: !!user });

      navigate('/auth/login', {
        state: {
          from: '/chat',
          message: 'Você precisa estar logado para usar o assistente virtual'
        }
      });
      console.log("↩️ Redirecionamento para login executado");
    } else {
      console.log("✅ ChatAssistant - Usuário autenticado, permitindo acesso ao assistente");
    }
  }, [isAuthenticated, navigate, loading, user]);

  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      content: 'Olá! Sou o assistente virtual do Mercado Livre Tracker. Como posso ajudar você hoje? Posso responder perguntas sobre relatórios, alertas, produtos e vendedores.'
    }
  ]);
  const [input, setInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);

  // Função para rolar automaticamente para a mensagem mais recente
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Adicionar mensagem do usuário à lista
    const userMessage = { type: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSendingMessage(true);

    try {
      // Enviar mensagem para o backend
      const response = await sendChatMessage(input);

      if (response.success) {
        // Adicionar resposta do assistente à lista
        setMessages(prev => [...prev, { type: 'assistant', content: response.message }]);
      } else {
        // Adicionar mensagem de erro
        setMessages(prev => [...prev, {
          type: 'error',
          content: 'Desculpe, tive um problema ao processar sua pergunta. Por favor, tente novamente.'
        }]);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setMessages(prev => [...prev, {
        type: 'error',
        content: `Erro: ${error.message || 'Não foi possível conectar ao assistente virtual.'}`
      }]);
    } finally {
      setSendingMessage(false);
    }
  };

  const suggestedQuestions = [
    "Como posso ver o histórico de preços de um produto?",
    "Como configurar um alerta de preço?",
    "Como analisar a reputação de um vendedor?",
    "Quais relatórios estão disponíveis no sistema?"
  ];

  const handleSuggestedQuestion = (question) => {
    setInput(question);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', maxWidth: '800px', mx: 'auto' }}>
      {/* Cabeçalho com botão de voltar */}
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, pt: 2, pb: 1 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          variant="outlined"
          size="small"
          sx={{ mr: 2 }}
        >
          Voltar ao Dashboard
        </Button>
        <Typography variant="h5" component="h2" gutterBottom sx={{ m: 0 }}>
          Assistente Virtual
          <Tooltip title="Este assistente virtual utiliza IA para responder perguntas sobre o sistema">
            <IconButton size="small" sx={{ ml: 1 }}>
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
      </Box>

      {/* Área de mensagens */}
      <Paper
        elevation={3}
        sx={{
          flex: 1,
          p: 2,
          mb: 2,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%'
            }}
          >
            {message.type !== 'user' && (
              <Avatar
                sx={{
                  mr: 1,
                  bgcolor: message.type === 'assistant' ? 'primary.main' : 'error.main'
                }}
              >
                {message.type === 'assistant' ? <SmartToyIcon /> : '!'}
              </Avatar>
            )}

            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: '12px',
                bgcolor: message.type === 'user'
                  ? 'primary.light'
                  : message.type === 'error'
                    ? 'error.light'
                    : 'grey.100',
                color: message.type === 'user' ? 'white' : 'text.primary'
              }}
            >
              <Typography variant="body1">
                {message.content}
              </Typography>
            </Paper>

            {message.type === 'user' && (
              <Avatar sx={{ ml: 1, bgcolor: 'secondary.main' }}>
                <PersonIcon />
              </Avatar>
            )}
          </Box>
        ))}
        {sendingMessage && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Paper>

      {/* Sugestões de perguntas */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {suggestedQuestions.map((question, index) => (
          <Button
            key={index}
            variant="outlined"
            size="small"
            onClick={() => handleSuggestedQuestion(question)}
          >
            {question}
          </Button>
        ))}
      </Box>

      {/* Campo de entrada de mensagem */}
      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 2
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Digite sua pergunta..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sendingMessage}
          sx={{ mr: 1 }}
        />
        <Button
          variant="contained"
          color="primary"
          endIcon={<SendIcon />}
          type="submit"
          disabled={sendingMessage || !input.trim()}
        >
          Enviar
        </Button>
      </Box>
    </Box>
  );
};

export default ChatAssistant;
