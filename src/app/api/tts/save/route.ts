import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// Ensure audio directory exists
const audioDir = path.join(process.cwd(), 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const text = formData.get('text') as string;
    const voice = formData.get('voice') as string || 'default';
    const speed = parseFloat(formData.get('speed') as string) || 1.0;
    const volume = parseFloat(formData.get('volume') as string) || 1.0;

    if (!audioFile || !text) {
      return NextResponse.json(
        { error: 'Аудио файл и текст обязательны' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const filename = `tts_russian_${timestamp}_${randomId}.webm`;
    const outputPath = path.join(audioDir, filename);

    // Save audio file
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));
    fs.writeFileSync(outputPath, buffer);

    // Save to database
    const generation = await db.tTSGeneration.create({
      data: {
        text: text.trim(),
        voice: voice,
        speed: speed,
        volume: volume,
        format: 'webm',
        audioPath: `/audio/${filename}`,
        characterCount: text.trim().length,
      },
    });

    return NextResponse.json({
      success: true,
      audioUrl: `/audio/${filename}`,
      id: generation.id,
      characterCount: text.trim().length,
    });
  } catch (error) {
    console.error('Save Audio API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ошибка сохранения аудио' },
      { status: 500 }
    );
  }
}
