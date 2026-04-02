import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const config = await db.telegramConfig.findFirst({
      where: { isActive: true },
    });

    return NextResponse.json({
      config: config ? {
        id: config.id,
        hasBotToken: !!config.botToken,
        chatId: config.chatId,
        isActive: config.isActive,
      } : null,
    });
  } catch (error) {
    console.error('Telegram Config GET Error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения конфигурации' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { botToken, chatId } = body;

    if (!botToken || !chatId) {
      return NextResponse.json(
        { error: 'Bot Token и Chat ID обязательны' },
        { status: 400 }
      );
    }

    // Deactivate all existing configs
    await db.telegramConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new config
    const config = await db.telegramConfig.create({
      data: {
        botToken,
        chatId,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        hasBotToken: !!config.botToken,
        chatId: config.chatId,
        isActive: config.isActive,
      },
    });
  } catch (error) {
    console.error('Telegram Config POST Error:', error);
    return NextResponse.json(
      { error: 'Ошибка сохранения конфигурации' },
      { status: 500 }
    );
  }
}
