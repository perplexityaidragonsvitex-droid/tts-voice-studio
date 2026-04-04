'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoginScreen } from '@/components/LoginScreen';
import { 
  Play, 
  Pause, 
  Download, 
  Send, 
  Settings, 
  History, 
  Loader2, 
  Volume2, 
  Mic, 
  Trash2,
  Copy,
  Sparkles,
  AlertCircle,
  RefreshCw,
  SkipBack,
  SkipForward,
  LogOut,
  Building2,
  Train,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

// Профессиональные русские голоса для метрополитена
const RUSSIAN_VOICES = [
  // Мужские голоса
  { 
    id: 'dmitry', 
    name: 'Дмитрий', 
    description: 'Мужской голос, информационный', 
    emoji: '👨‍💼',
    gender: 'male',
    neural: true,
    quality: 'premium',
    styles: ['neutral', 'cheerful', 'sad']
  },
  { 
    id: 'dmitry_advanced', 
    name: 'Дмитрий Pro', 
    description: 'Мужской голос, расширенный', 
    emoji: '🎙️',
    gender: 'male',
    neural: true,
    quality: 'premium',
    styles: ['neutral', 'cheerful', 'sad', 'angry', 'fearful', 'serious', 'affectionate']
  },
  // Женские голоса
  { 
    id: 'svetlana', 
    name: 'Светлана', 
    description: 'Женский голос, информационный', 
    emoji: '👩‍💼',
    gender: 'female',
    neural: true,
    quality: 'premium',
    styles: ['neutral', 'cheerful', 'sad']
  },
  { 
    id: 'svetlana_advanced', 
    name: 'Светлана Pro', 
    description: 'Женский голос, расширенный', 
    emoji: '🎤',
    gender: 'female',
    neural: true,
    quality: 'premium',
    styles: ['neutral', 'cheerful', 'sad', 'angry', 'fearful', 'serious', 'affectionate']
  },
  // Дополнительные голоса
  {
    id: 'oleg',
    name: 'Олег',
    description: 'Мужской голос, официальный',
    emoji: '🧔',
    gender: 'male',
    neural: true,
    quality: 'standard',
    styles: ['neutral', 'happy', 'sad']
  },
  {
    id: 'alena',
    name: 'Алёна',
    description: 'Женский голос, спокойный',
    emoji: '👩',
    gender: 'female',
    neural: true,
    quality: 'standard',
    styles: ['neutral', 'happy', 'sad']
  },
  {
    id: 'filipp',
    name: 'Филипп',
    description: 'Мужской голос, дикторский',
    emoji: '🎩',
    gender: 'male',
    neural: true,
    quality: 'standard',
    styles: ['neutral']
  },
];

// Эмоции для голосов
const EMOTIONS = [
  { id: 'neutral', name: 'Нейтральный', emoji: '😐', description: 'Спокойное произношение' },
  { id: 'cheerful', name: 'Весёлый', emoji: '😊', description: 'Позитивная интонация' },
  { id: 'sad', name: 'Грустный', emoji: '😢', description: 'Печальная интонация' },
  { id: 'angry', name: 'Злой', emoji: '😠', description: 'Агрессивная интонация' },
  { id: 'fearful', name: 'Испуганный', emoji: '😨', description: 'Тревожная интонация' },
  { id: 'serious', name: 'Серьёзный', emoji: '🧐', description: 'Деловая интонация' },
  { id: 'affectionate', name: 'Нежный', emoji: '🥰', description: 'Тёплая интонация' },
  { id: 'calm', name: 'Спокойный', emoji: '😌', description: 'Размеренное произношение' },
  { id: 'professional', name: 'Профессиональный', emoji: '💼', description: 'Дикторский стиль' },
];

interface Generation {
  id: string;
  text: string;
  voice: string;
  speed: number;
  volume: number;
  audioPath: string | null;
  characterCount: number;
  createdAt: string;
}

// Форматирование времени
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Форматирование даты
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function TTSStudio() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('svetlana');
  const [selectedEmotion, setSelectedEmotion] = useState('neutral');
  const [speed, setSpeed] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory] = useState<Generation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
  
// Состояние аудиоплеера
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);
const [audioStats, setAudioStats] = useState<any>(null);
const isSeeking = useRef(false);
  
  // Telegram settings
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [telegramConfigured, setTelegramConfigured] = useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Получить доступные эмоции для выбранного голоса
  const availableEmotions = RUSSIAN_VOICES.find(v => v.id === selectedVoice)?.styles || ['neutral'];
  
  // Фильтрованные голоса
  const filteredVoices = RUSSIAN_VOICES.filter(v => 
    filterGender === 'all' || v.gender === filterGender
  );

  // Check authentication
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth');
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  // Check TTS service status
  const checkServiceStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/tts/generate', { method: 'GET' });
      setServiceStatus(response.ok ? 'online' : 'offline');
    } catch {
      setServiceStatus('offline');
    }
  }, []);

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      setIsAuthenticated(false);
      toast.success('Вы вышли из системы');
    } catch {
      toast.error('Ошибка при выходе');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Load history on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated === true) {
      loadHistory();
      loadTelegramConfig();
      checkServiceStatus();
    }
  }, [isAuthenticated, checkServiceStatus]);

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/tts/history?limit=20');
      const data = await response.json();
      setHistory(data.generations || []);
    } catch {
      console.error('Failed to load history');
    }
  };

  const loadTelegramConfig = async () => {
    try {
      const response = await fetch('/api/telegram/config');
      const data = await response.json();
      if (data.config) {
        setTelegramConfigured(true);
        setChatId(data.config.chatId);
      }
    } catch {
      console.error('Failed to load telegram config');
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('Введите текст для синтеза');
      return;
    }

    if (serviceStatus === 'offline') {
      toast.error('Сервис синтеза речи недоступен');
      return;
    }

    setIsGenerating(true);
    try {
      const rateStr = speed === 0 ? '+0%' : (speed > 0 ? `+${speed}%` : `${speed}%`);

      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voice: selectedVoice,
          rate: rateStr,
          style: selectedEmotion,
          emotion: selectedEmotion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка генерации');
      }

      setAudioUrl(data.audioUrl);
      setAudioStats(data.audioStats || null);
      setCurrentTime(0);
      setDuration(0);
      
      const voiceInfo = RUSSIAN_VOICES.find(v => v.id === selectedVoice);
      const emotionInfo = EMOTIONS.find(e => e.id === selectedEmotion);
      toast.success(`Аудио готово! Голос: ${voiceInfo?.name}`);
      loadHistory();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка генерации');
    } finally {
      setIsGenerating(false);
    }
  };

  // Обработчики аудиоплеера
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

const handleTimeUpdate = () => {
  if (!audioRef.current || isSeeking.current) return;
  setCurrentTime(audioRef.current.currentTime);
};

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
  if (!progressRef.current || !audioRef.current) return;

  const audioDuration = audioRef.current.duration || duration;
  if (audioDuration === 0) return;

  isSeeking.current = true;
  
  const rect = progressRef.current.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  const newTime = Math.max(0, Math.min(audioDuration, percent * audioDuration));

  audioRef.current.currentTime = newTime;
  setCurrentTime(newTime);
  
  isSeeking.current = false;
};

const handleSkipBack = () => {
  if (!audioRef.current) return;
  const wasPlaying = !audioRef.current.paused;
  const newTime = Math.max(0, audioRef.current.currentTime - 10);
  audioRef.current.currentTime = newTime;
  setCurrentTime(newTime);
  if (!wasPlaying) audioRef.current.pause();
};

const handleSkipForward = () => {
  if (!audioRef.current) return;
  const wasPlaying = !audioRef.current.paused;
  const newTime = Math.min(audioRef.current.duration || duration, audioRef.current.currentTime + 10);
  audioRef.current.currentTime = newTime;
  setCurrentTime(newTime);
  if (!wasPlaying) audioRef.current.pause();
};

  const handleDownload = () => {
    if (!audioUrl) return;
    
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `metro_announcement_${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Аудио скачано');
  };

  const handleSendToTelegram = async () => {
    if (!audioUrl) return;
    
    setIsSendingTelegram(true);
    try {
      const response = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl,
          caption: `🚇 <b>ГУП Петербургский метрополитен</b>\n📢 Служба пассажирских сервисов\n🎤 Голос: ${RUSSIAN_VOICES.find(v => v.id === selectedVoice)?.name}\n📝 ${text.substring(0, 60)}...`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка отправки');
      }

      toast.success('Аудио отправлено в Telegram!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка отправки в Telegram');
    } finally {
      setIsSendingTelegram(false);
    }
  };

  const handleSaveTelegramConfig = async () => {
    if (!botToken || !chatId) {
      toast.error('Заполните все поля');
      return;
    }

    try {
      const response = await fetch('/api/telegram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken, chatId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка сохранения');
      }

      setTelegramConfigured(true);
      setShowSettings(false);
      toast.success('Telegram настроен!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка сохранения настроек');
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      await fetch(`/api/tts/history?id=${id}`, { method: 'DELETE' });
      setHistory(prev => prev.filter(h => h.id !== id));
      toast.success('Запись удалена');
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  const handlePlayFromHistory = (item: Generation) => {
    if (item.audioPath) {
      setAudioUrl(item.audioPath);
      setText(item.text);
      setSelectedVoice(item.voice);
      setCurrentTime(0);
    }
  };

  const handleCopyText = async (textToCopy: string, id: string) => {
    await navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Текст скопирован');
  };

  const charCount = text.length;
  const maxChars = 5000;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0d1f3c] to-[#0a1628] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img 
            src="/metro-logo.png" 
            alt="Петербургский метрополитен" 
            className="w-16 h-16 object-contain"
          />
          <Loader2 className="w-8 h-8 text-[#0066cc] animate-spin" />
          <p className="text-slate-400 text-sm">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0d1f3c] to-[#0a1628] text-white flex flex-col">
      {/* Audio Element */}
      {audioUrl && (
<audio
  ref={audioRef}
  src={audioUrl}
  onEnded={() => setIsPlaying(false)}
  onPlay={() => setIsPlaying(true)}
  onPause={() => setIsPlaying(false)}
  onTimeUpdate={handleTimeUpdate}
  onLoadedMetadata={handleLoadedMetadata}
  onSeeked={() => { isSeeking.current = false; }}
  onSeeking={() => { isSeeking.current = true; }}
/>
      )}

      {/* Header */}
      <header className="border-b border-[#0066cc]/30 bg-[#0a1628]/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="/metro-logo.png" 
                  alt="Петербургский метрополитен" 
                  className="w-12 h-12 object-contain"
                />
                <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0a1628] ${
                  serviceStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 
                  serviceStatus === 'offline' ? 'bg-red-500' : 'bg-amber-500'
                }`} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white flex items-center gap-2">
                  СПС Голосовая Студия
                </h1>
                <p className="text-xs text-[#0066cc]/80">Петербургский метрополитен • Служба пассажирских сервисов</p>
                <p className="text-[10px] text-slate-400 italic mt-0.5">Объединяем город, сближаем людей</p>
              </div>
            </div>
            
            {/* Status & Actions */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-blue-500/50 text-blue-300 bg-blue-500/10">
                <Train className="w-3 h-3 mr-1" />
                ГУП
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={checkServiceStatus}
                className="text-slate-300 hover:text-white hover:bg-white/10"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${serviceStatus === 'checking' ? 'animate-spin' : ''}`} />
                {serviceStatus === 'online' ? 'Онлайн' : serviceStatus === 'offline' ? 'Офлайн' : 'Проверка...'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(true)}
                className="text-slate-300 hover:text-white hover:bg-white/10"
              >
                <History className="w-4 h-4 mr-2" />
                История
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="text-slate-300 hover:text-white hover:bg-white/10"
              >
                <Settings className="w-4 h-4 mr-2" />
                Настройки
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Service Status Alert */}
      {serviceStatus === 'offline' && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Сервис синтеза речи недоступен.</strong> Обратитесь к администратору.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Text Input Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-[#0d1f3c]/60 border-[#0066cc]/20 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Mic className="w-5 h-5 text-[#0066cc]" />
                  Текст для озвучивания
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Введите текст объявления для синтеза речи
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="relative">
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Введите текст объявления...

Например: Уважаемые пассажиры! Поезд следует до станции «Площадь Восстания». Просьба освободить двери для выхода."
                    className="min-h-[160px] bg-[#0a1628]/80 border-[#1a3a5c] text-white placeholder:text-slate-500 focus:border-[#0066cc] focus:ring-[#0066cc]/20 resize-none text-base leading-relaxed"
                    maxLength={maxChars}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-slate-500">
                    {charCount} / {maxChars}
                  </div>
                </div>

                {/* Voice Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300 flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="w-4 h-4 text-[#0066cc]" />
                      Выберите голос
                    </Label>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant={filterGender === 'all' ? 'default' : 'ghost'}
                        onClick={() => setFilterGender('all')}
                        className={`h-7 text-xs ${filterGender === 'all' ? 'bg-[#0066cc] hover:bg-[#0055aa]' : 'text-slate-400'}`}
                      >
                        Все
                      </Button>
                      <Button
                        size="sm"
                        variant={filterGender === 'male' ? 'default' : 'ghost'}
                        onClick={() => setFilterGender('male')}
                        className={`h-7 text-xs ${filterGender === 'male' ? 'bg-[#0066cc] hover:bg-[#0055aa]' : 'text-slate-400'}`}
                      >
                        👨 Мужские
                      </Button>
                      <Button
                        size="sm"
                        variant={filterGender === 'female' ? 'default' : 'ghost'}
                        onClick={() => setFilterGender('female')}
                        className={`h-7 text-xs ${filterGender === 'female' ? 'bg-[#0066cc] hover:bg-[#0055aa]' : 'text-slate-400'}`}
                      >
                        👩 Женские
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {filteredVoices.map((voice) => (
                      <Button
                        key={voice.id}
                        variant={selectedVoice === voice.id ? 'default' : 'outline'}
                        onClick={() => {
                          setSelectedVoice(voice.id);
                          if (!voice.styles.includes(selectedEmotion)) {
                            setSelectedEmotion('neutral');
                          }
                        }}
                        className={`h-auto py-3 px-3 flex flex-col items-start gap-0.5 ${
                          selectedVoice === voice.id
                            ? 'bg-[#0066cc] hover:bg-[#0055aa] border-[#0066cc] shadow-lg shadow-[#0066cc]/25'
                            : 'bg-[#0a1628]/80 border-[#1a3a5c] hover:bg-[#0d1f3c] text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-xl">{voice.emoji}</span>
                          <div className="flex-1 text-left">
                            <span className="text-sm font-semibold block">{voice.name}</span>
                            <span className="text-[11px] opacity-70 line-clamp-1">{voice.description}</span>
                          </div>
                        </div>
                        {voice.quality === 'premium' && (
                          <Badge variant="secondary" className="bg-[#0066cc]/20 text-[#4da6ff] text-[10px] px-1.5 py-0 mt-1">
                            Pro
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Emotion Selection */}
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2 text-sm">
                    <span>🎭</span>
                    Интонация
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {EMOTIONS.filter(e => availableEmotions.includes(e.id)).map((emotion) => (
                      <Button
                        key={emotion.id}
                        size="sm"
                        variant={selectedEmotion === emotion.id ? 'default' : 'outline'}
                        onClick={() => setSelectedEmotion(emotion.id)}
                        className={`h-8 text-xs ${
                          selectedEmotion === emotion.id
                            ? 'bg-[#0077dd] hover:bg-[#0066cc] border-[#0077dd]'
                            : 'bg-[#0a1628]/80 border-[#1a3a5c] hover:bg-[#0d1f3c] text-slate-300'
                        }`}
                      >
                        <span className="mr-1">{emotion.emoji}</span>
                        {emotion.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Speed Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300 text-sm">Скорость речи</Label>
                    <Badge variant="outline" className="border-[#0066cc]/50 text-[#4da6ff] text-xs">
                      {speed === 0 ? 'Норма' : `${speed > 0 ? '+' : ''}${speed}%`}
                    </Badge>
                  </div>
                  <Slider
                    value={[speed]}
                    onValueChange={([v]) => setSpeed(v)}
                    min={-50}
                    max={100}
                    step={10}
                    className="[&_[role=slider]]:bg-[#0066cc]"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Медленно</span>
                    <span>Норма</span>
                    <span>Быстро</span>
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !text.trim() || serviceStatus === 'offline'}
                  className="w-full h-12 bg-[#0066cc] hover:bg-[#0055aa] text-white font-semibold text-base shadow-lg shadow-[#0066cc]/25 transition-all"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Генерация аудио...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Сгенерировать объявление
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Audio Player */}
            {audioUrl && (
              <Card className="bg-[#0d1f3c]/60 border-[#0066cc]/20 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Volume2 className="w-5 h-5 text-[#0066cc]" />
                    Прослушивание
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    MP3 • 44100 Гц • Стандарт АИ-22
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div 
                      ref={progressRef}
                      className="relative h-2 bg-[#1a3a5c] rounded-full cursor-pointer group"
                      onClick={handleProgressClick}
                    >
                      <div 
                        className="absolute h-full bg-[#0066cc] rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ left: `calc(${progress}% - 8px)` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                  
                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleSkipBack}
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      onClick={handlePlayPause}
                      size="lg"
                      className={`w-12 h-12 rounded-full ${
                        isPlaying
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-[#0066cc] hover:bg-[#0055aa]'
                      }`}
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </Button>
                    
                    <Button
                      onClick={handleSkipForward}
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                    
                    <Separator orientation="vertical" className="h-8 bg-[#1a3a5c] mx-2" />
                    
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      size="sm"
                      className="border-[#1a3a5c] text-slate-300 hover:bg-[#0d1f3c]"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Скачать
                    </Button>
                    
                    <Button
                      onClick={handleSendToTelegram}
                      disabled={!telegramConfigured || isSendingTelegram}
                      variant="outline"
                      size="sm"
                      className={`${
                        telegramConfigured
                          ? 'border-[#0066cc]/50 text-[#4da6ff] hover:bg-[#0066cc]/20'
                          : 'border-[#1a3a5c] text-slate-500'
                      }`}
                    >
                      {isSendingTelegram ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Telegram
                    </Button>
                  </div>
                  
                  {/* Audio Stats */}
                  {audioStats && (
                    <div className="grid grid-cols-4 gap-2 pt-2">
                      <div className="text-center p-2 rounded bg-slate-900/50">
                        <p className="text-[10px] text-slate-500">Формат</p>
                        <p className="text-xs font-medium">{audioStats.format}</p>
                      </div>
                      <div className="text-center p-2 rounded bg-slate-900/50">
                        <p className="text-[10px] text-slate-500">Частота</p>
                        <p className="text-xs font-medium">{audioStats.sample_rate} Гц</p>
                      </div>
                      <div className="text-center p-2 rounded bg-slate-900/50">
                        <p className="text-[10px] text-slate-500">Битрейт</p>
                        <p className="text-xs font-medium">{audioStats.bitrate}</p>
                      </div>
                      <div className="text-center p-2 rounded bg-[#0a1628]/80">
                        <p className="text-[10px] text-slate-500">LUFS</p>
                        <p className="text-xs font-medium">{audioStats.lufs_target}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Organization Card */}
            <Card className="bg-[#0d1f3c]/60 border-[#0066cc]/20 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#0066cc]" />
                  Информация
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Организация:</span>
                  <Badge variant="outline" className="border-[#0066cc]/50 text-[#4da6ff] text-xs">
                    ГУП
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Подразделение:</span>
                  <span className="text-xs text-white">Пассажирские сервисы</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Стандарт:</span>
                  <Badge variant="outline" className="border-emerald-500/50 text-emerald-300 text-xs">
                    АИ-22
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Standard Info */}
            <Card className="bg-[#0d1f3c]/60 border-[#0066cc]/20 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Стандарт АИ-22</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Формат:</span>
                  <Badge variant="outline" className="border-[#0066cc]/50 text-[#4da6ff] text-[10px]">MP3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Частота:</span>
                  <Badge variant="outline" className="border-cyan-500/50 text-cyan-300 text-[10px]">44100 Гц</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Битрейт:</span>
                  <Badge variant="outline" className="border-emerald-500/50 text-emerald-300 text-[10px]">128k CBR</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">LUFS:</span>
                  <Badge variant="outline" className="border-amber-500/50 text-amber-300 text-[10px]">-23 ±0.5</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Каналы:</span>
                  <Badge variant="outline" className="border-slate-500/50 text-slate-300 text-[10px]">Моно</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent History */}
            {history.length > 0 && (
              <Card className="bg-[#0d1f3c]/60 border-[#0066cc]/20 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#0066cc]" />
                    Последние
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-40">
                    <div className="space-y-2">
                      {history.slice(0, 5).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handlePlayFromHistory(item)}
                          className="w-full text-left p-2 rounded-lg bg-[#0a1628]/80 hover:bg-[#1a3a5c]/50 transition-colors group"
                        >
                          <p className="text-xs text-slate-300 truncate group-hover:text-white transition-colors">
                            {item.text.substring(0, 45)}...
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-[#4da6ff]">
                              {RUSSIAN_VOICES.find(v => v.id === item.voice)?.name || item.voice}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#0066cc]/20 bg-[#0a1628]/95 backdrop-blur-xl py-3 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <img 
              src="/metro-logo.png" 
              alt="М" 
              className="w-5 h-5 object-contain"
            />
            <span>ГУП «Петербургский метрополитен» • Служба пассажирских сервисов</span>
          </div>
          <span>СПС Студия v2.1</span>
        </div>
      </footer>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              История генераций
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Последние сгенерированные объявления
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>История пуста</p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-slate-300 flex-1">{item.text}</p>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyText(item.text, item.id)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-white"
                        >
                          {copiedId === item.id ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePlayFromHistory(item)}
                          className="h-7 w-7 p-0 text-blue-400 hover:text-blue-300"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteHistory(item.id)}
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="text-blue-400">
                        {RUSSIAN_VOICES.find(v => v.id === item.voice)?.name || item.voice}
                      </span>
                      <span>{item.characterCount} символов</span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" />
              Настройки Telegram
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Настройте отправку аудио в Telegram-бот
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Bot Token</Label>
              <Input
                type="password"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="123456:ABC-DEF..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">Chat ID</Label>
              <Input
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="-1001234567890"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            
            {telegramConfigured && (
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Telegram настроен
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              onClick={handleSaveTelegramConfig}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
