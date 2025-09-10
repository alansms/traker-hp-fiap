#!/bin/bash

# =============================================================================
# SCRIPT DE MANUTENÇÃO E MONITORAMENTO - MERCADO LIVRE TRACKER V2
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

# Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    print_error "Execute este script no diretório do projeto!"
    exit 1
fi

# Função para mostrar menu
show_menu() {
    echo ""
    echo -e "${CYAN}=== MENU DE MANUTENÇÃO ===${NC}"
    echo "1. Status do Sistema"
    echo "2. Ver Logs"
    echo "3. Reiniciar Serviços"
    echo "4. Parar Serviços"
    echo "5. Iniciar Serviços"
    echo "6. Backup do Sistema"
    echo "7. Restaurar Backup"
    echo "8. Limpeza de Logs"
    echo "9. Atualizar Sistema"
    echo "10. Monitoramento em Tempo Real"
    echo "11. Verificar Espaço em Disco"
    echo "12. Verificar Uso de Memória"
    echo "13. Testar Conectividade"
    echo "14. Configurar SSL"
    echo "15. Sair"
    echo ""
}

# Função para status do sistema
system_status() {
    print_header "STATUS DO SISTEMA"
    
    echo -e "${CYAN}=== CONTAINERS DOCKER ===${NC}"
    docker-compose ps
    
    echo ""
    echo -e "${CYAN}=== USO DE RECURSOS ===${NC}"
    echo "CPU:"
    top -bn1 | grep "Cpu(s)" | head -1
    
    echo ""
    echo "Memória:"
    free -h
    
    echo ""
    echo "Disco:"
    df -h | grep -E "(Filesystem|/dev/)"
    
    echo ""
    echo -e "${CYAN}=== CONECTIVIDADE ===${NC}"
    
    # Testar frontend
    if curl -s http://localhost:3000 > /dev/null; then
        print_success "✅ Frontend: http://localhost:3000"
    else
        print_error "❌ Frontend: http://localhost:3000"
    fi
    
    # Testar backend
    if curl -s http://localhost:8000/health > /dev/null; then
        print_success "✅ Backend: http://localhost:8000"
    else
        print_error "❌ Backend: http://localhost:8000"
    fi
    
    # Testar API
    if curl -s http://localhost:8000/api/health > /dev/null; then
        print_success "✅ API: http://localhost:8000/api"
    else
        print_error "❌ API: http://localhost:8000/api"
    fi
}

# Função para ver logs
view_logs() {
    print_header "LOGS DO SISTEMA"
    
    echo "Escolha o serviço:"
    echo "1. Todos os serviços"
    echo "2. Backend"
    echo "3. Frontend"
    echo "4. Banco de dados"
    echo "5. Redis"
    echo ""
    read -p "Opção: " log_option
    
    case $log_option in
        1) docker-compose logs -f ;;
        2) docker-compose logs -f backend ;;
        3) docker-compose logs -f frontend ;;
        4) docker-compose logs -f db ;;
        5) docker-compose logs -f redis ;;
        *) print_error "Opção inválida!" ;;
    esac
}

# Função para reiniciar serviços
restart_services() {
    print_header "REINICIANDO SERVIÇOS"
    print_status "Reiniciando todos os serviços..."
    
    docker-compose restart
    
    print_success "Serviços reiniciados com sucesso!"
    sleep 5
    system_status
}

# Função para parar serviços
stop_services() {
    print_header "PARANDO SERVIÇOS"
    print_status "Parando todos os serviços..."
    
    docker-compose down
    
    print_success "Serviços parados com sucesso!"
}

# Função para iniciar serviços
start_services() {
    print_header "INICIANDO SERVIÇOS"
    print_status "Iniciando todos os serviços..."
    
    docker-compose up -d
    
    print_success "Serviços iniciados com sucesso!"
    sleep 10
    system_status
}

# Função para backup
backup_system() {
    print_header "BACKUP DO SISTEMA"
    
    BACKUP_DIR="$HOME/backups/mercado-livre-tracker"
    DATE=$(date +%Y%m%d_%H%M%S)
    
    print_status "Criando backup..."
    
    # Criar diretório de backup
    mkdir -p "$BACKUP_DIR"
    
    # Backup do código
    tar -czf "$BACKUP_DIR/code_backup_$DATE.tar.gz" .
    
    # Backup do banco de dados
    if docker-compose ps | grep -q "db.*Up"; then
        docker-compose exec -T db pg_dump -U postgres ml_tracker > "$BACKUP_DIR/database_backup_$DATE.sql"
        print_success "Backup do banco de dados criado!"
    fi
    
    # Backup das variáveis de ambiente
    cp .env "$BACKUP_DIR/env_backup_$DATE"
    
    print_success "Backup criado em: $BACKUP_DIR"
    print_status "Arquivos:"
    ls -la "$BACKUP_DIR" | grep "$DATE"
}

# Função para restaurar backup
restore_backup() {
    print_header "RESTAURAR BACKUP"
    
    BACKUP_DIR="$HOME/backups/mercado-livre-tracker"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        print_error "Diretório de backup não encontrado!"
        return 1
    fi
    
    echo "Backups disponíveis:"
    ls -la "$BACKUP_DIR" | grep -E "(code_backup|database_backup)"
    echo ""
    read -p "Digite a data do backup (YYYYMMDD_HHMMSS): " backup_date
    
    if [ -f "$BACKUP_DIR/code_backup_$backup_date.tar.gz" ]; then
        print_warning "Isso irá sobrescrever os arquivos atuais!"
        read -p "Continuar? (y/N): " confirm
        
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            print_status "Restaurando backup..."
            tar -xzf "$BACKUP_DIR/code_backup_$backup_date.tar.gz"
            print_success "Backup restaurado com sucesso!"
        fi
    else
        print_error "Backup não encontrado!"
    fi
}

# Função para limpeza de logs
clean_logs() {
    print_header "LIMPEZA DE LOGS"
    
    print_status "Limpando logs antigos..."
    
    # Limpar logs do Docker
    docker system prune -f
    
    # Limpar logs do sistema
    sudo journalctl --vacuum-time=7d
    
    print_success "Logs limpos com sucesso!"
}

# Função para atualizar sistema
update_system() {
    print_header "ATUALIZANDO SISTEMA"
    
    print_status "Fazendo backup antes da atualização..."
    backup_system
    
    print_status "Atualizando código do repositório..."
    git pull origin main
    
    print_status "Reconstruindo containers..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    
    print_success "Sistema atualizado com sucesso!"
    sleep 10
    system_status
}

# Função para monitoramento em tempo real
real_time_monitor() {
    print_header "MONITORAMENTO EM TEMPO REAL"
    print_status "Pressione Ctrl+C para sair"
    
    while true; do
        clear
        echo -e "${CYAN}=== MONITORAMENTO EM TEMPO REAL ===${NC}"
        echo "Data: $(date)"
        echo ""
        
        # Status dos containers
        echo -e "${GREEN}=== CONTAINERS ===${NC}"
        docker-compose ps
        
        echo ""
        echo -e "${GREEN}=== RECURSOS ===${NC}"
        echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | head -1)"
        echo "Memória: $(free -h | grep Mem | awk '{print $3"/"$2}')"
        echo "Disco: $(df -h / | awk 'NR==2{print $3"/"$2" ("$5")"}')"
        
        echo ""
        echo -e "${GREEN}=== CONECTIVIDADE ===${NC}"
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
}

# Função para verificar espaço em disco
check_disk_space() {
    print_header "ESPAÇO EM DISCO"
    
    echo -e "${CYAN}=== USO DE DISCO ===${NC}"
    df -h
    
    echo ""
    echo -e "${CYAN}=== DIRETÓRIOS MAIORES ===${NC}"
    du -sh * 2>/dev/null | sort -hr | head -10
    
    echo ""
    echo -e "${CYAN}=== DOCKER VOLUMES ===${NC}"
    docker system df
}

# Função para verificar uso de memória
check_memory() {
    print_header "USO DE MEMÓRIA"
    
    echo -e "${CYAN}=== MEMÓRIA DO SISTEMA ===${NC}"
    free -h
    
    echo ""
    echo -e "${CYAN}=== PROCESSOS USANDO MAIS MEMÓRIA ===${NC}"
    ps aux --sort=-%mem | head -10
    
    echo ""
    echo -e "${CYAN}=== MEMÓRIA DOS CONTAINERS ===${NC}"
    docker stats --no-stream
}

# Função para testar conectividade
test_connectivity() {
    print_header "TESTE DE CONECTIVIDADE"
    
    echo -e "${CYAN}=== TESTES DE CONECTIVIDADE ===${NC}"
    
    # Testar frontend
    echo -n "Frontend (http://localhost:3000): "
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
        print_success "OK"
    else
        print_error "ERRO"
    fi
    
    # Testar backend
    echo -n "Backend (http://localhost:8000): "
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health | grep -q "200"; then
        print_success "OK"
    else
        print_error "ERRO"
    fi
    
    # Testar API
    echo -n "API (http://localhost:8000/api): "
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health | grep -q "200"; then
        print_success "OK"
    else
        print_error "ERRO"
    fi
    
    # Testar banco de dados
    echo -n "Banco de dados: "
    if docker-compose exec -T db pg_isready -U postgres > /dev/null 2>&1; then
        print_success "OK"
    else
        print_error "ERRO"
    fi
    
    # Testar Redis
    echo -n "Redis: "
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_success "OK"
    else
        print_error "ERRO"
    fi
}

# Função para configurar SSL
configure_ssl() {
    print_header "CONFIGURAÇÃO SSL"
    
    print_status "Para configurar SSL com Let's Encrypt:"
    echo ""
    echo "1. Instalar Certbot:"
    echo "   sudo apt install certbot python3-certbot-nginx"
    echo ""
    echo "2. Configurar SSL:"
    echo "   sudo certbot --nginx -d seu-dominio.com"
    echo ""
    echo "3. Configurar renovação automática:"
    echo "   sudo crontab -e"
    echo "   Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet"
    echo ""
    print_warning "Certifique-se de que o domínio está apontando para este servidor!"
}

# Loop principal
while true; do
    show_menu
    read -p "Escolha uma opção: " choice
    
    case $choice in
        1) system_status ;;
        2) view_logs ;;
        3) restart_services ;;
        4) stop_services ;;
        5) start_services ;;
        6) backup_system ;;
        7) restore_backup ;;
        8) clean_logs ;;
        9) update_system ;;
        10) real_time_monitor ;;
        11) check_disk_space ;;
        12) check_memory ;;
        13) test_connectivity ;;
        14) configure_ssl ;;
        15) 
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
