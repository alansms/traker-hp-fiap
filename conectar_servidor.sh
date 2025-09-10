#!/bin/bash

# =============================================================================
# SCRIPT PARA CONECTAR E CONFIGURAR SERVIDOR 191.252.203.163
# =============================================================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

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

# Configurações do servidor
SERVER_IP="191.252.203.163"
SERVER_USER="root"  # Alterar conforme necessário

print_header "CONFIGURAÇÃO DO SERVIDOR 191.252.203.163"

echo -e "${CYAN}=== INFORMAÇÕES DO SERVIDOR ===${NC}"
echo "IP: $SERVER_IP"
echo "Usuário: $SERVER_USER"
echo ""

# Função para mostrar menu
show_menu() {
    echo ""
    echo -e "${CYAN}=== MENU DE CONFIGURAÇÃO ===${NC}"
    echo "1. Conectar via SSH"
    echo "2. Testar conectividade"
    echo "3. Configurar chave SSH"
    echo "4. Instalar sistema completo"
    echo "5. Configurar Nginx"
    echo "6. Configurar SSL"
    echo "7. Monitorar sistema"
    echo "8. Backup do sistema"
    echo "9. Sair"
    echo ""
}

# Função para conectar via SSH
connect_ssh() {
    print_header "CONECTANDO VIA SSH"
    print_status "Conectando ao servidor $SERVER_IP..."
    
    echo "Comandos úteis após conectar:"
    echo "- Verificar sistema: lsb_release -a && free -h && df -h"
    echo "- Atualizar sistema: sudo apt update && sudo apt upgrade -y"
    echo "- Instalar Docker: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
    echo "- Baixar projeto: git clone https://github.com/alansms/trazer_hp_fiap_v4.git"
    echo ""
    
    read -p "Pressione Enter para conectar..."
    ssh $SERVER_USER@$SERVER_IP
}

# Função para testar conectividade
test_connectivity() {
    print_header "TESTANDO CONECTIVIDADE"
    
    print_status "Testando ping..."
    if ping -c 3 $SERVER_IP > /dev/null 2>&1; then
        print_success "✅ Ping: OK"
    else
        print_error "❌ Ping: FALHOU"
    fi
    
    print_status "Testando porta SSH (22)..."
    if nc -z $SERVER_IP 22 2>/dev/null; then
        print_success "✅ SSH (22): OK"
    else
        print_error "❌ SSH (22): FALHOU"
    fi
    
    print_status "Testando porta HTTP (80)..."
    if nc -z $SERVER_IP 80 2>/dev/null; then
        print_success "✅ HTTP (80): OK"
    else
        print_warning "⚠️  HTTP (80): Não disponível"
    fi
    
    print_status "Testando porta HTTPS (443)..."
    if nc -z $SERVER_IP 443 2>/dev/null; then
        print_success "✅ HTTPS (443): OK"
    else
        print_warning "⚠️  HTTPS (443): Não disponível"
    fi
}

# Função para configurar chave SSH
setup_ssh_key() {
    print_header "CONFIGURANDO CHAVE SSH"
    
    # Verificar se chave SSH existe
    if [ ! -f ~/.ssh/id_ed25519 ]; then
        print_status "Gerando nova chave SSH..."
        ssh-keygen -t ed25519 -C "mercado-livre-tracker@$SERVER_IP"
    else
        print_success "Chave SSH já existe!"
    fi
    
    print_status "Copiando chave para o servidor..."
    ssh-copy-id $SERVER_USER@$SERVER_IP
    
    print_success "Chave SSH configurada com sucesso!"
}

# Função para instalar sistema completo
install_system() {
    print_header "INSTALAÇÃO COMPLETA DO SISTEMA"
    
    print_status "Criando script de instalação remoto..."
    
    cat > install_remote.sh << 'EOF'
#!/bin/bash

# Script de instalação remota
set -e

echo "=== INSTALAÇÃO DO MERCADO LIVRE TRACKER V2 ==="

# Atualizar sistema
echo "Atualizando sistema..."
apt update && apt upgrade -y
apt install -y curl wget git unzip htop nano vim

# Instalar Docker
echo "Instalando Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker $USER

# Instalar Docker Compose
echo "Instalando Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Instalar Nginx
echo "Instalando Nginx..."
apt install -y nginx

# Configurar firewall
echo "Configurando firewall..."
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw allow 8000/tcp
ufw --force enable

# Baixar projeto
echo "Baixando projeto..."
mkdir -p ~/apps
cd ~/apps
git clone https://github.com/alansms/trazer_hp_fiap_v4.git mercado-livre-tracker-v2
cd mercado-livre-tracker-v2

# Configurar variáveis de ambiente
echo "Configurando variáveis de ambiente..."
cp .env.example .env

# Gerar chaves secretas
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)

sed -i "s/your-secret-key-here-change-this-in-production/$SECRET_KEY/g" .env
sed -i "s/your-jwt-secret-key-here-change-this-in-production/$JWT_SECRET_KEY/g" .env

# Iniciar sistema
echo "Iniciando sistema..."
docker-compose up -d

echo "=== INSTALAÇÃO CONCLUÍDA ==="
echo "Sistema disponível em:"
echo "- Frontend: http://$(curl -s ifconfig.me):3000"
echo "- Backend: http://$(curl -s ifconfig.me):8000"
echo "- API Docs: http://$(curl -s ifconfig.me):8000/docs"
echo ""
echo "Credenciais padrão:"
echo "- Username: admin"
echo "- Password: admin123"
EOF

    print_status "Enviando script para o servidor..."
    scp install_remote.sh $SERVER_USER@$SERVER_IP:~/
    
    print_status "Executando instalação no servidor..."
    ssh $SERVER_USER@$SERVER_IP "chmod +x ~/install_remote.sh && ~/install_remote.sh"
    
    print_success "Sistema instalado com sucesso!"
}

# Função para configurar Nginx
configure_nginx() {
    print_header "CONFIGURANDO NGINX"
    
    print_status "Criando configuração do Nginx..."
    
    cat > nginx_config << 'EOF'
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
EOF

    print_status "Enviando configuração para o servidor..."
    scp nginx_config $SERVER_USER@$SERVER_IP:~/
    
    print_status "Configurando Nginx no servidor..."
    ssh $SERVER_USER@$SERVER_IP "
        sudo cp ~/nginx_config /etc/nginx/sites-available/mercado-livre-tracker
        sudo ln -sf /etc/nginx/sites-available/mercado-livre-tracker /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
        sudo nginx -t
        sudo systemctl restart nginx
        sudo systemctl enable nginx
    "
    
    print_success "Nginx configurado com sucesso!"
}

# Função para configurar SSL
configure_ssl() {
    print_header "CONFIGURAÇÃO SSL"
    
    print_warning "Para configurar SSL, você precisa de um domínio apontando para o servidor!"
    echo ""
    read -p "Digite o domínio (ex: exemplo.com): " domain
    
    if [ -z "$domain" ]; then
        print_error "Domínio não informado!"
        return 1
    fi
    
    print_status "Configurando SSL para $domain..."
    
    ssh $SERVER_USER@$SERVER_IP "
        apt install -y certbot python3-certbot-nginx
        certbot --nginx -d $domain --non-interactive --agree-tos --email admin@$domain
        echo '0 12 * * * /usr/bin/certbot renew --quiet' | crontab -
    "
    
    print_success "SSL configurado para $domain!"
}

# Função para monitorar sistema
monitor_system() {
    print_header "MONITORAMENTO DO SISTEMA"
    
    print_status "Conectando para monitoramento..."
    
    ssh $SERVER_USER@$SERVER_IP "
        echo '=== STATUS DO SISTEMA ==='
        echo 'Data: \$(date)'
        echo ''
        echo '=== CONTAINERS ==='
        cd ~/apps/mercado-livre-tracker-v2
        docker-compose ps
        echo ''
        echo '=== RECURSOS ==='
        echo 'CPU: \$(top -bn1 | grep \"Cpu(s)\" | awk '{print \$2}' | head -1)'
        echo 'Memória: \$(free -h | grep Mem | awk '{print \$3\"/\"\$2}')'
        echo 'Disco: \$(df -h / | awk 'NR==2{print \$3\"/\"\$2\" (\"\$5\")}')'
        echo ''
        echo '=== CONECTIVIDADE ==='
        if curl -s http://localhost:3000 > /dev/null; then
            echo '✅ Frontend: OK'
        else
            echo '❌ Frontend: ERRO'
        fi
        if curl -s http://localhost:8000/health > /dev/null; then
            echo '✅ Backend: OK'
        else
            echo '❌ Backend: ERRO'
        fi
    "
}

# Função para backup
backup_system() {
    print_header "BACKUP DO SISTEMA"
    
    print_status "Criando backup do sistema..."
    
    ssh $SERVER_USER@$SERVER_IP "
        BACKUP_DIR=~/backups/mercado-livre-tracker
        DATE=\$(date +%Y%m%d_%H%M%S)
        
        mkdir -p \$BACKUP_DIR
        
        # Backup do código
        cd ~/apps/mercado-livre-tracker-v2
        tar -czf \$BACKUP_DIR/code_backup_\$DATE.tar.gz .
        
        # Backup do banco de dados
        if docker-compose ps | grep -q 'db.*Up'; then
            docker-compose exec -T db pg_dump -U postgres ml_tracker > \$BACKUP_DIR/database_backup_\$DATE.sql
        fi
        
        # Backup das variáveis de ambiente
        cp .env \$BACKUP_DIR/env_backup_\$DATE
        
        echo 'Backup criado em: \$BACKUP_DIR'
        ls -la \$BACKUP_DIR | grep \$DATE
    "
    
    print_success "Backup criado com sucesso!"
}

# Loop principal
while true; do
    show_menu
    read -p "Escolha uma opção: " choice
    
    case $choice in
        1) connect_ssh ;;
        2) test_connectivity ;;
        3) setup_ssh_key ;;
        4) install_system ;;
        5) configure_nginx ;;
        6) configure_ssl ;;
        7) monitor_system ;;
        8) backup_system ;;
        9) 
            print_success "Saindo..."
            exit 0
            ;;
        *) 
            print_error "Opção inválida!"
            ;;
    esac
    
    echo ""
    read -p "Pressione Enter para continuar..."
done
