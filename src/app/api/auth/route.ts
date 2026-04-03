import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { registerSession, removeSession, activeSessions } from '@/lib/auth-middleware';

const SESSION_COOKIE_NAME = 'tts_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getValidPasswords(): string[] {
  const password = process.env.APP_PASSWORD;
  if (!password) {
    console.warn('APP_PASSWORD not set, using default');
    return ['metro2024'];
  }
  return password.split(',').map(p => p.trim()).filter(Boolean);
}

function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

function isValidSession(token: string): boolean {
  const session = activeSessions.get(token);
  if (!session) return false;
  
  const now = Date.now();
  const age = now - session.createdAt;
  if (age > SESSION_MAX_AGE * 1000) {
    activeSessions.delete(token);
    return false;
  }
  return true;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    if (sessionToken && isValidSession(sessionToken)) {
      return NextResponse.json({ authenticated: true });
    }
    
    // Авто-вход: создаём новую сессию автоматически
    const newToken = generateSessionToken();
    registerSession(newToken);
    
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(SESSION_COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });
    
    return response;
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;
    
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Введите пароль' },
        { status: 400 }
      );
    }
    
    const validPasswords = getValidPasswords();
    if (!validPasswords.includes(password)) {
      return NextResponse.json(
        { error: 'Неверный пароль' },
        { status: 401 }
      );
    }
    
    const sessionToken = generateSessionToken();
    registerSession(sessionToken);
    
    const response = NextResponse.json({ 
      success: true, 
      message: 'Успешный вход' 
    });
    
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Ошибка авторизации' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    if (sessionToken) {
      removeSession(sessionToken);
    }
    
    const response = NextResponse.json({ 
      success: true, 
      message: 'Вы вышли из системы' 
    });
    
    response.cookies.delete(SESSION_COOKIE_NAME);
    
    return response;
  } catch {
    return NextResponse.json({ success: true });
  }
}
