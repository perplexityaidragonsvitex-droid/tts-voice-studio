#!/bin/bash
# СПС Голосовая Студия - TTS Service Runner
cd /home/z/my-project/mini-services/tts-service

# Убиваем старый процесс если есть
pkill -f "venv/bin/python index.py" 2>/dev/null
sleep 1

# Запускаем в фоне
nohup ./venv/bin/python index.py >> /tmp/tts-service.log 2>&1 &
echo "TTS Service started on port 3031"
