FROM node:18-alpine

WORKDIR /app

# Criar usuário não-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar arquivos de configuração
COPY package*.json ./

# Configurar permissões
RUN chown -R appuser:appgroup /app

# Mudar para o usuário não-root
USER appuser

# Limpar cache e instalar dependências
RUN npm cache clean --force && \
    npm install

# Copiar código fonte
COPY --chown=appuser:appgroup . .

# Expor a porta que o React usará
EXPOSE 3000

# Comando para iniciar a aplicação em modo de desenvolvimento
CMD ["npm", "start"]
