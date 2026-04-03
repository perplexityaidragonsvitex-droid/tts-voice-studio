import { NextRequest, NextResponse } from 'next/server';
import { readFile, access } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';

const AUDIO_DIR = process.env.AUDIO_DIR || join(process.cwd(), 'public', 'audio');

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }
    
    // Only allow mp3 files
    if (!filename.endsWith('.mp3')) {
      return NextResponse.json({ error: 'Only MP3 files allowed' }, { status: 400 });
    }
    
    const filePath = join(AUDIO_DIR, filename);
    
    // Check if file exists
    try {
      await access(filePath, constants.R_OK);
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    const fileBuffer = await readFile(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000',
        'Content-Length': String(fileBuffer.length),
      },
    });
  } catch (error) {
    console.error('Audio serve error:', error);
    return NextResponse.json(
      { error: 'Failed to serve audio' },
      { status: 500 }
    );
  }
}
