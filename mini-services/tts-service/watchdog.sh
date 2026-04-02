#!/bin/bash
# TTS Service Watchdog - проверяет каждые 30 секунд

KEEPALIVE="/home/z/my-project/mini-services/tts-service/keepalive.sh"

while true; do
    bash "$KEEPALIVE"
    sleep 30
done
