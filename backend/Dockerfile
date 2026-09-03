FROM python:3.12-slim

WORKDIR /app

# Install system utilities and OpenSSL needed for Prisma binary engine
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy Prisma schema and generate client for Debian Linux
COPY prisma/ ./prisma/
RUN python -m prisma generate --schema=prisma/schema.prisma

# Copy application source
COPY app/ ./app/
COPY seed_db.py .

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
