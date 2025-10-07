#!/bin/bash

# =============================================================================
# SCRIPT DE CONFIGURAÇÃO PÓS-INSTALAÇÃO
# =============================================================================
# Este script configura o sistema após a instalação inicial
# =============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Banner
print_banner() {
    echo -e "${BLUE}"
    echo "============================================================================="
    echo "                    CONFIGURAÇÃO PÓS-INSTALAÇÃO"
    echo "============================================================================="
    echo -e "${NC}"
}

# Verificar se o Docker está rodando
check_docker() {
    print_status "Verificando se o Docker está rodando..."
    
    if ! docker info &> /dev/null; then
        print_error "Docker não está rodando!"
        print_status "Inicie o Docker Desktop ou execute: sudo systemctl start docker"
        exit 1
    fi
    
    print_success "Docker está rodando"
}

# Verificar se os containers estão rodando
check_containers() {
    print_status "Verificando containers..."
    
    if ! docker-compose ps | grep -q "Up"; then
        print_error "Containers não estão rodando!"
        print_status "Inicie os containers com: docker-compose up -d"
        exit 1
    fi
    
    print_success "Containers estão rodando"
}

# Configurar banco de dados
setup_database() {
    print_status "Configurando banco de dados..."
    
    # Aguardar PostgreSQL estar pronto
    print_status "Aguardando PostgreSQL estar pronto..."
    sleep 10
    
    # Criar usuário admin padrão
    print_status "Criando usuário administrador padrão..."
    docker-compose exec -T backend python -c "
import sys
sys.path.append('/app')
from app.db.database import get_db
from app.models.user import User
from app.core.security import get_password_hash
from sqlalchemy.orm import Session

# Criar usuário admin se não existir
db = next(get_db())
admin_user = db.query(User).filter(User.email == 'admin@example.com').first()
if not admin_user:
    admin_user = User(
        email='admin@example.com',
        username='admin',
        password_hash=get_password_hash('admin123'),
        is_active=True,
        is_admin=True
    )
    db.add(admin_user)
    db.commit()
    print('Usuário admin criado com sucesso!')
else:
    print('Usuário admin já existe!')
" 2>/dev/null || print_warning "Não foi possível criar usuário admin automaticamente"
}

# Configurar dados iniciais
setup_initial_data() {
    print_status "Configurando dados iniciais..."
    
    # Criar categorias padrão
    print_status "Criando categorias padrão..."
    docker-compose exec -T backend python -c "
import sys
sys.path.append('/app')
from app.db.database import get_db
from app.models.category import Category
from sqlalchemy.orm import Session

db = next(get_db())

# Categorias padrão do Mercado Livre
categories = [
    'Eletrônicos, Áudio e Vídeo',
    'Celulares e Telefones',
    'Informática',
    'Casa, Móveis e Decoração',
    'Esportes e Fitness',
    'Moda e Beleza',
    'Livros, Revistas e Comics',
    'Brinquedos e Hobbies',
    'Automóveis e Barcos',
    'Imóveis'
]

for cat_name in categories:
    existing = db.query(Category).filter(Category.name == cat_name).first()
    if not existing:
        category = Category(name=cat_name, is_active=True)
        db.add(category)

db.commit()
print('Categorias criadas com sucesso!')
" 2>/dev/null || print_warning "Não foi possível criar categorias automaticamente"
}

# Configurar Elasticsearch
setup_elasticsearch() {
    print_status "Configurando Elasticsearch..."
    
    # Aguardar Elasticsearch estar pronto
    print_status "Aguardando Elasticsearch estar pronto..."
    sleep 15
    
    # Criar índices
    print_status "Criando índices do Elasticsearch..."
    docker-compose exec -T backend python -c "
import sys
sys.path.append('/app')
from app.services.elasticsearch_service import ElasticsearchService

try:
    es_service = ElasticsearchService()
    es_service.create_indexes()
    print('Índices do Elasticsearch criados com sucesso!')
except Exception as e:
    print(f'Erro ao criar índices: {e}')
" 2>/dev/null || print_warning "Não foi possível configurar Elasticsearch automaticamente"
}

# Configurar permissões
setup_permissions() {
    print_status "Configurando permissões..."
    
    # Dar permissões para logs
    mkdir -p logs
    chmod 755 logs
    
    # Dar permissões para backups
    mkdir -p backups
    chmod 755 backups
    
    print_success "Permissões configuradas"
}

# Configurar cron jobs (opcional)
setup_cron() {
    print_status "Configurando tarefas agendadas..."
    
    # Criar script de backup
    cat > backup.sh << 'EOF'
#!/bin/bash
# Script de backup automático
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T db pg_dump -U postgres ml_tracker > backups/backup_$DATE.sql
find backups/ -name "backup_*.sql" -mtime +30 -delete
EOF
    
    chmod +x backup.sh
    
    print_success "Script de backup criado"
}

# Testar sistema
test_system() {
    print_status "Testando sistema..."
    
    # Testar API
    print_status "Testando API..."
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        print_success "API está respondendo"
    else
        print_warning "API pode não estar pronta ainda"
    fi
    
    # Testar Frontend
    print_status "Testando Frontend..."
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend está respondendo"
    else
        print_warning "Frontend pode não estar pronto ainda"
    fi
    
    # Testar banco de dados
    print_status "Testando banco de dados..."
    docker-compose exec -T db psql -U postgres -d ml_tracker -c "SELECT 1;" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_success "Banco de dados está funcionando"
    else
        print_warning "Banco de dados pode não estar pronto"
    fi
}

# Mostrar informações de acesso
show_access_info() {
    echo ""
    echo -e "${GREEN}============================================================================="
    echo "                    CONFIGURAÇÃO CONCLUÍDA!"
    echo "=============================================================================${NC}"
    echo ""
    echo -e "${BLUE}URLs de Acesso:${NC}"
    echo "  • Frontend: http://localhost:3000"
    echo "  • API Backend: http://localhost:8000"
    echo "  • Documentação API: http://localhost:8000/docs"
    echo "  • Adminer (DB): http://localhost:8080"
    echo ""
    echo -e "${BLUE}Credenciais Padrão:${NC}"
    echo "  • Email: admin@example.com"
    echo "  • Senha: admin123"
    echo ""
    echo -e "${YELLOW}PRÓXIMOS PASSOS:${NC}"
    echo "  1. Acesse http://localhost:3000"
    echo "  2. Faça login com as credenciais padrão"
    echo "  3. Altere a senha do administrador"
    echo "  4. Configure as variáveis no arquivo .env"
    echo "  5. Adicione produtos para monitorar"
    echo ""
    echo -e "${BLUE}Comandos Úteis:${NC}"
    echo "  • Ver logs: docker-compose logs -f"
    echo "  • Parar sistema: docker-compose down"
    echo "  • Reiniciar: docker-compose restart"
    echo "  • Backup: ./backup.sh"
    echo ""
}

# Função principal
main() {
    print_banner
    
    # Verificações
    check_docker
    check_containers
    
    # Configurações
    setup_database
    setup_initial_data
    setup_elasticsearch
    setup_permissions
    setup_cron
    
    # Testes
    test_system
    
    # Informações finais
    show_access_info
}

# Executar script
main "$@"
