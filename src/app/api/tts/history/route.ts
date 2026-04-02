import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const generations = await db.tTSGeneration.findMany({
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await db.tTSGeneration.count();

    return NextResponse.json({
      generations,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('History API Error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения истории' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID обязателен' },
        { status: 400 }
      );
    }

    // Get the generation to find audio file
    const generation = await db.tTSGeneration.findUnique({
      where: { id },
    });

    if (!generation) {
      return NextResponse.json(
        { error: 'Запись не найдена' },
        { status: 404 }
      );
    }

    // Delete audio file if exists
    if (generation.audioPath) {
      const audioPath = path.join(process.cwd(), 'public', generation.audioPath);
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    }

    // Delete from database
    await db.tTSGeneration.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete API Error:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления' },
      { status: 500 }
    );
  }
}
