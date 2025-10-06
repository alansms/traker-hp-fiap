FROM node:16-alpine

WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./

# Instalar dependências sem verificar erros
ENV DISABLE_ESLINT_PLUGIN=true
ENV NODE_ENV=development
ENV ESLINT_NO_DEV_ERRORS=true
ENV CI=true

# Instalar dependências
RUN npm cache clean --force && \
    npm install --legacy-peer-deps

# Copiar código fonte
COPY . .

# Criar arquivo .env para garantir que o ESLint seja desabilitado
RUN echo "DISABLE_ESLINT_PLUGIN=true\nESLINT_NO_DEV_ERRORS=true\nCHOKIDAR_USEPOLLING=true\nFAST_REFRESH=false" > .env

# Configurar variáveis de ambiente para tornar o servidor de desenvolvimento mais estável
ENV DISABLE_ESLINT_PLUGIN=true
ENV CHOKIDAR_USEPOLLING=true
ENV FAST_REFRESH=false
ENV BROWSER=none
ENV WATCHPACK_POLLING=true
ENV REACT_APP_SKIP_PREFLIGHT_CHECK=true
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV WDS_SOCKET_PORT=0
ENV PORT=80
ENV CI=true
ENV ESLINT_NO_DEV_ERRORS=true

# Expor a porta que o servidor de desenvolvimento usará
EXPOSE 80

# Comando para iniciar o servidor de desenvolvimento com porta 80
CMD ["sh", "-c", "npm start"]
