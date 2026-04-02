import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

const TTS_SERVICE_URL = process.env.TTS_SERVICE_URL || 'http://localhost:3031';

function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return `tts:${ip}`;
}

export async function POST(req: NextRequest) {
  const identifier = getClientIdentifier(req);
  const rateLimit = checkRateLimit(identifier);
  
  if (!rateLimit.allowed) {
    const headers = getRateLimitHeaders(0, rateLimit.resetAt);
    headers.set('Retry-After', String(rateLimit.retryAfter));
    
    return NextResponse.json(
      { error: 'Слишком много запросов. Попробуйте позже.' },
      { status: 429, headers }
    );
  }
  
  const headers = getRateLimitHeaders(rateLimit.remaining, rateLimit.resetAt);
  
  try {
    const body = await req.json();
    const { text, voice = 'dmitry', rate = '+0%', pitch = '+0Hz', style = 'neutral', emotion = 'neutral' } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Текст не может быть пустым' },
        { status: 400, headers }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Максимум 5000 символов' },
        { status: 400, headers }
      );
    }

    const rateMatch = rate.match(/^[+-]?\d+%$/);
    if (!rateMatch) {
      return NextResponse.json(
        { error: 'Неверный формат скорости' },
        { status: 400, headers }
      );
    }

    try {
      const ttsResponse = await fetch(`${TTS_SERVICE_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voice,
          rate,
          pitch,
          style: style || emotion,
        }),
      });

      const ttsData = await ttsResponse.json();

      if (!ttsResponse.ok) {
        return NextResponse.json(
          { error: ttsData.error || 'Ошибка TTS сервиса' },
          { status: ttsResponse.status, headers }
        );
      }

      const generation = await db.tTSGeneration.create({
        data: {
          text: text.trim(),
          voice: voice,
          speed: parseFloat(rate.replace('%', '').replace('+', '')) || 0,
          volume: 1.0,
          format: 'mp3',
          audioPath: ttsData.audioUrl,
          characterCount: text.trim().length,
        },
      });

      return NextResponse.json({
        success: true,
        audioUrl: ttsData.audioUrl,
        id: generation.id,
        characterCount: text.trim().length,
        voice: ttsData.voiceName,
        engine: ttsData.engine || 'Microsoft Edge Neural TTS',
        audioStats: ttsData.audioStats,
      }, { headers });
    } catch (fetchError) {
      console.error('TTS Service Error:', fetchError);
      return NextResponse.json(
        { error: 'TTS сервис недоступен. Запустите mini-services/tts-service' },
        { status: 503, headers }
      );
    }
  } catch (error) {
    console.error('TTS API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ошибка генерации речи' },
      { status: 500, headers }
    );
  }
}

export async function GET() {
  try {
    const response = await fetch(`${TTS_SERVICE_URL}/voices`);
    const data = await response.json();

    return NextResponse.json({
      voices: data.voices || [],
      styles: data.styles || {},
      engine: 'Microsoft Edge Neural TTS + FFmpeg',
      quality: 'premium',
      standard: 'АИ-22'
    });
  } catch {
    return NextResponse.json({
      voices: [],
      error: 'TTS сервис недоступен'
    });
  }
}
