import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { audioUrl, caption } = body;

    if (!audioUrl) {
      return NextResponse.json(
        { error: 'Audio URL обязателен' },
        { status: 400 }
      );
    }

    // Get Telegram config
    const config = await db.telegramConfig.findFirst({
      where: { isActive: true },
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Telegram не настроен. Добавьте Bot Token и Chat ID в настройках.' },
        { status: 400 }
      );
    }

    // Read audio file
    const audioPath = path.join(process.cwd(), 'public', audioUrl);
    if (!fs.existsSync(audioPath)) {
      return NextResponse.json(
        { error: 'Аудио файл не найден' },
        { status: 404 }
      );
    }

    const audioBuffer = fs.readFileSync(audioPath);

    // Send to Telegram as voice message (better for audio)
    const formData = new FormData();
    formData.append('chat_id', config.chatId);
    formData.append('audio', new Blob([audioBuffer], { type: 'audio/mpeg' }), 'voice.mp3');
    formData.append('caption', caption || '🚇 СПС Голосовая Студия — Петербургский метрополитен\nОбъединяем город, сближаем людей');
    formData.append('parse_mode', 'HTML');

    const telegramUrl = `https://api.telegram.org/bot${config.botToken}/sendAudio`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!result.ok) {
      console.error('Telegram API Error:', result);

      // Более понятные сообщения об ошибках
      let errorMessage = result.description || 'Неизвестная ошибка';

      if (result.description?.includes('chat not found')) {
        errorMessage = 'Чат не найден. Убедитесь что: 1) Бот добавлен в чат 2) Вы написали боту /start 3) Chat ID указан верно';
      } else if (result.description?.includes('bot was blocked')) {
        errorMessage = 'Бот заблокирован пользователем. Разблокируйте бота и напишите /start';
      } else if (result.description?.includes('Unauthorized')) {
        errorMessage = 'Неверный Bot Token. Проверьте токен от @BotFather';
      } else if (result.description?.includes('Forbidden')) {
        errorMessage = 'Нет доступа к чату. Добавьте бота в чат или напишите ему /start';
      }

      return NextResponse.json(
        { error: `Ошибка Telegram: ${errorMessage}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.result?.message_id,
    });
  } catch (error) {
    console.error('Telegram Send Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ошибка отправки в Telegram' },
      { status: 500 }
    );
  }
}

// Проверка настроек Telegram
export async function GET() {
  try {
    const config = await db.telegramConfig.findFirst({
      where: { isActive: true },
    });

    if (!config) {
      return NextResponse.json({
        configured: false,
        message: 'Telegram не настроен'
      });
    }

    // Проверяем валидность токена и доступ к чату
    const testUrl = `https://api.telegram.org/bot${config.botToken}/getMe`;
    const testResponse = await fetch(testUrl);
    const testResult = await testResponse.json();

    if (!testResult.ok) {
      return NextResponse.json({
        configured: false,
        message: 'Неверный Bot Token'
      });
    }

    return NextResponse.json({
      configured: true,
      botName: testResult.result?.username,
      chatId: config.chatId
    });
  } catch (error) {
    return NextResponse.json({
      configured: false,
      message: 'Ошибка проверки настроек'
    });
  }
}
