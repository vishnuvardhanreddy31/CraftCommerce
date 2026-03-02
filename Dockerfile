# ── Stage 1: Build frontend ───────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Production image (backend + nginx serving frontend) ───────────────
FROM python:3.11-slim
WORKDIR /app

# Install nginx and envsubst (from gettext-base)
RUN apt-get update && apt-get install -y nginx gettext-base curl && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default

# Install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY backend/ ./

# Copy seed script for demo data
COPY seed.py ./seed.py

# Copy built frontend static files
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copy nginx config template (uses ${PORT} substituted at runtime)
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Copy and prepare startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Render assigns a dynamic PORT (default 10000)
EXPOSE 10000

CMD ["/start.sh"]
