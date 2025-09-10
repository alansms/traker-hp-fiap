#!/bin/bash

# =============================================================================
# SCRIPT DE INSTALAÇÃO AUTOMATIZADA - MERCADO LIVRE TRACKER V2
# Sistema Anti-Falsificação HP com IA
# =============================================================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}=============================================================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}=============================================================================${NC}"
}

# Verificar se está rodando como root
if [[ $EUID -eq 0 ]]; then
   print_error "Este script não deve ser executado como root!"
   print_warning "Execute como usuário normal com sudo habilitado"
   exit 1
fi

print_header "MERCADO LIVRE TRACKER V2 - INSTALAÇÃO AUTOMATIZADA"
print_status "Iniciando instalação do sistema Anti-Falsificação HP com IA..."

# =============================================================================
# 1. ATUALIZAÇÃO DO SISTEMA
# =============================================================================
print_header "1. ATUALIZANDO SISTEMA"
print_status "Atualizando pacotes do sistema..."

sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

print_success "Sistema atualizado com sucesso!"

# =============================================================================
# 2. INSTALAÇÃO DO DOCKER
# =============================================================================
print_header "2. INSTALANDO DOCKER"
print_status "Instalando Docker e Docker Compose..."

# Remover instalações antigas
sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Instalar dependências
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Adicionar chave GPG do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório do Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Iniciar e habilitar Docker
sudo systemctl start docker
sudo systemctl enable docker

print_success "Docker instalado com sucesso!"

# =============================================================================
# 3. INSTALAÇÃO DO DOCKER COMPOSE
# =============================================================================
print_header "3. INSTALANDO DOCKER COMPOSE"
print_status "Instalando Docker Compose standalone..."

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Criar link simbólico
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

print_success "Docker Compose instalado com sucesso!"

# =============================================================================
# 4. INSTALAÇÃO DO NODE.JS (para desenvolvimento)
# =============================================================================
print_header "4. INSTALANDO NODE.JS"
print_status "Instalando Node.js 18 LTS..."

# Instalar Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

print_success "Node.js instalado com sucesso!"

# =============================================================================
# 5. INSTALAÇÃO DO PYTHON (para desenvolvimento)
# =============================================================================
print_header "5. INSTALANDO PYTHON"
print_status "Instalando Python 3.11 e dependências..."

sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip build-essential

# Criar link simbólico
sudo ln -sf /usr/bin/python3.11 /usr/bin/python3

print_success "Python instalado com sucesso!"

# =============================================================================
# 6. BAIXAR PROJETO DO GITHUB
# =============================================================================
print_header "6. BAIXANDO PROJETO"
print_status "Clonando repositório do GitHub..."

# Criar diretório de aplicações
mkdir -p ~/apps
cd ~/apps

# Clonar repositório
if [ -d "mercado-livre-tracker-v2" ]; then
    print_warning "Diretório já existe. Fazendo backup..."
    mv mercado-livre-tracker-v2 mercado-livre-tracker-v2-backup-$(date +%Y%m%d_%H%M%S)
fi

git clone https://github.com/alansms/trazer_hp_fiap_v4.git mercado-livre-tracker-v2
cd mercado-livre-tracker-v2

print_success "Projeto baixado com sucesso!"

# =============================================================================
# 7. CONFIGURAR VARIÁVEIS DE AMBIENTE
# =============================================================================
print_header "7. CONFIGURANDO VARIÁVEIS DE AMBIENTE"
print_status "Criando arquivo .env..."

# Criar arquivo .env baseado no exemplo
if [ ! -f ".env" ]; then
    cp .env.example .env 2>/dev/null || cat > .env << 'EOF'
# Configurações do Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DEBUG=True

# Banco de Dados
DATABASE_URL=postgresql://postgres:postgres@db:5432/ml_tracker

# Redis
REDIS_URL=redis://redis:6379/0

# OpenAI (para assistente virtual)
OPENAI_API_KEY=your-openai-api-key-here

# Email
SMTP_SERVER=seu_servidor_smtp
SMTP_PORT=587
SMTP_USER=seu_usuario_smtp
SMTP_PASSWORD=sua_senha_smtp

# Frontend
FRONTEND_URL=http://localhost:3000

# Mercado Livre API
ML_CLIENT_ID=your_ml_client_id
ML_CLIENT_SECRET=your_ml_client_secret
ML_REDIRECT_URI=http://localhost:8000/auth/callback

# Segurança
SECRET_KEY=your-secret-key-here-change-this-in-production
JWT_SECRET_KEY=your-jwt-secret-key-here-change-this-in-production

# Configurações de Produção
ENVIRONMENT=production
LOG_LEVEL=INFO
EOF
    print_success "Arquivo .env criado!"
else
    print_warning "Arquivo .env já existe. Mantendo configurações atuais."
fi

# =============================================================================
# 8. CONFIGURAR FIREWALL
# =============================================================================
print_header "8. CONFIGURANDO FIREWALL"
print_status "Configurando UFW (Uncomplicated Firewall)..."

# Habilitar UFW
sudo ufw --force enable

# Permitir SSH
sudo ufw allow ssh

# Permitir portas do sistema
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 3000/tcp # Frontend
sudo ufw allow 8000/tcp # Backend

print_success "Firewall configurado com sucesso!"

# =============================================================================
# 9. CONFIGURAR NGINX (OPCIONAL)
# =============================================================================
print_header "9. CONFIGURANDO NGINX"
print_status "Instalando e configurando Nginx..."

sudo apt install -y nginx

# Criar configuração do Nginx
sudo tee /etc/nginx/sites-available/mercado-livre-tracker << 'EOF'
server {
    listen 80;
    server_name _;

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
EOF

# Habilitar site
sudo ln -sf /etc/nginx/sites-available/mercado-livre-tracker /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

print_success "Nginx configurado com sucesso!"

# =============================================================================
# 10. CONFIGURAR SYSTEMD SERVICES
# =============================================================================
print_header "10. CONFIGURANDO SERVIÇOS SYSTEMD"
print_status "Criando serviços para inicialização automática..."

# Criar serviço para o sistema
sudo tee /etc/systemd/system/mercado-livre-tracker.service << EOF
[Unit]
Description=Mercado Livre Tracker V2
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Recarregar systemd e habilitar serviço
sudo systemctl daemon-reload
sudo systemctl enable mercado-livre-tracker.service

print_success "Serviços systemd configurados com sucesso!"

# =============================================================================
# 11. CONFIGURAR LOGROTATE
# =============================================================================
print_header "11. CONFIGURANDO LOGROTATE"
print_status "Configurando rotação de logs..."

sudo tee /etc/logrotate.d/mercado-livre-tracker << 'EOF'
/var/log/mercado-livre-tracker/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        systemctl reload nginx
    endscript
}
EOF

print_success "Logrotate configurado com sucesso!"

# =============================================================================
# 12. CONFIGURAR BACKUP AUTOMÁTICO
# =============================================================================
print_header "12. CONFIGURANDO BACKUP AUTOMÁTICO"
print_status "Criando script de backup..."

# Criar diretório de backup
mkdir -p ~/backups/mercado-livre-tracker

# Criar script de backup
tee ~/backup-mercado-livre-tracker.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="$HOME/backups/mercado-livre-tracker"
PROJECT_DIR="$HOME/apps/mercado-livre-tracker-v2"
DATE=$(date +%Y%m%d_%H%M%S)

echo "Iniciando backup do Mercado Livre Tracker..."

# Criar backup do código
tar -czf "$BACKUP_DIR/code_backup_$DATE.tar.gz" -C "$PROJECT_DIR" .

# Backup do banco de dados (se estiver rodando)
cd "$PROJECT_DIR"
if docker-compose ps | grep -q "Up"; then
    docker-compose exec -T db pg_dump -U postgres ml_tracker > "$BACKUP_DIR/database_backup_$DATE.sql"
fi

# Manter apenas os últimos 7 backups
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete

echo "Backup concluído: $DATE"
EOF

chmod +x ~/backup-mercado-livre-tracker.sh

# Adicionar ao crontab
(crontab -l 2>/dev/null; echo "0 2 * * * $HOME/backup-mercado-livre-tracker.sh") | crontab -

print_success "Backup automático configurado com sucesso!"

# =============================================================================
# 13. CONFIGURAR MONITORAMENTO
# =============================================================================
print_header "13. CONFIGURANDO MONITORAMENTO"
print_status "Instalando ferramentas de monitoramento..."

# Instalar htop, iotop, etc.
sudo apt install -y htop iotop nethogs

# Criar script de monitoramento
tee ~/monitor-mercado-livre-tracker.sh << 'EOF'
#!/bin/bash

echo "=== STATUS DO MERCADO LIVRE TRACKER ==="
echo "Data: $(date)"
echo ""

echo "=== DOCKER CONTAINERS ==="
cd ~/apps/mercado-livre-tracker-v2
docker-compose ps

echo ""
echo "=== USO DE RECURSOS ==="
echo "CPU:"
top -bn1 | grep "Cpu(s)"

echo ""
echo "Memória:"
free -h

echo ""
echo "Disco:"
df -h

echo ""
echo "=== LOGS RECENTES ==="
docker-compose logs --tail=10
EOF

chmod +x ~/monitor-mercado-livre-tracker.sh

print_success "Monitoramento configurado com sucesso!"

# =============================================================================
# 14. INICIAR SISTEMA
# =============================================================================
print_header "14. INICIANDO SISTEMA"
print_status "Iniciando o Mercado Livre Tracker..."

# Fazer logout e login novamente para aplicar mudanças do grupo docker
print_warning "IMPORTANTE: Você precisa fazer logout e login novamente para aplicar as mudanças do grupo docker"
print_warning "Ou execute: newgrp docker"

# Iniciar o sistema
cd ~/apps/mercado-livre-tracker-v2
docker-compose up -d

print_success "Sistema iniciado com sucesso!"

# =============================================================================
# 15. VERIFICAÇÃO FINAL
# =============================================================================
print_header "15. VERIFICAÇÃO FINAL"
print_status "Verificando status do sistema..."

sleep 10

echo ""
echo "=== STATUS DOS CONTAINERS ==="
docker-compose ps

echo ""
echo "=== LOGS DO SISTEMA ==="
docker-compose logs --tail=5

echo ""
echo "=== TESTE DE CONECTIVIDADE ==="
if curl -s http://localhost:3000 > /dev/null; then
    print_success "Frontend acessível em http://localhost:3000"
else
    print_warning "Frontend ainda não está acessível. Aguarde alguns minutos."
fi

if curl -s http://localhost:8000/health > /dev/null; then
    print_success "Backend acessível em http://localhost:8000"
else
    print_warning "Backend ainda não está acessível. Aguarde alguns minutos."
fi

# =============================================================================
# FINALIZAÇÃO
# =============================================================================
print_header "INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
print_success "Mercado Livre Tracker V2 instalado e configurado!"

echo ""
echo -e "${CYAN}=== INFORMAÇÕES IMPORTANTES ===${NC}"
echo -e "${GREEN}📁 Diretório do projeto:${NC} ~/apps/mercado-livre-tracker-v2"
echo -e "${GREEN}🌐 Frontend:${NC} http://localhost:3000"
echo -e "${GREEN}🔧 Backend:${NC} http://localhost:8000"
echo -e "${GREEN}📊 API Docs:${NC} http://localhost:8000/docs"
echo ""
echo -e "${CYAN}=== COMANDOS ÚTEIS ===${NC}"
echo -e "${GREEN}Iniciar sistema:${NC} cd ~/apps/mercado-livre-tracker-v2 && docker-compose up -d"
echo -e "${GREEN}Parar sistema:${NC} cd ~/apps/mercado-livre-tracker-v2 && docker-compose down"
echo -e "${GREEN}Ver logs:${NC} cd ~/apps/mercado-livre-tracker-v2 && docker-compose logs -f"
echo -e "${GREEN}Monitorar:${NC} ~/monitor-mercado-livre-tracker.sh"
echo -e "${GREEN}Fazer backup:${NC} ~/backup-mercado-livre-tracker.sh"
echo ""
echo -e "${CYAN}=== PRÓXIMOS PASSOS ===${NC}"
echo -e "${YELLOW}1.${NC} Configure as variáveis de ambiente no arquivo .env"
echo -e "${YELLOW}2.${NC} Reinicie o sistema: docker-compose restart"
echo -e "${YELLOW}3.${NC} Acesse http://localhost:3000 para usar o sistema"
echo -e "${YELLOW}4.${NC} Configure SSL/HTTPS se necessário"
echo ""
echo -e "${PURPLE}🎉 Sistema pronto para uso! 🎉${NC}"
