# 🚇 Мини-сервисы СПС Голосовая Студия

## TTS Service (порт 3031)

### Запуск
```bash
./mini-services/tts-service/run.sh
```

### Проверка статуса
```bash
curl http://localhost:3031/health
```

### Остановка
```bash
pkill -f "venv/bin/python index.py"
```

### Логи
```bash
tail -f /tmp/tts-service.log
```

## Автоматическое восстановление

Watchdog проверяет TTS сервис каждые 30 секунд и автоматически перезапускает его при сбое.

### Управление watchdog
```bash
# Проверить работает ли watchdog
ps aux | grep watchdog

# Остановить watchdog
pkill -f "tts-service/watchdog.sh"

# Запустить watchdog
nohup ./mini-services/tts-service/watchdog.sh > /tmp/tts-watchdog.log 2>&1 &
```

## Запуск всех сервисов
```bash
./start-all-services.sh
```
