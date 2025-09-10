FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Instalar o Playwright e seus navegadores
RUN pip install playwright && playwright install chromium

COPY . .

# Configurar o PYTHONPATH
ENV PYTHONPATH=/app

# Expor a porta que o FastAPI usará
EXPOSE 8000

# Comando para iniciar a aplicação
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
