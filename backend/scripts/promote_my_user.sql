-- Script SQL para promover seu usuário para administrador
-- Substitua 'seu-email@example.com' pelo seu email de login real

-- Primeiro, vamos mostrar os usuários disponíveis para você escolher qual promover
SELECT id, email, full_name, role, is_active, approval_status FROM users;

-- Para promover um usuário específico, descomente e ajuste a linha abaixo:
-- UPDATE users SET role = 'admin', is_superuser = TRUE, is_active = TRUE, is_verified = TRUE, approval_status = 'approved' WHERE email = 'seu-email@example.com';

-- Para promover TODOS os usuários ativos (use apenas se necessário):
UPDATE users
SET role = 'admin',
    is_superuser = TRUE,
    is_verified = TRUE,
    approval_status = 'approved'
WHERE is_active = TRUE;

-- Confirme se as alterações foram aplicadas
SELECT id, email, full_name, role, is_superuser, is_active, is_verified, approval_status FROM users;
