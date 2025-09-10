-- Script SQL para apagar todos os usuários e recriar apenas o usuário sistemas@smstecnologia.com.br como administrador
-- ATENÇÃO: Este script remove TODOS os usuários do banco de dados!

-- Primeiro, fazemos um backup dos usuários atuais (opcional)
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;

-- Apagar todos os usuários do banco
DELETE FROM users;

-- Recriar apenas o usuário sistemas@smstecnologia.com.br como administrador
-- Senha original: Admin@2025
INSERT INTO users (
    email,
    full_name,
    hashed_password,
    role,
    is_active,
    is_superuser,
    is_verified,
    approval_status,
    created_at,
    updated_at
) VALUES (
    'sistemas@smstecnologia.com.br',
    'Administrador Sistema',
    '$2b$12$L7SfFyFtMQRTGW/dM.cfleT6WzUbOl/5Geb61CAO8SY.a9begYZHG',  -- Hash da senha Admin@2025
    'admin',
    TRUE,
    TRUE,
    TRUE,
    'approved',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Verificar o resultado da operação
SELECT id, email, full_name, role, is_superuser, is_active, is_verified, approval_status
FROM users;
