-- Script SQL para promover o usuário admin@example.com para administrador
UPDATE users
SET role = 'admin',
    is_superuser = TRUE,
    is_active = TRUE,
    is_verified = TRUE,
    approval_status = 'approved'
WHERE email = 'admin@example.com';

-- Se o usuário não existir, vamos inserir um novo
INSERT INTO users (email, full_name, hashed_password, role, is_active, is_superuser, is_verified, approval_status)
SELECT 'admin@example.com', 'Administrador',
       '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- senha: admin123
       'admin', TRUE, TRUE, TRUE, 'approved'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com');

-- Exibir o usuário após a atualização
SELECT id, email, role, is_superuser, is_active, is_verified, approval_status
FROM users
WHERE email = 'admin@example.com';
