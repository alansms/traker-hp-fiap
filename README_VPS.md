# 🚀 Instalação em VPS - Mercado Livre Tracker V2

Este guia fornece instruções completas para instalar o **Mercado Livre Tracker V2** em uma VPS (Virtual Private Server).

## 📋 Pré-requisitos

- **VPS com Ubuntu 20.04+ ou Debian 11+**
- **Mínimo 2GB RAM** (recomendado 4GB+)
- **Mínimo 20GB de espaço em disco** (recomendado 50GB+)
- **Acesso SSH** com usuário sudo
- **Domínio** (opcional, para SSL)

## 🛠️ Instalação Automatizada

### 1. Conectar na VPS

```bash
ssh usuario@seu-ip-vps
```

### 2. Baixar e Executar Script de Instalação

```bash
# Baixar o script de instalação
wget https://raw.githubusercontent.com/alansms/trazer_hp_fiap_v4/main/install_vps.sh

# Tornar executável
chmod +x install_vps.sh

# Executar instalação
./install_vps.sh
```

### 3. Configurar Sistema

```bash
# Executar configuração pós-instalação
chmod +x configure_vps.sh
./configure_vps.sh
```

## 📝 Instalação Manual

Se preferir instalar manualmente:

### 1. Atualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip software-properties-common
```

### 2. Instalar Docker

```bash
# Remover instalações antigas
sudo apt remove -y docker docker-engine docker.io containerd runc

# Instalar dependências
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Adicionar chave GPG do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### 3. Instalar Docker Compose

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
```

### 4. Baixar Projeto

```bash
# Criar diretório
mkdir -p ~/apps
cd ~/apps

# Clonar repositório
git clone https://github.com/alansms/trazer_hp_fiap_v4.git mercado-livre-tracker-v2
cd mercado-livre-tracker-v2
```

### 5. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar configurações
nano .env
```

**Configurações importantes no .env:**

```env
# Configurações do Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DEBUG=False

# Banco de Dados
DATABASE_URL=postgresql://postgres:postgres@db:5432/ml_tracker

# OpenAI (para assistente virtual)
OPENAI_API_KEY=sua-chave-openai-aqui

# Mercado Livre API
ML_CLIENT_ID=seu_client_id_ml
ML_CLIENT_SECRET=seu_client_secret_ml

# Segurança
SECRET_KEY=sua-chave-secreta-aqui
JWT_SECRET_KEY=sua-chave-jwt-aqui
```

### 6. Iniciar Sistema

```bash
# Iniciar todos os serviços
docker-compose up -d

# Verificar status
docker-compose ps
```

## 🔧 Configuração Pós-Instalação

### 1. Configurar Firewall

```bash
# Habilitar UFW
sudo ufw enable

# Permitir portas necessárias
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp
```

### 2. Configurar Nginx (Reverso Proxy)

```bash
# Instalar Nginx
sudo apt install -y nginx

# Criar configuração
sudo nano /etc/nginx/sites-available/mercado-livre-tracker
```

**Conteúdo do arquivo de configuração:**

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Habilitar site
sudo ln -s /etc/nginx/sites-available/mercado-livre-tracker /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Testar e reiniciar
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com

# Configurar renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🎯 Acesso ao Sistema

Após a instalação, o sistema estará disponível em:

- **Frontend:** http://seu-dominio.com ou http://seu-ip:3000
- **Backend:** http://seu-dominio.com/api ou http://seu-ip:8000
- **API Docs:** http://seu-dominio.com/api/docs

### Credenciais Padrão

- **Username:** admin
- **Password:** admin123

⚠️ **IMPORTANTE:** Altere a senha após o primeiro login!

## 🛠️ Comandos de Manutenção

### Script de Manutenção

```bash
# Executar script de manutenção
chmod +x maintenance_vps.sh
./maintenance_vps.sh
```

### Comandos Úteis

```bash
# Ver status dos containers
docker-compose ps

# Ver logs
docker-compose logs -f

# Reiniciar serviços
docker-compose restart

# Parar serviços
docker-compose down

# Iniciar serviços
docker-compose up -d

# Fazer backup
./backup-mercado-livre-tracker.sh

# Monitorar sistema
./monitor-mercado-livre-tracker.sh
```

## 📊 Monitoramento

### Verificar Status

```bash
# Status dos containers
docker-compose ps

# Uso de recursos
htop

# Logs em tempo real
docker-compose logs -f

# Teste de conectividade
curl http://localhost:3000
curl http://localhost:8000/health
```

### Logs Importantes

```bash
# Logs do sistema
sudo journalctl -u nginx -f

# Logs do Docker
docker-compose logs -f

# Logs de aplicação
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🔄 Backup e Restauração

### Backup Automático

O sistema inclui backup automático diário às 2h da manhã.

### Backup Manual

```bash
# Executar backup
./backup-mercado-livre-tracker.sh

# Restaurar backup
./maintenance_vps.sh
# Escolher opção 7 (Restaurar Backup)
```

## 🚨 Solução de Problemas

### Problemas Comuns

1. **Containers não iniciam:**
   ```bash
   docker-compose logs
   docker-compose down
   docker-compose up -d
   ```

2. **Erro de permissão:**
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. **Porta já em uso:**
   ```bash
   sudo netstat -tulpn | grep :3000
   sudo kill -9 PID
   ```

4. **Banco de dados não conecta:**
   ```bash
   docker-compose restart db
   docker-compose logs db
   ```

### Logs de Debug

```bash
# Logs detalhados
docker-compose logs --tail=100

# Logs de um serviço específico
docker-compose logs backend

# Logs em tempo real
docker-compose logs -f
```

## 📈 Otimização de Performance

### Para VPS com poucos recursos:

1. **Reduzir recursos do Docker:**
   ```yaml
   # No docker-compose.yml
   deploy:
     resources:
       limits:
         memory: 512M
         cpus: '0.5'
   ```

2. **Configurar swap:**
   ```bash
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

3. **Otimizar Nginx:**
   ```nginx
   # Adicionar no nginx.conf
   worker_processes auto;
   worker_connections 1024;
   ```

## 🔐 Segurança

### Configurações de Segurança

1. **Alterar senhas padrão**
2. **Configurar firewall**
3. **Usar SSL/HTTPS**
4. **Atualizar sistema regularmente**
5. **Configurar backup automático**

### Comandos de Segurança

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Verificar portas abertas
sudo netstat -tulpn

# Verificar logs de segurança
sudo journalctl -u ssh
```

## 📞 Suporte

Para suporte técnico:

1. **Verificar logs:** `docker-compose logs`
2. **Executar diagnóstico:** `./maintenance_vps.sh`
3. **Verificar status:** `./monitor-mercado-livre-tracker.sh`

## 🎉 Conclusão

Após seguir este guia, você terá:

- ✅ Sistema instalado e configurado
- ✅ SSL configurado (se usando domínio)
- ✅ Backup automático
- ✅ Monitoramento configurado
- ✅ Firewall configurado
- ✅ Sistema de manutenção

O **Mercado Livre Tracker V2** estará pronto para uso em produção! 🚀
