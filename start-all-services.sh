#!/bin/bash
# Автозапуск всех мини-сервисов

echo "🚀 Запуск мини-сервисов..."

# TTS Service
if ! curl -s --max-time 2 http://localhost:3031/health > /dev/null 2>&1; then
    echo "  🎤 Запуск TTS Service..."
    /home/z/my-project/mini-services/tts-service/run.sh
fi

echo "✅ Все сервисы запущены"
