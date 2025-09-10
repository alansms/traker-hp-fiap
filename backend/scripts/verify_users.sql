-- Script para verificar usuários no banco de dados e possíveis duplicidades
-- Listar todos os usuários ordenados por email
SELECT id, email, full_name, role, is_superuser, is_active, is_verified, approval_status
FROM users
ORDER BY email;

-- Verificar se existem emails duplicados
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Verificar especificamente o usuário sistemas@smstecnologia.com.br
SELECT id, email, full_name, role, is_superuser, is_active, is_verified, approval_status
FROM users
WHERE email ILIKE '%sistemas%';

-- Verificar quais usuários têm permissões de administrador
SELECT id, email, full_name, role, is_superuser, is_active, is_verified, approval_status
FROM users
WHERE (role = 'admin' OR is_superuser = TRUE);

-- Verificar a verificação de permissões na aplicação
SELECT * FROM users WHERE id = 2;
