FROM python:3.12-slim

WORKDIR /app

# Install system dependencies, OpenSSL, libatomic (required by Node/Prisma), and Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    openssl \
    libatomic1 \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy Prisma schema and generate client for Debian Linux
COPY prisma/ ./prisma/
RUN python -m prisma generate --schema=prisma/schema.prisma

# Clean up npm cache to keep Docker image lightweight
RUN npm cache clean --force 2>/dev/null || true

# Copy application source
COPY app/ ./app/
COPY seed_db.py .

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
