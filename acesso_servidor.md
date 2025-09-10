# 🖥️ Acesso ao Servidor 191.252.203.163

## 📋 Informações do Servidor

- **IP:** 191.252.203.163
- **Sistema:** Ubuntu/Debian (assumindo)
- **Porta SSH:** 22 (padrão)

## 🔐 Métodos de Acesso

### 1. Acesso via SSH (Recomendado)

```bash
# Conectar via SSH
ssh usuario@191.252.203.163

# Se for a primeira conexão, aceitar a chave do servidor
# Digite 'yes' quando perguntado
```

### 2. Acesso via Chave SSH (Mais Seguro)

```bash
# Gerar chave SSH (se não tiver)
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"

# Copiar chave pública para o servidor
ssh-copy-id usuario@191.252.203.163

# Conectar sem senha
ssh usuario@191.252.203.163
```

### 3. Acesso via Terminal Web (se disponível)

Alguns provedores de VPS oferecem terminal web:
- Acesse o painel de controle da VPS
- Procure por "Console" ou "Terminal Web"
- Faça login com as credenciais

## 🛠️ Configuração Inicial do Servidor

### 1. Verificar Sistema

```bash
# Verificar versão do sistema
lsb_release -a

# Verificar recursos
free -h
df -h
uname -a
```

### 2. Atualizar Sistema

```bash
# Atualizar pacotes
sudo apt update && sudo apt upgrade -y

# Instalar ferramentas básicas
sudo apt install -y curl wget git unzip htop nano vim
```

### 3. Configurar Firewall

```bash
# Verificar status do firewall
sudo ufw status

# Configurar firewall básico
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp
sudo ufw enable
```

## 🚀 Instalação do Mercado Livre Tracker

### 1. Baixar Script de Instalação

```bash
# Criar diretório de trabalho
mkdir -p ~/apps
cd ~/apps

# Baixar script de instalação
wget https://raw.githubusercontent.com/alansms/trazer_hp_fiap_v4/main/install_vps.sh

# Tornar executável
chmod +x install_vps.sh
```

### 2. Executar Instalação

```bash
# Executar script de instalação
./install_vps.sh
```

### 3. Configurar Sistema

```bash
# Baixar script de configuração
wget https://raw.githubusercontent.com/alansms/trazer_hp_fiap_v4/main/configure_vps.sh

# Tornar executável
chmod +x configure_vps.sh

# Executar configuração
./configure_vps.sh
```

## 🔧 Configurações Específicas

### 1. Configurar Variáveis de Ambiente

```bash
# Editar arquivo .env
nano ~/apps/mercado-livre-tracker-v2/.env
```

**Configurações importantes:**

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

# Configurações de Produção
ENVIRONMENT=production
LOG_LEVEL=INFO
```

### 2. Configurar Nginx

```bash
# Instalar Nginx
sudo apt install -y nginx

# Criar configuração
sudo nano /etc/nginx/sites-available/mercado-livre-tracker
```

**Conteúdo da configuração:**

```nginx
server {
    listen 80;
    server_name 191.252.203.163;

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
sudo systemctl enable nginx
```

## 🎯 Acesso ao Sistema

Após a instalação, o sistema estará disponível em:

- **Frontend:** http://191.252.203.163:3000
- **Backend:** http://191.252.203.163:8000
- **API Docs:** http://191.252.203.163:8000/docs

### Credenciais Padrão

- **Username:** admin
- **Password:** admin123

⚠️ **IMPORTANTE:** Altere a senha após o primeiro login!

## 🛠️ Comandos de Manutenção

### 1. Verificar Status

```bash
# Status dos containers
cd ~/apps/mercado-livre-tracker-v2
docker-compose ps

# Logs do sistema
docker-compose logs -f

# Status dos serviços
sudo systemctl status nginx
sudo systemctl status docker
```

### 2. Reiniciar Serviços

```bash
# Reiniciar containers
docker-compose restart

# Reiniciar Nginx
sudo systemctl restart nginx

# Reiniciar Docker
sudo systemctl restart docker
```

### 3. Monitoramento

```bash
# Uso de recursos
htop

# Espaço em disco
df -h

# Logs do sistema
sudo journalctl -f

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔍 Solução de Problemas

### 1. Verificar Conectividade

```bash
# Testar acesso local
curl http://localhost:3000
curl http://localhost:8000/health

# Testar acesso externo
curl http://191.252.203.163:3000
curl http://191.252.203.163:8000/health
```

### 2. Verificar Portas

```bash
# Verificar portas abertas
sudo netstat -tulpn | grep -E "(3000|8000|80|443)"

# Verificar firewall
sudo ufw status
```

### 3. Logs de Debug

```bash
# Logs dos containers
docker-compose logs --tail=100

# Logs do sistema
sudo journalctl -u nginx -f
sudo journalctl -u docker -f
```

## 📊 Monitoramento em Tempo Real

### 1. Script de Monitoramento

```bash
# Criar script de monitoramento
cat > ~/monitor.sh << 'EOF'
#!/bin/bash
while true; do
    clear
    echo "=== STATUS DO SERVIDOR ==="
    echo "Data: $(date)"
    echo ""
    echo "=== CONTAINERS ==="
    cd ~/apps/mercado-livre-tracker-v2
    docker-compose ps
    echo ""
    echo "=== RECURSOS ==="
    echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | head -1)"
    echo "Memória: $(free -h | grep Mem | awk '{print $3"/"$2}')"
    echo "Disco: $(df -h / | awk 'NR==2{print $3"/"$2" ("$5")"}')"
    echo ""
    echo "=== CONECTIVIDADE ==="
    if curl -s http://localhost:3000 > /dev/null; then
        echo "✅ Frontend: OK"
    else
        echo "❌ Frontend: ERRO"
    fi
    if curl -s http://localhost:8000/health > /dev/null; then
        echo "✅ Backend: OK"
    else
        echo "❌ Backend: ERRO"
    fi
    sleep 5
done
EOF

chmod +x ~/monitor.sh
```

### 2. Executar Monitoramento

```bash
# Executar monitoramento
~/monitor.sh
```

## 🔐 Configurações de Segurança

### 1. Alterar Porta SSH (Opcional)

```bash
# Editar configuração SSH
sudo nano /etc/ssh/sshd_config

# Alterar porta (exemplo: 2222)
Port 2222

# Reiniciar SSH
sudo systemctl restart ssh

# Atualizar firewall
sudo ufw allow 2222/tcp
sudo ufw delete allow 22/tcp
```

### 2. Configurar Chave SSH

```bash
# Criar diretório .ssh
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Criar arquivo authorized_keys
nano ~/.ssh/authorized_keys

# Adicionar sua chave pública
# Cole o conteúdo da sua chave pública aqui

# Configurar permissões
chmod 600 ~/.ssh/authorized_keys
```

## 📞 Comandos de Emergência

### 1. Parar Tudo

```bash
# Parar containers
docker-compose down

# Parar Nginx
sudo systemctl stop nginx

# Parar Docker
sudo systemctl stop docker
```

### 2. Reiniciar Tudo

```bash
# Reiniciar servidor
sudo reboot

# Após reinicialização, iniciar serviços
sudo systemctl start docker
sudo systemctl start nginx
cd ~/apps/mercado-livre-tracker-v2
docker-compose up -d
```

### 3. Backup de Emergência

```bash
# Fazer backup rápido
cd ~/apps/mercado-livre-tracker-v2
tar -czf ~/backup_emergencia_$(date +%Y%m%d_%H%M%S).tar.gz .
```

## 🎉 Próximos Passos

1. **Acessar o servidor:** `ssh usuario@191.252.203.163`
2. **Executar instalação:** `./install_vps.sh`
3. **Configurar sistema:** `./configure_vps.sh`
4. **Acessar aplicação:** http://191.252.203.163:3000
5. **Configurar SSL** (se necessário)
6. **Configurar backup automático**

## 📋 Checklist de Instalação

- [ ] Conectar no servidor via SSH
- [ ] Atualizar sistema
- [ ] Instalar Docker e Docker Compose
- [ ] Baixar projeto do GitHub
- [ ] Configurar variáveis de ambiente
- [ ] Iniciar containers
- [ ] Configurar Nginx
- [ ] Testar acesso
- [ ] Configurar backup
- [ ] Configurar monitoramento

---

**🚀 Sistema pronto para uso em produção!**
