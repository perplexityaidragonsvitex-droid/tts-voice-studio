#!/usr/bin/env python3
"""
Очистка старых аудио файлов
Удаляет файлы старше указанного количества дней
"""

import os
import sys
import time
import argparse
from pathlib import Path

AUDIO_DIR = Path(__file__).parent.parent.parent / 'public' / 'audio'
DEFAULT_MAX_AGE_DAYS = 30

def cleanup_old_audio(max_age_days: int = DEFAULT_MAX_AGE_DAYS, dry_run: bool = False):
    """
    Удаляет аудио файлы старше max_age_days дней
    
    Args:
        max_age_days: Максимальный возраст файла в днях
        dry_run: Если True, только показывает что будет удалено
    """
    if not AUDIO_DIR.exists():
        print(f"Директория {AUDIO_DIR} не существует")
        return
    
    now = time.time()
    max_age_seconds = max_age_days * 24 * 60 * 60
    
    deleted_count = 0
    deleted_size = 0
    kept_count = 0
    
    for file_path in AUDIO_DIR.glob('*.mp3'):
        file_age = now - file_path.stat().st_mtime
        
        if file_age > max_age_seconds:
            file_size = file_path.stat().st_size
            age_days = file_age / (24 * 60 * 60)
            
            if dry_run:
                print(f"[DRY RUN] Удаление: {file_path.name} ({age_days:.1f} дней, {file_size / 1024:.1f} KB)")
            else:
                try:
                    file_path.unlink()
                    print(f"Удалено: {file_path.name} ({age_days:.1f} дней)")
                except Exception as e:
                    print(f"Ошибка удаления {file_path.name}: {e}")
                    continue
            
            deleted_count += 1
            deleted_size += file_size
        else:
            kept_count += 1
    
    print()
    print(f"Статистика:")
    print(f"  Удалено: {deleted_count} файлов ({deleted_size / 1024 / 1024:.2f} MB)")
    print(f"  Оставлено: {kept_count} файлов")
    
    if dry_run:
        print()
        print("Это был dry-run. Файлы не были удалены.")
        print("Для реального удаления запустите без флага --dry-run")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Очистка старых аудио файлов')
    parser.add_argument(
        '--days', 
        type=int, 
        default=DEFAULT_MAX_AGE_DAYS,
        help=f'Максимальный возраст файла в днях (по умолчанию: {DEFAULT_MAX_AGE_DAYS})'
    )
    parser.add_argument(
        '--dry-run', 
        action='store_true',
        help='Только показать что будет удалено, без реального удаления'
    )
    
    args = parser.parse_args()
    
    print(f"Очистка аудио файлов старше {args.days} дней")
    print(f"Директория: {AUDIO_DIR}")
    print("-" * 50)
    
    cleanup_old_audio(max_age_days=args.days, dry_run=args.dry_run)
