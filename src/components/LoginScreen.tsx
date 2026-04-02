'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, Loader2, Eye, EyeOff, Shield, Train } from 'lucide-react';
import { toast } from 'sonner';

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error('Введите пароль');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка входа');
      }

      toast.success('Добро пожаловать!');
      onLogin();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0d1f3c] to-[#0a1628] flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#0066cc] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#004499] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#0066cc] rounded-full mix-blend-multiply filter blur-3xl opacity-10" />
      </div>

      <Card className="w-full max-w-md bg-[#0d1f3c]/80 border-[#0066cc]/30 backdrop-blur-xl relative z-10">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center">
            <img 
              src="/metro-logo.png" 
              alt="Петербургский метрополитен" 
              className="w-20 h-20 object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-white flex items-center justify-center gap-2">
              СПС Голосовая Студия
            </CardTitle>
            <CardDescription className="text-[#4da6ff]/80 mt-2">
              Петербургский метрополитен • Служба пассажирских сервисов
            </CardDescription>
            <p className="text-[10px] text-slate-400 text-center italic mt-2">
              Объединяем город, сближаем людей
            </p>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2 text-sm">
                <Lock className="w-4 h-4 text-[#0066cc]" />
                Пароль для доступа
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  className="bg-[#0a1628]/80 border-[#1a3a5c] text-white placeholder:text-slate-500 focus:border-[#0066cc] focus:ring-[#0066cc]/20 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full h-12 bg-[#0066cc] hover:bg-[#0055aa] text-white font-semibold shadow-lg shadow-[#0066cc]/25"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Проверка...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Войти
                </>
              )}
            </Button>

            <div className="text-center text-xs text-slate-500 space-y-2">
              <p className="flex items-center justify-center gap-1.5">
                <Train className="w-3 h-3" />
                Система синтеза речевых объявлений
              </p>
              <div className="flex items-center justify-center gap-2 text-slate-600">
                <Shield className="w-3 h-3" />
                <span>Стандарт АИ-22</span>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Footer */}
      <div className="absolute bottom-4 text-center text-xs text-slate-600">
        <p>ГУП «Петербургский метрополитен»</p>
      </div>
    </div>
  );
}
