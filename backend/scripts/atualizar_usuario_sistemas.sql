-- Atualiza o usuário sistemas@smstecnologia.com.br para administrador
UPDATE users
SET role = 'admin',
    is_superuser = TRUE,
    is_active = TRUE,
    is_verified = TRUE,
    approval_status = 'approved'
WHERE email = 'sistemas@smstecnologia.com.br';

-- Confirma a atualização
SELECT id, email, full_name, role, is_superuser, is_active, is_verified, approval_status
FROM users
WHERE email = 'sistemas@smstecnologia.com.br';
