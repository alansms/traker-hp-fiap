-- Adiciona coluna average_pages na tabela products
-- Execução: docker-compose exec backend psql postgresql://postgres:postgres@db:5432/ml_tracker -f /app/app/scripts/add_average_pages_column.sql

-- Adicionar coluna se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='products' 
        AND column_name='average_pages'
    ) THEN
        ALTER TABLE products ADD COLUMN average_pages INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna average_pages adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna average_pages já existe!';
    END IF;
END $$;

-- Atualizar produtos existentes com valores padrão
UPDATE products SET average_pages = 0 WHERE average_pages IS NULL;

-- Verificar resultado
SELECT id, name, pn, family, average_pages, reference_price 
FROM products 
ORDER BY id 
LIMIT 10;

