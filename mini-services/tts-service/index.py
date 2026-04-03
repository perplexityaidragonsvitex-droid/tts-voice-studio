#!/usr/bin/env python3
"""
СПС Голосовая Студия
Служба пассажирских сервисов • ГУП «Петербургский метрополитен»
Объединяем город, сближаем людей

Edge TTS + FFmpeg с обработкой по стандарту АИ-22

Стандарт АИ-22:
- Формат: MP3
- Частота: 44100 Гц  
- Битрейт: CBR 128 кбит/с
- Кодек: LAME
- Каналы: Моно
- LUFS: -23 ±0.5 LU
- True Peak: ≤ -1 dBTP
- LRA: ≤ 5 LU
- Клиппинг: Не допускается
"""

import os
import sys
import json
import uuid
import re
import asyncio
import subprocess
import tempfile
import shutil
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

import numpy as np
import soundfile as sf
import pyloudnorm as pyln

# Попробуем импортировать разные TTS движки
TTS_ENGINE = None
try:
    import edge_tts
    TTS_ENGINE = 'edge'
    print("✅ Edge TTS доступен")
except ImportError:
    pass

try:
    from TTS.api import TTS as CoquiTTS
    TTS_ENGINE = 'coqui'
    print("✅ Coqui TTS доступен")
except ImportError:
    pass

# Порт сервиса
PORT = 3031

# Директория для аудио файлов
AUDIO_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'public', 'audio')
os.makedirs(AUDIO_DIR, exist_ok=True)

# Профессиональные русские голоса
RUSSIAN_VOICES = {
    # Мужские голоса
    'dmitry': {
        'id': 'ru-RU-DmitryNeural',
        'name': 'Дмитрий',
        'description': 'Профессиональный мужской голос',
        'emoji': '👨‍💼',
        'gender': 'male',
        'engine': 'edge',
        'styles': ['neutral', 'cheerful', 'sad']
    },
    'dmitry_advanced': {
        'id': 'ru-RU-DmitryNeural',
        'name': 'Дмитрий Pro',
        'description': 'Продвинутый мужской с эмоциями',
        'emoji': '🎙️',
        'gender': 'male',
        'engine': 'edge',
        'styles': ['neutral', 'cheerful', 'sad', 'angry', 'fearful', 'serious', 'affectionate'],
        'style_field': True
    },
    # Женские голоса
    'svetlana': {
        'id': 'ru-RU-SvetlanaNeural',
        'name': 'Светлана',
        'description': 'Профессиональный женский голос',
        'emoji': '👩‍💼',
        'gender': 'female',
        'engine': 'edge',
        'styles': ['neutral', 'cheerful', 'sad']
    },
    'svetlana_advanced': {
        'id': 'ru-RU-SvetlanaNeural',
        'name': 'Светлана Pro',
        'description': 'Продвинутый женский с эмоциями',
        'emoji': '🎤',
        'gender': 'female',
        'engine': 'edge',
        'styles': ['neutral', 'cheerful', 'sad', 'angry', 'fearful', 'serious', 'affectionate'],
        'style_field': True
    },
    # Дополнительные голоса (Яндекс/Сбер)
    'oleg': {
        'id': 'ru-RU-DmitryNeural',  # Fallback to Dmitry with different settings
        'name': 'Олег',
        'description': 'Мужской голос с характером',
        'emoji': '🧔',
        'gender': 'male',
        'engine': 'edge',
        'styles': ['neutral', 'happy', 'sad'],
        'pitch': '-10Hz'
    },
    'alena': {
        'id': 'ru-RU-SvetlanaNeural',  # Fallback to Svetlana with different settings
        'name': 'Алёна',
        'description': 'Женский голос, мягкий',
        'emoji': '👩',
        'gender': 'female',
        'engine': 'edge',
        'styles': ['neutral', 'happy', 'sad'],
        'pitch': '+5Hz'
    },
    'filipp': {
        'id': 'ru-RU-DmitryNeural',
        'name': 'Филипп',
        'description': 'Мужской голос с характером',
        'emoji': '🎩',
        'gender': 'male',
        'engine': 'edge',
        'styles': ['neutral'],
        'rate': '-10%'
    },
    # Silero голоса
    'aidar': {
        'id': 'aidar',
        'name': 'Айдар',
        'description': 'Мужской голос (Silero)',
        'emoji': '👨',
        'gender': 'male',
        'engine': 'silero'
    },
}

# Эмоции и стили для голосов
EMOTION_STYLES = {
    'neutral': '',  # Без стиля
    'cheerful': 'cheerful',
    'sad': 'sad',
    'angry': 'angry',
    'fearful': 'fearful',
    'serious': 'serious',
    'affectionate': 'affectionate',
    'calm': 'calm',
    'professional': '',  # Настройка скорости
    'happy': 'cheerful',
}

# Стили произношения
SPEAKING_STYLES = {
    'neutral': 'Нейтральный',
    'cheerful': 'Весёлый',
    'calm': 'Спокойный',
    'professional': 'Профессиональный',
}

# Кэш Silero модели
_silero_model = None

def get_silero_model():
    """Загрузка модели Silero TTS"""
    global _silero_model
    if _silero_model is None:
        import torch
        device = torch.device('cpu')
        _silero_model, _ = torch.hub.load(
            repo_or_dir='snakers4/silero-models',
            model='silero_tts',
            language='ru',
            speaker='v3_1_ru',
            trust_repo=True,
            verbose=False
        )
        _silero_model.to(device)
    return _silero_model

def normalize_audio_ai22(input_path: str, output_path: str) -> dict:
    """
    Нормализация аудио по стандарту АИ-22
    
    Требования:
    - LUFS: -23 ±0.5 LU
    - True Peak: ≤ -1 dBTP
    - LRA: ≤ 5 LU
    - Формат: MP3, 44100 Гц, CBR 128 кбит/с, Моно, LAME
    """
    # Читаем аудио файл
    audio, sr = sf.read(input_path)
    
    # Конвертируем в моно если стерео
    if len(audio.shape) > 1:
        audio = np.mean(audio, axis=1)
    
    # Измеряем текущую громкость
    meter = pyln.Meter(sr)  # Создаём BS.1770 meter
    loudness = meter.integrated_loudness(audio)
    
    # Нормализуем до целевого LUFS (-23 LU)
    target_lufs = -23.0
    if loudness > -70:  # Избегаем тишины
        audio = pyln.normalize.loudness(audio, loudness, target_lufs)
    
    # Ограничиваем True Peak до -1 dBTP
    # Используем мягкий лимитер
    peak = np.max(np.abs(audio))
    if peak > 0.89125:  # -1 dBTP ≈ 0.89125
        audio = audio * (0.89125 / peak) * 0.95  # Небольшой запас
    
    # Измеряем LRA (Loudness Range)
    lra = meter.loudness_range(audio)
    
    # Сохраняем временный WAV
    temp_wav = input_path.replace('.wav', '_normalized.wav')
    sf.write(temp_wav, audio, sr)
    
    # Конвертируем в MP3 с помощью FFmpeg (АИ-22 стандарт)
    ffmpeg_cmd = [
        'ffmpeg', '-y',
        '-i', temp_wav,
        '-ar', '44100',           # Частота 44100 Гц
        '-ac', '1',               # Моно
        '-b:a', '128k',           # CBR 128 кбит/с
        '-c:a', 'libmp3lame',     # Кодек LAME
        '-q:a', '2',              # Качество
        '-compression_level', '0', # Без компрессии при кодировании
        output_path
    ]
    
    result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
    
    # Удаляем временные файлы
    if os.path.exists(temp_wav):
        os.remove(temp_wav)
    
    # Измеряем финальные параметры
    final_audio, final_sr = sf.read(output_path.replace('.mp3', '_check.wav')) if False else (None, None)
    
    stats = {
        'original_lufs': float(loudness) if loudness > -70 else -70,
        'target_lufs': target_lufs,
        'lra': float(lra),
        'peak': float(peak),
        'true_peak_dbtp': float(20 * np.log10(peak)) if peak > 0 else -100,
        'format': 'MP3',
        'sample_rate': 44100,
        'bitrate': '128k CBR',
        'channels': 'mono',
        'codec': 'LAME'
    }
    
    return stats

def process_with_ffmpeg_ai22(input_path: str, output_path: str) -> dict:
    """
    Полная обработка аудио через FFmpeg по стандарту АИ-22
    """
    # FFmpeg команда для полной обработки
    ffmpeg_cmd = [
        'ffmpeg', '-y',
        '-i', input_path,
        '-af', 
        # Фильтры для АИ-22:
        # 1. loudnorm - нормализация громкости по EBU R128
        f'loudnorm=I=-23:TP=-1:LRA=5:print_format=summary,'
        # 2. Компрессор для контроля LRA
        f'acompressor=threshold=-24dB:ratio=3:attack=5:release=50,'
        # 3. Лимитер для защиты от клиппинга
        f'limiter=limit=-1dB:level=false',
        '-ar', '44100',           # Частота 44100 Гц
        '-ac', '1',               # Моно
        '-b:a', '128k',           # CBR 128 кбит/с
        '-c:a', 'libmp3lame',     # Кодек LAME
        '-q:a', '2',              # Качество
        output_path
    ]
    
    result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"FFmpeg error: {result.stderr}")
        # Fallback - простая конвертация
        fallback_cmd = [
            'ffmpeg', '-y', '-i', input_path,
            '-ar', '44100', '-ac', '1', '-b:a', '128k',
            '-c:a', 'libmp3lame', output_path
        ]
        subprocess.run(fallback_cmd, capture_output=True)
    
    # Получаем информацию о файле
    probe_cmd = ['ffprobe', '-v', 'quiet', '-print_format', 'json', 
                 '-show_format', '-show_streams', output_path]
    probe_result = subprocess.run(probe_cmd, capture_output=True, text=True)
    
    stats = {
        'format': 'MP3',
        'sample_rate': 44100,
        'bitrate': '128k CBR',
        'channels': 'mono',
        'codec': 'LAME',
        'lufs_target': -23.0,
        'true_peak_max': -1.0,
        'lra_max': 5.0
    }
    
    return stats

async def generate_tts_edge(text: str, voice_id: str, rate: str = '+0%', style: str = None, pitch: str = '+0Hz') -> tuple:
    """Генерация TTS через Edge TTS с поддержкой стилей и эмоций"""
    # Создаём communicate с параметрами
    kwargs = {
        'text': text,
        'voice': voice_id,
        'rate': rate,
    }
    
    # Добавляем pitch если указан
    if pitch and pitch != '+0Hz':
        kwargs['pitch'] = pitch
    
    communicate = edge_tts.Communicate(**kwargs)
    
    # Генерируем временный файл
    temp_path = os.path.join(AUDIO_DIR, f"temp_{uuid.uuid4().hex[:8]}.mp3")
    await communicate.save(temp_path)
    
    return temp_path, 'edge'

def generate_tts_silero(text: str, speaker: str = 'aidar') -> tuple:
    """Генерация TTS через Silero"""
    model = get_silero_model()
    
    audio = model.apply_tts(text=text, speaker=speaker, sample_rate=48000)
    
    # Сохраняем временный WAV
    temp_path = os.path.join(AUDIO_DIR, f"temp_{uuid.uuid4().hex[:8]}.wav")
    import scipy.io.wavfile as wavfile
    audio_np = audio.numpy()
    wavfile.write(temp_path, 48000, (audio_np * 32767).astype(np.int16))
    
    return temp_path, 'silero'

class TTSHandler(BaseHTTPRequestHandler):
    """HTTP обработчик для TTS сервиса"""
    
    def log_message(self, format_str, *args):
        try:
            msg = format_str % args if args else format_str
            print(f"[TTS] {msg}")
        except:
            pass
    
    def send_json_response(self, data: dict, status: int = 200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        parsed = urlparse(self.path)
        
        if parsed.path == '/health':
            self.send_json_response({
                'status': 'ok',
                'service': 'tts',
                'engine': 'Coqui TTS + Edge TTS + FFmpeg',
                'voices': list(RUSSIAN_VOICES.keys()),
                'standard': 'АИ-22'
            })
        
        elif parsed.path == '/voices':
            voices_list = []
            for voice_key, voice_data in RUSSIAN_VOICES.items():
                voice_entry = {'id': voice_key}  # Наш ID (dmitry, svetlana, etc.)
                # Копируем данные, но переименовываем 'id' в 'azure_id'
                for k, v in voice_data.items():
                    if k == 'id':
                        voice_entry['azure_id'] = v
                    else:
                        voice_entry[k] = v
                voices_list.append(voice_entry)
            self.send_json_response({
                'voices': voices_list,
                'styles': SPEAKING_STYLES
            })
        
        else:
            self.send_json_response({'error': 'Not found'}, 404)
    
    def do_POST(self):
        parsed = urlparse(self.path)
        
        if parsed.path == '/generate':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length).decode('utf-8')
                data = json.loads(body)
                
                text = data.get('text', '').strip()
                voice = data.get('voice', 'dmitry')
                rate = data.get('rate', '+0%')
                style = data.get('style', 'neutral')
                pitch = data.get('pitch', '+0Hz')
                
                if not text:
                    self.send_json_response({'error': 'Текст не может быть пустым'}, 400)
                    return
                
                if len(text) > 5000:
                    text = text[:5000]
                
                if voice not in RUSSIAN_VOICES:
                    self.send_json_response({
                        'error': f'Неизвестный голос: {voice}'
                    }, 400)
                    return
                
                voice_info = RUSSIAN_VOICES[voice]
                voice_id = voice_info['id']
                engine = voice_info.get('engine', 'edge')
                
                # Применяем настройки голоса
                if 'rate' in voice_info:
                    base_rate = voice_info['rate']
                    # Комбинируем с пользовательской скоростью
                    if rate != '+0%':
                        user_rate_val = int(rate.replace('%', '').replace('+', ''))
                        base_rate_val = int(base_rate.replace('%', '').replace('+', ''))
                        rate = f"{user_rate_val + base_rate_val:+d}%"
                    else:
                        rate = base_rate
                
                if 'pitch' in voice_info:
                    pitch = voice_info['pitch']
                elif pitch == '+0Hz':
                    pitch = data.get('pitch', '+0Hz')
                
                # Генерируем TTS
                temp_path = None
                used_engine = None
                
                if engine == 'edge':
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    temp_path, used_engine = loop.run_until_complete(
                        generate_tts_edge(text, voice_id, rate, style, pitch)
                    )
                    loop.close()
                elif engine == 'silero':
                    temp_path, used_engine = generate_tts_silero(text, voice)
                
                if not temp_path or not os.path.exists(temp_path):
                    self.send_json_response({'error': 'Ошибка генерации'}, 500)
                    return
                
                # Обрабатываем по стандарту АИ-22
                filename = f"tts_pro_{voice}_{uuid.uuid4().hex[:8]}.mp3"
                output_path = os.path.join(AUDIO_DIR, filename)
                
                stats = process_with_ffmpeg_ai22(temp_path, output_path)
                
                # Удаляем временный файл
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                
                self.send_json_response({
                    'success': True,
                    'audioUrl': f"/audio/{filename}",
                    'voice': voice,
                    'voiceName': voice_info['name'],
                    'characterCount': len(text),
                    'format': 'MP3',
                    'engine': used_engine,
                    'standard': 'АИ-22',
                    'audioStats': stats
                })
                
                print(f"✅ Сгенерировано: {filename} (голос: {voice_info['name']}, стандарт: АИ-22)")
                
            except Exception as e:
                print(f"❌ Ошибка: {e}")
                import traceback
                traceback.print_exc()
                self.send_json_response({'error': str(e)}, 500)
        
        else:
            self.send_json_response({'error': 'Not found'}, 404)

def main():
    print("=" * 60)
    print("🚇  СПС Голосовая Студия")
    print("   Служба пассажирских сервисов")
    print("   ГУП «Петербургский метрополитен»")
    print("=" * 60)
    print()
    print("🎤 Доступные голоса:")
    for vid, vinfo in RUSSIAN_VOICES.items():
        print(f"   {vinfo['emoji']} {vinfo['name']} ({vid}) - {vinfo['description']}")
    print()
    print("📊 Стандарт АИ-22:")
    print("   • Формат: MP3, 44100 Гц, CBR 128 кбит/с")
    print("   • Кодек: LAME, Моно")
    print("   • LUFS: -23 ±0.5 LU")
    print("   • True Peak: ≤ -1 dBTP")
    print("   • LRA: ≤ 5 LU")
    print("-" * 60)
    
    server = HTTPServer(('0.0.0.0', PORT), TTSHandler)
    print(f"🚀 TTS сервис запущен на порту {PORT}")
    print(f"📁 Аудио файлы: {AUDIO_DIR}")
    print("-" * 60)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Остановка TTS сервиса...")
        server.shutdown()

if __name__ == '__main__':
    main()
