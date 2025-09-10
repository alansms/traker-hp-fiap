-- Verificar o usuário sistemas@smstecnologia.com.br e garantir que role seja 'admin'
SELECT id, email, full_name, role, is_superuser
FROM users
WHERE email = 'sistemas@smstecnologia.com.br';

-- Corrigir o valor do campo role para garantir acesso
UPDATE users
SET role = 'admin'
WHERE email = 'sistemas@smstecnologia.com.br' AND role != 'admin';

-- Verificar após a atualização
SELECT id, email, full_name, role, is_superuser
FROM users
WHERE email = 'sistemas@smstecnologia.com.br';
