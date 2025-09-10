import React from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import ChatAssistant from '../../components/Chat/ChatAssistant';

const ChatPage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, height: 'calc(100vh - 120px)' }}>
      <Paper
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <Typography component="h1" variant="h4" color="primary" gutterBottom>
          Assistente Virtual
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Use nosso assistente virtual para tirar dúvidas sobre o sistema, obter ajuda com relatórios, alertas, produtos e vendedores.
        </Typography>

        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', mt: 2 }}>
          <ChatAssistant />
        </Box>
      </Paper>
    </Container>
  );
};

export default ChatPage;
