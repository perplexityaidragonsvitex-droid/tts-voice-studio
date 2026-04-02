# ===========================================
# СПС Голосовая Студия - Render.com (с Python TTS)
# ===========================================

# ===========================================
# Stage 1: Python TTS Builder
# ===========================================
FROM python:3.12-slim AS tts-builder

WORKDIR /tts-service

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY mini-services/tts-service/requirements.txt ./
RUN pip install --no-cache-dir --target=/python-packages -r requirements.txt

COPY mini-services/tts-service/index.py ./
COPY mini-services/tts-service/cleanup_audio.py ./

# ===========================================
# Stage 2: Node.js Dependencies
# ===========================================
FROM oven/bun:1 AS deps

WORKDIR /app

COPY package.json bun.lock* ./
COPY prisma ./prisma/

RUN bun install --frozen-lockfile

# ===========================================
# Stage 3: Builder
# ===========================================
FROM oven/bun:1 AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN bun run build

# ===========================================
# Stage 4: Runner (Production)
# ===========================================
FROM oven/bun:1 AS runner

WORKDIR /app

# Install Python and FFmpeg for TTS
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages
COPY --from=tts-builder /python-packages /python-packages
ENV PYTHONPATH="/python-packages:$PYTHONPATH"

# Copy TTS service
COPY --from=tts-builder /tts-service /app/tts-service

# Copy Next.js application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Create directories and startup script
RUN mkdir -p /app/public/audio /app/data && \
    echo '#!/bin/bash\n\
set -e\n\
echo "Starting TTS service..."\n\
cd /app/tts-service && PYTHONIOENCODING=utf-8 PYTHONPATH=/python-packages python3 index.py &\n\
sleep 5\n\
echo "Running Prisma migrations..."\n\
cd /app && bunx prisma db push --skip-generate || true\n\
echo "Starting Next.js server..."\n\
cd /app && bun server.js\n\
' > /app/start.sh && chmod +x /app/start.sh

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PYTHONIOENCODING=utf-8
ENV TTS_SERVICE_URL=http://localhost:3031
ENV DATABASE_URL=file:/app/data/tts.db

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["/bin/bash", "/app/start.sh"]
