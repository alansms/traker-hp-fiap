import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Fab,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Slide,
  Fade,
  Chip,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as SmartToyIcon,
  Person as PersonIcon,
  Minimize as MinimizeIcon,
  Expand as ExpandIcon
} from '@mui/icons-material';
import { sendChatMessage } from '../../services/chat';
import { useAuth } from '../../hooks/useAuth';

const FloatingChat = () => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      content: 'Olá! Sou o assistente virtual do Mercado Livre Tracker. Como posso ajudar você hoje?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll para a última mensagem
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focar no input quando o chat abrir
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setShowWelcome(true);
      setTimeout(() => setShowWelcome(false), 3000);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || sendingMessage) return;

    const userMessage = {
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSendingMessage(true);

    try {
      const response = await sendChatMessage(input);
      
      const assistantMessage = {
        type: 'assistant',
        content: response.success ? response.message : response.message || 'Ocorreu um erro ao processar sua solicitação.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        type: 'error',
        content: 'Não foi possível conectar ao servidor. Tente novamente mais tarde.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSendingMessage(false);
    }
  };

  const suggestedQuestions = [
    "Como ver histórico de preços?",
    "Configurar alerta de preço",
    "Analisar reputação de vendedor",
    "Quais relatórios estão disponíveis?"
  ];

  const handleSuggestedQuestion = (question) => {
    setInput(question);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Botão flutuante */}
      <Fab
        color="primary"
        aria-label="chat"
        onClick={handleToggleChat}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1300,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          }
        }}
      >
        <ChatIcon />
      </Fab>

      {/* Chat popup */}
      <Slide
        direction="up"
        in={isOpen}
        mountOnEnter
        unmountOnExit
        timeout={300}
      >
        <Paper
          elevation={24}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: { xs: 'calc(100vw - 48px)', sm: 420 },
            height: isMinimized ? 60 : { xs: 'calc(100vh - 48px)', sm: 650 },
            maxHeight: { xs: 'calc(100vh - 48px)', sm: 650 },
            zIndex: 1300,
            borderRadius: 3,
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'grey.900',
            color: 'white',
            '&:hover': {
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              bgcolor: 'primary.main',
              color: 'white',
              cursor: 'pointer'
            }}
            onClick={isMinimized ? handleMinimize : undefined}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'white', color: 'primary.main', width: 32, height: 32 }}>
                <SmartToyIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  Assistente Virtual
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {isMinimized ? 'Clique para expandir' : 'Online'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title={isMinimized ? 'Expandir' : 'Minimizar'}>
                <IconButton
                  size="small"
                  onClick={handleMinimize}
                  sx={{ color: 'white' }}
                >
                  {isMinimized ? <ExpandIcon /> : <MinimizeIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Fechar">
                <IconButton
                  size="small"
                  onClick={handleToggleChat}
                  sx={{ color: 'white' }}
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {!isMinimized && (
            <>
              {/* Welcome message */}
              <Fade in={showWelcome} timeout={1000}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(0,0,0,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1
                  }}
                >
                  <Box sx={{ textAlign: 'center', color: 'white', p: 3 }}>
                    <SmartToyIcon sx={{ fontSize: 48, mb: 2, color: 'primary.main' }} />
                    <Typography variant="h6" gutterBottom>
                      Olá! Precisa de ajuda?
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, color: 'grey.300' }}>
                      Estou aqui para ajudar com o sistema
                    </Typography>
                  </Box>
                </Box>
              </Fade>

              {/* Messages area */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  minHeight: 0,
                  bgcolor: 'grey.900'
                }}
              >
                {messages.map((message, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      flexDirection: message.type === 'user' ? 'row-reverse' : 'row'
                    }}
                  >
                    {message.type !== 'user' && (
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: message.type === 'assistant' ? 'primary.main' : 'error.main',
                          mr: 1
                        }}
                      >
                        {message.type === 'assistant' ? <SmartToyIcon fontSize="small" /> : '!'}
                      </Avatar>
                    )}

                    <Box
                      sx={{
                        bgcolor: message.type === 'user' 
                          ? 'primary.main' 
                          : message.type === 'error'
                            ? 'error.dark'
                            : 'grey.800',
                        color: message.type === 'user' ? 'white' : 'white',
                        p: 1.5,
                        borderRadius: 2,
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 12,
                          [message.type === 'user' ? 'right' : 'left']: -8,
                          width: 0,
                          height: 0,
                          borderTop: '8px solid transparent',
                          borderBottom: '8px solid transparent',
                          [message.type === 'user' ? 'borderLeft' : 'borderRight']: `8px solid ${
                            message.type === 'user' 
                              ? 'primary.main' 
                              : message.type === 'error'
                                ? 'error.dark'
                                : 'grey.800'
                          }`
                        }
                      }}
                    >
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {message.content}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
                        {formatTime(message.timestamp)}
                      </Typography>
                    </Box>

                    {message.type === 'user' && (
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: 'secondary.main',
                          ml: 1
                        }}
                      >
                        <PersonIcon fontSize="small" />
                      </Avatar>
                    )}
                  </Box>
                ))}

                {sendingMessage && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                    <CircularProgress size={20} />
                  </Box>
                )}

                <div ref={messagesEndRef} />
              </Box>

              {/* Suggested questions */}
              <Box sx={{ 
                p: 2, 
                borderTop: 1, 
                borderColor: 'grey.700', 
                flexShrink: 0,
                bgcolor: 'grey.900'
              }}>
                <Typography variant="caption" color="grey.300" sx={{ mb: 1, display: 'block' }}>
                  Perguntas frequentes:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {suggestedQuestions.map((question, index) => (
                    <Chip
                      key={index}
                      label={question}
                      size="small"
                      variant="outlined"
                      onClick={() => handleSuggestedQuestion(question)}
                      sx={{
                        cursor: 'pointer',
                        color: 'white',
                        borderColor: 'grey.600',
                        '&:hover': {
                          bgcolor: 'primary.main',
                          color: 'white',
                          borderColor: 'primary.main'
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Input area */}
              <Box
                component="form"
                onSubmit={handleSendMessage}
                sx={{
                  p: 2,
                  borderTop: 1,
                  borderColor: 'grey.700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flexShrink: 0,
                  bgcolor: 'grey.900'
                }}
              >
                <TextField
                  ref={inputRef}
                  fullWidth
                  variant="outlined"
                  placeholder="Digite sua pergunta..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={sendingMessage}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      bgcolor: 'grey.800',
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'grey.600',
                      },
                      '&:hover fieldset': {
                        borderColor: 'grey.500',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                      '&::placeholder': {
                        color: 'grey.400',
                        opacity: 1,
                      },
                    },
                  }}
                />
                <IconButton
                  type="submit"
                  disabled={sendingMessage || !input.trim()}
                  color="primary"
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    },
                    '&:disabled': {
                      bgcolor: 'grey.600',
                      color: 'grey.400'
                    }
                  }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </>
          )}
        </Paper>
      </Slide>
    </>
  );
};

export default FloatingChat;
