import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'tts_session';

const activeSessions: Map<string, { createdAt: number }> = 
  (globalThis as unknown as { _sessions: Map<string, { createdAt: number }> })._sessions 
  || ((globalThis as unknown as { _sessions: Map<string, { createdAt: number }> })._sessions = new Map());

function isValidSession(token: string): boolean {
  const session = activeSessions.get(token);
  if (!session) return false;
  
  const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
  const now = Date.now();
  const age = now - session.createdAt;
  
  if (age > SESSION_MAX_AGE * 1000) {
    activeSessions.delete(token);
    return false;
  }
  return true;
}

export function withAuth(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    
    if (!sessionToken || !isValidSession(sessionToken)) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }
    
    return handler(req);
  };
}

export function registerSession(token: string): void {
  activeSessions.set(token, { createdAt: Date.now() });
}

export function removeSession(token: string): void {
  activeSessions.delete(token);
}

export { activeSessions };
