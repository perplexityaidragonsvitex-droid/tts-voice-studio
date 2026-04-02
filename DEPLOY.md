# Деплой на Render.com

## 📋 Подготовка

### 1. Создать репозиторий на GitHub

```bash
# Инициализировать git (если ещё нет)
git init

# Добавить все файлы
git add .

# Создать коммит
git commit -m "Initial commit: TTS Voice Studio"

# Добавить remote
git remote add origin https://github.com/YOUR_USERNAME/tts-voice-studio.git

# Отправить на GitHub
git push -u origin main
```

### 2. Создать аккаунт на Render.com

1. Перейдите на https://dashboard.render.com/
2. Нажмите "Sign Up" и авторизуйтесь через GitHub
3. Разрешите Render доступ к вашим репозиториям

## 🚀 Деплой через Blueprint

### Автоматический способ (рекомендуется)

1. В Render Dashboard нажмите **"New"** → **"Blueprint"**
2. Подключите ваш GitHub репозиторий
3. Render автоматически найдет `render.yaml`
4. Подтвердите создание сервисов

Render создаст:
- ✅ Web Service (Next.js + Python TTS)
- ✅ PostgreSQL Database (бесплатно)
- ✅ Сгенерирует безопасные пароли

### Ручной способ

Если Blueprint не работает:

1. **Создать базу данных:**
   - New → PostgreSQL
   - Имя: `tts-db`
   - Region: Frankfurt (или ближайший)
   - Plan: Free

2. **Создать Web Service:**
   - New → Web Service
   - Подключить GitHub репозиторий
   - Runtime: Docker
   - Dockerfile Path: `./Dockerfile.render`
   - Environment Variables:
     ```
     DATABASE_URL=<вставить из PostgreSQL>
     APP_PASSWORD=<ваш-пароль>
     SESSION_SECRET=<случайная-строка>
     ```

## ⚙️ Переменные окружения

| Переменная | Описание | Значение |
|------------|----------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Автоматически из Render |
| `APP_PASSWORD` | Пароль для входа | Сгенерировать или указать |
| `SESSION_SECRET` | Секрет для сессий | Минимум 32 символа |
| `TTS_SERVICE_URL` | URL TTS сервиса | `http://localhost:3031` |
| `TELEGRAM_BOT_TOKEN` | Telegram токен (опционально) | От @BotFather |
| `TELEGRAM_CHAT_ID` | Telegram чат (опционально) | ID получателя |

## 📊 Мониторинг

### Логи
```bash
# В Render Dashboard → ваш сервис → Logs
```

### Health Check
- Endpoint: `/api/auth`
- Интервал: 30 секунд

### Проверка работоспособности
```bash
# Проверить статус
curl https://your-app.onrender.com/api/auth

# Должен вернуть:
{"authenticated":false}
```

## 🔧 Устранение неполадок

### Ошибка сборки Docker

```bash
# Проверить Dockerfile локально
docker build -f Dockerfile.render -t tts-studio .
docker run -p 3000:3000 tts-studio
```

### База данных не создается

```bash
# В Render Dashboard → Shell
bunx prisma db push
```

### TTS сервис не стартует

Проверить логи на наличие:
```
Starting TTS service...
TTS service started
```

## 🌐 Домен

### Поддомен Render (бесплатно)
- Формат: `your-app.onrender.com`
- Настраивается автоматически

### Кастомный домен
1. Render Dashboard → Settings → Custom Domain
2. Добавить домен
3. Настроить DNS:
   ```
   CNAME your-app.onrender.com
   ```

## 💰 Стоимость

| План | Цена | Ресурсы |
|------|------|---------|
| Free | $0 | 512MB RAM, 0.1 CPU |
| Starter | $7/мес | 512MB RAM, 0.5 CPU |
| Standard | $25/мес | 2GB RAM, 1 CPU |

**Рекомендуется:** Starter план для стабильной работы.

## 🔄 Обновление

При пуше в GitHub Render автоматически пересоберёт и задеплоит:

```bash
git add .
git commit -m "Update"
git push
```

## 📝 Примечания

- Free PostgreSQL истекает через 90 дней
- Free сервис "засыпает" через 15 минут неактивности
- Первый запуск может занять 5-10 минут
