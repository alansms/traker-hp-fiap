#!/bin/bash
# Script para exportar logs dos contêineres Docker para arquivos

# Criar diretório para logs se não existir
mkdir -p docker_logs

# Exportar logs do backend
echo "Exportando logs do backend..."
docker logs ml-tracker-backend > docker_logs/backend_logs.txt 2>&1

# Exportar logs do frontend
echo "Exportando logs do frontend..."
docker logs ml-tracker-frontend > docker_logs/frontend_logs.txt 2>&1

# Exportar logs do nginx
echo "Exportando logs do nginx..."
docker logs ml-tracker-nginx > docker_logs/nginx_logs.txt 2>&1

echo "Logs exportados para a pasta docker_logs/"
