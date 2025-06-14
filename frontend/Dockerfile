FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./

# Limpar cache e instalar dependências
RUN npm cache clean --force && \
    npm install

# Copiar código fonte
COPY . .

# Expor a porta que o React usará
EXPOSE 3000

# Comando para iniciar a aplicação em modo de desenvolvimento
CMD ["npm", "start"]
