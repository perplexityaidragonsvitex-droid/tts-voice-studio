# ===========================================
# TTS Service Dockerfile
# Python 3.12 + Edge TTS + FFmpeg
# ===========================================
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY index.py .

# Create audio directory
RUN mkdir -p /app/public/audio

# Expose port
EXPOSE 3031

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3031/health || exit 1

# Run the service
CMD ["python3", "index.py"]
