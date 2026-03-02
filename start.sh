#!/bin/sh
set -e

# Render sets PORT dynamically; default to 10000 if not set
export PORT="${PORT:-10000}"

# Substitute ${PORT} in the nginx config template, leaving nginx variables untouched
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Optionally seed demo data (set SEED_DATA=true to populate the database)
if [ "${SEED_DATA}" = "true" ]; then
  echo "Seeding demo data..."
  python /app/seed.py && echo "Seed complete." || echo "Seed failed (may already be seeded)."
fi

# Start uvicorn (FastAPI backend) in the background, log to stderr
uvicorn app.main:app --host 127.0.0.1 --port 8000 2>&1 &
UVICORN_PID=$!

# Wait for uvicorn to become ready before accepting traffic via nginx
echo "Waiting for backend to be ready..."
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:8000/health > /dev/null 2>&1; then
    echo "Backend is ready."
    break
  fi
  if ! kill -0 "$UVICORN_PID" 2>/dev/null; then
    echo "ERROR: uvicorn process exited unexpectedly." >&2
    exit 1
  fi
  sleep 1
done

# Start nginx in the foreground (keeps the container alive)
exec nginx -g "daemon off;"
