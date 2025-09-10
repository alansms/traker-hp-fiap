-- Script para verificar o status do usuário sistemas@smstecnologia.com.br
SELECT
    id,
    email,
    full_name,
    role,
    is_active,
    is_superuser,
    is_verified,
    approval_status
FROM
    users
WHERE
    email = 'sistemas@smstecnologia.com.br';

