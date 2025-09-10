-- Script SQL para promover o usuário sistemas@smstecnologia.com.br para administrador
-- e garantir que todas as permissões necessárias estejam configuradas corretamente

-- Promover o usuário para administrador e ativar todas as permissões necessárias
UPDATE users
SET role = 'admin',
    is_superuser = TRUE,
    is_active = TRUE,
    is_verified = TRUE,
    approval_status = 'approved'
WHERE email = 'sistemas@smstecnologia.com.br';

-- Verificar o resultado da operação
SELECT id, email, full_name, role, is_superuser, is_active, is_verified, approval_status
FROM users
WHERE email = 'sistemas@smstecnologia.com.br';
