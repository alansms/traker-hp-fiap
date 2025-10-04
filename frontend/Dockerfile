FROM node:14-alpine

WORKDIR /app

# Criar usuário não-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar arquivos de configuração
COPY package*.json ./

# Instalar serve globalmente como root
RUN npm install -g serve

# Configurar permissões
RUN chown -R appuser:appgroup /app

# Mudar para o usuário não-root
USER appuser

# Limpar cache e instalar dependências
RUN npm cache clean --force && \
    npm install --legacy-peer-deps

# Copiar código fonte
COPY --chown=appuser:appgroup . .

# Build de produção
ENV DISABLE_ESLINT_PLUGIN=true
ENV GENERATE_SOURCEMAP=false
ENV CI=false
RUN npm run build

# Expor a porta que o servidor estático usará
EXPOSE 3000

# Servir a build de produção
CMD ["serve", "-s", "build", "-l", "3000"]
