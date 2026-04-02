# AGENTS.md

## Описание проекта

СПС Голосовая Студия — профессиональное веб-приложение для синтеза речевых объявлений Петербургского метрополитена. Генерирует аудио по вещательному стандарту АИ-22 (MP3, 44100 Гц, 128k CBR, моно, LUFS -23).

## Команды сборки/линтера/тестов

### Разработка

```bash
bun run dev              # Запуск Next.js dev сервера (порт 3000)
bun run build            # Сборка для продакшена (standalone)
bun run start            # Запуск продакшен сервера
bun run lint             # Запуск ESLint
```

### База данных (Prisma)

```bash
bun run db:push          # Применить схему к базе
bun run db:generate      # Сгенерировать Prisma клиент
bun run db:migrate       # Выполнить миграции
bun run db:reset         # Сбросить базу данных
```

### Python TTS сервис

```bash
# Запуск TTS сервиса (терминал 1)
cd mini-services/tts-service
python3 index.py         # Запускается на порту 3031

# Проверка состояния
curl http://localhost:3031/health
```

### Тестирование

Тесты не настроены. Ручное тестирование:
- Браузер: `http://localhost:3000`
- API через curl/Postman

## Стиль кода

### TypeScript/React

#### Импорты

```typescript
// 1. Импорты React
import { useState, useEffect, useCallback } from 'react';

// 2. Сторонние библиотеки
import { NextRequest, NextResponse } from 'next/server';
import { toast } from 'sonner';

// 3. UI компоненты (через алиас @/)
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// 4. Иконки (lucide-react)
import { Play, Pause, Download } from 'lucide-react';

// 5. Локальные модули
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';
```

#### Структура файлов

- `'use client';` в начале клиентских компонентов
- Export default для страниц
- Named exports для переиспользуемых компонентов
- Интерфейсы до компонента

#### Именование

| Тип | Стиль | Пример |
|-----|-------|--------|
| Компоненты | PascalCase | `LoginScreen`, `TTSStudio` |
| Функции | camelCase | `handleGenerate`, `loadHistory` |
| Константы | UPPER_SNAKE или camelCase | `RUSSIAN_VOICES`, `EMOTIONS` |
| Файлы | PascalCase.tsx | `LoginScreen.tsx` |
| API маршруты | lowercase | `route.ts` |
| CSS классы | kebab-case | `bg-[#0066cc]` |

#### Типы TypeScript

```typescript
// Использовать interface для объектов
interface Generation {
  id: string;
  text: string;
  voice: string;
  createdAt: string;
}

// Использовать type для объединений/примитивов
type ServiceStatus = 'checking' | 'online' | 'offline';

// Избегать any, использовать unknown с type guards
const data: unknown = await response.json();
if (isGeneration(data)) { ... }
```

#### Паттерны React

```typescript
// Функциональные компоненты
export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState('');
  
  // useCallback для функций-пропсов
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    // ...
  }, [dependencies]);
  
  return ( ... );
}
```

#### Стилизация

- Tailwind CSS утилиты
- shadcn/ui компоненты из `@/components/ui/`
- Цвета бренда: `#0066cc` (основной), `#0a1628` (тёмный), `#0d1f3c` (фон)
- Использовать `cn()` для условных классов

```typescript
className={cn(
  "базовые-классы",
  condition && "условные-классы"
)}
```

### API маршруты

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Валидация
    if (!body.text) {
      return NextResponse.json(
        { error: 'Текст не может быть пустым' },
        { status: 400 }
      );
    }
    
    // Обработка...
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Ошибка API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ошибка' },
      { status: 500 }
    );
  }
}
```

### Python (TTS сервис)

#### Стиль

- Кодировка UTF-8 с русскими docstring
- Двойные кавычки для строк
- snake_case для функций/переменных
- UPPER_CASE для констант
- Type hints где применимо

```python
def process_with_ffmpeg_ai22(input_path: str, output_path: str) -> dict:
    """
    Обработка аудио через FFmpeg по стандарту АИ-22
    """
    # ...
```

#### Обработка ошибок

```python
try:
    # операция
except Exception as e:
    print(f"❌ Ошибка: {e}")
    import traceback
    traceback.print_exc()
    self.send_json_response({'error': str(e)}, 500)
```

## Структура проекта

```
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── page.tsx      # Главная страница
│   │   ├── layout.tsx    # Корневой layout
│   │   └── api/          # API маршруты
│   ├── components/
│   │   ├── ui/           # shadcn/ui компоненты
│   │   ├── LoginScreen.tsx
│   │   └── PWAInstall.tsx
│   ├── lib/
│   │   ├── db.ts         # Prisma клиент
│   │   └── utils.ts      # cn() helper
│   └── hooks/            # Кастомные хуки
├── mini-services/
│   └── tts-service/      # Python TTS бэкенд
│       └── index.py      # Edge TTS + FFmpeg
├── prisma/
│   └── schema.prisma     # Схема базы данных
├── public/
│   └── audio/            # Сгенерированные аудио
├── package.json
├── tsconfig.json
├── eslint.config.mjs
└── tailwind.config.ts
```

## Ключевые технологии

| Слой | Технология |
|------|------------|
| Frontend | Next.js 16, React 19, TypeScript 5 |
| Стили | Tailwind CSS 4, shadcn/ui |
| Состояние | React hooks, Zustand |
| База данных | Prisma ORM, SQLite |
| TTS | Python, Edge TTS, FFmpeg |
| Менеджер пакетов | Bun |

## ESLint

Проект использует ослабленные правила ESLint. Отключены:
- `@typescript-eslint/no-explicit-any`: off
- `@typescript-eslint/no-unused-vars`: off
- `react-hooks/exhaustive-deps`: off
- `no-console`: off

Приоритет — рабочий код над строгим линтингом.

## Примечания

- Тесты не настроены
- Аутентификация отключена (авто-вход)
- Стандарт аудио: АИ-22 (вещательное качество)
- Основной язык: русский
- Порты: TTS на 3031, Next.js на 3000
