#!/bin/bash
# TTS Service Keep-Alive Script
# Проверяет работу TTS и перезапускает если нужно

TTS_URL="http://localhost:3031/health"
TTS_SCRIPT="/home/z/my-project/mini-services/tts-service/venv/bin/python"
TTS_DIR="/home/z/my-project/mini-services/tts-service"
LOG_FILE="/tmp/tts-service.log"

# Проверяем ответ от сервиса
if ! curl -s --max-time 3 "$TTS_URL" > /dev/null 2>&1; then
    echo "[$(date)] TTS Service не отвечает, перезапуск..." >> "$LOG_FILE"
    cd "$TTS_DIR"
    pkill -f "venv/bin/python index.py" 2>/dev/null
    sleep 1
    nohup "$TTS_SCRIPT" index.py >> "$LOG_FILE" 2>&1 &
    echo "[$(date)] TTS Service перезапущен" >> "$LOG_FILE"
fi
